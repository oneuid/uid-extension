import './style.css'

let activeTabId = 'tab-security';
let selectedSrc: string | null = null;
let processedDataURL: string | null = null;

function renderPopup() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
    const isPaired = pairingRes?.isPaired;

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (statsRes) => {
      const stats = statsRes || { cookies_blocked: 0, exif_stripped: 0, otp_cleared: 0, gpc_signals: 0 };

      // Render main container
      const app = document.querySelector<HTMLDivElement>('#app')!;
      app.innerHTML = `
        <div class="header">
          <div class="brand">
            <span class="brand-dot"></span>
            UID Link
          </div>
          <span style="font-size: 10px; font-weight: 500; color: var(--text-muted);">v1.1.0</span>
        </div>

        <div class="tabs-nav" style="display: flex; gap: 8px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px;">
          <button id="btn-tab-security" class="tab-button ${activeTabId === 'tab-security' ? 'active' : ''}" style="flex: 1; padding: 6px; border: none; background: transparent; color: ${activeTabId === 'tab-security' ? 'var(--primary-glow)' : 'var(--text-muted)'}; font-weight: 600; font-size: 12px; cursor: pointer; border-bottom: 2px solid ${activeTabId === 'tab-security' ? 'var(--primary-glow)' : 'transparent'}; outline: none;">Security</button>
          <button id="btn-tab-pixelate" class="tab-button ${activeTabId === 'tab-pixelate' ? 'active' : ''}" style="flex: 1; padding: 6px; border: none; background: transparent; color: ${activeTabId === 'tab-pixelate' ? 'var(--primary-glow)' : 'var(--text-muted)'}; font-weight: 600; font-size: 12px; cursor: pointer; border-bottom: 2px solid ${activeTabId === 'tab-pixelate' ? 'var(--primary-glow)' : 'transparent'}; outline: none;">Face Pixelate</button>
        </div>

        <div class="tab-content" style="flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 380px; scrollbar-width: none;">
          ${activeTabId === 'tab-security' ? renderSecurityTab(isPaired, stats) : renderPixelateTab()}
        </div>

        <div class="footer">
          <span>Sovereign Identity Layer</span>
          <a href="https://uid.one" target="_blank" class="footer-link">uid.one</a>
        </div>
      `;

      // Attach tab event listeners
      document.getElementById('btn-tab-security')?.addEventListener('click', () => {
        activeTabId = 'tab-security';
        renderPopup();
      });
      document.getElementById('btn-tab-pixelate')?.addEventListener('click', () => {
        activeTabId = 'tab-pixelate';
        renderPopup();
        scanPageImages();
      });

      // Attach security toggles if in security tab
      if (activeTabId === 'tab-security') {
        setupSecurityToggleListeners();
      } else {
        setupPixelateListeners();
      }
    });
  });
}

function renderSecurityTab(isPaired: boolean, stats: any): string {
  return `
    <div class="vault-card">
      <div class="vault-status-badge ${isPaired ? 'connected' : 'disconnected'}">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
        ${isPaired ? 'Vault Connected' : 'Disconnected'}
      </div>
      <p style="margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.5;">
        ${isPaired 
          ? 'Zero-Trust security active. Passkeys and credentials synced securely with vault.' 
          : 'Pairing pending. Log in to your <a href="https://uid.one/login" target="_blank" style="color: var(--primary-glow); text-decoration: underline;">uid.one</a> vault to synchronize credentials.'}
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${stats.cookies_blocked}</div>
        <div class="stat-label">Cookies Blocked</div>
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
  `;
}

function renderPixelateTab(): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Style Option</label>
        <select id="style-select" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 4px; font-size: 11px; outline: none; cursor: pointer;">
          <option value="pixel_medium" selected>Pixel Medium (8px) ✓</option>
          <option value="pixel_fine">Pixel Fine (6px)</option>
          <option value="pixel_large">Pixel Large (16px)</option>
          <option value="emoji">😊 Emoji</option>
        </select>
      </div>
      <div id="emoji-select-container" style="display: none; align-items: center; justify-content: space-between; margin-top: 4px;">
        <label style="font-size: 11px; color: var(--text-muted);">Choose Emoji</label>
        <select id="emoji-select" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 4px; font-size: 11px; outline: none; cursor: pointer;">
          <option value="😊">😊 Smile</option>
          <option value="🔒">🔒 Locked</option>
          <option value="👤">👤 Profile</option>
          <option value="😎">😎 Cool</option>
          <option value="🙈">🙈 Hide</option>
        </select>
      </div>
    </div>

    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Select Image on Page</div>
    <div id="image-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-height: 180px; overflow-y: auto; padding: 4px; background: rgba(255,255,255,0.02); border: 1px solid var(--card-border); border-radius: var(--radius-md); scrollbar-width: none;">
      <div style="grid-column: span 3; text-align: center; color: var(--text-muted); font-size: 11px; padding: 20px;">Scanning page for images...</div>
    </div>

    <div id="pixelate-actions" style="display: none; flex-direction: column; gap: 8px; margin-top: 8px;">
      <button id="btn-process" class="btn-premium">✦ Pixelate Face</button>
      <div style="display: flex; gap: 8px;">
        <button id="btn-download" class="btn-premium-outline" style="flex: 1;">↓ Download</button>
        <button id="btn-copy" class="btn-premium-outline" style="flex: 1;">⎘ Copy</button>
      </div>
    </div>

    <div id="pixelate-status" style="font-size: 11px; text-align: center; color: var(--primary-glow); font-weight: 500; min-height: 14px; margin-top: 4px;"></div>
  `;
}

function setupSecurityToggleListeners() {
  const toggleDlp = document.getElementById('toggle-dlp') as HTMLInputElement;
  if (!toggleDlp) return;

  chrome.storage.local.get('settings_otp_shield').then(res => {
    toggleDlp.checked = res.settings_otp_shield !== false;
  });

  toggleDlp.addEventListener('change', () => {
    chrome.storage.local.set({ 'settings_otp_shield': toggleDlp.checked });
  });
}

async function scanPageImages() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { action: 'GET_IMAGES' }, (res) => {
      const imgList = document.getElementById('image-list');
      if (!imgList) return;

      if (chrome.runtime.lastError || !res || !res.images || res.images.length === 0) {
        imgList.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); font-size: 11px; padding: 20px;">No images found on page</div>`;
        return;
      }

      imgList.innerHTML = res.images.map((img: any) => `
        <div class="image-item" data-src="${img.src}" style="position: relative; aspect-ratio: 1; border: 1px solid var(--card-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; background: rgba(0,0,0,0.2); transition: all 0.2s;">
          <img src="${img.src}" style="width: 100%; height: 100%; object-fit: cover;" />
          <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; font-size: 8px; padding: 1px 3px; border-radius: 3px;">${img.width}x${img.height}</span>
        </div>
      `).join('');

      // Add selection style
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .image-item.selected {
          border-color: var(--primary-glow) !important;
          box-shadow: 0 0 8px var(--primary-glow);
          transform: scale(0.96);
        }
      `;
      document.head.appendChild(styleEl);

      const items = imgList.querySelectorAll('.image-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          selectedSrc = (item as HTMLElement).dataset.src || null;
          processedDataURL = null;

          const actions = document.getElementById('pixelate-actions');
          if (actions) actions.style.display = 'flex';
          setPixelateStatus('');
        });
      });
    });
  } catch (err) {
    console.error('[uid.one] Failed to scan tab images:', err);
  }
}

function setupPixelateListeners() {
  const styleSelect = document.getElementById('style-select') as HTMLSelectElement;
  const emojiContainer = document.getElementById('emoji-select-container') as HTMLDivElement;
  const btnProcess = document.getElementById('btn-process');
  const btnDownload = document.getElementById('btn-download');
  const btnCopy = document.getElementById('btn-copy');

  if (styleSelect && emojiContainer) {
    styleSelect.addEventListener('change', () => {
      emojiContainer.style.display = styleSelect.value === 'emoji' ? 'flex' : 'none';
    });
  }

  btnProcess?.addEventListener('click', async () => {
    if (!selectedSrc) return;

    setPixelateStatus('Processing face detection...');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const style = styleSelect.value;
      const emoji = (document.getElementById('emoji-select') as HTMLSelectElement)?.value || '😊';

      chrome.tabs.sendMessage(tab.id, {
        action: 'PROCESS_IMAGE',
        src: selectedSrc,
        style,
        emoji
      }, (res) => {
        if (chrome.runtime.lastError || !res) {
          setPixelateStatus('Error communicating with tab');
          return;
        }

        if (res.success) {
          processedDataURL = res.dataURL;
          setPixelateStatus('✓ Face pixelation successful!');
          // Refresh list to show blurred image
          scanPageImages();
        } else {
          setPixelateStatus(`⚠ ${res.error || 'Failed'}`);
        }
      });
    } catch (err: any) {
      setPixelateStatus(`Error: ${err.message}`);
    }
  });

  btnDownload?.addEventListener('click', async () => {
    if (!processedDataURL) {
      setPixelateStatus('Please pixelate image first');
      return;
    }
    chrome.downloads.download({
      url: processedDataURL,
      filename: `pixelated_${Date.now()}.jpg`,
      saveAs: false
    });
    setPixelateStatus('✓ Download complete');
  });

  btnCopy?.addEventListener('click', async () => {
    if (!processedDataURL) {
      setPixelateStatus('Please pixelate image first');
      return;
    }
    try {
      const blob = await fetch(processedDataURL).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })]);
      setPixelateStatus('✓ Copied to clipboard');
    } catch (err) {
      setPixelateStatus('Clipboard write permission denied');
    }
  });
}

function setPixelateStatus(msg: string) {
  const el = document.getElementById('pixelate-status');
  if (el) el.textContent = msg;
}

renderPopup();
