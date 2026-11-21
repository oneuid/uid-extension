import './style.css';
import {
  bindShieldToggles,
  escapeHtml,
  formatTimestamp,
  renderShieldRows,
  SHIELD_CONFIGS,
  syncLocale,
  t,
} from './shared/ui';
import { isUidHostname } from './shared/origins';

function renderOptions(): void {
  if (!chrome.runtime?.id) return;
  const uiLang = syncLocale();
  document.title = t('optionsTitle', 'UID Link settings');

  const root = document.getElementById('options-app');
  if (!root) return;

  root.innerHTML = `
    <div class="page-shell">
      <div class="header">
        <div class="brand">
          <img src="/icon_32.png" alt="" class="brand-mark" />
          <span>${escapeHtml(t('optionsTitle', 'UID Link settings'))}</span>
        </div>
        <span class="version-pill">v${escapeHtml(chrome.runtime.getManifest().version)}</span>
      </div>

      <p class="row-desc" style="margin: 0; font-size: 13px;">${escapeHtml(t('optionsSubtitle', 'Configure opt-in privacy shields, allowed autofill sites, and your linked session.'))}</p>

      <div id="options-live" class="status-banner" role="status" aria-live="polite" style="display: none;"></div>

      <div class="premium-card">
        <div>
          <div class="row-title" style="font-size: 15px;">${escapeHtml(t('optionsAccountHeading', 'Account and session'))}</div>
        </div>
        <div id="options-account-body" class="row-desc">${escapeHtml(t('loadingSession', 'Checking session...'))}</div>
      </div>

      <div class="premium-card">
        <div>
          <div class="row-title" style="font-size: 15px;">${escapeHtml(t('optionsShieldsHeading', 'Privacy shields'))}</div>
          <div class="row-desc">${escapeHtml(t('optionsShieldsDesc', 'All shields are off by default. Enable only what you need.'))}</div>
        </div>
        ${renderShieldRows(SHIELD_CONFIGS)}
      </div>

      <div class="premium-card">
        <div>
          <div class="row-title" style="font-size: 15px;">${escapeHtml(t('optionsSitesHeading', 'Allowed autofill sites'))}</div>
          <div class="row-desc">${escapeHtml(t('optionsSitesDesc', 'Vault password fill runs only on HTTPS sites you explicitly allow.'))}</div>
        </div>
        <form id="add-site-form" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input
            type="url"
            id="site-origin-input"
            class="input-field"
            style="flex: 1; min-width: 200px;"
            placeholder="${escapeHtml(t('optionsSitePlaceholder', 'https://example.com'))}"
            aria-label="${escapeHtml(t('optionsSitesHeading', 'Allowed autofill sites'))}"
          />
          <button type="submit" class="btn-premium" style="width: auto; min-width: 120px;">
            ${escapeHtml(t('optionsAddSiteBtn', 'Add site'))}
          </button>
        </form>
        <div id="sites-list"></div>
      </div>

      <div class="footer">
        <a href="https://uid.one/privacy" target="_blank" rel="noopener noreferrer" class="text-link">
          ${escapeHtml(t('privacyPolicyLink', 'Privacy policy'))}
        </a>
        <span>UID.one</span>
      </div>
    </div>
  `;

  bindShieldToggles(SHIELD_CONFIGS);

  const liveEl = document.getElementById('options-live');
  const showLive = (msg: string, kind: 'success' | 'error' = 'success') => {
    if (!liveEl) return;
    liveEl.style.display = 'block';
    liveEl.className = `status-banner ${kind}`;
    liveEl.textContent = msg;
  };

  const loadAccount = () => {
    const accountBody = document.getElementById('options-account-body');
    if (!accountBody) return;
    chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (session) => {
      if (session?.isLocked) {
        accountBody.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div class="row-title">${escapeHtml(t('vaultLocked', 'Vault locked'))}</div>
            <div class="btn-row">
              <button type="button" id="opt-unlock" class="btn-premium">${escapeHtml(t('unlockButton', 'Unlock'))}</button>
              <button type="button" id="opt-unlink" class="btn-danger-outline">${escapeHtml(t('unlinkButton', 'Unlink'))}</button>
            </div>
          </div>
        `;
        document.getElementById('opt-unlock')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'UNLOCK_SESSION' }, (r) => {
            if (r?.success) {
              showLive(t('statusUnlocked', 'Vault unlocked.'), 'success');
              loadAccount();
            } else {
              showLive(r?.error || t('sessionCheckFailed', 'Could not verify your UID.one session.'), 'error');
            }
          });
        });
        document.getElementById('opt-unlink')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'CLEAR_SESSION_TOKEN' }, () => {
            showLive(t('statusUnlinked', 'Browser unlinked.'), 'success');
            loadAccount();
          });
        });
        return;
      }

      if (session?.isPaired) {
        accountBody.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div class="row-title">${escapeHtml(t('accountLabel', 'Account: $1', [session.email || 'UID.one']))}</div>
            <div class="row-desc">${escapeHtml(t('linkedAtLabel', 'Linked: $1', [formatTimestamp(session.linkedAt, uiLang)]))}</div>
            <div class="btn-row">
              <button type="button" id="opt-lock" class="btn-premium-outline">${escapeHtml(t('lockButton', 'Lock'))}</button>
              <button type="button" id="opt-unlink" class="btn-danger-outline">${escapeHtml(t('unlinkButton', 'Unlink'))}</button>
            </div>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="https://uid.one/profile" target="_blank" rel="noopener noreferrer" class="text-link">${escapeHtml(t('accountSettings', 'Account settings'))}</a>
              <a href="https://uid.one/data-privacy" target="_blank" rel="noopener noreferrer" class="text-link" style="color: var(--danger-glow);">${escapeHtml(t('deleteAccount', 'Delete account'))}</a>
            </div>
          </div>
        `;
        document.getElementById('opt-lock')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'LOCK_SESSION' }, () => {
            showLive(t('statusLocked', 'Vault locked.'), 'success');
            loadAccount();
          });
        });
        document.getElementById('opt-unlink')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'CLEAR_SESSION_TOKEN' }, () => {
            showLive(t('statusUnlinked', 'Browser unlinked.'), 'success');
            loadAccount();
          });
        });
        return;
      }

      accountBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="row-desc">${escapeHtml(t('waitingForLogin', 'Waiting for login'))}</div>
          <a href="https://uid.one/login" target="_blank" rel="noopener noreferrer" class="btn-premium" style="max-width: 240px;">
            ${escapeHtml(t('signInWeb', 'Sign in on UID.one'))}
          </a>
        </div>
      `;
    });
  };

  const loadSites = () => {
    const listEl = document.getElementById('sites-list');
    if (!listEl) return;
    chrome.runtime.sendMessage({ type: 'GET_AUTOFILL_SITES' }, (res) => {
      const origins: string[] = Array.isArray(res?.origins) ? res.origins : [];
      if (origins.length === 0) {
        listEl.innerHTML = `<div class="row-desc">${escapeHtml(t('optionsSitesEmpty', 'No sites enabled yet. Add an HTTPS site below or toggle it from the popup.'))}</div>`;
        return;
      }
      listEl.innerHTML = origins
        .map(
          (origin) => `
          <div class="card-row">
            <div class="row-content">
              <div class="row-title">${escapeHtml(origin)}</div>
            </div>
            <button type="button" class="btn-danger-outline remove-site-btn" data-origin="${escapeHtml(origin)}" style="width: auto; min-width: 96px;">
              ${escapeHtml(t('optionsRemoveSiteBtn', 'Remove'))}
            </button>
          </div>
        `
        )
        .join('');

      listEl.querySelectorAll<HTMLButtonElement>('.remove-site-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const origin = btn.dataset.origin || '';
          if (!origin) return;
          if (chrome.permissions?.remove) {
            await chrome.permissions.remove({ origins: [`${origin}/*`] }).catch(() => {});
          }
          chrome.runtime.sendMessage({ type: 'SET_AUTOFILL_SITE', origin, enabled: false }, () => {
            loadSites();
          });
        });
      });
    });
  };

  const form = document.getElementById('add-site-form') as HTMLFormElement | null;
  const input = document.getElementById('site-origin-input') as HTMLInputElement | null;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = (input?.value || '').trim();
    let origin = '';
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'https:' && !isUidHostname(parsed.hostname)) {
        origin = parsed.origin;
      }
    } catch {
      origin = '';
    }
    if (!origin) {
      showLive(t('optionsSiteInvalid', 'Enter a valid third-party HTTPS origin (for example, https://example.com).'), 'error');
      return;
    }

    if (chrome.permissions?.request) {
      const granted = await chrome.permissions.request({ origins: [`${origin}/*`] }).catch(() => false);
      if (!granted) {
        showLive(t('optionsSitePermDenied', 'Site permission was not granted.'), 'error');
        return;
      }
    }

    chrome.runtime.sendMessage({ type: 'SET_AUTOFILL_SITE', origin, enabled: true }, (res) => {
      if (res?.success) {
        if (input) input.value = '';
        loadSites();
      } else {
        showLive(res?.error || t('optionsSiteInvalid', 'Enter a valid third-party HTTPS origin.'), 'error');
      }
    });
  });

  loadAccount();
  loadSites();
}

renderOptions();
