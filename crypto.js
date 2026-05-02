/**
 * ENC1 crypto for "A Game About Crates" by _Froggi
 *
 * Works in both browser (<script src="crypto.js">) and Node.js (require('./crypto.js')).
 *
 * LCG:  state = (state × 0x0019660D + 0x3C6EF35F) & 0x7FFFFFFF
 * key[i] = (state ^ seed[i % seedLen]) & 0xFF
 * seed[i] = (31 × charCode(i) + 7 × i) & 0xFF   (DeriveKeyFromSeed, reverse-engineered)
 * stateInit = (seed[0] << 8) | seed[1]
 * ENC1 format: "ENC1:" + hexCipher + lowerHex4(checksum)
 * checksum = sum(plaintextBytes) & 0xFFFF
 */

/* global TextEncoder, TextDecoder */

const MULT    = 1664525;    // 0x0019660D
const LCGADD  = 1013904223; // 0x3C6EF35F
const MASK    = 2147483647; // 0x7FFFFFFF  (lower 31 bits)
const DEF_KEY = 'K9#mXqL2$vRnT5@w';

// seed[i] = (31 * charCode + 7 * i) & 0xFF
// Reverse-engineered from Udon assembly DeriveKeyFromSeed
function deriveSeed(s) {
  const n = s.length;
  const seed = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    seed[i] = (31 * s.charCodeAt(i) + 7 * i) & 0xFF;
  return seed;
}

// LCG-based keystream; state × MULT fits in float64 (max ≈ 3.57e15 < 2^53)
function buildKS(seed, stateInit, len) {
  const sl = seed.length;
  let st = stateInit;
  const ks = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    st = (st * MULT + LCGADD) & MASK;
    ks[i] = (st ^ seed[i % sl]) & 0xFF;
  }
  return ks;
}

function hexToU8(hex) {
  const out = new Uint8Array(hex.length >>> 1);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function u8ToHex(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

function checksum(bytes) {
  let s = 0;
  for (let i = 0; i < bytes.length; i++) s += bytes[i];
  return s & 0xFFFF;
}

/**
 * Decrypt an ENC1 string.
 * @param {string} enc1    Full ENC1 save string
 * @param {string} player  VRChat display name (case-sensitive)
 * @param {string} [key]   Encryption key (defaults to DEF_KEY)
 * @returns {{ json: string, keys: number, warning: string|null }}
 */
function decrypt(enc1, player, key) {
  enc1 = enc1.trim();
  if (!enc1.startsWith('ENC1:')) throw new Error("Input must start with 'ENC1:'");
  const cksHex    = enc1.slice(-4);
  const cipherHex = enc1.slice(5, -4);
  if (cipherHex.length & 1) throw new Error('Malformed ENC1: odd-length hex');

  const cipher = hexToU8(cipherHex);
  const seed   = deriveSeed((key || DEF_KEY) + player);
  const si     = (seed[0] << 8) | seed[1];
  const ks     = buildKS(seed, si, cipher.length);

  const plain = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) plain[i] = cipher[i] ^ ks[i];

  const cks = checksum(plain);
  const exp = parseInt(cksHex, 16);
  const warning = (cks !== exp)
    ? `Checksum mismatch — computed ${cks.toString(16).padStart(4, '0')}, expected ${cksHex}`
    : null;

  const text = new TextDecoder().decode(plain);
  const obj  = JSON.parse(text);
  return { json: JSON.stringify(obj, null, 2), keys: Object.keys(obj).length, warning };
}

/**
 * Encrypt a JSON string to ENC1 format.
 * @param {string} jsonText  JSON to encrypt
 * @param {string} player    VRChat display name (case-sensitive)
 * @param {string} [key]     Encryption key (defaults to DEF_KEY)
 * @returns {string} ENC1 string
 */
function encrypt(jsonText, player, key) {
  const obj   = JSON.parse(jsonText); // validates JSON
  const plain = new TextEncoder().encode(JSON.stringify(obj));
  const seed  = deriveSeed((key || DEF_KEY) + player);
  const si    = (seed[0] << 8) | seed[1];
  const ks    = buildKS(seed, si, plain.length);

  const cipher = new Uint8Array(plain.length);
  for (let i = 0; i < plain.length; i++) cipher[i] = plain[i] ^ ks[i];

  const cks = checksum(plain).toString(16).padStart(4, '0');
  return 'ENC1:' + u8ToHex(cipher) + cks;
}

// Export for Node.js; in browser, functions are in global scope via <script>
if (typeof module !== 'undefined') {
  module.exports = { deriveSeed, buildKS, hexToU8, u8ToHex, checksum, decrypt, encrypt, DEF_KEY };
}
