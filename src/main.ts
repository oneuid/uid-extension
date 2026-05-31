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
          </div>

          <!-- Engine Control Section -->
          <div class="premium-card">
            <div class="section-title">
              ${i18n('engineControl')}
            </div>
            <div class="card-row">
              <div class="row-left">
                <div class="icon-wrapper purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div class="row-content">
                  <div class="row-title">${i18n('activeDlpInterceptor')}</div>
                  <div class="row-desc">${i18n('activeDlpInterceptorDesc')}</div>
                </div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-dlp" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="footer">
          <a href="https://uid.one/profile" target="_blank" class="text-link">
            Xem chi tiết trên web →
          </a>
          <span style="font-size: 9px; color: var(--text-muted);">UID.one</span>
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
