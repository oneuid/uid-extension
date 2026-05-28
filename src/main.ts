import './style.css'

function updateUI() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
    const isPaired = pairingRes?.isPaired;

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (statsRes) => {
      const stats = statsRes || { cookies_blocked: 0, exif_stripped: 0, otp_cleared: 0, gpc_signals: 0 };

      const app = document.querySelector<HTMLDivElement>('#app')!;
      app.innerHTML = `
        <div class="header">
          <div class="brand">
            <span class="brand-dot"></span>
            UID Link
          </div>
          <span style="font-size: 10px; font-weight: 500; color: var(--text-muted);">v1.1.0</span>
        </div>

        <div class="tab-content" style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
          <div class="vault-card">
            <div class="vault-status-badge ${isPaired ? 'connected' : 'disconnected'}">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
              ${isPaired ? 'Vault Connected' : 'Waiting for Login'}
            </div>
            <p style="margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.5; text-align: center;">
              ${isPaired 
                ? 'Zero-Trust security active. Passkeys and credentials synced securely with vault.' 
                : 'Log in to your <strong><a href="https://uid.one/login" target="_blank" style="color: var(--primary-glow); text-decoration: underline;">uid.one</a></strong> web account. The extension will synchronize and pair automatically.'}
            </p>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${stats.cookies_blocked}</div>
              <div class="stat-label">Cookies Guard</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.exif_stripped}</div>
              <div class="stat-label">EXIF Stripped</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.otp_cleared}</div>
              <div class="stat-label">Inputs Wiped</div>
            </div>
          </div>

          <div class="toggles-section">
            <div class="section-title">Engine Control</div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-label">Active DLP Interceptor</div>
                <div class="toggle-desc">Analyze uploads, copies, and form submissions</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="toggle-dlp" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="footer">
          <span>Sovereign Identity Layer</span>
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
