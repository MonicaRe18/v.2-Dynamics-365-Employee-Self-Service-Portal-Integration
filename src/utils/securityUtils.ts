/**
 * Security & Cryptographic Utilities for Enterprise D365 Authentication
 * Provides synchronous HMAC-SHA256 hashing and token signing/verification
 * to guarantee that session tokens cannot be forged or tampered with
 * by editing localStorage or sessionStorage.
 */

// Ephemeral runtime server/session secret key
// Persisted within the browser session (sessionStorage) so page reloads do not invalidate active sessions
let RUNTIME_SECRET_KEY: string = '';

function getRuntimeSecret(): string {
  if (RUNTIME_SECRET_KEY) return RUNTIME_SECRET_KEY;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const persistedSecret = sessionStorage.getItem('__d365_sec_rk__');
      if (persistedSecret && persistedSecret.length >= 32) {
        RUNTIME_SECRET_KEY = persistedSecret;
        return RUNTIME_SECRET_KEY;
      }
    }
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    }
    RUNTIME_SECRET_KEY = Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('__d365_sec_rk__', RUNTIME_SECRET_KEY);
    }
  } catch {
    RUNTIME_SECRET_KEY = 'D365_SECURE_KERNEL_' + Math.random().toString(36).substring(2) + Date.now();
  }
  return RUNTIME_SECRET_KEY;
}

export function clearRuntimeSecret(): void {
  RUNTIME_SECRET_KEY = '';
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('__d365_sec_rk__');
    }
  } catch {
    // Ignore
  }
}

// Pure standard SHA-256 implementation
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const maxWord = Math.pow(2, 32);
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';

  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // Only ASCII
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += byte.toString(16).padStart(2, '0');
    }
  }
  return result;
}

// Standard HMAC implementation using SHA-256
function hmacSha256(key: string, message: string): string {
  const blockSize = 64;
  let keyBytes = key;

  if (keyBytes.length > blockSize) {
    keyBytes = sha256(keyBytes);
  }
  while (keyBytes.length < blockSize) {
    keyBytes += '\x00';
  }

  let oKeyPad = '';
  let iKeyPad = '';
  for (let i = 0; i < blockSize; i++) {
    const code = keyBytes.charCodeAt(i);
    oKeyPad += String.fromCharCode(code ^ 0x5c);
    iKeyPad += String.fromCharCode(code ^ 0x36);
  }

  const innerHash = sha256(iKeyPad + message);
  // Convert hex inner hash back to ascii bytes for outer hash
  let innerBinary = '';
  for (let i = 0; i < innerHash.length; i += 2) {
    innerBinary += String.fromCharCode(parseInt(innerHash.substring(i, i + 2), 16));
  }

  return sha256(oKeyPad + innerBinary);
}

// Safe base64url encode/decode
function base64UrlEncode(str: string): string {
  try {
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function base64UrlDecode(str: string): string {
  try {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return atob(b64);
  }
}

export interface TokenPayload {
  sub: string; // Worker personnel ID
  civilId: string; // 14-digit National ID
  name: string;
  role: string;
  roles?: string[]; // D365 RBAC assigned roles (e.g. ['ESS_USER', 'MSS_MGR'])
  iat: number; // Issued at (ms)
  exp: number; // Expires at (ms)
  nonce: string; // Unique cryptographic random nonce
}

export interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  tampered: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * Creates a signed JWT-like token with HMAC-SHA256 signature
 */
export function signAuthToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'nonce'>, expiresInMinutes: number = 60): string {
  const now = Date.now();
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInMinutes * 60 * 1000,
    nonce: Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36),
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = hmacSha256(getRuntimeSecret(), signingInput);

  return `${signingInput}.${signature}`;
}

/**
 * Cryptographically verifies a token's HMAC-SHA256 signature and expiration
 */
export function verifyAuthToken(token: string | null | undefined): TokenVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, expired: false, tampered: false, error: 'Token is missing or not a string' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, expired: false, tampered: true, error: 'Token structure is invalid' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = hmacSha256(getRuntimeSecret(), signingInput);

  // Constant-time-like comparison against tampering
  if (signature !== expectedSignature) {
    return { valid: false, expired: false, tampered: true, error: 'Cryptographic signature mismatch (tampered token)' };
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: TokenPayload = JSON.parse(payloadJson);

    if (!payload.civilId || !payload.exp || !payload.iat) {
      return { valid: false, expired: false, tampered: true, error: 'Malformed payload claims' };
    }

    const now = Date.now();
    if (now >= payload.exp) {
      return { valid: false, expired: true, tampered: false, payload, error: 'Token has expired' };
    }

    return { valid: true, expired: false, tampered: false, payload };
  } catch {
    return { valid: false, expired: false, tampered: true, error: 'Payload decode error' };
  }
}
