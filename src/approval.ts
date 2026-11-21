import './style.css';
import QRCode from 'qrcode';
import { escapeHtml, syncLocale, t } from './shared/ui';

interface ActiveChallenge {
  token: string;
  mode: 'pair' | 'fill';
  origin: string;
  domain: string;
  matchNumber: string;
  qrUrl?: string;
  fillTargetId?: string;
  status: 'PENDING' | 'APPROVED' | 'FILLED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'ERROR';
  error?: string;
}

const PAIRING_TIMEOUT_MS = 120_000;
const PUSH_TIMEOUT_MS = 180_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let activeWs: WebSocket | null = null;

function stopMonitors(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
  if (activeWs) {
    try {
      activeWs.close();
    } catch {}
    activeWs = null;
  }
}

async function renderApproval(): Promise<void> {
  if (!chrome.runtime?.id) return;
  syncLocale();
  document.title = t('challengeTitle', 'UID Link verification');

  const root = document.getElementById('approval-app');
  if (!root) return;

  const res = await new Promise<any>((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_ACTIVE_CHALLENGE' }, resolve);
  });

  const challenge: ActiveChallenge | null = res?.challenge || null;
  if (!challenge) {
    root.innerHTML = `
      <div class="approval-shell">
        <div class="header">
          <div class="brand">
            <img src="/icon_32.png" alt="" class="brand-mark" />
            <span>UID Link</span>
          </div>
          <span class="version-pill">v${escapeHtml(chrome.runtime.getManifest().version)}</span>
        </div>
        <div class="premium-card">
          <div class="row-title">${escapeHtml(t('challengeFailed', 'Verification failed'))}</div>
          <div class="row-desc">${escapeHtml(t('challengeExpired', 'Request expired. Please try again.'))}</div>
          <button type="button" id="btn-close" class="btn-premium-outline">${escapeHtml(t('challengeCloseBtn', 'Close'))}</button>
        </div>
      </div>
    `;
    document.getElementById('btn-close')?.addEventListener('click', () => window.close());
    return;
  }

  const isPair = challenge.mode === 'pair';
  const heading = isPair
    ? t('challengePairTitle', 'Confirm browser link')
    : t('challengeTitle', 'Confirm vault password fill');

  root.innerHTML = `
    <div class="approval-shell">
      <div class="header">
        <div class="brand">
          <img src="/icon_32.png" alt="" class="brand-mark" />
          <span>UID Link</span>
        </div>
        <span class="version-pill">v${escapeHtml(chrome.runtime.getManifest().version)}</span>
      </div>

      <div class="premium-card">
        <div class="row-title" style="font-size: 16px;">${escapeHtml(heading)}</div>
        <div class="row-desc">${escapeHtml(isPair ? t('pairBrowserDesc', 'Scan this QR code with the UID.one mobile app and confirm the match number.') : t('challengeDesc', 'Verify the match number on your UID.one device. Forms never auto-submit.'))}</div>

        <div>
          <div class="section-title" style="margin-bottom: 4px;">${escapeHtml(t('originLabel', 'Origin'))}</div>
          <div class="origin-pill">${escapeHtml(challenge.origin || 'https://uid.one')}</div>
        </div>

        <div>
          <div class="section-title" style="margin-bottom: 4px;">${escapeHtml(t('matchNumberLabel', 'Match number'))}</div>
          <div class="match-badge">${escapeHtml(challenge.matchNumber || '—')}</div>
        </div>

        ${isPair && challenge.qrUrl ? `<div class="qr-frame"><img id="approval-qr-img" alt="${escapeHtml(t('pairBrowserTitle', 'Link this browser'))}" width="180" height="180" /></div>` : ''}

        <div id="approval-status" class="status-banner" role="status" aria-live="polite">
          ${escapeHtml(t('challengeWaiting', 'Waiting for approval...'))}
        </div>

        <div id="approval-actions" style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" id="btn-cancel" class="btn-danger-outline">${escapeHtml(t('challengeCancelBtn', 'Cancel'))}</button>
          <button type="button" id="btn-retry" class="btn-premium" style="display: none;">${escapeHtml(t('retryButton', 'Retry'))}</button>
          <button type="button" id="btn-close" class="btn-premium-outline" style="display: none;">${escapeHtml(t('challengeCloseBtn', 'Close'))}</button>
        </div>
      </div>
    </div>
  `;

  if (isPair && challenge.qrUrl) {
    const qrImg = document.getElementById('approval-qr-img') as HTMLImageElement | null;
    if (qrImg) {
      QRCode.toDataURL(challenge.qrUrl, { margin: 2, width: 180 }).then((url) => {
        qrImg.src = url;
      });
    }
  }

  const statusEl = document.getElementById('approval-status');
  const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement | null;
  const btnRetry = document.getElementById('btn-retry') as HTMLButtonElement | null;
  const btnClose = document.getElementById('btn-close') as HTMLButtonElement | null;

  const showTerminalState = (kind: 'error' | 'success', message: string, allowRetry: boolean) => {
    stopMonitors();
    if (statusEl) {
      statusEl.className = `status-banner ${kind}`;
      statusEl.textContent = message;
    }
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnRetry) btnRetry.style.display = allowRetry ? 'inline-flex' : 'none';
    if (btnClose) btnClose.style.display = 'inline-flex';
  };

  btnClose?.addEventListener('click', () => window.close());

  btnCancel?.addEventListener('click', () => {
    stopMonitors();
    chrome.runtime.sendMessage({ type: 'CANCEL_ACTIVE_CHALLENGE', token: challenge.token }, () => {
      showTerminalState('error', t('challengeCancelled', 'Request cancelled.'), true);
    });
  });

  btnRetry?.addEventListener('click', () => {
    stopMonitors();
    if (isPair) {
      chrome.runtime.sendMessage(
        {
          type: 'START_OOB_AUTH',
          domain: challenge.domain || 'uid.one',
          origin: challenge.origin || 'https://uid.one',
          device: navigator.userAgent.includes('Mac') ? 'Browser on macOS' : 'Browser Web',
        },
        (nextRes) => {
          if (nextRes?.success && nextRes.challenge?.token) {
            void renderApproval();
          } else {
            showTerminalState(
              'error',
              t('challengeInitFailed', 'Failed to start verification: $1', [nextRes?.error || 'Error']),
              true
            );
          }
        }
      );
    } else {
      chrome.runtime.sendMessage(
        {
          type: 'PUSH_REQUEST',
          domain: challenge.domain,
          targetId: challenge.fillTargetId,
        },
        (nextRes) => {
          if (nextRes?.success && nextRes.data?.token) {
            void renderApproval();
          } else {
            showTerminalState(
              'error',
              t('challengeInitFailed', 'Failed to start verification: $1', [nextRes?.error || 'Error']),
              true
            );
          }
        }
      );
    }
  });

  if (challenge.status === 'CANCELLED') {
    showTerminalState('error', t('challengeCancelled', 'Request cancelled.'), true);
    return;
  }
  if (challenge.status === 'REJECTED') {
    showTerminalState('error', t('challengeRejected', 'Request was rejected.'), true);
    return;
  }
  if (challenge.status === 'EXPIRED') {
    showTerminalState('error', t('challengeExpired', 'Request expired. Please try again.'), true);
    return;
  }
  if (challenge.status === 'FILLED') {
    showTerminalState(
      'success',
      `${t('challengeFilled', 'Password filled')} — ${t('challengeFilledDesc', 'Review the form and submit manually when ready.')}`,
      false
    );
    return;
  }

  if (isPair) {
    timeoutTimer = setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
        token: challenge.token,
        status: 'EXPIRED',
      });
      showTerminalState('error', t('challengeTimedOut', 'Request timed out. Please try again.'), true);
    }, PAIRING_TIMEOUT_MS);

    pollTimer = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'POLL_OOB_STATUS', token: challenge.token }, (pollRes) => {
        if (!pollRes?.success) {
          showTerminalState('error', t('challengeFailed', 'Verification failed'), true);
          return;
        }
        if (pollRes.status === 'REJECTED') {
          showTerminalState('error', t('challengeRejected', 'Request was rejected.'), true);
          return;
        }
        if (pollRes.status === 'EXPIRED') {
          showTerminalState('error', t('challengeExpired', 'Request expired. Please try again.'), true);
          return;
        }
        if (pollRes.status === 'APPROVED') {
          const issuedToken = typeof pollRes.data?.access_token === 'string' ? pollRes.data.access_token : '';
          if (!issuedToken) {
            showTerminalState(
              'error',
              t('pairingTokenUnverified', 'Approved. Finish signing in on uid.one.'),
              true
            );
            return;
          }
          chrome.runtime.sendMessage({ type: 'SAVE_PAIRING', token: issuedToken }, (saveRes) => {
            if (!saveRes?.success) {
              showTerminalState('error', saveRes?.error || t('challengeFailed', 'Verification failed'), true);
              return;
            }
            showTerminalState(
              'success',
              `${t('pairingSuccess', 'Device linked')} — ${t('pairingSuccessDesc', 'Your browser session is now verified.')}`,
              false
            );
          });
        }
      });
    }, 2000);
  } else {
    timeoutTimer = setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
        token: challenge.token,
        status: 'EXPIRED',
      });
      showTerminalState('error', t('challengeTimedOut', 'Request timed out. Please try again.'), true);
    }, PUSH_TIMEOUT_MS);

    const wsBase = import.meta.env.VITE_WS_BASE || 'wss://api.uid.one';
    try {
      const ws = new WebSocket(`${wsBase}/ws/challenges/${encodeURIComponent(challenge.token)}/`);
      activeWs = ws;
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.status === 'REJECTED') {
            chrome.runtime.sendMessage({
              type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
              token: challenge.token,
              status: 'REJECTED',
            });
            showTerminalState('error', t('challengeRejected', 'Request was rejected.'), true);
          } else if (data.status === 'EXPIRED') {
            chrome.runtime.sendMessage({
              type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
              token: challenge.token,
              status: 'EXPIRED',
            });
            showTerminalState('error', t('challengeExpired', 'Request expired. Please try again.'), true);
          } else if (data.status === 'APPROVED' && data.encrypted_payload) {
            chrome.runtime.sendMessage(
              {
                type: 'FILL_APPROVED_CREDENTIAL',
                token: challenge.token,
                encrypted_payload: data.encrypted_payload,
                targetId: challenge.fillTargetId,
              },
              (fillRes) => {
                if (fillRes?.success) {
                  showTerminalState(
                    'success',
                    `${t('challengeFilled', 'Password filled')} — ${t('challengeFilledDesc', 'Review the form and submit manually when ready.')}`,
                    false
                  );
                } else {
                  showTerminalState('error', fillRes?.error || t('fillFailedDesc', 'Could not fill the password field.'), true);
                }
              }
            );
          }
        } catch {
          // Ignore malformed websocket frames
        }
      };
    } catch {
      // Fall back to storage change listener if WebSocket fails
    }
  }
}

if (chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes.oneuid_active_challenge) {
      const updated = changes.oneuid_active_challenge.newValue as ActiveChallenge | undefined;
      if (!updated) return;
      const statusEl = document.getElementById('approval-status');
      const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement | null;
      const btnRetry = document.getElementById('btn-retry') as HTMLButtonElement | null;
      const btnClose = document.getElementById('btn-close') as HTMLButtonElement | null;
      if (updated.status === 'FILLED' && statusEl) {
        stopMonitors();
        statusEl.className = 'status-banner success';
        statusEl.textContent = `${t('challengeFilled', 'Password filled')} — ${t('challengeFilledDesc', 'Review the form and submit manually when ready.')}`;
        if (btnCancel) btnCancel.style.display = 'none';
        if (btnRetry) btnRetry.style.display = 'none';
        if (btnClose) btnClose.style.display = 'inline-flex';
      } else if (updated.status === 'CANCELLED' && statusEl) {
        stopMonitors();
        statusEl.className = 'status-banner error';
        statusEl.textContent = t('challengeCancelled', 'Request cancelled.');
        if (btnCancel) btnCancel.style.display = 'none';
        if (btnRetry) btnRetry.style.display = 'inline-flex';
        if (btnClose) btnClose.style.display = 'inline-flex';
      }
    }
  });
}

void renderApproval();
