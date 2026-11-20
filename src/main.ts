import './style.css'

function syncDocumentLocale() {
  const uiLang = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').trim();
  document.documentElement.lang = uiLang;
  document.documentElement.dir = uiLang.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
}

interface ShieldToggleConfig {
  id: string;
  storageKey: string;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
}

const SHIELD_TOGGLES: ShieldToggleConfig[] = [
  {
    id: 'toggle-dlp',
    storageKey: 'settings_otp_shield',
    titleKey: 'shieldDlpTitle',
    titleFallback: 'DLP input and paste shield',
    descKey: 'shieldDlpDesc',
    descFallback: 'Scan form submissions, uploads, and sensitive pastes',
  },
  {
    id: 'toggle-exif',
    storageKey: 'settings_exif_stripper',
    titleKey: 'shieldExifTitle',
    titleFallback: 'EXIF metadata stripper',
    descKey: 'shieldExifDesc',
    descFallback: 'Strip JPEG location and camera metadata on upload',
  },
  {
    id: 'toggle-cookie',
    storageKey: 'settings_cookie_guard',
    titleKey: 'shieldCookieTitle',
    titleFallback: 'Tracking cookie guard',
    descKey: 'shieldCookieDesc',
    descFallback: 'Sweep known third-party analytics cookies',
  },
  {
    id: 'toggle-audit',
    storageKey: 'settings_clipboard_audit',
    titleKey: 'shieldAuditTitle',
    titleFallback: 'Clipboard audit metadata',
    descKey: 'shieldAuditDesc',
    descFallback: 'Log copy type, count, and length without content',
  },
  {
    id: 'toggle-screen',
    storageKey: 'settings_screen_shield',
    titleKey: 'shieldScreenTitle',
    titleFallback: 'Tab-switch blur (UID.one)',
    descKey: 'shieldScreenDesc',
    descFallback: 'Blur UID.one pages when the tab is hidden',
  },
];

function updateUI() {
  if (!chrome.runtime?.id) return;

  syncDocumentLocale();

  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
    const isPaired = pairingRes?.isPaired;

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (statsRes) => {
      const stats = statsRes || { cookies_blocked: 0, exif_stripped: 0, otp_cleared: 0, gpc_signals: 0 };

      const app = document.querySelector<HTMLDivElement>('#app')!;
      const i18n = (key: string) => chrome.i18n.getMessage(key);

      const shieldRowsHtml = SHIELD_TOGGLES.map((shield, index) => {
        const title = i18n(shield.titleKey) || shield.titleFallback;
        const desc = i18n(shield.descKey) || shield.descFallback;
        const dividerStyle =
          index > 0
            ? 'margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(148, 163, 184, 0.14);'
            : '';
        return `
          <div class="card-row" style="${dividerStyle}">
            <div class="row-left">
              <div class="row-content">
                <div class="row-title">${title}</div>
                <div class="row-desc">${desc}</div>
              </div>
            </div>
            <label class="switch">
              <input type="checkbox" id="${shield.id}" aria-label="${title}">
              <span class="slider"></span>
            </label>
          </div>
        `;
      }).join('');

      app.innerHTML = `
        <div class="header">
          <div class="brand">
            <span class="brand-dot"></span>
            UID Link
          </div>
          <span class="tabular-nums" style="font-size: 10px; font-weight: 500; color: var(--text-muted);">v${chrome.runtime.getManifest().version}</span>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 14px;">
          <!-- Vault Status Card -->
          <div class="premium-card">
            <div class="card-row">
              <div class="row-left">
                <div class="icon-wrapper ${isPaired ? 'success' : 'warning'}">
                  ${isPaired 
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>` 
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`}
                </div>
                <div class="row-content">
                  <div class="row-title" style="display: flex; align-items: center; gap: 6px;">
                    ${isPaired ? i18n('vaultConnected') : i18n('waitingForLogin')}
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${isPaired ? '#10b981' : '#f59e0b'};"></span>
                  </div>
                  <div class="row-desc">
                    ${isPaired ? i18n('vaultConnectedDesc') : i18n('waitingForLoginDesc')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Protection Stats -->
          <div class="premium-card">
            <div class="section-title">
              ${i18n('sovereignIdentityLayer')}
            </div>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value tabular-nums">${stats.cookies_blocked}</div>
                <div class="stat-label">${i18n('cookiesGuard')}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value tabular-nums">${stats.exif_stripped}</div>
                <div class="stat-label">${i18n('exifStripped')}</div>
              </div>
              <div class="stat-box">
                <div class="stat-value tabular-nums">${stats.otp_cleared}</div>
                <div class="stat-label">${i18n('inputsWiped')}</div>
              </div>
            </div>
          </div>

          <!-- Engine Control Section -->
          <div class="premium-card">
            <div class="section-title">
              ${i18n('engineControl')}
            </div>
            ${shieldRowsHtml}
            <div class="card-row" id="autofill-site-row" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(148, 163, 184, 0.14);">
              <div class="row-left">
                <div class="row-content">
                  <div class="row-title">${i18n('vaultFillTitle') || 'Site integration and vault fill'}</div>
                  <div class="row-desc" id="autofill-site-origin">${i18n('vaultFillOffDesc') || 'Off by default for this site'}</div>
                </div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-autofill-site" aria-label="${i18n('vaultFillTitle') || 'Site integration and vault fill'}">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="footer">
          <a href="https://uid.one/profile" target="_blank" rel="noopener noreferrer" class="text-link">
            ${i18n('viewWebProfile') || 'Open web vault'}
          </a>
          <span style="font-size: 10px; color: var(--text-muted);">UID.one</span>
        </div>
      `;

      const storageKeys = SHIELD_TOGGLES.map((s) => s.storageKey);
      chrome.storage.local.get(storageKeys).then((res) => {
        for (const shield of SHIELD_TOGGLES) {
          const el = document.getElementById(shield.id) as HTMLInputElement | null;
          if (!el) continue;
          el.checked = res[shield.storageKey] === true;
          el.addEventListener('change', () => {
            chrome.storage.local.set({ [shield.storageKey]: el.checked });
          });
        }
      });

      const autofillRow = document.getElementById('autofill-site-row');
      const autofillOriginEl = document.getElementById('autofill-site-origin');
      const toggleAutofill = document.getElementById('toggle-autofill-site') as HTMLInputElement | null;
      if (autofillRow && autofillOriginEl && toggleAutofill && chrome.tabs?.query) {
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
    });
  });
}

updateUI();
