import './style.css'

function updateUI() {
  if (!chrome.runtime?.id) return;

  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (res) => {
    const isPaired = res?.isPaired;
    
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="auth-success" style="text-align: center; font-family: system-ui, -apple-system, sans-serif;">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; display: inline-block;">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <h2 style="margin: 0 0 4px 0; color: var(--foreground); font-size: 16px; font-weight: 600;">UID Link</h2>
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 9999px; background: ${isPaired ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${isPaired ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 500; margin-bottom: 16px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
          ${isPaired ? 'Connected to Web Vault' : 'Waiting for Login'}
        </div>
        <p style="margin: 0; color: var(--muted-foreground); font-size: 13px; line-height: 1.5; text-align: left;">
          ${isPaired 
            ? 'Click the fingerprint icon on any password input to autofill credentials or authorize logins directly from this browser.' 
            : 'Log in to your <strong><a href="https://uid.one/login" target="_blank" style="color: #0ea5e9; text-decoration: underline; font-weight: 500;">uid.one</a></strong> web account. The extension will synchronize and pair automatically.'}
        </p>
      </div>
    `;
  });
}

updateUI();
