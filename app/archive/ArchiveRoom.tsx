"use client";

import { useEffect, useMemo, useState } from "react";
import {
  caesarDecode,
  compactAnswer,
  diffieHellmanSharedSecret,
  modPow,
  normalizeAnswer,
  railFenceDecode,
  vigenereDecode,
} from "@/lib/ciphers";
import { buildArchiveRun, type PuzzleStation, type StationId } from "@/lib/archive-data";

type ArchiveMode = "archive" | "daily";

interface ArchiveRoomProps {
  handle: string | null;
  authenticated?: boolean;
  mode?: ArchiveMode;
  initialSeed?: string;
  initialSolved?: Partial<Record<StationId, boolean>>;
  toolUnlocks?: Partial<Record<StationId, boolean>>;
  dailyDate?: string;
  dailyAttempt?: {
    solved: boolean;
    viewedReveal: boolean;
    credited: boolean;
    hintCount: number;
    wrongAttempts: number;
  } | null;
  leaderboard?: Array<{
    handle: string;
    picture: string | null;
    solved_at: string;
    hint_count: number;
    wrong_attempts: number;
    seconds_to_solve: number | null;
  }>;
  streak?: {
    current: number;
    longest: number;
    total: number;
  } | null;
}

interface SavedRunState {
  seed: string;
  solved: Record<string, boolean>;
  answers: Record<string, string>;
  hintCounts: Record<string, number>;
}

interface VaultHistoryEntry {
  label: string;
  before: string;
  after: string;
}

const STORAGE_KEY = "cypherpunk-archive-run-v1";
const DEFAULT_SEED = "archive-demo";

export default function ArchiveRoom({
  handle,
  authenticated = false,
  mode = "archive",
  initialSeed = DEFAULT_SEED,
  initialSolved = {},
  toolUnlocks,
  dailyDate,
  dailyAttempt,
  leaderboard = [],
  streak,
}: ArchiveRoomProps) {
  const [seed, setSeed] = useState(initialSeed);
  const [activeId, setActiveId] = useState<StationId | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [localToolUnlocks, setLocalToolUnlocks] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hintCounts, setHintCounts] = useState<Record<string, number>>({});
  const [dailyState, setDailyState] = useState(dailyAttempt);

  const run = useMemo(() => buildArchiveRun(seed), [seed]);
  const visibleStations = mode === "daily" ? run.stations.filter((station) => station.id === "vault") : run.stations;
  const activeStation = run.stations.find((station) => station.id === activeId) ?? null;
  const solvedCount = visibleStations.filter((station) => solved[station.id]).length;
  const runComplete = solvedCount === visibleStations.length;
  const effectiveToolUnlocks =
    mode === "daily"
      ? authenticated
        ? toolUnlocks ?? {}
        : localToolUnlocks
      : solved;
  const vaultUnlocked =
    mode === "daily" ||
    run.stations
      .filter((station) => station.id !== "vault")
      .every((station) => solved[station.id]);

  useEffect(() => {
    if (mode === "daily") {
      setSeed(initialSeed);
      setSolved({ ...initialSolved });
      setDailyState(dailyAttempt);
      if (!authenticated) {
        const saved = loadSavedRun();
        setLocalToolUnlocks(saved?.solved ?? {});
      }
      return;
    }

    const saved = loadSavedRun();
    if (saved) {
      setSeed(saved.seed);
      setSolved({ ...saved.solved, ...initialSolved });
      setAnswers(saved.answers);
      setHintCounts(saved.hintCounts);
      return;
    }

    setSeed(initialSeed === DEFAULT_SEED ? `archive-${new Date().toISOString().slice(0, 10)}` : initialSeed);
    setSolved({ ...initialSolved });
  }, [authenticated, dailyAttempt, initialSeed, mode]);

  useEffect(() => {
    setSolved((current) => ({ ...current, ...initialSolved }));
  }, [initialSolved]);

  useEffect(() => {
    if (mode === "daily") return;
    const state: SavedRunState = { seed, solved, answers, hintCounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [answers, hintCounts, mode, seed, solved]);

  function submitAnswer(station: PuzzleStation) {
    const answer = answers[station.id] ?? "";
    const accepted = [station.expectedAnswer, ...(station.acceptedAnswers ?? [])];
    const isCorrect = accepted.some(
      (acceptedAnswer) =>
        normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer) ||
        compactAnswer(answer) === compactAnswer(acceptedAnswer)
    );

    if (isCorrect) {
      setSolved((current) => ({ ...current, [station.id]: true }));
      if (mode === "archive" && station.id !== "vault") {
        void recordStationCompletion(station.id);
      }
      if (mode === "daily" && station.id === "vault") {
        void submitDailyAnswer(answer);
      }
    } else if (mode === "daily" && station.id === "vault") {
      void submitDailyAnswer(answer);
    }
  }

  function resetRun() {
    if (mode === "daily") {
      setSolved(dailyState?.solved ? { vault: true } : {});
      setAnswers({});
      setHintCounts({});
      setActiveId(null);
      return;
    }
    const nextSeed = `archive-${Date.now().toString(36)}`;
    setSeed(nextSeed);
    setSolved({ ...initialSolved });
    setAnswers({});
    setHintCounts({});
    setActiveId(null);
  }

  function revealHint(station: PuzzleStation) {
    const nextHintCount = Math.min(station.hints.length, (hintCounts[station.id] ?? 0) + 1);
    setHintCounts((current) => ({
      ...current,
      [station.id]: nextHintCount,
    }));

    if (mode !== "daily" || station.id !== "vault") return;
    void fetch("/api/daily/hint", { method: "POST" });
    if (nextHintCount >= station.hints.length) {
      setDailyState((current) => current ? { ...current, viewedReveal: true, credited: false } : current);
      void fetch("/api/daily/reveal", { method: "POST" });
    }
  }

  async function recordStationCompletion(stationId: StationId) {
    if (!authenticated) return;
    await fetch("/api/station-completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId }),
    }).catch(() => null);
  }

  async function submitDailyAnswer(answer: string) {
    const response = await fetch("/api/daily/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    }).catch(() => null);
    if (!response?.ok) return;
    const result = (await response.json()) as {
      attempt?: {
        solved_at: string | null;
        viewed_reveal_at: string | null;
        hint_count: number;
        wrong_attempts: number;
      };
      credited?: boolean;
    };
    if (result.attempt) {
      setDailyState({
        solved: Boolean(result.attempt.solved_at),
        viewedReveal: Boolean(result.attempt.viewed_reveal_at),
        credited: Boolean(result.credited),
        hintCount: result.attempt.hint_count,
        wrongAttempts: result.attempt.wrong_attempts,
      });
    }
  }

  return (
    <main className="archive">
      <header className="archive__hud">
        <div>
          <p className="eyebrow">{mode === "daily" ? "Shared daily vault" : "Archive demo"}</p>
          <h1>{mode === "daily" ? "Daily Vault" : "Cypherpunk Archive"}</h1>
        </div>
        <div className="hud-panel">
          <span>{handle ? `Signed in: ${handle}` : "Anonymous run"}</span>
          {mode === "daily" && dailyDate && <span>Daily: {dailyDate}</span>}
          <span>Seed: {run.seed}</span>
          <strong>
            {solvedCount}/{visibleStations.length} solved
          </strong>
          <button className="text-button" type="button" onClick={resetRun}>
            {mode === "daily" ? "Reset work" : "New run"}
          </button>
        </div>
      </header>

      <section className="room" aria-label="Cypherpunk archive room">
        <img className="room__background" src="/backgrounds/arena-dungeon.png" alt="" />
        <div className="room__sigils" aria-hidden="true" />
        <div className="room__shade" />
        <div className="room__beam room__beam--left" aria-hidden="true" />
        <div className="room__beam room__beam--right" aria-hidden="true" />
        {visibleStations.map((station) => {
          const locked = station.id === "vault" && !vaultUnlocked;
          return (
            <button
              key={station.id}
              className={[
                "hotspot",
                solved[station.id] ? "hotspot--solved" : "",
                locked ? "hotspot--locked" : "",
              ].join(" ")}
              style={{ left: `${station.hotspot.x}%`, top: `${station.hotspot.y}%` }}
              type="button"
              disabled={locked}
              onClick={() => setActiveId(station.id)}
            >
              <StationProp id={station.id} solved={Boolean(solved[station.id])} locked={locked} />
              <span className="hotspot__label">{station.title}</span>
            </button>
          );
        })}
      </section>

      <aside className="artifact-strip" aria-label="Unlocked artifacts">
        {(mode === "daily" ? run.stations.filter((station) => station.id !== "vault") : run.stations).map((station) => {
          const artifactOpen = mode === "daily" ? Boolean(effectiveToolUnlocks[station.id]) : Boolean(solved[station.id]);
          return (
            <a
              key={station.id}
              className={artifactOpen ? "artifact artifact--open" : "artifact"}
              href={artifactOpen ? station.artifact.href : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!artifactOpen}
            >
              <span>{station.artifact.title}</span>
            </a>
          );
        })}
      </aside>

      {activeStation && (
        <PuzzlePanel
          station={activeStation}
          stations={run.stations}
          solved={Boolean(solved[activeStation.id])}
          solvedMap={solved}
          toolUnlocks={effectiveToolUnlocks}
          mode={mode}
          answer={answers[activeStation.id] ?? ""}
          hintCount={hintCounts[activeStation.id] ?? 0}
          onAnswer={(value) => setAnswers((current) => ({ ...current, [activeStation.id]: value }))}
          onHint={() => revealHint(activeStation)}
          onSubmit={() => submitAnswer(activeStation)}
          onClose={() => setActiveId(null)}
        />
      )}

      {mode === "daily" && (
        <DailyStatus
          authenticated={authenticated}
          dailyState={dailyState}
          leaderboard={leaderboard}
          streak={streak}
          toolUnlocks={effectiveToolUnlocks}
        />
      )}

      {runComplete && !activeStation && (
        <RunSummary
          seed={run.seed}
          stations={visibleStations}
          solvedMap={solved}
          onNewRun={resetRun}
          mode={mode}
        />
      )}
    </main>
  );
}

function StationProp({ id, solved, locked }: { id: StationId; solved: boolean; locked: boolean }) {
  const asset = stationPropAsset(id);

  return (
    <span
      className={[
        "station-prop",
        `station-prop--${id}`,
        solved ? "station-prop--solved" : "",
        locked ? "station-prop--locked" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <span className="station-prop__glow" />
      <img className="station-prop__image" src={`/sprites/props/${asset}`} alt="" />
    </span>
  );
}

function stationPropAsset(id: StationId) {
  if (id === "caesar") return "caesar-door.png";
  if (id === "rail-fence") return "rail-table.png";
  if (id === "vigenere") return "vigenere-terminal.png";
  if (id === "diffie-hellman") return "diffie-hellman-altar.png";
  return "final-vault.png";
}

function DailyStatus({
  authenticated,
  dailyState,
  leaderboard,
  streak,
  toolUnlocks,
}: {
  authenticated: boolean;
  dailyState: ArchiveRoomProps["dailyAttempt"];
  leaderboard: NonNullable<ArchiveRoomProps["leaderboard"]>;
  streak: ArchiveRoomProps["streak"];
  toolUnlocks: Partial<Record<StationId, boolean>>;
}) {
  const toolStatus = [
    { id: "caesar" as const, label: "Shift Door" },
    { id: "rail-fence" as const, label: "Rail Table" },
    { id: "vigenere" as const, label: "Keyword Terminal" },
  ];

  return (
    <section className="daily-panel" aria-label="Daily vault status">
      <div>
        <h2>Daily Status</h2>
        <p className="muted">
          {authenticated
            ? dailyState?.solved
              ? dailyState.credited
                ? "Credited solve. Streak extended."
                : "Solved after reveal. Completed, but no daily credit."
              : "Solve without the full reveal for leaderboard and streak credit."
            : "Anonymous daily play is enabled. Sign in through Portal for streaks and leaderboard credit."}
        </p>
      </div>

      <div className="tool-unlocks">
        {toolStatus.map((tool) => (
          <span className={toolUnlocks[tool.id] ? "tool-unlock is-open" : "tool-unlock"} key={tool.id}>
            {tool.label}
          </span>
        ))}
      </div>

      {streak && (
        <div className="daily-stats">
          <span>Current streak: {streak.current}</span>
          <span>Longest: {streak.longest}</span>
          <span>Total credited: {streak.total}</span>
        </div>
      )}

      <div>
        <h3>Leaderboard</h3>
        {leaderboard.length ? (
          <ol className="leaderboard">
            {leaderboard.map((entry) => (
              <li key={`${entry.handle}-${entry.solved_at}`}>
                <span>{entry.handle}</span>
                <small>
                  {entry.hint_count} hints · {entry.wrong_attempts} misses
                  {entry.seconds_to_solve !== null ? ` · ${entry.seconds_to_solve}s` : ""}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No credited solves yet today.</p>
        )}
      </div>
    </section>
  );
}

function RunSummary({
  seed,
  stations,
  solvedMap,
  onNewRun,
  mode,
}: {
  seed: string;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
  onNewRun: () => void;
  mode: ArchiveMode;
}) {
  const solvedStations = stations.filter((station) => solvedMap[station.id]);

  return (
    <section className="summary-panel" aria-labelledby="summary-title">
      <div>
        <p className="eyebrow">Archive complete</p>
        <h2 id="summary-title">Vault Opened</h2>
        <p className="muted">Run seed: {seed}</p>
      </div>

      <div className="summary-grid">
        <div>
          <h3>Solved Concepts</h3>
          <ul className="summary-list">
            {solvedStations.map((station) => (
              <li key={station.id}>
                <strong>{station.subtitle}</strong>
                <span>{station.clue}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Unlocked Artifacts</h3>
          <ul className="summary-list">
            {solvedStations.map((station) => (
              <li key={station.id}>
                <strong>{station.artifact.title}</strong>
                <a href={station.artifact.href} target="_blank" rel="noreferrer">
                  Open source
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="summary-actions">
        <button className="button button--primary" type="button" onClick={onNewRun}>
          {mode === "daily" ? "Reset work" : "New run"}
        </button>
        {mode === "archive" && <a className="button" href="/daily">Daily Vault</a>}
      </div>
    </section>
  );
}

function PuzzlePanel({
  station,
  stations,
  solved,
  solvedMap,
  toolUnlocks,
  mode,
  answer,
  hintCount,
  onAnswer,
  onHint,
  onSubmit,
  onClose,
}: {
  station: PuzzleStation;
  stations: PuzzleStation[];
  solved: boolean;
  solvedMap: Record<string, boolean>;
  toolUnlocks: Record<string, boolean> | Partial<Record<StationId, boolean>>;
  mode: ArchiveMode;
  answer: string;
  hintCount: number;
  onAnswer: (value: string) => void;
  onHint: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="station-title">
      <div className="modal__panel">
        <button className="icon-button modal__close" type="button" onClick={onClose} aria-label="Close">
          x
        </button>
        <p className="eyebrow">
          {station.subtitle} · {station.difficulty}
        </p>
        <h2 id="station-title">{station.title}</h2>
        <p className="modal__prompt">{station.prompt}</p>
        <div className="clue-box">
          <span>Archive clue</span>
          <p>{station.clue}</p>
        </div>

        <div className="cipher-box">
          <span>Encrypted / public clue</span>
          <code>{station.encodedText}</code>
        </div>

        <div className="tool-box">
          <p>{station.toolLabel}</p>
          <StationTool
            station={station}
            stations={stations}
            solvedMap={solvedMap}
            toolUnlocks={toolUnlocks}
            mode={mode}
            solved={solved}
            onAnswer={onAnswer}
          />
        </div>

        <label className="answer-field">
          <span>Answer</span>
          <input
            value={answer}
            onChange={(event) => onAnswer(event.target.value)}
            placeholder="Type or transfer the decoded answer"
            disabled={solved}
          />
        </label>

        <div className="modal__actions">
          <button className="button button--primary" type="button" onClick={onSubmit} disabled={solved}>
            {solved ? "Solved" : "Submit"}
          </button>
          <button className="button" type="button" onClick={onHint} disabled={hintCount >= station.hints.length}>
            Hint
          </button>
        </div>

        {Array.from({ length: hintCount }, (_, index) => station.hints[index]).map((hint, index) => (
          <blockquote className="hint" key={`${hint.speaker}-${index}`}>
            <strong>{hint.speaker}</strong>
            <span>{hint.text}</span>
          </blockquote>
        ))}

        {solved && (
          <div className="lore">
            <strong>{station.artifact.title}</strong>
            <p>{station.artifact.body}</p>
            <a href={station.artifact.href} target="_blank" rel="noreferrer">
              Open source
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function StationTool({
  station,
  stations,
  solvedMap,
  toolUnlocks,
  mode,
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
  toolUnlocks: Record<string, boolean> | Partial<Record<StationId, boolean>>;
  mode: ArchiveMode;
  solved: boolean;
  onAnswer: (value: string) => void;
}) {
  if (station.id === "caesar") {
    return <CaesarTool station={station} solved={solved} onAnswer={onAnswer} />;
  }
  if (station.id === "rail-fence") {
    return <RailFenceTool station={station} solved={solved} onAnswer={onAnswer} />;
  }
  if (station.id === "vigenere") {
    return <VigenereTool station={station} solved={solved} onAnswer={onAnswer} />;
  }
  if (station.id === "diffie-hellman") {
    return <DiffieHellmanTool station={station} solved={solved} onAnswer={onAnswer} />;
  }
  return (
    <VaultTool
      station={station}
      stations={stations}
      solvedMap={solvedMap}
      toolUnlocks={toolUnlocks}
      mode={mode}
      onAnswer={onAnswer}
    />
  );
}

function CaesarTool({
  station,
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  solved: boolean;
  onAnswer: (value: string) => void;
}) {
  const [shift, setShift] = useState(13);
  const decoded = caesarDecode(station.encodedText, shift);
  const plainAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const shiftedAlphabet = caesarDecode(plainAlphabet, shift);

  return (
    <div className="tool-stack">
      <label className="range-field">
        <span>Shift: {shift}</span>
        <input
          type="range"
          min="1"
          max="25"
          value={shift}
          onChange={(event) => setShift(Number(event.target.value))}
        />
      </label>
      <div className="preview-line">
        <span>Preview</span>
        <code>{decoded}</code>
      </div>
      <div className="alphabet-strip" aria-label="Current Caesar alphabet mapping">
        <code>{plainAlphabet.split("").join(" ")}</code>
        <code>{shiftedAlphabet.split("").join(" ")}</code>
      </div>
      <button className="button" type="button" onClick={() => onAnswer(decoded)}>
        Transfer preview
      </button>
    </div>
  );
}

function RailFenceTool({
  station,
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  solved: boolean;
  onAnswer: (value: string) => void;
}) {
  const [rails, setRails] = useState(3);
  const decoded = railFenceDecode(station.encodedText, rails);
  const railOptions = [2, 3, 4, 5];
  const reconstructedRows = railFenceReconstructionRows(station.encodedText, rails);

  return (
    <div className="tool-stack">
      <div className="segmented" aria-label="Rail count">
        {railOptions.map((option) => (
          <button
            key={option}
            className={option === rails ? "segmented__button segmented__button--active" : "segmented__button"}
            type="button"
            onClick={() => setRails(option)}
          >
            {option} rails
          </button>
        ))}
      </div>
      <div className="preview-line">
        <span>Selected table</span>
        <code>
          {rails} rails · read the filled letters by following the zigzag columns from left to right
        </code>
      </div>
      <div className="rail-table" aria-label="Reconstructed rail table">
        {reconstructedRows.map((row, rowIndex) => (
          <code key={rowIndex}>{row.map((char) => char || ".").join(" ")}</code>
        ))}
      </div>
      <button className="button" type="button" onClick={() => onAnswer(decoded)}>
        Transfer zigzag readout
      </button>
    </div>
  );
}

function VigenereTool({
  station,
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  solved: boolean;
  onAnswer: (value: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const targetKeyword = station.config.keyword ?? "";
  const normalizedKeyword = compactAnswer(keyword).replace(/[^A-Z]/g, "").slice(0, targetKeyword.length);
  const decoded = vigenereDecode(station.encodedText, normalizedKeyword);
  const tiles = vigenereTiles(station.encodedText, normalizedKeyword);
  const keywordSlots = Array.from({ length: targetKeyword.length }, (_, index) => normalizedKeyword[index] ?? "");

  return (
    <div className="tool-stack">
      <label className="answer-field answer-field--compact">
        <span>Keyword once</span>
        <input
          value={normalizedKeyword}
          maxLength={targetKeyword.length}
          onChange={(event) => setKeyword(event.target.value.toUpperCase())}
          placeholder={`${targetKeyword.length} letters`}
        />
      </label>
      <div className="keyword-slots" aria-label="Keyword slots">
        {keywordSlots.map((letter, index) => (
          <span key={index}>{letter || " "}</span>
        ))}
      </div>
      <p className="tool-note">
        Type the keyword once. The terminal repeats it under the message and shifts each cipher
        letter backward by that key letter.
      </p>
      <div className="preview-line">
        <span>Decoded preview</span>
        <code>{decoded}</code>
      </div>
      <div className="vigenere-machine" aria-label="Vigenere letter machine">
        {tiles.map((tile, index) => (
          <div className={tile.key ? "vigenere-tile is-active" : "vigenere-tile"} key={`${tile.cipher}-${index}`}>
            <span>C</span>
            <strong>{tile.cipher}</strong>
            <span>K</span>
            <strong>{tile.key || "."}</strong>
            <span>-{tile.shift}</span>
            <strong>{tile.plain || "."}</strong>
          </div>
        ))}
      </div>
      <button className="button" type="button" disabled={!normalizedKeyword} onClick={() => onAnswer(decoded)}>
        Transfer preview
      </button>
    </div>
  );
}

function DiffieHellmanTool({
  station,
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  solved: boolean;
  onAnswer: (value: string) => void;
}) {
  const [step, setStep] = useState(0);
  const prime = station.config.publicPrime ?? 23;
  const base = station.config.publicBase ?? 5;
  const aliceSecret = station.config.aliceSecret ?? 1;
  const bobSecret = station.config.bobSecret ?? 1;
  const dh = diffieHellmanSharedSecret(prime, base, aliceSecret, bobSecret);
  const aliceShared = modPow(dh.bobPublic, aliceSecret, prime);
  const bobShared = modPow(dh.alicePublic, bobSecret, prime);
  const steps = [
    {
      label: "Use case",
      value: "Alice and Bob need the same room key, but the hallway is watched.",
      detail: "They can publish a recipe and exchange public numbers. Their private choices never leave their side.",
    },
    {
      label: "Public recipe",
      value: `prime ${prime}, base ${base}`,
      detail: "Everyone can see these numbers. They define the small demo math space for this puzzle.",
    },
    {
      label: "Alice sends",
      value: `${base}^${aliceSecret} mod ${prime} = ${dh.alicePublic}`,
      detail: `Alice keeps ${aliceSecret} private and sends only ${dh.alicePublic}.`,
    },
    {
      label: "Bob sends",
      value: `${base}^${bobSecret} mod ${prime} = ${dh.bobPublic}`,
      detail: `Bob keeps ${bobSecret} private and sends only ${dh.bobPublic}.`,
    },
    {
      label: "Shared room key",
      value: `${dh.bobPublic}^${aliceSecret} mod ${prime} = ${aliceShared}; ${dh.alicePublic}^${bobSecret} mod ${prime} = ${bobShared}`,
      detail: "They use the other person's public value with their own private number. Both sides arrive at the same secret.",
    },
  ];

  return (
    <div className="dh-steps">
      <div className="public-private-grid">
        <div className="public-private-card">
          <span>Public</span>
          <strong>prime {prime}, base {base}</strong>
          <strong>Alice sends {step >= 2 ? dh.alicePublic : "..."}</strong>
          <strong>Bob sends {step >= 3 ? dh.bobPublic : "..."}</strong>
        </div>
        <div className="public-private-card public-private-card--private">
          <span>Private</span>
          <strong>Alice keeps {aliceSecret}</strong>
          <strong>Bob keeps {bobSecret}</strong>
          <strong>Shared key {step >= 4 ? dh.sharedSecret : "..."}</strong>
        </div>
      </div>
      {steps.map((exchangeStep, index) => (
        <div key={exchangeStep.label} className={step >= index ? "dh-step dh-step--open" : "dh-step"}>
          <div>
            <span>{exchangeStep.label}</span>
            <strong>{step >= index ? exchangeStep.value : "locked"}</strong>
          </div>
          {step >= index && <p>{exchangeStep.detail}</p>}
        </div>
      ))}
      <div className="modal__actions">
        <button
          className="button"
          type="button"
          disabled={step >= steps.length - 1}
          onClick={() => setStep((value) => value + 1)}
        >
          Advance exchange
        </button>
        <button
          className="button"
          type="button"
          disabled={step < steps.length - 1}
          onClick={() => onAnswer(String(dh.sharedSecret))}
        >
          Transfer shared secret
        </button>
      </div>
    </div>
  );
}

function railFenceReconstructionRows(cipherText: string, rails: number) {
  const cipher = compactAnswer(cipherText);
  const pattern = railPattern(cipher.length, rails);
  const railLengths = Array.from({ length: rails }, (_, rail) =>
    pattern.filter((patternRail) => patternRail === rail).length
  );
  const rows = Array.from({ length: rails }, () => Array.from({ length: cipher.length }, () => ""));
  let cursor = 0;

  for (let rail = 0; rail < rails; rail += 1) {
    const chars = cipher.slice(cursor, cursor + railLengths[rail]).split("");
    cursor += railLengths[rail];
    let charIndex = 0;

    for (let col = 0; col < pattern.length; col += 1) {
      if (pattern[col] === rail) {
        rows[rail][col] = chars[charIndex++] ?? "";
      }
    }
  }

  return rows;
}

function railPattern(length: number, rails: number) {
  const pattern: number[] = [];
  let row = 0;
  let dir = 1;

  for (let col = 0; col < length; col += 1) {
    pattern.push(row);
    if (row === 0) dir = 1;
    if (row === rails - 1) dir = -1;
    row += dir;
  }

  return pattern;
}

function vigenereTiles(cipherText: string, keyword: string) {
  const cipher = compactAnswer(cipherText).slice(0, 18);
  const key = compactAnswer(keyword).replace(/[^A-Z]/g, "");
  const plain = key ? compactAnswer(vigenereDecode(cipher, key)) : "";

  return cipher.split("").map((cipherLetter, index) => {
    const keyLetter = key[index % Math.max(1, key.length)] ?? "";
    const shift = keyLetter ? keyLetter.charCodeAt(0) - "A".charCodeAt(0) : 0;
    return {
      cipher: cipherLetter,
      key: keyLetter,
      shift: String(shift).padStart(2, "0"),
      plain: plain[index] ?? "",
    };
  });
}

function VaultTool({
  station,
  stations,
  solvedMap,
  toolUnlocks,
  mode,
  onAnswer,
}: {
  station: PuzzleStation;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
  toolUnlocks: Record<string, boolean> | Partial<Record<StationId, boolean>>;
  mode: ArchiveMode;
  onAnswer: (value: string) => void;
}) {
  const [workText, setWorkText] = useState(station.encodedText);
  const [activeTool, setActiveTool] = useState<"shift" | "rail" | "keyword" | null>("shift");
  const [shift, setShift] = useState(13);
  const [rails, setRails] = useState(3);
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<VaultHistoryEntry[]>([]);
  const railOptions = [2, 3, 4, 5];
  const normalizedKeyword = compactAnswer(keyword).replace(/[^A-Z]/g, "");
  const shiftPreview = caesarDecode(workText, shift);
  const railPreview = railFenceDecode(workText, rails);
  const railRows = railFenceReconstructionRows(workText, rails);
  const keywordPreview = normalizedKeyword ? vigenereDecode(workText, normalizedKeyword) : workText;
  const researchFiles = station.config.vaultResearchFiles ?? [];
  const shiftUnlocked = mode !== "daily" || Boolean(toolUnlocks.caesar);
  const railUnlocked = mode !== "daily" || Boolean(toolUnlocks["rail-fence"]);
  const keywordUnlocked = mode !== "daily" || Boolean(toolUnlocks.vigenere);

  useEffect(() => {
    setWorkText(station.encodedText);
    setActiveTool("shift");
    setShift(13);
    setRails(3);
    setKeyword("");
    setHistory([]);
  }, [station]);

  function applyStep(label: string, nextText: string) {
    setHistory((current) => [{ label, before: workText, after: nextText }, ...current].slice(0, 6));
    setWorkText(nextText);
  }

  function undoStep() {
    const lastStep = history[0];
    if (!lastStep) return;
    setWorkText(lastStep.before);
    setHistory((current) => current.slice(1));
  }

  function resetWorkbench() {
    setWorkText(station.encodedText);
    setHistory([]);
  }

  return (
    <div className="tool-stack">
      <div className="preview-line">
        <span>Vault work text</span>
        <code>{workText}</code>
      </div>

      <div className="artifact-mini">
        {stations
          .filter((candidate) => candidate.id !== "vault")
          .map((candidate) => (
            <span key={candidate.id} className={solvedMap[candidate.id] ? "artifact-mini__item is-open" : "artifact-mini__item"}>
              {candidate.title}
            </span>
          ))}
      </div>

      <div className="vault-tool-tray" aria-label="Vault tools">
        <button
          className={activeTool === "shift" ? "vault-tool-tab is-active" : "vault-tool-tab"}
          type="button"
          disabled={!shiftUnlocked}
          onClick={() => setActiveTool("shift")}
        >
          Shift Door{shiftUnlocked ? "" : " locked"}
        </button>
        <button
          className={activeTool === "rail" ? "vault-tool-tab is-active" : "vault-tool-tab"}
          type="button"
          disabled={!railUnlocked}
          onClick={() => setActiveTool("rail")}
        >
          Rail Table{railUnlocked ? "" : " locked"}
        </button>
        <button
          className={activeTool === "keyword" ? "vault-tool-tab is-active" : "vault-tool-tab"}
          type="button"
          disabled={!keywordUnlocked}
          onClick={() => setActiveTool("keyword")}
        >
          Keyword Terminal{keywordUnlocked ? "" : " locked"}
        </button>
      </div>

      {mode === "daily" && (!shiftUnlocked || !railUnlocked || !keywordUnlocked) && (
        <p className="tool-note">Solve archive stations to unlock their tools for the Daily Vault.</p>
      )}

      {activeTool === "shift" && shiftUnlocked && (
        <section className="vault-tool-dialog" aria-label="Shift Door decoder">
          <div className="vault-tool-dialog__head">
            <strong>Shift Door</strong>
            <span>Try all 25 rotations. The right one should make the next seal look less random.</span>
          </div>
          <label className="range-field">
            <span>Shift: {shift}</span>
            <input
              type="range"
              min="1"
              max="25"
              value={shift}
              onChange={(event) => setShift(Number(event.target.value))}
            />
          </label>
          <div className="preview-line">
            <span>Shift preview</span>
            <code>{shiftPreview}</code>
          </div>
          <button className="button" type="button" onClick={() => applyStep(`Shift -${shift}`, shiftPreview)}>
            Apply preview
          </button>
        </section>
      )}

      {activeTool === "rail" && railUnlocked && (
        <section className="vault-tool-dialog" aria-label="Rail Table decoder">
          <div className="vault-tool-dialog__head">
            <strong>Rail Table</strong>
            <span>Choose a rail count, rebuild the rows, then read the zigzag path.</span>
          </div>
          <div className="segmented segmented--compact" aria-label="Vault rail count">
            {railOptions.map((option) => (
              <button
                key={option}
                className={option === rails ? "segmented__button segmented__button--active" : "segmented__button"}
                type="button"
                onClick={() => setRails(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="rail-table" aria-label="Vault rail reconstruction">
            {railRows.map((row, rowIndex) => (
              <code key={rowIndex}>{row.map((char) => char || ".").join(" ")}</code>
            ))}
          </div>
          <div className="preview-line">
            <span>Zigzag readout</span>
            <code>{railPreview}</code>
          </div>
          <button className="button" type="button" onClick={() => applyStep(`${rails}-rail read`, railPreview)}>
            Apply readout
          </button>
        </section>
      )}

      {activeTool === "keyword" && keywordUnlocked && (
        <section className="vault-tool-dialog" aria-label="Keyword Terminal decoder">
          <div className="vault-tool-dialog__head">
            <strong>Keyword Terminal</strong>
            <span>Read the research files, infer the pioneer surname, then inspect the repeated key strip.</span>
          </div>
          <div className="research-files" aria-label="Vault research files">
            {researchFiles.map((file) => (
              <a className="research-file" href={file.href} target="_blank" rel="noreferrer" key={file.title}>
                <strong>{file.title}</strong>
                <span>{file.body}</span>
              </a>
            ))}
          </div>
          <label className="answer-field answer-field--compact">
            <span>Keyword</span>
            <input
              value={normalizedKeyword}
              onChange={(event) => setKeyword(event.target.value.toUpperCase())}
              placeholder="Pioneer surname"
            />
          </label>
          <div className="preview-line">
            <span>Keyword preview</span>
            <code>{keywordPreview}</code>
          </div>
          {normalizedKeyword && (
            <div className="vigenere-machine" aria-label="Vault Vigenere letter machine">
              {vigenereTiles(workText, normalizedKeyword).map((tile, index) => (
                <div className={tile.key ? "vigenere-tile is-active" : "vigenere-tile"} key={`${tile.cipher}-${index}`}>
                  <span>C</span>
                  <strong>{tile.cipher}</strong>
                  <span>K</span>
                  <strong>{tile.key || "."}</strong>
                  <span>-{tile.shift}</span>
                  <strong>{tile.plain || "."}</strong>
                </div>
              ))}
            </div>
          )}
          <button
            className="button"
            type="button"
            disabled={!normalizedKeyword}
            onClick={() => applyStep(`${normalizedKeyword} key`, keywordPreview)}
          >
            Apply preview
          </button>
        </section>
      )}

      {history.length > 0 && (
        <div className="vault-history" aria-label="Vault decode history">
          {history.map((entry, index) => (
            <code key={`${entry.label}-${index}`}>{entry.label}: {entry.after}</code>
          ))}
        </div>
      )}

      <div className="modal__actions">
        <button className="button" type="button" onClick={undoStep} disabled={history.length === 0}>
          Undo apply
        </button>
        <button className="button" type="button" onClick={resetWorkbench}>
          Reset vault text
        </button>
        <button className="button" type="button" onClick={() => onAnswer(workText)}>
          Transfer work text
        </button>
      </div>
    </div>
  );
}

function loadSavedRun(): SavedRunState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedRunState>;
    if (!saved.seed) return null;
    return {
      seed: saved.seed,
      solved: saved.solved ?? {},
      answers: saved.answers ?? {},
      hintCounts: saved.hintCounts ?? {},
    };
  } catch {
    return null;
  }
}
