import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  isSuspiciousUidHostname,
  isTrustedUidOrigin,
  isTrustedUidUrl,
} from '../src/shared/origins.ts';
import {
  validateJwtStructureAndClaims,
  verifyJwtWithJwks,
} from '../src/background/auth.ts';

function toBase64Url(input: Uint8Array | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signRs256Jwt(
  payload: Record<string, unknown>,
  privateKey: CryptoKey,
  kid = 'test-key-1'
): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT', kid };
  const h = toBase64Url(JSON.stringify(header));
  const p = toBase64Url(JSON.stringify(payload));
  const signingInput = new TextEncoder().encode(`${h}.${p}`);
  const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, signingInput);
  return `${h}.${p}.${toBase64Url(new Uint8Array(sig))}`;
}

test('isTrustedUidOrigin allows explicit HTTPS uid.one origins only', () => {
  assert.equal(isTrustedUidOrigin('https://uid.one'), true);
  assert.equal(isTrustedUidOrigin('https://www.uid.one'), true);
  assert.equal(isTrustedUidOrigin('https://auth.uid.one'), true);
  assert.equal(isTrustedUidOrigin('https://api.uid.one'), true);

  // Substring / lookalike / downgrade / userinfo bypass attempts MUST fail
  assert.equal(isTrustedUidOrigin('https://myuid.one'), false);
  assert.equal(isTrustedUidOrigin('https://notuid.one'), false);
  assert.equal(isTrustedUidOrigin('https://uid.one.attacker.com'), false);
  assert.equal(isTrustedUidOrigin('https://uid.one@attacker.com'), false);
  assert.equal(isTrustedUidOrigin('http://uid.one'), false);
  assert.equal(isTrustedUidOrigin('https://uid.one:8443'), false);
  assert.equal(isTrustedUidOrigin('https://example.com'), false);
  assert.equal(isTrustedUidOrigin(''), false);
  assert.equal(isTrustedUidOrigin(null), false);
});

test('isTrustedUidUrl validates full URLs without substring bypasses', () => {
  assert.equal(isTrustedUidUrl('https://uid.one/profile'), true);
  assert.equal(isTrustedUidUrl('https://auth.uid.one/login?next=/'), true);

  assert.equal(isTrustedUidUrl('https://myuid.one/profile'), false);
  assert.equal(isTrustedUidUrl('https://uid.one.evil.com/login'), false);
  assert.equal(isTrustedUidUrl('https://evil.com/?origin=https://uid.one'), false);
  assert.equal(isTrustedUidUrl('http://uid.one/login'), false);
});

test('isSuspiciousUidHostname flags typo-squats and lookalikes without flagging uid.one', () => {
  assert.equal(isSuspiciousUidHostname('uid.one'), false);
  assert.equal(isSuspiciousUidHostname('auth.uid.one'), false);
  assert.equal(isSuspiciousUidHostname('example.com'), false);

  assert.equal(isSuspiciousUidHostname('myuid.one'), true);
  assert.equal(isSuspiciousUidHostname('notuid.one'), true);
  assert.equal(isSuspiciousUidHostname('uid.one.attacker.com'), true);
  assert.equal(isSuspiciousUidHostname('uid-one-login.com'), true);
  assert.equal(isSuspiciousUidHostname('u1d.one'), true);
});

test('verifyJwtWithJwks accepts valid signed JWT and rejects tampered/expired/untrusted JWTs', async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const pubJwk = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey & {
    kid?: string;
  };
  pubJwk.kid = 'test-key-1';

  const now = Math.floor(Date.now() / 1000);
  const validToken = await signRs256Jwt(
    {
      sub: 'user-123',
      email: 'alice@example.com',
      iss: 'https://api.uid.one',
      aud: 'uid-extension-client',
      exp: now + 3600,
    },
    keyPair.privateKey
  );

  const ok = await verifyJwtWithJwks(validToken, [pubJwk], now);
  assert.equal(ok.valid, true);
  assert.equal(ok.payload?.sub, 'user-123');

  // Tamper with payload
  const [h, , s] = validToken.split('.');
  const tamperedPayload = toBase64Url(
    JSON.stringify({
      sub: 'admin-999',
      email: 'attacker@example.com',
      iss: 'https://api.uid.one',
      aud: 'uid-extension-client',
      exp: now + 3600,
    })
  );
  const tampered = await verifyJwtWithJwks(`${h}.${tamperedPayload}.${s}`, [pubJwk], now);
  assert.equal(tampered.valid, false);

  // Expired JWT
  const expiredToken = await signRs256Jwt(
    {
      sub: 'user-123',
      iss: 'https://api.uid.one',
      aud: 'uid-extension-client',
      exp: now - 10,
    },
    keyPair.privateKey
  );
  const expired = await verifyJwtWithJwks(expiredToken, [pubJwk], now);
  assert.equal(expired.valid, false);

  // Untrusted issuer
  const badIssToken = await signRs256Jwt(
    {
      sub: 'user-123',
      iss: 'https://myuid.one',
      aud: 'uid-extension-client',
      exp: now + 3600,
    },
    keyPair.privateKey
  );
  const badIss = await verifyJwtWithJwks(badIssToken, [pubJwk], now);
  assert.equal(badIss.valid, false);

  // alg: none
  const noneToken = `${toBase64Url(JSON.stringify({ alg: 'none' }))}.${tamperedPayload}.sig`;
  const noneRes = validateJwtStructureAndClaims(noneToken, now);
  assert.equal(noneRes.valid, false);
});

test('built chrome bundle eliminates 13013 auth/sync, localhost host_permissions, and MAIN-world CA emulator', () => {
  const distDir = path.resolve(import.meta.dirname, '../dist/chrome');
  if (!fs.existsSync(distDir)) return;

  const bgBundle = fs.readFileSync(path.join(distDir, 'src/background/index.js'), 'utf8');
  assert.equal(bgBundle.includes('13013'), false, 'background bundle must not reference 13013');
  assert.equal(bgBundle.includes('auth/sync'), false, 'background bundle must not reference auth/sync');

  const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
  const hostPerms: string[] = manifest.host_permissions || [];
  assert.equal(hostPerms.some((p) => p.includes('127.0.0.1') || p.includes('localhost')), false);
  const contentScripts: Array<{ world?: string; js?: string[] }> = manifest.content_scripts || [];
  assert.equal(contentScripts.some((cs) => cs.world === 'MAIN'), false);

  const contentBundle = fs.readFileSync(path.join(distDir, 'src/content/index.js'), 'utf8');
  assert.equal(contentBundle.includes('vnpt_plugin'), false);
  assert.equal(contentBundle.includes('vgcaplugin'), false);
  assert.equal(contentBundle.includes('oneuid-handshake-token'), false);
  assert.equal(contentBundle.includes('Sign in with passkey'), false);
});
