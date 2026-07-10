import { buildArchiveRun, type ArchiveRun, type Hint, type PuzzleStation, type VaultLayer, type VaultResearchFile } from "@/lib/archive-data";
import {
  caesarDecode,
  caesarEncode,
  compactAnswer,
  railFenceDecode,
  railFenceEncode,
  vigenereDecode,
  vigenereEncode,
} from "@/lib/ciphers";

export type DailyDifficulty = "easy" | "medium" | "hard";

export interface DailyChallenge {
  id: string;
  generatorVersion: number;
  date: string;
  seed: string;
  difficulty: DailyDifficulty;
  encodedText: string;
  layers: VaultLayer[];
  researchFiles: VaultResearchFile[];
  expectedAnswer: string;
  acceptedAnswers: string[];
  hints: Hint[];
  theme: string;
  figureId: string;
}

interface PhraseDefinition {
  id: string;
  text: string;
  tiers: DailyDifficulty[];
  theme: string;
  figureId: string;
}

interface KeywordFile extends VaultResearchFile {
  keyword: string;
}

const GENERATOR_VERSION = 2;

const dailyPhrases: PhraseDefinition[] = [
  { id: "tools-people-use", text: "PRIVACY NEEDS PRACTICAL TOOLS", tiers: ["easy"], theme: "privacy", figureId: "hughes" },
  { id: "code-speech", text: "CODE CAN PROTECT FREE SPEECH", tiers: ["easy"], theme: "speech", figureId: "gilmore" },
  { id: "keys-secrets", text: "KEYS TURN PUBLIC WORDS PRIVATE", tiers: ["easy"], theme: "privacy", figureId: "finney" },
  { id: "cipher-trust", text: "CIPHERS REVEAL HOW TRUST WORKS", tiers: ["easy"], theme: "privacy", figureId: "chaum" },
  {
    id: "usable-tools",
    text: "PRIVACY REQUIRES TOOLS PEOPLE CAN ACTUALLY USE",
    tiers: ["medium"],
    theme: "privacy",
    figureId: "hughes",
  },
  {
    id: "public-private-secret",
    text: "A PUBLIC MESSAGE CAN HELP CREATE A PRIVATE SHARED SECRET",
    tiers: ["medium"],
    theme: "public-key",
    figureId: "hellman",
  },
  {
    id: "remailer-link",
    text: "ANONYMOUS REMAILERS BREAK THE LINK BETWEEN SENDER AND RECEIVER",
    tiers: ["medium"],
    theme: "remailers",
    figureId: "sassaman",
  },
  {
    id: "abuse-cost",
    text: "COMPUTATIONAL COST CAN MAKE MASS ABUSE EXPENSIVE",
    tiers: ["medium"],
    theme: "proof-of-work",
    figureId: "back",
  },
  {
    id: "open-coordination",
    text: "OPEN PROTOCOLS LET STRANGERS COORDINATE WITHOUT ONE GATEKEEPER",
    tiers: ["medium"],
    theme: "peer-to-peer",
    figureId: "cohen",
  },
  {
    id: "selective-reveal",
    text: "PRIVACY IS THE POWER TO CHOOSE WHAT WE REVEAL AND TO WHOM",
    tiers: ["medium"],
    theme: "privacy",
    figureId: "hughes",
  },
  {
    id: "verify-records",
    text: "HASH TREES LET MANY RECORDS BE VERIFIED FROM ONE SMALL COMMITMENT",
    tiers: ["medium"],
    theme: "integrity",
    figureId: "merkle",
  },
  {
    id: "publish-code",
    text: "PUBLISHING CRYPTOGRAPHIC CODE TURNS AN IDEA INTO A PUBLIC TOOL",
    tiers: ["medium"],
    theme: "speech",
    figureId: "zimmermann",
  },
];

const keywordFiles: KeywordFile[] = [
  {
    keyword: "CHAUM",
    title: "Blind Signatures and Digital Cash",
    body: "A private-money file describing blind signatures, anonymous payments, and the DigiCash experiments.",
    href: "https://chaum.com/publications/",
  },
  {
    keyword: "FINNEY",
    title: "PGP Mail and the First Bitcoin Transfer",
    body: "A practical-crypto file about PGP 2.0, reusable proof of work, and an early Bitcoin recipient.",
    href: "https://nakamotoinstitute.org/finney/rpow/",
  },
  {
    keyword: "MERKLE",
    title: "Hash Trees and Public-Key Puzzles",
    body: "A data-integrity file about early public-key puzzles and tree-shaped hash commitments.",
    href: "https://www.merkle.com/papers/Protocols.pdf",
  },
  {
    keyword: "GILMORE",
    title: "Mailing Lists, Free Speech, and Backdoors",
    body: "A movement-history file about the Cypherpunks mailing list, EFF advocacy, and resistance to cryptographic backdoors.",
    href: "https://www.eff.org/about/history",
  },
  {
    keyword: "HUGHES",
    title: "Privacy and Working Code",
    body: "A manifesto file distinguishing privacy from secrecy and arguing that privacy tools must be built and deployed.",
    href: "https://activism.net/cypherpunk/manifesto.html",
  },
  {
    keyword: "BACK",
    title: "Computational Stamps Against Abuse",
    body: "A proof-of-work file about attaching a measurable computational cost to email and other network requests.",
    href: "https://www.hashcash.org/papers/",
  },
];

export function dailyDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailyDifficulty(date = dailyDate()): DailyDifficulty {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return weekday === 1 || weekday === 2 ? "easy" : "medium";
}

export function dailySeed(date = dailyDate(), difficulty = dailyDifficulty(date)) {
  return `daily:v${GENERATOR_VERSION}:${date}:${difficulty}`;
}

export function buildDailyChallenge(
  date = dailyDate(),
  difficulty: DailyDifficulty = dailyDifficulty(date)
): DailyChallenge {
  if (difficulty === "hard") {
    throw new Error("Hard daily challenges require an advanced archive tool.");
  }

  const seed = dailySeed(date, difficulty);
  const rng = createRng(seed);
  const phrases = dailyPhrases.filter((phrase) => phrase.tiers.includes(difficulty));
  const phrase = pick(phrases, rng);
  const keywordFile = pick(keywordFiles, rng);
  const layers: VaultLayer[] = [
    { id: "shift", tool: "caesar", params: { shift: 1 + Math.floor(rng() * 25) } },
    { id: "rails", tool: "rail-fence", params: { rails: 2 + Math.floor(rng() * 4) } },
    { id: "keyword", tool: "vigenere", params: { keyword: keywordFile.keyword } },
  ];

  if (difficulty === "medium") shuffleInPlace(layers, rng);

  const encodedText = [...layers].reverse().reduce((text, layer) => encodeLayer(text, layer), phrase.text);
  const intermediateTexts: string[] = [];
  layers.reduce((text, layer) => {
    const decoded = decodeLayer(text, layer);
    intermediateTexts.push(decoded);
    return decoded;
  }, encodedText);

  const researchFiles = shuffle(keywordFiles.map(({ keyword: _keyword, ...file }) => file), rng);
  const hints = buildHints(layers, intermediateTexts, keywordFile);
  const challenge: DailyChallenge = {
    id: `${date}:${difficulty}:v${GENERATOR_VERSION}`,
    generatorVersion: GENERATOR_VERSION,
    date,
    seed,
    difficulty,
    encodedText,
    layers,
    researchFiles,
    expectedAnswer: phrase.text,
    acceptedAnswers: [compactAnswer(phrase.text)],
    hints,
    theme: phrase.theme,
    figureId: phrase.figureId,
  };

  if (compactAnswer(decodeDailyChallenge(challenge)) !== compactAnswer(challenge.expectedAnswer)) {
    throw new Error(`Generated daily challenge ${challenge.id} did not decode to its expected answer.`);
  }

  return challenge;
}

export function buildDailyRun(date = dailyDate()): ArchiveRun {
  const challenge = buildDailyChallenge(date);
  const run = buildArchiveRun(challenge.seed);
  return {
    ...run,
    stations: run.stations.map((station) =>
      station.id === "vault" ? dailyVaultStation(station, challenge) : station
    ),
  };
}

export function decodeDailyChallenge(challenge: DailyChallenge) {
  return challenge.layers.reduce((text, layer) => decodeLayer(text, layer), challenge.encodedText);
}

function dailyVaultStation(station: PuzzleStation, challenge: DailyChallenge): PuzzleStation {
  const shiftLayer = challenge.layers.find((layer) => layer.tool === "caesar");
  const railLayer = challenge.layers.find((layer) => layer.tool === "rail-fence");
  const keywordLayer = challenge.layers.find((layer) => layer.tool === "vigenere");
  return {
    ...station,
    subtitle: `${capitalize(challenge.difficulty)} layered challenge`,
    difficulty: challenge.difficulty,
    prompt:
      challenge.difficulty === "easy"
        ? "Three familiar seals protect today's message. Follow the marked tool order and decode each layer."
        : "Three familiar seals protect today's longer message, but their order has shifted. Use the clues and readable transitions to diagnose each layer.",
    clue:
      challenge.difficulty === "easy"
        ? "The lock plates read Shift Door, Rail Table, then Keyword Terminal. Each successful layer reveals the next seal."
        : "The same three archive tools were used once each. Their order changes with the day, and each successful layer leaves a more recognizable signal.",
    encodedText: challenge.encodedText,
    expectedAnswer: challenge.expectedAnswer,
    acceptedAnswers: challenge.acceptedAnswers,
    hints: challenge.hints,
    config: {
      ...station.config,
      vaultShift: Number(shiftLayer?.params.shift),
      vaultRails: Number(railLayer?.params.rails),
      vaultKeyword: String(keywordLayer?.params.keyword),
      vaultLayers: challenge.layers,
      vaultResearchFiles: challenge.researchFiles,
      dailyDifficulty: challenge.difficulty,
    },
  };
}

function buildHints(layers: VaultLayer[], intermediateTexts: string[], keywordFile: KeywordFile): Hint[] {
  const hints: Hint[] = [
    {
      speaker: "Archive custodian",
      text: "Diagnose one layer at a time. A useful decode should expose structure; undo anything that only produces different noise.",
    },
  ];

  layers.forEach((layer, index) => {
    const position = index === 0 ? "first" : index === layers.length - 1 ? "final" : "next";
    const marker = compactAnswer(intermediateTexts[index]).charAt(0);
    if (layer.tool === "caesar") {
      hints.push({
        speaker: "Archive margin",
        text: `The ${position} seal turns one alphabet wheel by a fixed amount. A correct preview begins with ${marker}.`,
      });
    } else if (layer.tool === "rail-fence") {
      hints.push({
        speaker: "Archive margin",
        text: `The ${position} seal changes the route, not the letters. Rebuild the zigzag; a correct read begins with ${marker}.`,
      });
    } else {
      hints.push({
        speaker: "Archive margin",
        text: `The ${position} seal repeats a pioneer surname. Research the file titled "${keywordFile.title}"; a correct decode begins with ${marker}.`,
      });
    }
  });

  hints.push({
    speaker: "Direct reveal",
    text: `Decode route: ${layers.map(describeLayer).join(" -> ")}. Final answer: ${intermediateTexts.at(-1)}.`,
  });
  return hints;
}

function describeLayer(layer: VaultLayer) {
  if (layer.tool === "caesar") return `Shift ${layer.params.shift}`;
  if (layer.tool === "rail-fence") return `${layer.params.rails} rails`;
  return `Keyword ${layer.params.keyword}`;
}

function encodeLayer(text: string, layer: VaultLayer) {
  if (layer.tool === "caesar") return caesarEncode(text, Number(layer.params.shift));
  if (layer.tool === "rail-fence") return railFenceEncode(text, Number(layer.params.rails));
  return vigenereEncode(text, String(layer.params.keyword));
}

function decodeLayer(text: string, layer: VaultLayer) {
  if (layer.tool === "caesar") return caesarDecode(text, Number(layer.params.shift));
  if (layer.tool === "rail-fence") return railFenceDecode(text, Number(layer.params.rails));
  return vigenereDecode(text, String(layer.params.keyword));
}

function createRng(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rng: () => number) {
  if (!items.length) throw new Error("Cannot choose from an empty daily content bank.");
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(items: T[], rng: () => number) {
  return shuffleInPlace([...items], rng);
}

function shuffleInPlace<T>(items: T[], rng: () => number) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
