import { caesarEncode, diffieHellmanSharedSecret, railFenceEncode, vigenereEncode } from "@/lib/ciphers";

export type StationId = "caesar" | "rail-fence" | "vigenere" | "diffie-hellman" | "vault";

export interface Hint {
  speaker: string;
  text: string;
}

export interface LoreArtifact {
  title: string;
  body: string;
  href: string;
}

export interface VaultResearchFile {
  title: string;
  body: string;
  href: string;
}

export interface PuzzleStation {
  id: StationId;
  title: string;
  subtitle: string;
  act: "intro" | "keys" | "vault";
  difficulty: "easy" | "medium";
  guide: string;
  hotspot: { x: number; y: number };
  prompt: string;
  clue: string;
  encodedText: string;
  expectedAnswer: string;
  acceptedAnswers?: string[];
  toolLabel: string;
  hints: Hint[];
  artifact: LoreArtifact;
  config: {
    shift?: number;
    rails?: number;
    keyword?: string;
    publicPrime?: number;
    publicBase?: number;
    aliceSecret?: number;
    bobSecret?: number;
    alicePublic?: number;
    bobPublic?: number;
    sharedSecret?: number;
    vaultShift?: number;
    vaultRails?: number;
    vaultKeyword?: string;
    vaultResearchFiles?: VaultResearchFile[];
  };
}

export interface ArchiveRun {
  seed: string;
  stations: PuzzleStation[];
}

const caesarPhrases = [
  "PRIVACY IS POWER",
  "CODE CAN SPEAK",
  "SHIFT THE ALPHABET",
  "SECRETS NEED PRACTICE",
  "TRY EVERY SHIFT",
  "CIPHERS OPEN DOORS",
  "PUBLIC WORDS PRIVATE MEANING",
  "ROTATE THE RING",
];

const railFencePhrases = [
  "ORDER HIDES THE MESSAGE",
  "THE LETTERS STAY THE SAME",
  "FOLLOW THE ZIGZAG",
  "PATHS CAN HIDE WORDS",
  "READ THE RAILS",
  "MOVE THE SYMBOLS",
  "THE ROUTE IS THE KEY",
  "REORDER THEN RECOVER",
];

const vigenerePhrases = [
  "THE KEY CHANGES EVERYTHING",
  "SECRETS NEED SHARED CONTEXT",
  "KEYWORDS GUIDE THE SHIFT",
  "A STRONGER LOCK USES A KEY",
  "REPEAT THE KEY TO READ",
  "PATTERNS BECOME HARDER",
  "THE KEY TRAVELS WITH TRUST",
  "PRIVATE TOOLS NEED KEYS",
];

const keywordClues = [
  {
    keyword: "CHAUM",
    clue: "The keyword belongs to the cryptographer who imagined private digital cash and blind signatures before Bitcoin.",
    hint1: "Look for the pioneer connected to blind signatures and anonymous payments.",
    hint2: "His DigiCash work heavily influenced later cypherpunk money experiments.",
    artifactTitle: "David Chaum and Digital Cash",
    artifactBody:
      "David Chaum's work on blind signatures and digital cash helped shape the cypherpunk imagination around privacy-preserving money and identity.",
    fileTitle: "Blind Signatures and Digital Cash",
    fileBody:
      "A private-money file describing blind signatures, anonymous payments, and the DigiCash experiments that influenced later cypherpunk currency designs.",
    href: "https://chaum.com/publications/",
  },
  {
    keyword: "FINNEY",
    clue: "The keyword belongs to the PGP contributor who received the first Bitcoin transaction.",
    hint1: "Look for the bridge between practical email privacy and early Bitcoin history.",
    hint2: "He helped author PGP 2.0 and later ran early Bitcoin software.",
    artifactTitle: "Hal Finney and PGP",
    artifactBody:
      "Hal Finney helped make strong cryptography practical for real users through PGP 2.0, then became one of Bitcoin's earliest contributors.",
    fileTitle: "PGP Mail and the First Bitcoin Transfer",
    fileBody:
      "A practical-crypto file about PGP 2.0, reusable proof of work, and the recipient of Satoshi's first Bitcoin transaction.",
    href: "https://nakamotoinstitute.org/finney/rpow/",
  },
  {
    keyword: "MERKLE",
    clue: "The keyword belongs to the public-key pioneer whose hash trees help verify large sets of data.",
    hint1: "Look for the pioneer tied to Merkle puzzles and tree-shaped integrity checks.",
    hint2: "His surname also names the trees used in many blockchain systems.",
    artifactTitle: "Ralph Merkle and Integrity Trees",
    artifactBody:
      "Ralph Merkle contributed foundational public-key ideas and Merkle trees, a practical structure for verifying data integrity.",
    fileTitle: "Hash Trees and Public-Key Puzzles",
    fileBody:
      "A data-integrity file about early public-key puzzles and tree-shaped hash commitments used to verify large sets of records.",
    href: "https://www.merkle.com/papers/Protocols.pdf",
  },
  {
    keyword: "GILMORE",
    clue: "The keyword belongs to the Cypherpunks mailing-list co-founder who also helped start the EFF.",
    hint1: "Look for the privacy and free-speech advocate associated with fighting crypto backdoors.",
    hint2: "He co-founded the Cypherpunks mailing list with Eric Hughes and Tim May.",
    artifactTitle: "John Gilmore and the Cypherpunks",
    artifactBody:
      "John Gilmore helped build cypherpunk infrastructure and defended strong cryptography as a tool for privacy and speech.",
    fileTitle: "Mailing Lists, Free Speech, and Backdoors",
    fileBody:
      "A movement-history file about the Cypherpunks mailing list, EFF advocacy, and resistance to government backdoors in cryptography.",
    href: "https://www.eff.org/about/history",
  },
];

const dhSetups = [
  { publicPrime: 23, publicBase: 5, aliceSecret: 6, bobSecret: 15 },
  { publicPrime: 23, publicBase: 5, aliceSecret: 4, bobSecret: 9 },
  { publicPrime: 29, publicBase: 2, aliceSecret: 7, bobSecret: 11 },
  { publicPrime: 31, publicBase: 3, aliceSecret: 5, bobSecret: 13 },
  { publicPrime: 37, publicBase: 5, aliceSecret: 8, bobSecret: 12 },
];

const finalPhrases = [
  "PRIVACY NEEDS TOOLS",
  "CODE PROTECTS SPEECH",
  "KEYS MAKE SECRETS",
  "PUBLIC EXCHANGE PRIVATE SECRET",
  "CIPHERS TEACH TRUST",
];

const acrosticWords: Record<string, string[]> = {
  A: ["Always", "Archive", "Anonymous", "Algebra", "Agents"],
  B: ["Be", "Blind", "Build", "Broadcast", "Between"],
  C: ["Cryptic", "Cipher", "Code", "Carry", "Chaum"],
  D: ["Defend", "Decode", "Digital", "Door", "Diffie"],
  E: ["Every", "Exchange", "Encode", "Entropy", "Encrypt"],
  F: ["Find", "Finney", "Freedom", "Follow", "Forge"],
  G: ["Guard", "Gilmore", "Graph", "Guess", "Gateway"],
  H: ["Hide", "Hash", "Hellman", "Hold", "Handshake"],
  I: ["Inside", "Integrity", "Inspect", "Invisible", "Index"],
  J: ["Join", "Jumble", "Judge", "Journey", "Justify"],
  K: ["Keep", "Key", "Known", "Kernel", "Knock"],
  L: ["Layer", "Lock", "Ledger", "Listen", "Link"],
  M: ["Merkle", "Message", "Mask", "Move", "Map"],
  N: ["Never", "Network", "Notice", "Noise", "Name"],
  O: ["Open", "Order", "Observe", "Obscure", "Outer"],
  P: ["Private", "Public", "Proof", "Puzzle", "Protect"],
  Q: ["Question", "Quiet", "Quorum", "Queue", "Quilt"],
  R: ["Rotate", "Rail", "Read", "Recover", "Resist"],
  S: ["Secret", "Shift", "Signal", "Speech", "Seal"],
  T: ["Trust", "Trace", "Tool", "Tree", "Terminal"],
  U: ["Unseal", "Undo", "Unknown", "Use", "Unlink"],
  V: ["Vault", "Verify", "Vigenere", "Voice", "Value"],
  W: ["Wheel", "Watch", "Write", "Whisper", "Work"],
  X: ["Xor", "Xray", "Xmark", "Xeno", "Xaxis"],
  Y: ["Yield", "Your", "Yoke", "Yonder", "Yearn"],
  Z: ["Zigzag", "Zero", "Zone", "Zip", "Zeal"],
};

export function buildArchiveRun(seed: string): ArchiveRun {
  const rng = createRng(seed);
  const caesarPlain = pick(caesarPhrases, rng);
  const caesarShift = 1 + Math.floor(rng() * 25);
  const railPlain = pick(railFencePhrases, rng);
  const railCount = rng() > 0.72 ? 4 : 3;
  const vigenerePlain = pick(vigenerePhrases, rng);
  const keywordClue = pick(keywordClues, rng);
  const keyword = keywordClue.keyword;
  const dhConfig = pick(dhSetups, rng);
  const dh = diffieHellmanSharedSecret(
    dhConfig.publicPrime,
    dhConfig.publicBase,
    dhConfig.aliceSecret,
    dhConfig.bobSecret
  );
  const vaultPhrase = pick(finalPhrases, rng);
  const vaultShift = pickDifferentNumber(1 + Math.floor(rng() * 25), caesarShift, 1, 25);
  const vaultRails = railCount === 3 ? 4 : 3;
  const vaultKeywordClue = pickDifferentKeyword(keywordClues, keyword, rng);
  const vaultKeyword = vaultKeywordClue.keyword;
  const vaultAfterKeyword = vigenereEncode(vaultPhrase, vaultKeyword);
  const vaultAfterRail = railFenceEncode(vaultAfterKeyword, vaultRails);
  const vaultCipher = caesarEncode(vaultAfterRail, vaultShift);
  const shiftAcrostic = makeAcrostic(vaultAfterRail, rng);
  const railAcrostic = makeAcrostic(vaultAfterKeyword, rng);
  const vaultResearchFiles = shuffle(
    keywordClues.map((clue) => ({
      title: clue.fileTitle,
      body: clue.fileBody,
      href: clue.href,
    })),
    rng
  );

  return {
    seed,
    stations: [
      {
        id: "caesar",
        title: "Shift Door",
        subtitle: "Caesar / ROT cipher",
        act: "intro",
        difficulty: "easy",
        guide: "John Gilmore",
        hotspot: { x: 18, y: 34 },
        prompt: "The door accepts the plaintext hidden behind an unknown alphabet shift.",
        clue: "This is an old weak cipher. The lesson is not secrecy by obscurity; the lesson is how quickly a small key space can be searched.",
        encodedText: caesarEncode(caesarPlain, caesarShift),
        expectedAnswer: caesarPlain,
        acceptedAnswers: [caesarPlain.replaceAll(" ", "")],
        toolLabel: "No shift is provided. Move the wheel until the preview turns into readable words.",
        config: { shift: caesarShift },
        hints: [
          {
            speaker: "John Gilmore",
            text: "A fixed shift does not stay secret for long. There are only 25 useful shifts to try.",
          },
          {
            speaker: "Archive note",
            text: "Use the wheel as a brute-force tool. Stop when the preview becomes readable English.",
          },
          {
            speaker: "Archive note",
            text: `This door was shifted by ${caesarShift}.`,
          },
        ],
        artifact: {
          title: "Cypherpunk Ethos",
          body: "The cypherpunk movement tied privacy, speech, and practical software together. The point was not just secret messages, but tools people could actually use.",
          href: "https://www.eff.org/cyberspace-independence",
        },
      },
      {
        id: "rail-fence",
        title: "Rail Table",
        subtitle: "Transposition cipher",
        act: "intro",
        difficulty: "easy",
        guide: "Archive Scribe",
        hotspot: { x: 49, y: 68 },
        prompt: "The letters were not replaced. They were walked across rails and read row by row.",
        clue: "The plaque says: the route matters more than the alphabet. Count the paths carved into the table before reading.",
        encodedText: railFenceEncode(railPlain, railCount),
        expectedAnswer: railPlain,
        acceptedAnswers: [railPlain.replaceAll(" ", "")],
        toolLabel: "Choose a rail count, rebuild the rows, then read the letters along the zigzag path.",
        config: { rails: railCount },
        hints: [
          {
            speaker: "Archive Scribe",
            text: "A transposition cipher keeps the same letters and changes their order.",
          },
          {
            speaker: "Archive note",
            text: "Choose a rail count, rebuild the rows, then read the message by tracing the zigzag path.",
          },
          {
            speaker: "Archive note",
            text: `This table uses ${railCount} rails and removes spaces before encoding.`,
          },
        ],
        artifact: {
          title: "Substitution vs Transposition",
          body: "Classical ciphers often either replace symbols or move them around. Modern systems are more complex, but this split is a useful first mental model.",
          href: "https://en.wikipedia.org/wiki/Transposition_cipher",
        },
      },
      {
        id: "vigenere",
        title: "Keyword Terminal",
        subtitle: "Vigenere cipher",
        act: "keys",
        difficulty: "medium",
        guide: "Hal Finney",
        hotspot: { x: 73, y: 42 },
        prompt: "The terminal changes its shift with each keyword letter, but the keyword is hidden in the archive's history.",
        clue: keywordClue.clue,
        encodedText: vigenereEncode(vigenerePlain, keyword),
        expectedAnswer: vigenerePlain,
        acceptedAnswers: [vigenerePlain.replaceAll(" ", "")],
        toolLabel: "Enter the keyword and compare each encrypted letter against the repeated keyword strip.",
        config: { keyword },
        hints: [
          {
            speaker: "Hal Finney",
            text: "A key turns a simple method into a shared procedure. Here, the key is a pioneer surname hidden in the clue.",
          },
          {
            speaker: "Archive note",
            text: keywordClue.hint1,
          },
          {
            speaker: "Archive note",
            text: keywordClue.hint2,
          },
          {
            speaker: "Archive note",
            text: `The keyword is ${keyword}. Type it once; the terminal repeats it for you.`,
          },
        ],
        artifact: {
          title: keywordClue.artifactTitle,
          body: keywordClue.artifactBody,
          href: keywordClue.href,
        },
      },
      {
        id: "diffie-hellman",
        title: "Shared Secret Altar",
        subtitle: "Diffie-Hellman idea",
        act: "vault",
        difficulty: "medium",
        guide: "Diffie, Hellman, and Merkle",
        hotspot: { x: 38, y: 28 },
        prompt: "Alice and Bob need to create one shared room key while an eavesdropper can see every public message they send.",
        clue: "The altar is named for public-key pioneers: public exchange, private choices, shared secret.",
        encodedText: `Public recipe: prime ${dhConfig.publicPrime}, base ${dhConfig.publicBase}. Private choices: Alice ${dhConfig.aliceSecret}, Bob ${dhConfig.bobSecret}.`,
        expectedAnswer: String(dh.sharedSecret),
        toolLabel: "Advance the exchange to see which numbers are public, which stay private, and how both sides land on the same room key.",
        config: {
          ...dhConfig,
          alicePublic: dh.alicePublic,
          bobPublic: dh.bobPublic,
          sharedSecret: dh.sharedSecret,
        },
        hints: [
          {
            speaker: "Martin Hellman",
            text: "The public values are safe to send because the private exponents are not sent with them.",
          },
          {
            speaker: "Archive note",
            text: `Alice's public value is ${dhConfig.publicBase}^${dhConfig.aliceSecret} mod ${dhConfig.publicPrime}. Bob's is ${dhConfig.publicBase}^${dhConfig.bobSecret} mod ${dhConfig.publicPrime}.`,
          },
        ],
        artifact: {
          title: "Public-Key Exchange",
          body: "Diffie-Hellman key exchange showed that two parties could agree on a shared secret over an insecure channel, a foundation for secure internet protocols.",
          href: "https://ee.stanford.edu/~hellman/publications/24.pdf",
        },
      },
      {
        id: "vault",
        title: "Final Vault",
        subtitle: "Archive synthesis",
        act: "vault",
        difficulty: "medium",
        guide: "David Chaum",
        hotspot: { x: 83, y: 73 },
        prompt: "The vault has been sealed with tools you already unlocked. Use the room's ciphers to peel the layers back.",
        clue: "Three plates mark the lock: a shift wheel, a rail path, and a keyword terminal. This is a new lock, not a copy of the station settings.",
        encodedText: vaultCipher,
        expectedAnswer: vaultPhrase,
        acceptedAnswers: [vaultPhrase.replaceAll(" ", "")],
        toolLabel:
          "Open one tool at a time, test a decode, and apply it to the work text. Reset when a path turns unreadable; transfer the work text when it becomes the final lesson.",
        config: { vaultShift, vaultRails, vaultKeyword, vaultResearchFiles },
        hints: [
          {
            speaker: "David Chaum",
            text: "Cryptography matters when it becomes a tool: private enough to protect people, practical enough to use. Here, use the tool types you earned, not the old answers.",
          },
          {
            speaker: "Archive note",
            text: `Start with the Shift Door. The next seal begins where this margin phrase points: "${shiftAcrostic.phrase}".`,
          },
          {
            speaker: "Archive note",
            text: `Then use the Rail Table. Its readout begins where this note points: "${railAcrostic.phrase}".`,
          },
          {
            speaker: "Archive note",
            text: `The final layer is a Keyword Terminal. Search the vault research files for "${vaultKeywordClue.fileTitle}" and use the associated pioneer surname as the key.`,
          },
          {
            speaker: "Archive note",
            text: `Direct reveal: after Shift Door starts with ${shiftAcrostic.target}, after Rail Table starts with ${railAcrostic.target}, final keyword is ${vaultKeyword}. Settings: shift ${vaultShift}, ${vaultRails} rails.`,
          },
        ],
        artifact: {
          title: "Digital Cash and Anonymous Systems",
          body: "David Chaum's work on blind signatures and digital cash helped shape the cypherpunk imagination around privacy-preserving money and identity.",
          href: "https://chaum.com/publications/",
        },
      },
    ],
  };
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
  return items[Math.floor(rng() * items.length)];
}

function pickDifferentNumber(candidate: number, excluded: number, min: number, max: number) {
  if (candidate !== excluded) return candidate;
  return candidate === max ? min : candidate + 1;
}

function pickDifferentKeyword<T extends { keyword: string }>(items: T[], excluded: string, rng: () => number) {
  const candidates = items.filter((item) => item.keyword !== excluded);
  return pick(candidates.length ? candidates : items, rng);
}

function shuffle<T>(items: T[], rng: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeAcrostic(source: string, rng: () => number, length = 3) {
  const target = source.replace(/[^A-Z]/g, "").slice(0, length);
  const words = target.split("").map((letter) => pick(acrosticWords[letter] ?? [letter], rng));
  return {
    target,
    phrase: words.join(" "),
  };
}
