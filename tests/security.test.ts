import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  isAllowedPdfFetchUrl,
  isSuspiciousUidHostname,
  isTrustedUidOrigin,
  isTrustedUidUrl,
  isValidLocalHttpsEndpoint,
} from '../src/shared/origins.ts';
import {
  maskAccountIdentifier,
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

test('isAllowedPdfFetchUrl refuses file://, http://, and off-origin URLs', () => {
  assert.equal(isAllowedPdfFetchUrl('https://uid.one/doc.pdf'), true);
  assert.equal(isAllowedPdfFetchUrl('https://api.uid.one/files/a.pdf'), true);
  assert.equal(
    isAllowedPdfFetchUrl('https://docs.example.com/a.pdf', 'https://docs.example.com'),
    true
  );

  // Refused cases
  assert.equal(isAllowedPdfFetchUrl('file:///etc/passwd'), false);
  assert.equal(isAllowedPdfFetchUrl('file:///home/user/secret.pdf', 'https://example.com'), false);
  assert.equal(isAllowedPdfFetchUrl('http://uid.one/doc.pdf'), false);
  assert.equal(isAllowedPdfFetchUrl('https://evil.com/doc.pdf'), false);
  assert.equal(
    isAllowedPdfFetchUrl('https://evil.com/doc.pdf', 'https://docs.example.com'),
    false
  );
  assert.equal(isAllowedPdfFetchUrl('data:application/pdf;base64,AA=='), false);
  assert.equal(isAllowedPdfFetchUrl('https://user:pass@uid.one/doc.pdf'), false);
});

test('isValidLocalHttpsEndpoint requires HTTPS and rejects cleartext localhost', () => {
  assert.equal(isValidLocalHttpsEndpoint('https://127.0.0.1:8443'), true);
  assert.equal(isValidLocalHttpsEndpoint('https://localhost:9443'), true);

  assert.equal(isValidLocalHttpsEndpoint(''), false);
  assert.equal(isValidLocalHttpsEndpoint('http://127.0.0.1:13013'), false);
  assert.equal(isValidLocalHttpsEndpoint('http://localhost:8080'), false);
  assert.equal(isValidLocalHttpsEndpoint('https://user:pass@localhost:8443'), false);
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

test('built chrome and firefox manifests and bundles enforce P0 and P1 security invariants', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8')
  );

  for (const target of ['chrome', 'firefox']) {
    const distDir = path.resolve(import.meta.dirname, `../dist/${target}`);
    if (!fs.existsSync(distDir)) continue;

    const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.version, pkg.version, `${target} manifest version must match package.json`);

    const hostPerms: string[] = manifest.host_permissions || [];
    assert.equal(hostPerms.includes('*://*/*'), false);
    assert.equal(hostPerms.includes('file:///*'), false);
    assert.equal(hostPerms.some((p) => p.includes('127.0.0.1') || p.includes('localhost')), false);

    const perms: string[] = manifest.permissions || [];
    assert.equal(perms.includes('clipboardRead'), false);
    assert.equal(perms.includes('clipboardWrite'), false);
    assert.equal(perms.includes('webRequest'), false);

    const contentScripts: Array<{ world?: string; matches?: string[]; all_frames?: boolean }> =
      manifest.content_scripts || [];
    assert.equal(contentScripts.some((cs) => cs.world === 'MAIN'), false);
    assert.equal(
      contentScripts.some((cs) => (cs.matches || []).includes('<all_urls>')),
      false
    );
    assert.equal(
      contentScripts.some((cs) => cs.all_frames === true),
      false
    );

    const csp = manifest.content_security_policy?.extension_pages || '';
    assert.equal(csp.includes("script-src 'self'"), true);
    assert.equal(csp.includes("object-src 'none'"), true);

    const bgBundle = fs.readFileSync(path.join(distDir, 'src/background/index.js'), 'utf8');
    assert.equal(bgBundle.includes('13013'), false, 'background bundle must not reference 13013');
    assert.equal(bgBundle.includes('auth/sync'), false, 'background bundle must not reference auth/sync');
    assert.equal(
      bgBundle.includes('DEMO_SIGNATURE_VALUE'),
      false,
      'background bundle must not contain DEMO_SIGNATURE_VALUE'
    );

    const signerBundle = fs.readFileSync(path.join(distDir, 'signer.js'), 'utf8');
    assert.equal(signerBundle.includes('13013'), false, 'signer bundle must not reference 13013');
    assert.equal(signerBundle.includes('Remote CA Demo'), false);
    assert.equal(signerBundle.includes('generateKeyPair(512)'), false);

    const contentBundle = fs.readFileSync(path.join(distDir, 'src/content/index.js'), 'utf8');
    assert.equal(contentBundle.includes('vnpt_plugin'), false);
    assert.equal(contentBundle.includes('vgcaplugin'), false);
    assert.equal(contentBundle.includes('oneuid-handshake-token'), false);
    assert.equal(contentBundle.includes('Sign in with passkey'), false);
    assert.equal(contentBundle.includes('display: none !important'), false);
  }

  // Ensure clipboard audit payload never ships secret sample substrings
  const dlpSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/content/interceptors/dlp.ts'),
    'utf8'
  );
  const bgSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/background/index.ts'),
    'utf8'
  );
  assert.equal(dlpSource.includes('sample: text.slice'), false);
  assert.equal(bgSource.includes('sample: request.sample'), false);
});

test('version parity, untracked zip artifacts, options_ui, and popup title are valid', () => {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, pkg.version, 'manifest.json version must match package.json');
  assert.equal(manifest.options_ui?.page, 'options.html');

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.equal(indexHtml.includes('<title>UID Link</title>'), true);
  assert.equal(indexHtml.includes('uid-extension-client'), false);

  const trackedZips = execFileSync('git', ['ls-files', '*.zip'], { cwd: rootDir, encoding: 'utf8' }).trim();
  assert.equal(trackedZips, '', 'No .zip files may be tracked in git');

  assert.equal(fs.existsSync(path.join(rootDir, 'src/counter.ts')), false);
  assert.equal(fs.existsSync(path.join(rootDir, 'public/screenshoots')), false);
  assert.equal(fs.existsSync(path.join(rootDir, 'public/screenshots/popup.png')), true);
});

test('14-locale message packs have 100% key parity and autofill overlays are closed-shadow and alert-free', () => {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const localesDir = path.join(rootDir, 'public/_locales');
  const expectedLocales = ['ar', 'de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'th', 'vi', 'zh_CN', 'zh_TW'];
  const actualLocales = fs.readdirSync(localesDir).sort();
  assert.deepEqual(actualLocales, expectedLocales);

  const enKeys = Object.keys(
    JSON.parse(fs.readFileSync(path.join(localesDir, 'en/messages.json'), 'utf8'))
  ).sort();
  for (const loc of expectedLocales) {
    const keys = Object.keys(
      JSON.parse(fs.readFileSync(path.join(localesDir, loc, 'messages.json'), 'utf8'))
    ).sort();
    assert.deepEqual(keys, enKeys, `Locale ${loc} must have identical keys to en`);
  }

  const autofillSrc = fs.readFileSync(path.join(rootDir, 'src/content/autofill.ts'), 'utf8');
  assert.equal(/\balert\s*\(/.test(autofillSrc), false, 'autofill.ts must not call window.alert');
  assert.equal(autofillSrc.includes("attachShadow({ mode: 'closed' })"), true);
  assert.equal(autofillSrc.includes('prefers-reduced-motion: reduce'), true);

  assert.equal(maskAccountIdentifier('alice@example.com'), 'al***@example.com');
  assert.equal(maskAccountIdentifier('a@b.co'), 'a*@b.co');
});

test('official OneUID #2563FF primary palette is applied across CSS and SVG assets', () => {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const files = ['src/style.css', 'signer.html', 'public/icon.svg', 'public/favicon.svg'];
  for (const rel of files) {
    const content = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    assert.equal(/#2563eb/i.test(content), false, `${rel} must not use legacy #2563EB`);
    assert.equal(/#2563ff/i.test(content), true, `${rel} must use official #2563FF`);
  }
});
