import QRCode from 'qrcode';
import { isTrustedUidOrigin, isUidHostname } from '../shared/origins';
import { escapeHtml, t } from '../shared/ui';

const AUTOFILL_SITES_KEY = 'autofill_enabled_origins';
const PAIRING_TIMEOUT_MS = 120_000;
const PUSH_TIMEOUT_MS = 180_000;

let isListeningToSessionEvents = false;
let cachedEnabledOrigins: Set<string> | null = null;
let isWatchingEnabledOrigins = false;

function generateTargetId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getShadowStyles(): string {
  return `
    :host {
      all: initial;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    .uid-backdrop {
      position: fixed;
      inset: 0;
      min-height: 100dvh;
      background: rgba(11, 18, 32, 0.72);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 2147483647;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #F8FAFC;
    }
    .uid-card {
      width: 100%;
      max-width: 360px;
      background: #1A2233;
      border: 1px solid rgba(229, 231, 235, 0.18);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      color: #F8FAFC;
    }
    .uid-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(229, 231, 235, 0.14);
    }
    .uid-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 700;
      color: #F8FAFC;
    }
    .uid-close {
      min-width: 44px;
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid rgba(229, 231, 235, 0.18);
      background: #0B1220;
      color: #E5E7EB;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .uid-close:hover {
      border-color: #6E9BFF;
    }
    .uid-title {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #F8FAFC;
    }
    .uid-desc {
      margin: 0;
      font-size: 13px;
      line-height: 1.45;
      color: #CBD5E1;
    }
    .uid-label {
      font-size: 12px;
      font-weight: 600;
      color: #CBD5E1;
      margin-bottom: 4px;
    }
    .uid-origin {
      font-size: 13px;
      font-weight: 600;
      color: #F8FAFC;
      background: #0B1220;
      border: 1px solid rgba(229, 231, 235, 0.16);
      border-radius: 8px;
      padding: 8px 12px;
      word-break: break-all;
    }
    .uid-match {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.14em;
      font-variant-numeric: tabular-nums;
      color: #6E9BFF;
      background: rgba(37, 99, 255, 0.14);
      border: 1px solid rgba(37, 99, 255, 0.35);
      border-radius: 12px;
      padding: 10px 18px;
      text-align: center;
    }
    .uid-qr-wrap {
      align-self: center;
      background: #FFFFFF;
      border-radius: 12px;
      padding: 8px;
      border: 1px solid #E5E7EB;
    }
    .uid-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      line-height: 1.45;
      padding: 10px 12px;
      border-radius: 10px;
      background: #0B1220;
      border: 1px solid rgba(229, 231, 235, 0.16);
      color: #E5E7EB;
    }
    .uid-status.error {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(239, 68, 68, 0.14);
      color: #FECACA;
    }
    .uid-status.success {
      border-color: rgba(16, 185, 129, 0.5);
      background: rgba(16, 185, 129, 0.14);
      color: #A7F3D0;
    }
    .uid-spinner {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      animation: uid-spin 1s linear infinite;
    }
    .uid-actions {
      display: flex;
      gap: 8px;
    }
    .uid-btn {
      flex: 1;
      min-height: 44px;
      padding: 10px 16px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .uid-btn-primary {
      background: #2563FF;
      color: #FFFFFF;
    }
    .uid-btn-primary:hover {
      background: #1457FF;
    }
    .uid-btn-cancel {
      background: transparent;
      color: #FCA5A5;
      border: 1px solid rgba(239, 68, 68, 0.45);
    }
    .uid-btn-cancel:hover {
      background: rgba(239, 68, 68, 0.12);
    }
    .uid-btn-secondary {
      background: #0B1220;
      color: #F8FAFC;
      border: 1px solid rgba(229, 231, 235, 0.22);
    }
    .uid-btn:focus-visible, .uid-close:focus-visible {
      outline: 2px solid #6E9BFF;
      outline-offset: 2px;
    }
    @keyframes uid-spin {
      100% { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

function createClosedOverlayHost(): { host: HTMLDivElement; shadow: ShadowRoot; dir: 'rtl' | 'ltr' } {
  const host = document.createElement('div');
  host.className = 'uid-extension-dialog-host';
  const shadow = host.attachShadow({ mode: 'closed' });
  const uiLang = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase();
  const dir: 'rtl' | 'ltr' = uiLang.startsWith('ar') ? 'rtl' : 'ltr';
  document.body.appendChild(host);
  return { host, shadow, dir };
}

function showClosedNoticeDialog(title: string, message: string): void {
  const { host, shadow, dir } = createClosedOverlayHost();
  const closeLabel = escapeHtml(t('challengeCloseBtn', 'Close'));

  shadow.innerHTML = `
    <style>${getShadowStyles()}</style>
    <div class="uid-backdrop" dir="${dir}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="uid-card">
        <div class="uid-header">
          <div class="uid-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6E9BFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>UID Link</span>
          </div>
          <button type="button" id="uid-notice-close" class="uid-close" aria-label="${closeLabel}">✕</button>
        </div>
        <h3 class="uid-title">${escapeHtml(title)}</h3>
        <div class="uid-status error" role="status" aria-live="polite">${escapeHtml(message)}</div>
        <div class="uid-actions">
          <button type="button" id="uid-notice-ok" class="uid-btn uid-btn-primary">${closeLabel}</button>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    document.removeEventListener('keydown', onEsc, true);
    host.remove();
  };
  const onEsc = (e: KeyboardEvent) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };
  document.addEventListener('keydown', onEsc, true);
  shadow.getElementById('uid-notice-close')?.addEventListener('click', close);
  shadow.getElementById('uid-notice-ok')?.addEventListener('click', close);
  shadow.querySelector('.uid-backdrop')?.addEventListener('click', (ev) => {
    if (ev.target === ev.currentTarget) close();
  });
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
  shadowHost.style.width = '44px';
  shadowHost.style.height = '44px';

  document.body.appendChild(shadowHost);

  const computedStyle = window.getComputedStyle(input);
  const originalPaddingRight = parseFloat(computedStyle.paddingRight) || 0;
  input.style.paddingRight = `${originalPaddingRight + 44}px`;

  const updatePosition = () => {
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(input)) {
      shadowHost.style.display = 'none';
      return;
    }
    shadowHost.style.display = 'block';
    shadowHost.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;
    shadowHost.style.left = `${rect.right + window.scrollX - 44}px`;
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
  const iconStyle = document.createElement('style');
  iconStyle.textContent = `
    :host { all: initial; }
    .uid-fill-trigger {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
      color: #0B1220;
      border-radius: 10px;
      transition: color 0.15s ease, transform 0.15s ease;
    }
    .uid-fill-trigger:hover {
      color: #2563FF;
      transform: scale(1.05);
    }
    .uid-fill-trigger:focus-visible {
      outline: 2px solid #2563FF;
      outline-offset: -2px;
    }
    @media (prefers-reduced-motion: reduce) {
      .uid-fill-trigger {
        transition: none;
      }
      .uid-fill-trigger:hover {
        transform: none;
      }
    }
  `;

  const rawTitle = chrome.runtime?.id ? chrome.i18n.getMessage('iconTitle') : '';
  const triggerLabel =
    rawTitle && !/passkey/i.test(rawTitle) ? rawTitle : t('iconTitle', 'Fill saved password (UID.one)');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'uid-fill-trigger';
  button.title = triggerLabel;
  button.setAttribute('aria-label', triggerLabel);
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>`;

  const performVaultFill = async (targetUsername: string, fillTargetId: string) => {
    try {
      if (!chrome.runtime?.id) {
        showClosedNoticeDialog(
          t('challengeFailed', 'Verification failed'),
          t('extensionContextInvalid', 'Extension updated. Refresh the page and try again.')
        );
        return;
      }

      const origin = window.location.origin;
      const domain = window.location.hostname;
      const device = navigator.userAgent.includes('Mac') ? 'Browser on macOS' : 'Browser Web';

      const isPairedRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, resolve);
      });

      if (!isPairedRes?.isPaired) {
        const reqRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'START_OOB_AUTH', domain, origin, device, identifier: targetUsername },
            resolve
          );
        });

        if (!reqRes?.success || !reqRes.challenge?.token) {
          showClosedNoticeDialog(
            t('challengePairTitle', 'Confirm browser link'),
            t('challengeInitFailed', 'Failed to start verification: $1', [reqRes?.error || 'Error'])
          );
          return;
        }

        const challengeToken = String(reqRes.challenge.token);
        const qrUrl = `https://uid.one/qr?challenge=${encodeURIComponent(challengeToken)}&client_id=uid-extension-client&client_name=Extension`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 180 });
        const pairingMatchNumber = String(
          reqRes.challenge.match_number ?? reqRes.challenge.verification_code ?? '—'
        );

        // Open extension chrome verification window so pairing completes outside host DOM.
        chrome.runtime.sendMessage({ type: 'OPEN_CHALLENGE_WINDOW', token: challengeToken });

        const { host, shadow, dir } = createClosedOverlayHost();
        const titleText = t('challengePairTitle', 'Confirm browser link');
        const closeLabel = t('challengeCloseBtn', 'Close');
        const cancelLabel = t('challengeCancelBtn', 'Cancel');
        const retryLabel = t('retryButton', 'Retry');

        shadow.innerHTML = `
          <style>${getShadowStyles()}</style>
          <div class="uid-backdrop" dir="${dir}" role="dialog" aria-modal="true" aria-label="${escapeHtml(titleText)}">
            <div class="uid-card">
              <div class="uid-header">
                <div class="uid-brand">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6E9BFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>UID Link</span>
                </div>
                <button type="button" id="close-qr" class="uid-close" aria-label="${escapeHtml(closeLabel)}">✕</button>
              </div>
              <h3 class="uid-title">${escapeHtml(titleText)}</h3>
              <p class="uid-desc">${escapeHtml(t('pairBrowserDesc', 'Scan this QR code with the UID.one mobile app and confirm the match number.'))}</p>
              <div>
                <div class="uid-label">${escapeHtml(t('originLabel', 'Origin'))}</div>
                <div class="uid-origin">${escapeHtml(origin)}</div>
              </div>
              <div>
                <div class="uid-label">${escapeHtml(t('matchNumberLabel', 'Match number'))}</div>
                <div class="uid-match">${escapeHtml(pairingMatchNumber)}</div>
              </div>
              <div class="uid-qr-wrap">
                <img src="${qrDataUrl}" alt="${escapeHtml(t('pairBrowserTitle', 'Link this browser'))}" width="180" height="180" style="display: block;" />
              </div>
              <div id="uid-qr-status" class="uid-status" role="status" aria-live="polite">
                <svg class="uid-spinner" viewBox="0 0 24 24" fill="none" stroke="#6E9BFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                <span>${escapeHtml(t('challengeWaiting', 'Waiting for approval...'))}</span>
              </div>
              <div class="uid-actions">
                <button type="button" id="cancel-qr" class="uid-btn uid-btn-cancel">${escapeHtml(cancelLabel)}</button>
                <button type="button" id="retry-qr" class="uid-btn uid-btn-primary" style="display: none;">${escapeHtml(retryLabel)}</button>
              </div>
            </div>
          </div>
        `;

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
          host.remove();
        };

        const showTerminalQrState = (message: string, kind: 'error' | 'success', allowRetry: boolean) => {
          stopPolling();
          const statusEl = shadow.getElementById('uid-qr-status');
          const cancelBtn = shadow.getElementById('cancel-qr') as HTMLButtonElement | null;
          const retryBtn = shadow.getElementById('retry-qr') as HTMLButtonElement | null;
          if (statusEl) {
            statusEl.className = `uid-status ${kind}`;
            statusEl.textContent = message;
          }
          if (cancelBtn) cancelBtn.style.display = 'none';
          if (retryBtn) retryBtn.style.display = allowRetry ? 'inline-flex' : 'none';
        };

        const cancelQr = () => {
          chrome.runtime.sendMessage({ type: 'CANCEL_ACTIVE_CHALLENGE', token: challengeToken });
          cleanupQr();
        };

        const onQrEsc = (e: KeyboardEvent) => {
          if (e.isComposing || e.keyCode === 229) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelQr();
          }
        };
        document.addEventListener('keydown', onQrEsc, true);

        shadow.getElementById('close-qr')?.addEventListener('click', cancelQr);
        shadow.getElementById('cancel-qr')?.addEventListener('click', cancelQr);
        shadow.getElementById('retry-qr')?.addEventListener('click', () => {
          cleanupQr();
          void performVaultFill(targetUsername, fillTargetId);
        });
        shadow.querySelector('.uid-backdrop')?.addEventListener('click', (ev) => {
          if (ev.target === ev.currentTarget) cancelQr();
        });

        pollInterval = setInterval(async () => {
          if (Date.now() - startedAt > PAIRING_TIMEOUT_MS) {
            chrome.runtime.sendMessage({
              type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
              token: challengeToken,
              status: 'EXPIRED',
            });
            showTerminalQrState(t('challengeTimedOut', 'Request timed out. Please try again.'), 'error', true);
            return;
          }

          const pollRes = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({ type: 'POLL_OOB_STATUS', token: challengeToken }, resolve);
          });

          if (!pollRes?.success) {
            showTerminalQrState(t('challengeFailed', 'Verification failed'), 'error', true);
            return;
          }

          if (pollRes.status === 'REJECTED') {
            showTerminalQrState(t('challengeRejected', 'Request was rejected.'), 'error', true);
            return;
          }

          if (pollRes.status === 'EXPIRED') {
            showTerminalQrState(t('challengeExpired', 'Request expired. Please try again.'), 'error', true);
            return;
          }

          if (pollRes.status === 'APPROVED') {
            stopPolling();
            const issuedAccessToken =
              typeof pollRes.data?.access_token === 'string' ? pollRes.data.access_token : '';
            if (!issuedAccessToken) {
              showTerminalQrState(
                t('pairingTokenUnverified', 'Approved. Finish signing in on uid.one.'),
                'error',
                true
              );
              return;
            }
            const saveRes = await new Promise<any>((resolve) =>
              chrome.runtime.sendMessage({ type: 'SAVE_PAIRING', token: issuedAccessToken }, resolve)
            );
            if (!saveRes?.success) {
              showTerminalQrState(saveRes?.error || t('challengeFailed', 'Verification failed'), 'error', true);
              return;
            }
            showTerminalQrState(
              `${t('pairingSuccess', 'Device linked')} — ${t('pairingSuccessDesc', 'Your browser session is now verified.')}`,
              'success',
              false
            );
            setTimeout(() => {
              cleanupQr();
              void performVaultFill(targetUsername, fillTargetId);
            }, 1200);
          }
        }, 2000);
        return;
      }

      const reqRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'PUSH_REQUEST', domain, targetId: fillTargetId }, resolve);
      });

      if (!reqRes?.success || !reqRes.data?.token) {
        showClosedNoticeDialog(
          t('challengeTitle', 'Confirm vault password fill'),
          t('challengeInitFailed', 'Failed to start verification: $1', [reqRes?.error || 'Error'])
        );
        return;
      }

      const challengeId = String(reqRes.data.token);
      const matchNumber = String(reqRes.data.match_number ?? reqRes.data.verification_code ?? '—');

      chrome.runtime.sendMessage({ type: 'OPEN_CHALLENGE_WINDOW', token: challengeId });

      const { host, shadow, dir } = createClosedOverlayHost();
      const titleText = t('challengeTitle', 'Confirm vault password fill');
      const closeLabel = t('challengeCloseBtn', 'Close');
      const cancelLabel = t('challengeCancelBtn', 'Cancel');
      const retryLabel = t('retryButton', 'Retry');

      shadow.innerHTML = `
        <style>${getShadowStyles()}</style>
        <div class="uid-backdrop" dir="${dir}" role="dialog" aria-modal="true" aria-label="${escapeHtml(titleText)}">
          <div class="uid-card">
            <div class="uid-header">
              <div class="uid-brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6E9BFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>UID Link</span>
              </div>
              <button type="button" id="close-match" class="uid-close" aria-label="${escapeHtml(closeLabel)}">✕</button>
            </div>
            <h3 class="uid-title">${escapeHtml(titleText)}</h3>
            <p class="uid-desc">${escapeHtml(t('challengeDesc', 'Verify the match number on your UID.one device. Forms never auto-submit.'))}</p>
            <div>
              <div class="uid-label">${escapeHtml(t('originLabel', 'Origin'))}</div>
              <div class="uid-origin">${escapeHtml(origin)}</div>
            </div>
            <div>
              <div class="uid-label">${escapeHtml(t('matchNumberLabel', 'Match number'))}</div>
              <div class="uid-match">${escapeHtml(matchNumber)}</div>
            </div>
            <div id="uid-match-status" class="uid-status" role="status" aria-live="polite">
              <svg class="uid-spinner" viewBox="0 0 24 24" fill="none" stroke="#6E9BFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
              <span>${escapeHtml(t('challengeWaiting', 'Waiting for approval...'))}</span>
            </div>
            <div class="uid-actions">
              <button type="button" id="cancel-match" class="uid-btn uid-btn-cancel">${escapeHtml(cancelLabel)}</button>
              <button type="button" id="retry-match" class="uid-btn uid-btn-primary" style="display: none;">${escapeHtml(retryLabel)}</button>
            </div>
          </div>
        </div>
      `;

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
        host.remove();
      };

      const showTerminalMatchState = (message: string, kind: 'error' | 'success', allowRetry: boolean) => {
        if (pushTimeout) {
          clearTimeout(pushTimeout);
          pushTimeout = null;
        }
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        const statusEl = shadow.getElementById('uid-match-status');
        const cancelBtn = shadow.getElementById('cancel-match') as HTMLButtonElement | null;
        const retryBtn = shadow.getElementById('retry-match') as HTMLButtonElement | null;
        if (statusEl) {
          statusEl.className = `uid-status ${kind}`;
          statusEl.textContent = message;
        }
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (retryBtn) retryBtn.style.display = allowRetry ? 'inline-flex' : 'none';
      };

      const cancelMatch = () => {
        chrome.runtime.sendMessage({ type: 'CANCEL_ACTIVE_CHALLENGE', token: challengeId });
        cleanupMatch();
      };

      pushTimeout = setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
          token: challengeId,
          status: 'EXPIRED',
        });
        showTerminalMatchState(t('challengeTimedOut', 'Request timed out. Please try again.'), 'error', true);
      }, PUSH_TIMEOUT_MS);

      const onMatchEsc = (e: KeyboardEvent) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cancelMatch();
        }
      };
      document.addEventListener('keydown', onMatchEsc, true);

      shadow.getElementById('close-match')?.addEventListener('click', cancelMatch);
      shadow.getElementById('cancel-match')?.addEventListener('click', cancelMatch);
      shadow.getElementById('retry-match')?.addEventListener('click', () => {
        cleanupMatch();
        void performVaultFill(targetUsername, fillTargetId);
      });
      shadow.querySelector('.uid-backdrop')?.addEventListener('click', (ev) => {
        if (ev.target === ev.currentTarget) cancelMatch();
      });

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'REJECTED') {
            chrome.runtime.sendMessage({
              type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
              token: challengeId,
              status: 'REJECTED',
            });
            showTerminalMatchState(t('challengeRejected', 'Request was rejected.'), 'error', true);
            return;
          }
          if (data.status === 'EXPIRED') {
            chrome.runtime.sendMessage({
              type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
              token: challengeId,
              status: 'EXPIRED',
            });
            showTerminalMatchState(t('challengeExpired', 'Request expired. Please try again.'), 'error', true);
            return;
          }

          if (data.status === 'APPROVED' && data.encrypted_payload) {
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

            if (fillRes?.success) {
              showTerminalMatchState(
                `${t('challengeFilled', 'Password filled')} — ${t('challengeFilledDesc', 'Review the form and submit manually when ready.')}`,
                'success',
                false
              );
              setTimeout(cleanupMatch, 1100);
            } else {
              showTerminalMatchState(
                fillRes?.error || t('fillFailedDesc', 'Could not fill the password field.'),
                'error',
                true
              );
            }
          }
        } catch {
          showTerminalMatchState(t('challengeFailed', 'Verification failed'), 'error', true);
        }
      };

      ws.onerror = () => {
        showTerminalMatchState(t('challengeFailed', 'Verification failed'), 'error', true);
      };
    } catch {
      showClosedNoticeDialog(
        t('challengeFailed', 'Verification failed'),
        t('fillFailedDesc', 'Could not fill the password field.')
      );
    }
  };

  button.addEventListener('click', async (e) => {
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
      const msg =
        rawErr && !/passkey/i.test(rawErr)
          ? rawErr
          : t('errorNoUsernameProvided', 'Please enter your email or username first to fill your saved password.');
      showClosedNoticeDialog(t('challengeTitle', 'Confirm vault password fill'), msg);
      return;
    }

    await performVaultFill(username, targetId);
  });

  shadowRoot.append(iconStyle, button);
}
