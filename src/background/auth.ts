/// <reference types="chrome"/>

export interface VerifiedJwtPayload {
  sub?: string;
  email?: string;
  username?: string;
  name?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface JwtVerificationResult {
  valid: boolean;
  payload?: VerifiedJwtPayload;
  error?: string;
}

const SESSION_STORAGE_KEY = 'oneuid_session_token';
const LEGACY_LOCAL_TOKEN_KEYS = ['oneuid_access_token', 'identity_token'];

const ALLOWED_ALGS = new Set([
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512',
  'EdDSA',
]);

const ALLOWED_ISSUERS = new Set([
  'https://uid.one',
  'https://api.uid.one',
  'https://auth.uid.one',
  'https://api.uid.one/v1/auth',
  'https://api.uid.one/o',
]);

const ALLOWED_AUDIENCES = new Set([
  'uid-extension-client',
  'uid-web',
  'uid-one',
  'https://uid.one',
  'https://api.uid.one',
  'https://auth.uid.one',
]);

const CLOCK_SKEW_SECONDS = 30;
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;

interface JwksCacheEntry {
  keys: JsonWebKey[];
  fetchedAt: number;
}

const jwksCache = new Map<string, JwksCacheEntry>();

let memorySessionToken: string | null = null;
const memoryBindingStore = new Map<string, { bindingKey: string; createdAt: number }>();

function base64UrlToUint8Array(segment: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error('Invalid base64url encoding');
  }
  let base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

function normalizeIssuer(iss: string): string {
  return iss.trim().replace(/\/+$/, '');
}

function getWebCryptoAlgorithm(alg: string, jwk: JsonWebKey): {
  importParams: RsaHashedImportParams | EcKeyImportParams | AlgorithmIdentifier;
  verifyParams: AlgorithmIdentifier | EcdsaParams;
} | null {
  switch (alg) {
    case 'RS256':
      return {
        importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        verifyParams: { name: 'RSASSA-PKCS1-v1_5' },
      };
    case 'RS384':
      return {
        importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
        verifyParams: { name: 'RSASSA-PKCS1-v1_5' },
      };
    case 'RS512':
      return {
        importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
        verifyParams: { name: 'RSASSA-PKCS1-v1_5' },
      };
    case 'ES256':
      return {
        importParams: { name: 'ECDSA', namedCurve: jwk.crv || 'P-256' },
        verifyParams: { name: 'ECDSA', hash: 'SHA-256' },
      };
    case 'ES384':
      return {
        importParams: { name: 'ECDSA', namedCurve: jwk.crv || 'P-384' },
        verifyParams: { name: 'ECDSA', hash: 'SHA-384' },
      };
    case 'ES512':
      return {
        importParams: { name: 'ECDSA', namedCurve: jwk.crv || 'P-521' },
        verifyParams: { name: 'ECDSA', hash: 'SHA-512' },
      };
    case 'EdDSA':
      return {
        importParams: { name: 'Ed25519' },
        verifyParams: { name: 'Ed25519' },
      };
    default:
      return null;
  }
}

export function validateJwtStructureAndClaims(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): {
  valid: boolean;
  header?: { alg: string; kid?: string; typ?: string };
  payload?: VerifiedJwtPayload;
  signingInput?: Uint8Array;
  signature?: Uint8Array;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing token' };
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) {
    return { valid: false, error: 'Malformed JWT' };
  }

  let header: { alg?: string; kid?: string; typ?: string };
  let payload: VerifiedJwtPayload;
  let signature: Uint8Array;

  try {
    header = decodeBase64UrlJson<{ alg?: string; kid?: string; typ?: string }>(parts[0]);
    payload = decodeBase64UrlJson<VerifiedJwtPayload>(parts[1]);
    signature = base64UrlToUint8Array(parts[2]);
  } catch {
    return { valid: false, error: 'Invalid JWT encoding' };
  }

  if (!header.alg || !ALLOWED_ALGS.has(header.alg)) {
    return { valid: false, error: `Unsupported JWT algorithm: ${header.alg || 'none'}` };
  }

  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return { valid: false, error: 'Missing exp claim' };
  }

  if (nowSeconds >= payload.exp) {
    return { valid: false, error: 'Token expired' };
  }

  if (typeof payload.nbf === 'number' && Number.isFinite(payload.nbf)) {
    if (nowSeconds + CLOCK_SKEW_SECONDS < payload.nbf) {
      return { valid: false, error: 'Token not yet valid' };
    }
  }

  if (typeof payload.iss !== 'string' || !ALLOWED_ISSUERS.has(normalizeIssuer(payload.iss))) {
    return { valid: false, error: 'Untrusted JWT issuer' };
  }

  if (payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const hasAllowedAud = audiences.some(
      (a) => typeof a === 'string' && ALLOWED_AUDIENCES.has(normalizeIssuer(a))
    );
    if (!hasAllowedAud) {
      return { valid: false, error: 'Untrusted JWT audience' };
    }
  }

  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  return {
    valid: true,
    header: { alg: header.alg, kid: header.kid, typ: header.typ },
    payload,
    signingInput,
    signature,
  };
}

export async function verifyJwtWithJwks(
  token: string,
  keys: JsonWebKey[],
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<JwtVerificationResult> {
  const parsed = validateJwtStructureAndClaims(token, nowSeconds);
  if (!parsed.valid || !parsed.header || !parsed.payload || !parsed.signingInput || !parsed.signature) {
    return { valid: false, error: parsed.error || 'Invalid JWT' };
  }

  if (!Array.isArray(keys) || keys.length === 0) {
    return { valid: false, error: 'No JWKS keys available' };
  }

  const { alg, kid } = parsed.header;
  const candidateKeys = kid
    ? keys.filter((k) => (k as { kid?: string }).kid === kid)
    : keys;

  const keysToTry = candidateKeys.length > 0 ? candidateKeys : keys;

  for (const jwk of keysToTry) {
    const cryptoAlg = getWebCryptoAlgorithm(alg, jwk);
    if (!cryptoAlg) continue;
    try {
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        cryptoAlg.importParams,
        false,
        ['verify']
      );
      const isValid = await crypto.subtle.verify(
        cryptoAlg.verifyParams,
        publicKey,
        parsed.signature as BufferSource,
        parsed.signingInput as BufferSource
      );
      if (isValid) {
        return { valid: true, payload: parsed.payload };
      }
    } catch {
      // Try next candidate key
    }
  }

  return { valid: false, error: 'Invalid JWT signature' };
}

async function fetchJwksForApiBase(apiBase: string): Promise<JsonWebKey[]> {
  let origin = 'https://api.uid.one';
  try {
    origin = new URL(apiBase).origin;
  } catch {
    origin = 'https://api.uid.one';
  }

  const cached = jwksCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
    return cached.keys;
  }

  const endpoints = [
    `${origin}/.well-known/jwks.json`,
    `${origin}/o/.well-known/jwks.json`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'omit' });
      if (!res.ok) continue;
      const body = (await res.json()) as { keys?: JsonWebKey[] };
      if (Array.isArray(body.keys) && body.keys.length > 0) {
        jwksCache.set(origin, { keys: body.keys, fetchedAt: Date.now() });
        return body.keys;
      }
    } catch {
      // Try next endpoint
    }
  }

  return [];
}

/**
 * Verifies JWT structure, claims (`iss`, `aud`, `exp`, `nbf`), and cryptographic signature
 * against the live UID.one JWKS endpoint.
 */
export async function verifySessionJwt(
  token: string,
  apiBase: string
): Promise<JwtVerificationResult> {
  const precheck = validateJwtStructureAndClaims(token);
  if (!precheck.valid) {
    return { valid: false, error: precheck.error };
  }

  const keys = await fetchJwksForApiBase(apiBase);
  return verifyJwtWithJwks(token, keys);
}

// ================= SECURE SESSION STORAGE =================

export async function configureSessionStorageAccess(): Promise<void> {
  try {
    if (chrome.storage?.session?.setAccessLevel) {
      await chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    }
  } catch {
    // Some browsers (e.g. Firefox < 115) may not support setAccessLevel
  }
}

export async function purgeLegacyPlaintextTokens(): Promise<void> {
  try {
    await chrome.storage.local.remove(LEGACY_LOCAL_TOKEN_KEYS);
  } catch {
    // Ignore storage cleanup errors
  }
}

export async function getStoredSessionToken(): Promise<string | null> {
  if (memorySessionToken) return memorySessionToken;
  try {
    if (chrome.storage?.session) {
      const stored = await chrome.storage.session.get([SESSION_STORAGE_KEY]);
      const token = stored[SESSION_STORAGE_KEY] as string | undefined;
      if (token) {
        memorySessionToken = token;
        return token;
      }
    }
  } catch {
    // Fallback to in-memory only
  }
  return null;
}

export async function setStoredSessionToken(token: string): Promise<void> {
  memorySessionToken = token;
  await purgeLegacyPlaintextTokens();
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [SESSION_STORAGE_KEY]: token });
    }
  } catch {
    // Keep in memory if session storage is unavailable
  }
}

export async function clearStoredSessionToken(): Promise<void> {
  memorySessionToken = null;
  memoryBindingStore.clear();
  await purgeLegacyPlaintextTokens();
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.remove([SESSION_STORAGE_KEY]);
    }
  } catch {
    // Ignore cleanup errors
  }
  try {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] });
  } catch {
    // Ignore rule cleanup errors
  }
}

export async function setBindingRecord(key: string, bindingKey: string): Promise<void> {
  const record = { bindingKey, createdAt: Date.now() };
  memoryBindingStore.set(key, record);
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [key]: record });
    }
  } catch {
    // In-memory fallback
  }
}

export async function getBindingRecord(key: string): Promise<{ bindingKey: string; createdAt: number } | null> {
  const mem = memoryBindingStore.get(key);
  if (mem) return mem;
  try {
    if (chrome.storage?.session) {
      const stored = await chrome.storage.session.get(key);
      const record = stored[key] as { bindingKey: string; createdAt: number } | undefined;
      if (record) {
        memoryBindingStore.set(key, record);
        return record;
      }
    }
  } catch {
    // In-memory fallback
  }
  return null;
}
