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

interface ArchiveRoomProps {
  handle: string | null;
}

interface SavedRunState {
  seed: string;
  solved: Record<string, boolean>;
  answers: Record<string, string>;
  hintCounts: Record<string, number>;
}

const STORAGE_KEY = "cypherpunk-archive-run-v1";
const DEFAULT_SEED = "archive-demo";
const dailyCipherEnabled = false;

export default function ArchiveRoom({ handle }: ArchiveRoomProps) {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [activeId, setActiveId] = useState<StationId | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hintCounts, setHintCounts] = useState<Record<string, number>>({});

  const run = useMemo(() => buildArchiveRun(seed), [seed]);
  const activeStation = run.stations.find((station) => station.id === activeId) ?? null;
  const solvedCount = run.stations.filter((station) => solved[station.id]).length;
  const runComplete = solvedCount === run.stations.length;
  const vaultUnlocked = run.stations
    .filter((station) => station.id !== "vault")
    .every((station) => solved[station.id]);

  useEffect(() => {
    const saved = loadSavedRun();
    if (saved) {
      setSeed(saved.seed);
      setSolved(saved.solved);
      setAnswers(saved.answers);
      setHintCounts(saved.hintCounts);
      return;
    }

    const firstSeed = `archive-${new Date().toISOString().slice(0, 10)}`;
    setSeed(firstSeed);
  }, []);

  useEffect(() => {
    const state: SavedRunState = { seed, solved, answers, hintCounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [answers, hintCounts, seed, solved]);

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
    }
  }

  function resetRun() {
    const nextSeed = `archive-${Date.now().toString(36)}`;
    setSeed(nextSeed);
    setSolved({});
    setAnswers({});
    setHintCounts({});
    setActiveId(null);
  }

  return (
    <main className="archive">
      <header className="archive__hud">
        <div>
          <p className="eyebrow">Archive demo</p>
          <h1>Cypherpunk Archive</h1>
        </div>
        <div className="hud-panel">
          <span>{handle ? `Signed in: ${handle}` : "Anonymous run"}</span>
          <span>Seed: {run.seed}</span>
          <strong>
            {solvedCount}/{run.stations.length} solved
          </strong>
          <button className="text-button" type="button" onClick={resetRun}>
            New run
          </button>
        </div>
      </header>

      <section className="room" aria-label="Cypherpunk archive room">
        <img className="room__background" src="/backgrounds/arena-dungeon.png" alt="" />
        <div className="room__sigils" aria-hidden="true" />
        <div className="room__shade" />
        <div className="room__beam room__beam--left" aria-hidden="true" />
        <div className="room__beam room__beam--right" aria-hidden="true" />
        {run.stations.map((station) => {
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
        {run.stations.map((station) => (
          <a
            key={station.id}
            className={solved[station.id] ? "artifact artifact--open" : "artifact"}
            href={solved[station.id] ? station.artifact.href : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!solved[station.id]}
          >
            <span>{station.artifact.title}</span>
          </a>
        ))}
      </aside>

      {activeStation && (
        <PuzzlePanel
          station={activeStation}
          stations={run.stations}
          solved={Boolean(solved[activeStation.id])}
          solvedMap={solved}
          answer={answers[activeStation.id] ?? ""}
          hintCount={hintCounts[activeStation.id] ?? 0}
          onAnswer={(value) => setAnswers((current) => ({ ...current, [activeStation.id]: value }))}
          onHint={() =>
            setHintCounts((current) => ({
              ...current,
              [activeStation.id]: Math.min(activeStation.hints.length, (current[activeStation.id] ?? 0) + 1),
            }))
          }
          onSubmit={() => submitAnswer(activeStation)}
          onClose={() => setActiveId(null)}
        />
      )}

      {runComplete && !activeStation && (
        <RunSummary
          seed={run.seed}
          stations={run.stations}
          solvedMap={solved}
          onNewRun={resetRun}
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

function RunSummary({
  seed,
  stations,
  solvedMap,
  onNewRun,
}: {
  seed: string;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
  onNewRun: () => void;
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
          New run
        </button>
        <button className="button" type="button" disabled={!dailyCipherEnabled}>
          Daily Cipher
        </button>
      </div>
      {!dailyCipherEnabled && <p className="summary-note">Daily Cipher is planned after the archive demo loop settles.</p>}
    </section>
  );
}

function PuzzlePanel({
  station,
  stations,
  solved,
  solvedMap,
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
  solved,
  onAnswer,
}: {
  station: PuzzleStation;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
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
  onAnswer,
}: {
  station: PuzzleStation;
  stations: PuzzleStation[];
  solvedMap: Record<string, boolean>;
  onAnswer: (value: string) => void;
}) {
  const [workText, setWorkText] = useState(station.encodedText);
  const [activeTool, setActiveTool] = useState<"shift" | "rail" | "keyword" | null>("shift");
  const [shift, setShift] = useState(13);
  const [rails, setRails] = useState(3);
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const railOptions = [2, 3, 4, 5];
  const normalizedKeyword = compactAnswer(keyword).replace(/[^A-Z]/g, "");
  const shiftPreview = caesarDecode(workText, shift);
  const railPreview = railFenceDecode(workText, rails);
  const railRows = railFenceReconstructionRows(workText, rails);
  const keywordPreview = normalizedKeyword ? vigenereDecode(workText, normalizedKeyword) : workText;

  useEffect(() => {
    setWorkText(station.encodedText);
    setActiveTool("shift");
    setShift(13);
    setRails(3);
    setKeyword("");
    setHistory([]);
  }, [station]);

  function applyStep(label: string, nextText: string) {
    setHistory((current) => [`${label}: ${nextText}`, ...current].slice(0, 4));
    setWorkText(nextText);
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
          onClick={() => setActiveTool("shift")}
        >
          Shift Door
        </button>
        <button
          className={activeTool === "rail" ? "vault-tool-tab is-active" : "vault-tool-tab"}
          type="button"
          onClick={() => setActiveTool("rail")}
        >
          Rail Table
        </button>
        <button
          className={activeTool === "keyword" ? "vault-tool-tab is-active" : "vault-tool-tab"}
          type="button"
          onClick={() => setActiveTool("keyword")}
        >
          Keyword Terminal
        </button>
      </div>

      {activeTool === "shift" && (
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

      {activeTool === "rail" && (
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

      {activeTool === "keyword" && (
        <section className="vault-tool-dialog" aria-label="Keyword Terminal decoder">
          <div className="vault-tool-dialog__head">
            <strong>Keyword Terminal</strong>
            <span>Use the historical clue to guess the pioneer surname, then inspect the repeated key strip.</span>
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
            <code key={`${entry}-${index}`}>{entry}</code>
          ))}
        </div>
      )}

      <div className="modal__actions">
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
