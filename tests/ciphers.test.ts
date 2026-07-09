import assert from "node:assert/strict";
import test from "node:test";
import {
  caesarDecode,
  caesarEncode,
  compactAnswer,
  diffieHellmanSharedSecret,
  modPow,
  normalizeAnswer,
  railFenceDecode,
  railFenceEncode,
  vigenereDecode,
  vigenereEncode,
} from "../lib/ciphers";

test("normalizes answers for forgiving puzzle validation", () => {
  assert.equal(normalizeAnswer(" privacy,  is power! "), "PRIVACY IS POWER");
  assert.equal(compactAnswer("Privacy is power"), "PRIVACYISPOWER");
});

test("caesar encode/decode round trips with punctuation preserved", () => {
  const encoded = caesarEncode("HELLO, WORLD!", 3);
  assert.equal(encoded, "KHOOR, ZRUOG!");
  assert.equal(caesarDecode(encoded, 3), "HELLO, WORLD!");
});

test("caesar handles wraparound shifts", () => {
  assert.equal(caesarEncode("XYZ", 3), "ABC");
  assert.equal(caesarDecode("ABC", 3), "XYZ");
});

test("vigenere encode/decode round trips with a repeated keyword", () => {
  const encoded = vigenereEncode("THE KEY CHANGES EVERYTHING", "MERKLE");
  assert.equal(encoded, "FLV UPC OLRXRIE IMOCCFLZXR");
  assert.equal(vigenereDecode(encoded, "MERKLE"), "THE KEY CHANGES EVERYTHING");
});

test("rail fence encode/decode round trips for three rails", () => {
  const encoded = railFenceEncode("ORDER HIDES THE MESSAGE", 3);
  assert.equal(encoded, "OREESREHDSHMSAEDITEG");
  assert.equal(railFenceDecode(encoded, 3), "ORDERHIDESTHEMESSAGE");
});

test("rail fence encode/decode round trips for four rails", () => {
  const encoded = railFenceEncode("FOLLOW THE ZIGZAG", 4);
  assert.equal(railFenceDecode(encoded, 4), "FOLLOWTHEZIGZAG");
});

test("modPow computes small modular exponent examples", () => {
  assert.equal(modPow(5, 6, 23), 8);
  assert.equal(modPow(5, 15, 23), 19);
});

test("diffieHellmanSharedSecret computes matching public and shared values", () => {
  const result = diffieHellmanSharedSecret(23, 5, 6, 15);
  assert.deepEqual(result, {
    alicePublic: 8,
    bobPublic: 19,
    sharedSecret: 2,
    verified: true,
  });
});
