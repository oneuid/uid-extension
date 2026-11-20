import QRCode from 'qrcode';
import { isTrustedUidOrigin, isUidHostname } from '../shared/origins';

const AUTOFILL_SITES_KEY = 'autofill_enabled_origins';
const PAIRING_TIMEOUT_MS = 120_000;
const PUSH_TIMEOUT_MS = 180_000;

let isListeningToSessionEvents = false;
let cachedEnabledOrigins: Set<string> | null = null;
let isWatchingEnabledOrigins = false;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateTargetId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Listens for authenticated postMessage login/logout events ONLY on top-level
 * allowlisted HTTPS `uid.one` origins. Never scrapes DOM nodes, never reads
 * page `localStorage`, ignores CustomEvents, and never touches `chrome.storage.local`
 * session keys from content scripts.
 */
export function captureSessionToken(): void {
  if (window !== window.top) return;
  if (!isTrustedUidOrigin(window.location.origin)) return;
  if (isListeningToSessionEvents) return;

  try {
    window.addEventListener('message', (e: MessageEvent) => {
      if (e.source !== window) return;
      if (!isTrustedUidOrigin(e.origin)) return;
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'oneuid_session_login') {
        const token = typeof e.data.token === 'string' ? e.data.token.trim() : '';
        if (token) {
          chrome.runtime.sendMessage({
            type: 'SET_SESSION_TOKEN',
            token,
          });
        }
      } else if (e.data.type === 'oneuid_session_logout') {
        chrome.runtime.sendMessage({ type: 'CLEAR_SESSION_TOKEN' });
      }
    });

    isListeningToSessionEvents = true;
  } catch (e) {
    console.error('[uid.one] Failed to attach origin-gated session listener:', e);
  }
}

const injectedInputs = new WeakSet<HTMLInputElement>();

async function isCurrentOriginAutofillEnabled(): Promise<boolean> {
  if (window.location.protocol !== 'https:') return false;
  if (isUidHostname(window.location.hostname)) return false;

  if (!isWatchingEnabledOrigins && chrome.storage?.onChanged) {
    isWatchingEnabledOrigins = true;
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[AUTOFILL_SITES_KEY]) {
        const next = changes[AUTOFILL_SITES_KEY].newValue;
        cachedEnabledOrigins = new Set(
          Array.isArray(next) ? next.filter((v): v is string => typeof v === 'string') : []
        );
      }
    });
  }

  if (cachedEnabledOrigins === null) {
    try {
      const res = await chrome.storage.local.get([AUTOFILL_SITES_KEY]);
      const raw = res[AUTOFILL_SITES_KEY];
      cachedEnabledOrigins = new Set(
        Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
      );
    } catch {
      cachedEnabledOrigins = new Set();
    }
  }

  return cachedEnabledOrigins.has(window.location.origin);
}

export function injectAll(): void {
  const nativeMeta = document.querySelector('meta[name="uid-vault-native"], meta[name="uid-passkey-native"]');
  if (nativeMeta && nativeMeta.getAttribute('content') === 'true') {
    return;
  }

  if (window.location.protocol !== 'https:') return;
  if (isUidHostname(window.location.hostname)) return;

  void isCurrentOriginAutofillEnabled().then((enabled) => {
    if (!enabled) return;

    const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    passwordInputs.forEach((input) => {
      if (
        input.disabled ||
        input.readOnly ||
        input.type === 'hidden' ||
        input.style.display === 'none' ||
        input.style.visibility === 'hidden' ||
        input.autocomplete === 'new-password'
      ) {
        return;
      }

      if (!injectedInputs.has(input)) {
        injectIcon(input);
        injectedInputs.add(input);
      }
    });
  });
}

function injectIcon(input: HTMLInputElement): void {
  const targetId = generateTargetId();
  input.setAttribute('data-uid-fill-target', targetId);
  input.setAttribute('data-uid-autofill', 'true');

  const shadowHost = document.createElement('div');
  shadowHost.className = 'uid-vault-wrapper';
  shadowHost.style.position = 'absolute';
  shadowHost.style.zIndex = '999999';
  shadowHost.style.cursor = 'pointer';

  document.body.appendChild(shadowHost);

  const computedStyle = window.getComputedStyle(input);
  const originalPaddingRight = parseFloat(computedStyle.paddingRight) || 0;
  input.style.paddingRight = `${originalPaddingRight + 28}px`;

  const updatePosition = () => {
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(input)) {
      shadowHost.style.display = 'none';
      return;
    }
    shadowHost.style.display = 'block';
    shadowHost.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;

    const offsetFromRight = originalPaddingRight + 28;
    shadowHost.style.left = `${rect.right + window.scrollX - offsetFromRight}px`;
    shadowHost.style.transform = 'translateY(-50%)';
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
  const positionTimer = setInterval(() => {
    if (!document.body.contains(input)) {
      clearInterval(positionTimer);
      shadowHost.remove();
      return;
    }
    updatePosition();
  }, 500);

  const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #0B1220;
    opacity: 1;
    transition: color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  `;

  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>`;

  const rawTitle = chrome.runtime?.id ? chrome.i18n.getMessage('iconTitle') : '';
  icon.title = rawTitle && !/passkey/i.test(rawTitle) ? rawTitle : 'Fill saved password (UID.one)';

  icon.addEventListener('mouseenter', () => {
    icon.style.color = '#2563FF';
    icon.style.transform = 'scale(1.05)';
  });

  icon.addEventListener('mouseleave', () => {
    icon.style.color = '#0B1220';
    icon.style.transform = 'scale(1)';
  });

  const performVaultFill = async (targetUsername: string, fillTargetId: string) => {
    try {
      if (!chrome.runtime?.id) {
        alert('Extension context invalidated. Please refresh the page.');
        return;
      }

      const origin = window.location.origin;
      const domain = window.location.hostname;
      const device = navigator.userAgent.includes('Mac') ? 'Chrome on macOS' : 'Chrome Web';

      const isPairedRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, resolve);
      });

      if (!isPairedRes?.isPaired) {
        const reqRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'START_OOB_AUTH', domain, device, identifier: targetUsername },
            resolve
          );
        });

        if (!reqRes?.success || !reqRes.challenge?.token) {
          alert('Failed to initiate device pairing.');
          return;
        }

        const qrUrl = `https://uid.one/qr?challenge=${encodeURIComponent(reqRes.challenge.token)}&client_id=uid-extension-client&client_name=Extension`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 200 });
        const pairingMatchNumber =
          reqRes.challenge.match_number ?? reqRes.challenge.verification_code ?? '';

        const overlay = document.createElement('div');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Pair device');
        overlay.innerHTML = `
          <div id="uid-qr-backdrop" style="position: fixed; inset: 0; min-height: 100dvh; background: rgba(2, 8, 23, 0.55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999999;">
            <div id="uid-qr-container" style="background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.28); display: flex; flex-direction: column; align-items: center; gap: 14px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; position: relative; min-width: 280px; min-height: 320px; justify-content: center;">
              <button type="button" id="close-qr" aria-label="Close" style="position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 15px;">✕</button>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">Pair device for vault fill</h3>
              <p style="margin: 0; font-size: 12px; color: #475569; text-align: center;">Site: <strong>${escapeHtml(origin)}</strong></p>
              ${pairingMatchNumber ? `<div style="font-size: 22px; font-weight: 700; letter-spacing: 0.14em; color: #2563FF; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 6px 16px;">${escapeHtml(String(pairingMatchNumber))}</div>` : ''}
              <div style="padding: 8px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <img src="${qrDataUrl}" alt="UID.one pairing QR code" style="width: 200px; height: 200px; display: block;" />
              </div>
              <p id="uid-qr-status" style="margin: 0; font-size: 13px; color: #475569; text-align: center; max-width: 240px; line-height: 1.45;">
                Scan this code with the UID.one mobile app and confirm the match number.
              </p>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        let pollInterval: ReturnType<typeof setInterval> | null = null;
        const startedAt = Date.now();

        const stopPolling = () => {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };

        const cleanupQr = () => {
          stopPolling();
          document.removeEventListener('keydown', onQrEsc, true);
          overlay.remove();
        };

        const onQrEsc = (e: KeyboardEvent) => {
          if (e.isComposing || e.keyCode === 229) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cleanupQr();
          }
        };
        document.addEventListener('keydown', onQrEsc, true);

        overlay.querySelector('#close-qr')?.addEventListener('click', cleanupQr);
        overlay.querySelector('#uid-qr-backdrop')?.addEventListener('click', (ev) => {
          if (ev.target === ev.currentTarget) cleanupQr();
        });

        const showPairingFailure = (message: string) => {
          stopPolling();
          const statusEl = overlay.querySelector('#uid-qr-status') as HTMLElement | null;
          if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#dc2626';
          }
        };

        pollInterval = setInterval(async () => {
          if (Date.now() - startedAt > PAIRING_TIMEOUT_MS) {
            showPairingFailure('Pairing timed out. Close and try again.');
            return;
          }

          const pollRes = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage(
              { type: 'POLL_OOB_STATUS', token: reqRes.challenge.token },
              resolve
            );
          });

          if (!pollRes?.success) {
            showPairingFailure('Pairing check failed. Please try again.');
            return;
          }

          if (pollRes.status === 'REJECTED' || pollRes.status === 'EXPIRED') {
            showPairingFailure(
              pollRes.status === 'REJECTED'
                ? 'Pairing request was rejected.'
                : 'Pairing code expired. Please try again.'
            );
            return;
          }

          if (pollRes.status === 'APPROVED') {
            stopPolling();
            document.removeEventListener('keydown', onQrEsc, true);

            // Never persist a challenge token as a session token; only persist a verified access_token if issued.
            const issuedAccessToken =
              typeof pollRes.data?.access_token === 'string' ? pollRes.data.access_token : '';
            if (issuedAccessToken) {
              const saveRes = await new Promise<any>((resolve) =>
                chrome.runtime.sendMessage({ type: 'SAVE_PAIRING', token: issuedAccessToken }, resolve)
              );
              if (!saveRes?.success) {
                showPairingFailure('Could not verify session token. Sign in on uid.one to pair.');
                return;
              }
            } else {
              showPairingFailure('Approved. Please complete pairing by signing in on https://uid.one.');
              return;
            }

            const container = overlay.querySelector('#uid-qr-container') as HTMLElement;
            if (container) {
              container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                  <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; color: #16a34a;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">Device paired</h3>
                  <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">Vault password fill verification is now active.</p>
                </div>
              `;
              setTimeout(() => {
                overlay.remove();
                void performVaultFill(targetUsername, fillTargetId);
              }, 1800);
            }
          }
        }, 2000);
        return;
      }

      const reqRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'PUSH_REQUEST', domain }, resolve);
      });

      if (!reqRes?.success || !reqRes.data?.token) {
        alert('Failed to request vault password fill: ' + (reqRes?.error || 'Unknown error'));
        return;
      }

      const challengeId = reqRes.data.token;
      const matchNumber =
        reqRes.data.match_number ?? reqRes.data.verification_code ?? '';

      const overlay = document.createElement('div');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Confirm vault password fill');
      overlay.innerHTML = `
        <div id="uid-match-backdrop" style="position: fixed; inset: 0; min-height: 100dvh; background: rgba(2, 8, 23, 0.55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999999;">
          <div id="uid-match-container" style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.28); display: flex; flex-direction: column; align-items: center; gap: 14px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; position: relative; min-width: 300px;">
            <button type="button" id="close-match" aria-label="Close" style="position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 15px;">✕</button>
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; text-align: center; color: #0f172a;">Confirm vault password fill</h3>
            <p style="margin: 0; font-size: 12px; color: #475569; text-align: center;">Origin: <strong>${escapeHtml(origin)}</strong></p>
            <p style="margin: 0; font-size: 13px; color: #475569; text-align: center; max-width: 260px; line-height: 1.45;">Verify the match number below on your paired UID.one device. The form will not auto-submit.</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.16em; color: #2563FF; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 10px 22px; margin: 4px 0;">
              ${escapeHtml(matchNumber ? String(matchNumber) : '—')}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
              <span style="font-size: 12px; color: #64748b;">Waiting for approval...</span>
            </div>
            <style>
              @keyframes spin { 100% { transform: rotate(360deg); } }
            </style>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const wsBase = import.meta.env.VITE_WS_BASE || 'wss://api.uid.one';
      const wsUrl = `${wsBase}/ws/challenges/${encodeURIComponent(challengeId)}/`;
      const ws = new WebSocket(wsUrl);

      let pushTimeout: ReturnType<typeof setTimeout> | null = null;

      const cleanupMatch = () => {
        if (pushTimeout) {
          clearTimeout(pushTimeout);
          pushTimeout = null;
        }
        document.removeEventListener('keydown', onMatchEsc, true);
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        overlay.remove();
      };

      pushTimeout = setTimeout(() => {
        cleanupMatch();
      }, PUSH_TIMEOUT_MS);

      const onMatchEsc = (e: KeyboardEvent) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cleanupMatch();
        }
      };
      document.addEventListener('keydown', onMatchEsc, true);

      overlay.querySelector('#close-match')?.addEventListener('click', cleanupMatch);
      overlay.querySelector('#uid-match-backdrop')?.addEventListener('click', (ev) => {
        if (ev.target === ev.currentTarget) cleanupMatch();
      });

      const showMatchError = (message: string) => {
        const container = overlay.querySelector('#uid-match-container') as HTMLElement | null;
        if (container) {
          document.addEventListener('keydown', onMatchEsc, true);
          container.innerHTML = `
            <button type="button" id="close-match-error" aria-label="Close" style="position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 15px;">✕</button>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 16px;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; color: #dc2626;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #dc2626;">Password fill failed</h3>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center; max-width: 240px;">${escapeHtml(message)}</p>
            </div>
          `;
          container.querySelector('#close-match-error')?.addEventListener('click', cleanupMatch);
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'REJECTED' || data.status === 'EXPIRED') {
            if (pushTimeout) clearTimeout(pushTimeout);
            ws.close();
            showMatchError(
              data.status === 'REJECTED'
                ? 'Vault fill request was rejected.'
                : 'Vault fill request expired.'
            );
            return;
          }

          if (data.status === 'APPROVED' && data.encrypted_payload) {
            if (pushTimeout) clearTimeout(pushTimeout);
            ws.close();
            document.removeEventListener('keydown', onMatchEsc, true);

            const fillRes = await new Promise<any>((resolve) => {
              chrome.runtime.sendMessage(
                {
                  type: 'FILL_APPROVED_CREDENTIAL',
                  token: challengeId,
                  encrypted_payload: data.encrypted_payload,
                  targetId: fillTargetId,
                },
                resolve
              );
            });

            const container = overlay.querySelector('#uid-match-container') as HTMLElement;
            if (fillRes?.success) {
              if (container) {
                container.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; color: #16a34a;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">Password filled</h3>
                    <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">Review the form and submit manually when ready.</p>
                  </div>
                `;
              }
              setTimeout(() => {
                overlay.remove();
              }, 900);
            } else {
              showMatchError(fillRes?.error || 'Could not fill the password field.');
            }
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WS Error', err);
      };
    } catch (error) {
      console.error('[uid.one] Error:', error);
    }
  };

  icon.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = input.closest('form');
    let username = '';
    if (form) {
      const usernameInput = form.querySelector<HTMLInputElement>(
        'input[type="text"], input[type="email"], input[name="email"], input[name="username"]'
      );
      if (usernameInput) username = usernameInput.value.trim();
    }
    if (!username) {
      const rawErr = chrome.runtime?.id ? chrome.i18n.getMessage('errorNoUsernameProvided') : '';
      alert(
        rawErr && !/passkey/i.test(rawErr)
          ? rawErr
          : 'Enter your email or username first to fill your saved password.'
      );
      return;
    }

    await performVaultFill(username, targetId);
  });

  shadowRoot.appendChild(icon);
}
