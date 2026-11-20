const TRUSTED_UID_HOSTS = new Set<string>([
  'uid.one',
  'www.uid.one',
  'auth.uid.one',
  'api.uid.one',
  'app.uid.one',
  'id.uid.one',
  'account.uid.one',
  'my.uid.one',
  'verify.uid.one',
]);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Returns true only for exact HTTPS origins on the explicit UID.one allowlist.
 * Never uses substring matching (`String.includes`), so hosts such as
 * `https://myuid.one`, `https://notuid.one`, `https://uid.one.attacker.com`,
 * `https://uid.one@attacker.com`, or `http://uid.one` are always rejected.
 */
export function isTrustedUidOrigin(origin: string | null | undefined): boolean {
  if (!origin || typeof origin !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.port) return false;
  if (parsed.origin !== origin.replace(/\/$/, '')) return false;

  const host = normalizeHostname(parsed.hostname);
  return TRUSTED_UID_HOSTS.has(host);
}

/**
 * Returns true only if the given URL belongs to an allowlisted HTTPS UID.one origin.
 */
export function isTrustedUidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.port) return false;
  return isTrustedUidOrigin(parsed.origin);
}

/**
 * Returns true for exact `uid.one` or any direct subdomain of `uid.one`.
 */
export function isUidHostname(hostname: string | null | undefined): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  const host = normalizeHostname(hostname);
  return host === 'uid.one' || host.endsWith('.uid.one');
}

/**
 * Returns true if a non-UID hostname looks like a lookalike / typo-squat of `uid.one`
 * (e.g. `myuid.one`, `notuid.one`, `uid.one.evil.com`, `uid-one-login.com`, `u1d.one`).
 */
export function isSuspiciousUidHostname(hostname: string | null | undefined): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  const host = normalizeHostname(hostname);
  if (!host || isUidHostname(host)) return false;

  const patterns = [
    /uid\.one\./i,
    /uid[-_.]?one/i,
    /[a-z0-9-]+uid\.one$/i,
    /u[1il]d[-_.]?one/i,
    /u[1il]d\.one$/i,
    /uid[-_.]?1\.one$/i,
  ];
  return patterns.some((p) => p.test(host));
}
