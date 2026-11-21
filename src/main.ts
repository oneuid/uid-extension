import './style.css';
import QRCode from 'qrcode';
import {
  bindShieldToggles,
  escapeHtml,
  formatTimestamp,
  renderShieldRows,
  SHIELD_CONFIGS,
  syncLocale,
  t,
} from './shared/ui';

type PopupTab = 'status' | 'shields';

interface SessionState {
  isPaired: boolean;
  isLocked: boolean;
  hasSession: boolean;
  email?: string;
  sub?: string;
  linkedAt?: number | null;
  offline?: boolean;
  error?: string;
}

interface ActiveChallenge {
  token: string;
  mode: 'pair' | 'fill';
  origin: string;
  domain: string;
  matchNumber: string;
  qrUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'FILLED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'ERROR';
}

interface StatsState {
  cookies_blocked: number;
  exif_stripped: number;
  otp_cleared: number;
  gpc_signals: number;
}

const PAIRING_TIMEOUT_MS = 120_000;

let activeTab: PopupTab = 'status';
let liveMessage = '';
let liveKind: 'info' | 'error' | 'success' = 'info';
let pairingPollTimer: ReturnType<typeof setInterval> | null = null;
let pairingTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

function stopPairingPoll(): void {
  if (pairingPollTimer) {
    clearInterval(pairingPollTimer);
    pairingPollTimer = null;
  }
  if (pairingTimeoutTimer) {
    clearTimeout(pairingTimeoutTimer);
    pairingTimeoutTimer = null;
  }
}

function sendMessageAsync<T = any>(payload: Record<string, unknown>): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(payload, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(res as T);
      });
    } catch {
      resolve(null);
    }
  });
}

function setLiveStatus(msg: string, kind: 'info' | 'error' | 'success' = 'info'): void {
  liveMessage = msg;
  liveKind = kind;
  const el = document.getElementById('popup-live-banner');
  const srEl = document.getElementById('popup-live-sr');
  if (srEl) srEl.textContent = msg;
  if (el) {
    if (!msg) {
      el.style.display = 'none';
    } else {
      el.style.display = 'block';
      el.className = `status-banner ${kind === 'info' ? '' : kind}`.trim();
      el.textContent = msg;
    }
  }
}

function renderShell(uiLang: string, bodyHtml: string): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  const manifestVersion = chrome.runtime.getManifest().version;
  app.innerHTML = `
    <div class="header">
      <div class="brand">
        <span class="brand-dot"></span>
        <span>UID Link</span>
      </div>
      <div class="header-actions">
        <span class="version-pill tabular-nums">v${escapeHtml(manifestVersion)}</span>
        <button
          type="button"
          id="btn-open-options"
          class="icon-btn"
          aria-label="${escapeHtml(t('openOptions', 'Options'))}"
          title="${escapeHtml(t('openOptions', 'Options'))}"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="nav-tabs" role="tablist" aria-label="UID Link">
      <button type="button" role="tab" id="tab-status" class="nav-tab" aria-selected="${activeTab === 'status' ? 'true' : 'false'}">
        ${escapeHtml(t('tabStatus', 'Status'))}
      </button>
      <button type="button" role="tab" id="tab-shields" class="nav-tab" aria-selected="${activeTab === 'shields' ? 'true' : 'false'}">
        ${escapeHtml(t('tabShields', 'Shields'))}
      </button>
    </div>

    <div id="popup-live-sr" class="sr-only" aria-live="polite">${escapeHtml(liveMessage)}</div>
    <div id="popup-live-banner" class="status-banner ${liveKind === 'info' ? '' : liveKind}" style="display: ${liveMessage ? 'block' : 'none'};">${escapeHtml(liveMessage)}</div>

    <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
      ${bodyHtml}
    </div>

    <div class="footer">
      <a href="https://uid.one/profile" target="_blank" rel="noopener noreferrer" class="text-link">
        ${escapeHtml(t('viewWebProfile', 'Open web vault'))}
      </a>
      <a href="https://uid.one/privacy" target="_blank" rel="noopener noreferrer" class="text-link">
        ${escapeHtml(t('privacyPolicyLink', 'Privacy policy'))}
      </a>
    </div>
  `;

  document.getElementById('btn-open-options')?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
  });

  document.getElementById('tab-status')?.addEventListener('click', () => {
    if (activeTab !== 'status') {
      activeTab = 'status';
      void updateUI();
    }
  });
  document.getElementById('tab-shields')?.addEventListener('click', () => {
    if (activeTab !== 'shields') {
      activeTab = 'shields';
      void updateUI();
    }
  });

  void uiLang;
}

function renderActiveChallengeCard(challenge: ActiveChallenge): string {
  const isPair = challenge.mode === 'pair';
  const heading = isPair
    ? t('challengePairTitle', 'Confirm browser link')
    : t('challengeTitle', 'Confirm vault password fill');
  return `
    <div class="premium-card" id="popup-challenge-card">
      <div class="row-title">${escapeHtml(heading)}</div>
      <div class="row-desc">${escapeHtml(isPair ? t('pairBrowserDesc', 'Scan this QR code with the UID.one mobile app and confirm the match number.') : t('challengeDesc', 'Verify the match number on your UID.one device. Forms never auto-submit.'))}</div>
      <div>
        <div class="section-title" style="margin-bottom: 4px;">${escapeHtml(t('originLabel', 'Origin'))}</div>
        <div class="origin-pill">${escapeHtml(challenge.origin || 'https://uid.one')}</div>
      </div>
      <div>
        <div class="section-title" style="margin-bottom: 4px;">${escapeHtml(t('matchNumberLabel', 'Match number'))}</div>
        <div class="match-badge">${escapeHtml(challenge.matchNumber || '—')}</div>
      </div>
      ${isPair && challenge.qrUrl ? `<div class="qr-frame"><img id="popup-qr-img" alt="${escapeHtml(t('pairBrowserTitle', 'Link this browser'))}" width="160" height="160" /></div>` : ''}
      <div id="popup-challenge-status" class="status-banner" role="status" aria-live="polite">
        ${escapeHtml(t('challengeWaiting', 'Waiting for approval...'))}
      </div>
      <div class="btn-row">
        <button type="button" id="btn-challenge-cancel" class="btn-danger-outline">${escapeHtml(t('challengeCancelBtn', 'Cancel'))}</button>
        ${!isPair ? `<button type="button" id="btn-challenge-approve" class="btn-premium">${escapeHtml(t('challengeApproveBtn', 'Approve'))}</button>` : `<button type="button" id="btn-challenge-retry" class="btn-premium-outline" style="display: none;">${escapeHtml(t('retryButton', 'Retry'))}</button>`}
      </div>
    </div>
  `;
}

function renderStatsCard(stats: StatsState): string {
  return `
    <div class="premium-card">
      <div class="section-title">${escapeHtml(t('sovereignIdentityLayer', 'Sovereign identity layer'))}</div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value tabular-nums">${stats.cookies_blocked}</div>
          <div class="stat-label">${escapeHtml(t('cookiesGuard', 'Cookies guard'))}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value tabular-nums">${stats.exif_stripped}</div>
          <div class="stat-label">${escapeHtml(t('exifStripped', 'EXIF stripped'))}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value tabular-nums">${stats.otp_cleared}</div>
          <div class="stat-label">${escapeHtml(t('inputsWiped', 'Inputs wiped'))}</div>
        </div>
      </div>
    </div>
  `;
}

async function startInPopupPairing(): Promise<void> {
  stopPairingPoll();
  setLiveStatus(t('loadingSession', 'Checking session...'), 'info');

  const reqRes = await sendMessageAsync<any>({
    type: 'START_OOB_AUTH',
    domain: 'uid.one',
    origin: 'https://uid.one',
    device: navigator.userAgent.includes('Mac') ? 'Browser on macOS' : 'Browser Web',
  });

  if (!reqRes?.success || !reqRes.challenge?.token) {
    setLiveStatus(
      t('challengeInitFailed', 'Failed to start verification: $1', [reqRes?.error || 'Network error']),
      'error'
    );
    return;
  }

  setLiveStatus('', 'info');
  await updateUI();
}

function attachPairingMonitor(challenge: ActiveChallenge): void {
  stopPairingPoll();
  if (challenge.qrUrl) {
    const img = document.getElementById('popup-qr-img') as HTMLImageElement | null;
    if (img) {
      QRCode.toDataURL(challenge.qrUrl, { margin: 2, width: 160 }).then((dataUrl) => {
        img.src = dataUrl;
      });
    }
  }

  const statusEl = document.getElementById('popup-challenge-status');
  const retryBtn = document.getElementById('btn-challenge-retry') as HTMLButtonElement | null;

  const failPairing = (msg: string) => {
    stopPairingPoll();
    if (statusEl) {
      statusEl.className = 'status-banner error';
      statusEl.textContent = msg;
    }
    if (retryBtn) {
      retryBtn.style.display = 'inline-flex';
      retryBtn.onclick = () => {
        void startInPopupPairing();
      };
    }
  };

  pairingTimeoutTimer = setTimeout(() => {
    void sendMessageAsync({
      type: 'UPDATE_ACTIVE_CHALLENGE_STATUS',
      token: challenge.token,
      status: 'EXPIRED',
    });
    failPairing(t('challengeTimedOut', 'Request timed out. Please try again.'));
  }, PAIRING_TIMEOUT_MS);

  pairingPollTimer = setInterval(async () => {
    const pollRes = await sendMessageAsync<any>({
      type: 'POLL_OOB_STATUS',
      token: challenge.token,
    });
    if (!pollRes?.success) {
      failPairing(t('challengeFailed', 'Verification failed'));
      return;
    }
    if (pollRes.status === 'REJECTED') {
      failPairing(t('challengeRejected', 'Request was rejected.'));
      return;
    }
    if (pollRes.status === 'EXPIRED') {
      failPairing(t('challengeExpired', 'Request expired. Please try again.'));
      return;
    }
    if (pollRes.status === 'APPROVED') {
      stopPairingPoll();
      const issuedToken = typeof pollRes.data?.access_token === 'string' ? pollRes.data.access_token : '';
      if (!issuedToken) {
        failPairing(t('pairingTokenUnverified', 'Approved. Finish signing in on uid.one.'));
        return;
      }
      const saveRes = await sendMessageAsync<any>({ type: 'SAVE_PAIRING', token: issuedToken });
      if (!saveRes?.success) {
        failPairing(saveRes?.error || t('challengeFailed', 'Verification failed'));
        return;
      }
      setLiveStatus(t('pairingSuccessDesc', 'Your browser session is now verified.'), 'success');
      await updateUI();
    }
  }, 2000);
}

async function updateUI(): Promise<void> {
  if (!chrome.runtime?.id) return;
  const uiLang = syncLocale();
  document.title = t('extensionName', 'UID Link');

  renderShell(
    uiLang,
    `
      <div class="premium-card">
        <div class="row-title">${escapeHtml(t('loadingSession', 'Checking session...'))}</div>
      </div>
    `
  );

  const [session, statsRes, challengeRes] = await Promise.all([
    sendMessageAsync<SessionState>({ type: 'CHECK_PAIRING' }),
    sendMessageAsync<StatsState>({ type: 'GET_STATS' }),
    sendMessageAsync<{ success: boolean; challenge: ActiveChallenge | null }>({ type: 'GET_ACTIVE_CHALLENGE' }),
  ]);

  if (!session || !statsRes) {
    renderShell(
      uiLang,
      `
        <div class="premium-card">
          <div class="row-title">${escapeHtml(t('sessionCheckFailed', 'Could not verify your UID.one session.'))}</div>
          <button type="button" id="btn-retry-load" class="btn-premium">${escapeHtml(t('retryButton', 'Retry'))}</button>
        </div>
      `
    );
    document.getElementById('btn-retry-load')?.addEventListener('click', () => {
      void updateUI();
    });
    return;
  }

  const stats: StatsState = {
    cookies_blocked: statsRes.cookies_blocked || 0,
    exif_stripped: statsRes.exif_stripped || 0,
    otp_cleared: statsRes.otp_cleared || 0,
    gpc_signals: statsRes.gpc_signals || 0,
  };

  if (activeTab === 'shields') {
    renderShell(
      uiLang,
      `
        <div class="premium-card">
          <div class="section-title">${escapeHtml(t('engineControl', 'Engine control'))}</div>
          ${renderShieldRows(SHIELD_CONFIGS)}
          <div class="card-row" id="autofill-site-row" style="display: none;">
            <div class="row-left">
              <div class="row-content">
                <div class="row-title">${escapeHtml(t('vaultFillTitle', 'Site integration and vault fill'))}</div>
                <div class="row-desc" id="autofill-site-origin">${escapeHtml(t('vaultFillOffDesc', 'Off by default for this site'))}</div>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" id="toggle-autofill-site" aria-label="${escapeHtml(t('vaultFillTitle', 'Site integration and vault fill'))}">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `
    );

    bindShieldToggles(SHIELD_CONFIGS);
    bindAutofillSiteToggle();
    return;
  }

  const pendingChallenge =
    challengeRes?.challenge && challengeRes.challenge.status === 'PENDING'
      ? challengeRes.challenge
      : null;

  let statusCardHtml = '';
  if (session.offline) {
    statusCardHtml = `
      <div class="premium-card">
        <div class="row-left">
          <div class="icon-wrapper warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div class="row-content">
            <div class="row-title">${escapeHtml(t('sessionCheckFailed', 'Could not verify your UID.one session.'))}</div>
            <div class="row-desc">${escapeHtml(session.error || '')}</div>
          </div>
        </div>
        <div class="btn-row">
          <button type="button" id="btn-retry-session" class="btn-premium">${escapeHtml(t('retryButton', 'Retry'))}</button>
          <a href="https://uid.one/login" target="_blank" rel="noopener noreferrer" class="btn-premium-outline">${escapeHtml(t('signInWeb', 'Sign in on UID.one'))}</a>
        </div>
      </div>
    `;
  } else if (session.isLocked) {
    statusCardHtml = `
      <div class="premium-card">
        <div class="row-left">
          <div class="icon-wrapper warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div class="row-content">
            <div class="row-title">${escapeHtml(t('vaultLocked', 'Vault locked'))}</div>
            <div class="row-desc">${escapeHtml(t('vaultLockedDesc', 'Unlock UID Link to use autofill and signing.'))}</div>
          </div>
        </div>
        <div class="btn-row">
          <button type="button" id="btn-unlock-session" class="btn-premium">${escapeHtml(t('unlockButton', 'Unlock'))}</button>
          <button type="button" id="btn-unlink-session" class="btn-danger-outline">${escapeHtml(t('unlinkButton', 'Unlink'))}</button>
        </div>
      </div>
    `;
  } else if (session.isPaired) {
    statusCardHtml = `
      <div class="premium-card">
        <div class="row-left">
          <div class="icon-wrapper success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div class="row-content">
            <div class="row-title">${escapeHtml(t('vaultConnected', 'Vault connected'))}</div>
            <div class="row-desc">${escapeHtml(t('accountLabel', 'Account: $1', [session.email || 'UID.one']))}</div>
            <div class="row-desc">${escapeHtml(t('linkedAtLabel', 'Linked: $1', [formatTimestamp(session.linkedAt, uiLang)]))}</div>
          </div>
        </div>
        <div class="btn-row">
          <button type="button" id="btn-lock-session" class="btn-premium-outline">${escapeHtml(t('lockButton', 'Lock'))}</button>
          <button type="button" id="btn-unlink-session" class="btn-danger-outline">${escapeHtml(t('unlinkButton', 'Unlink'))}</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
          <a href="https://uid.one/profile" target="_blank" rel="noopener noreferrer" class="text-link">${escapeHtml(t('accountSettings', 'Account settings'))}</a>
          <a href="https://uid.one/data-privacy" target="_blank" rel="noopener noreferrer" class="text-link" style="color: var(--danger-glow);">${escapeHtml(t('deleteAccount', 'Delete account'))}</a>
        </div>
        <div class="row-desc">${escapeHtml(t('deleteAccountHint', 'Account deletion is managed in UID.one Data and privacy.'))}</div>
      </div>
    `;
  } else {
    statusCardHtml = `
      <div class="premium-card">
        <div class="row-left">
          <div class="icon-wrapper warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div class="row-content">
            <div class="row-title">${escapeHtml(t('waitingForLogin', 'Waiting for login'))}</div>
            <div class="row-desc">${escapeHtml(t('pairBrowserDesc', 'Scan this QR code with the UID.one mobile app and confirm the match number.'))}</div>
          </div>
        </div>
        <button type="button" id="btn-link-browser" class="btn-premium">${escapeHtml(t('signInPrimary', 'Link this browser'))}</button>
        <a href="https://uid.one/login" target="_blank" rel="noopener noreferrer" class="btn-premium-outline">${escapeHtml(t('signInWeb', 'Sign in on UID.one'))}</a>
      </div>
    `;
  }

  const challengeHtml = pendingChallenge ? renderActiveChallengeCard(pendingChallenge) : '';
  renderShell(uiLang, `${challengeHtml}${statusCardHtml}${renderStatsCard(stats)}`);

  document.getElementById('btn-retry-session')?.addEventListener('click', () => {
    void updateUI();
  });

  document.getElementById('btn-link-browser')?.addEventListener('click', () => {
    void startInPopupPairing();
  });

  document.getElementById('btn-lock-session')?.addEventListener('click', async () => {
    const res = await sendMessageAsync<any>({ type: 'LOCK_SESSION' });
    if (res?.success) {
      setLiveStatus(t('statusLocked', 'Vault locked.'), 'info');
    }
    await updateUI();
  });

  document.getElementById('btn-unlock-session')?.addEventListener('click', async () => {
    const res = await sendMessageAsync<any>({ type: 'UNLOCK_SESSION' });
    if (res?.success) {
      setLiveStatus(t('statusUnlocked', 'Vault unlocked.'), 'success');
    } else {
      setLiveStatus(res?.error || t('sessionCheckFailed', 'Could not verify your UID.one session.'), 'error');
    }
    await updateUI();
  });

  document.getElementById('btn-unlink-session')?.addEventListener('click', async () => {
    stopPairingPoll();
    await sendMessageAsync({ type: 'CLEAR_SESSION_TOKEN' });
    setLiveStatus(t('statusUnlinked', 'Browser unlinked.'), 'info');
    await updateUI();
  });

  if (pendingChallenge) {
    document.getElementById('btn-challenge-cancel')?.addEventListener('click', async () => {
      stopPairingPoll();
      await sendMessageAsync({ type: 'CANCEL_ACTIVE_CHALLENGE', token: pendingChallenge.token });
      setLiveStatus(t('challengeCancelled', 'Request cancelled.'), 'info');
      await updateUI();
    });

    document.getElementById('btn-challenge-approve')?.addEventListener('click', async () => {
      const approveRes = await sendMessageAsync<any>({
        type: 'APPROVE_CHALLENGE',
        token: pendingChallenge.token,
        matchNumber: pendingChallenge.matchNumber,
        userGesture: true,
      });
      if (approveRes?.success) {
        setLiveStatus(t('challengeApproved', 'Approved'), 'success');
        await updateUI();
      } else {
        setLiveStatus(approveRes?.error || t('challengeFailed', 'Verification failed'), 'error');
      }
    });

    if (pendingChallenge.mode === 'pair') {
      attachPairingMonitor(pendingChallenge);
    }
  }
}

function bindAutofillSiteToggle(): void {
  const autofillRow = document.getElementById('autofill-site-row');
  const autofillOriginEl = document.getElementById('autofill-site-origin');
  const toggleAutofill = document.getElementById('toggle-autofill-site') as HTMLInputElement | null;
  if (!autofillRow || !autofillOriginEl || !toggleAutofill || !chrome.tabs?.query) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urlStr = tabs?.[0]?.url || '';
    let activeOrigin = '';
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol === 'https:' && parsed.hostname !== 'uid.one' && !parsed.hostname.endsWith('.uid.one')) {
        activeOrigin = parsed.origin;
      }
    } catch {
      activeOrigin = '';
    }

    if (!activeOrigin) return;
    autofillRow.style.display = 'flex';
    autofillOriginEl.textContent = activeOrigin;

    chrome.runtime.sendMessage({ type: 'GET_AUTOFILL_SITES' }, (sitesRes) => {
      const origins: string[] = Array.isArray(sitesRes?.origins) ? sitesRes.origins : [];
      toggleAutofill.checked = origins.includes(activeOrigin);
    });

    toggleAutofill.addEventListener('change', async () => {
      const wantEnabled = toggleAutofill.checked;
      const originPattern = `${activeOrigin}/*`;
      if (wantEnabled && chrome.permissions?.request) {
        const granted = await chrome.permissions
          .request({ origins: [originPattern] })
          .catch(() => false);
        if (!granted) {
          toggleAutofill.checked = false;
          return;
        }
      } else if (!wantEnabled && chrome.permissions?.remove) {
        await chrome.permissions.remove({ origins: [originPattern] }).catch(() => {});
      }

      chrome.runtime.sendMessage({
        type: 'SET_AUTOFILL_SITE',
        origin: activeOrigin,
        enabled: wantEnabled,
      });
    });
  });
}

void updateUI();
