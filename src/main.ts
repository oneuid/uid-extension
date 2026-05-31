import './style.css'

function updateUI() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
    const isPaired = pairingRes?.isPaired;

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (statsRes) => {
      const stats = statsRes || { cookies_blocked: 0, exif_stripped: 0, otp_cleared: 0, gpc_signals: 0 };

      const app = document.querySelector<HTMLDivElement>('#app')!;
      const i18n = (key: string) => chrome.i18n.getMessage(key);

      app.innerHTML = `
        <div class="header">
          <div class="brand">
            <span class="brand-dot"></span>
            UID Link
          </div>
          <span style="font-size: 10px; font-weight: 500; color: var(--text-muted);">v${chrome.runtime.getManifest().version}</span>
        </div>

        <div class="tab-content" style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
          <div class="vault-card">
            <div class="vault-status-badge ${isPaired ? 'connected' : 'disconnected'}">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
              ${isPaired ? i18n('vaultConnected') : i18n('waitingForLogin')}
            </div>
            <p style="margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.5; text-align: center;">
              ${isPaired 
                ? i18n('vaultConnectedDesc') 
                : i18n('waitingForLoginDesc')}
            </p>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${stats.cookies_blocked}</div>
              <div class="stat-label">${i18n('cookiesGuard')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.exif_stripped}</div>
              <div class="stat-label">${i18n('exifStripped')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.otp_cleared}</div>
              <div class="stat-label">${i18n('inputsWiped')}</div>
            </div>
          </div>

          <div class="toggles-section">
            <div class="section-title">${i18n('engineControl')}</div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-label">${i18n('activeDlpInterceptor')}</div>
                <div class="toggle-desc">${i18n('activeDlpInterceptorDesc')}</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-dlp" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="footer">
          <span>${i18n('sovereignIdentityLayer')}</span>
          <a href="https://uid.one" target="_blank" class="footer-link">uid.one</a>
        </div>
      `;

      // Set up switch listener
      const toggleDlp = document.getElementById('toggle-dlp') as HTMLInputElement;
      if (toggleDlp) {
        chrome.storage.local.get('settings_otp_shield').then(res => {
          toggleDlp.checked = res.settings_otp_shield !== false;
        });

        toggleDlp.addEventListener('change', () => {
          chrome.storage.local.set({ 'settings_otp_shield': toggleDlp.checked });
        });
      }
    });
  });
}

updateUI();
