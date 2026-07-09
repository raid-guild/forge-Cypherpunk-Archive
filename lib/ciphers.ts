const A_CODE = "A".charCodeAt(0);
const ALPHABET_SIZE = 26;

export function normalizeAnswer(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactAnswer(value: string) {
  return normalizeAnswer(value).replaceAll(" ", "");
}

export function caesarEncode(text: string, shift: number) {
  return shiftLetters(text, shift);
}

export function caesarDecode(text: string, shift: number) {
  return shiftLetters(text, -shift);
}

export function vigenereEncode(text: string, keyword: string) {
  return vigenere(text, keyword, 1);
}

export function vigenereDecode(text: string, keyword: string) {
  return vigenere(text, keyword, -1);
}

export function railFenceEncode(text: string, rails: number) {
  const normalized = compactAnswer(text);
  if (rails <= 1 || normalized.length <= rails) return normalized;

  const rows = Array.from({ length: rails }, () => "");
  let row = 0;
  let dir = 1;

  for (const char of normalized) {
    rows[row] += char;
    if (row === 0) dir = 1;
    if (row === rails - 1) dir = -1;
    row += dir;
  }

  return rows.join("");
}

export function railFenceDecode(text: string, rails: number) {
  const cipher = compactAnswer(text);
  if (rails <= 1 || cipher.length <= rails) return cipher;

  const pattern = railPattern(cipher.length, rails);
  const railLengths = Array.from({ length: rails }, (_, rail) =>
    pattern.filter((patternRail) => patternRail === rail).length
  );
  const railsText: string[][] = [];
  let cursor = 0;

  for (const length of railLengths) {
    railsText.push(cipher.slice(cursor, cursor + length).split(""));
    cursor += length;
  }

  const railPositions = Array.from({ length: rails }, () => 0);
  return pattern
    .map((rail) => railsText[rail][railPositions[rail]++])
    .join("");
}

export function railFenceRows(text: string, rails: number) {
  const normalized = compactAnswer(text);
  const rows = Array.from({ length: rails }, () => Array.from({ length: normalized.length }, () => ""));
  if (rails <= 1) return [normalized.split("")];

  for (const [col, row] of railPattern(normalized.length, rails).entries()) {
    rows[row][col] = normalized[col];
  }
  return rows;
}

export function modPow(base: number, exponent: number, modulus: number) {
  let result = 1;
  let current = base % modulus;
  let power = exponent;

  while (power > 0) {
    if (power % 2 === 1) result = (result * current) % modulus;
    current = (current * current) % modulus;
    power = Math.floor(power / 2);
  }

  return result;
}

export function diffieHellmanSharedSecret(prime: number, base: number, aliceSecret: number, bobSecret: number) {
  const alicePublic = modPow(base, aliceSecret, prime);
  const bobPublic = modPow(base, bobSecret, prime);
  const sharedFromAlice = modPow(bobPublic, aliceSecret, prime);
  const sharedFromBob = modPow(alicePublic, bobSecret, prime);

  return {
    alicePublic,
    bobPublic,
    sharedSecret: sharedFromAlice,
    verified: sharedFromAlice === sharedFromBob,
  };
}

function shiftLetters(text: string, shift: number) {
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < A_CODE || code >= A_CODE + ALPHABET_SIZE) return char;
      const offset = code - A_CODE;
      const shifted = (offset + shift + ALPHABET_SIZE * 4) % ALPHABET_SIZE;
      return String.fromCharCode(A_CODE + shifted);
    })
    .join("");
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

function vigenere(text: string, keyword: string, dir: 1 | -1) {
  const key = normalizeAnswer(keyword).replace(/[^A-Z]/g, "");
  if (!key) return text.toUpperCase();

  let keyIndex = 0;
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < A_CODE || code >= A_CODE + ALPHABET_SIZE) return char;
      const keyShift = key.charCodeAt(keyIndex % key.length) - A_CODE;
      keyIndex += 1;
      return shiftLetters(char, keyShift * dir);
    })
    .join("");
}
