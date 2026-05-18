import QRCode from 'qrcode';

console.log('[uid.one] Content script loaded on', window.location.hostname);

let isChecking = false;

function init() {
  if (isChecking) return;
  isChecking = true;
  
  if (!chrome.runtime?.id) {
    console.warn('[uid.one] Extension context invalidated. Please refresh the page.');
    return;
  }
  
  injectAll();
  const observer = new MutationObserver(() => {
    if (!chrome.runtime?.id) {
      observer.disconnect();
      return;
    }
    injectAll();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

const injectedInputs = new WeakSet<HTMLInputElement>();

function injectAll() {
  const nativeMeta = document.querySelector('meta[name="uid-passkey-native"]');
  if (nativeMeta && nativeMeta.getAttribute('content') === 'true') {
    return; // Abort injection if native integration is detected
  }

  const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  passwordInputs.forEach((input) => {
    // Skip if input is hidden, disabled, readonly, or part of a new-password/change-password form
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
}

function injectIcon(input: HTMLInputElement) {
  const shadowHost = document.createElement('div');
  shadowHost.className = 'uid-passkey-wrapper';
  shadowHost.style.position = 'absolute';
  shadowHost.style.zIndex = '999999';
  shadowHost.style.cursor = 'pointer';

  document.body.appendChild(shadowHost);

  const computedStyle = window.getComputedStyle(input);
  const originalPaddingRight = parseFloat(computedStyle.paddingRight) || 0;
  
  input.style.paddingRight = `${originalPaddingRight + 28}px`;

  const updatePosition = () => {
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(input)) {
      shadowHost.style.display = 'none';
      return;
    }
    shadowHost.style.display = 'block';
    shadowHost.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;
    
    const offsetFromRight = originalPaddingRight + 28;
    shadowHost.style.left = `${rect.right + window.scrollX - offsetFromRight}px`;
    shadowHost.style.transform = 'translateY(-50%)';
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
  setInterval(updatePosition, 500);

  const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
  
  const icon = document.createElement('div');
  icon.style.width = '24px';
  icon.style.height = '24px';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.cursor = 'pointer';
  icon.style.color = '#0B1220'; 
  icon.style.opacity = '1';
  icon.style.transition = 'color 0.2s ease, transform 0.2s ease, opacity 0.2s ease';
  
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-fingerprint">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3" />
    <path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6" />
    <path d="M12 11v2a14 14 0 0 0 2.5 8" />
    <path d="M8 15a18 18 0 0 0 1.8 6" />
    <path d="M4.9 19a22 22 0 0 1 -.9 -7v-1a8 8 0 0 1 12 -6.95" />
  </svg>`;
  
  icon.title = chrome.runtime?.id ? (chrome.i18n.getMessage("iconTitle") || "Login with Passkey") : "Login with Passkey";
  
  icon.addEventListener('mouseenter', () => {
    icon.style.color = '#1A2233';
    icon.style.transform = "scale(1.05)";
  });
  
  icon.addEventListener('mouseleave', () => {
    icon.style.color = '#0B1220';
    icon.style.transform = "scale(1)";
  });

  const performOOBAuth = async (targetUsername: string, passwordInput: HTMLInputElement) => {
    try {
      if (!chrome.runtime?.id) {
        alert("Extension context invalidated. Please refresh the page.");
        return;
      }
      
      const domain = window.location.hostname;
      const device = navigator.userAgent.includes("Mac") ? "Chrome on macOS" : "Chrome Web";
      
      // Check if paired
      const isPairedRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, resolve);
      });

      if (!isPairedRes?.isPaired) {
        // --- PHASE 1: PAIRING MODE ---
        const reqRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'START_OOB_AUTH', domain, device, identifier: targetUsername }, resolve);
        });

        if (!reqRes?.success) return alert("Failed to initiate Pairing");

        const qrUrl = `https://uid.one/qr?challenge=${reqRes.challenge.token}&client_id=uid_extension_client&client_name=Extension`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 200 });

        const overlay = document.createElement('div');
        overlay.innerHTML = `
          <div style="position: fixed; inset: 0; background: rgba(2, 8, 23, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999999;">
            <div id="uid-qr-container" style="background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: system-ui, sans-serif; color: #0f172a; position: relative; min-width: 280px; min-height: 320px; justify-content: center;">
              <button id="close-qr" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 16px;">✕</button>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Pair Device</h3>
              <div style="padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
              </div>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center; max-width: 220px;">
                Scan this code with the UID.ONE App to pair this browser.
              </p>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#close-qr')?.addEventListener('click', () => overlay.remove());

        const pollInterval = setInterval(async () => {
          const pollRes = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({ type: 'POLL_OOB_STATUS', token: reqRes.challenge.token }, resolve);
          });

          if (pollRes?.success && pollRes.status === 'APPROVED') {
            clearInterval(pollInterval);
            await new Promise((resolve) => chrome.runtime.sendMessage({ type: 'SAVE_PAIRING', token: reqRes.challenge.token }, resolve));
            
            const container = overlay.querySelector('#uid-qr-container') as HTMLElement;
            if (container) {
              container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                  <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; color: #16a34a;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">Paired Successfully!</h3>
                  <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">You can now use push notifications.</p>
                </div>
              `;
              setTimeout(() => { overlay.remove(); performOOBAuth(targetUsername, passwordInput); }, 2000);
            }
          }
        }, 2000);
        return;
      }

      // --- PHASE 2: NUMBER MATCHING MODE ---
      const reqRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'PUSH_REQUEST', domain }, resolve);
      });

      if (!reqRes?.success) {
        alert("Failed to request push: " + (reqRes?.error || "Unknown error"));
        return;
      }

      const matchNumber = reqRes.data.match_number;
      const challengeId = reqRes.data.token;

      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(2, 8, 23, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999999;">
          <div id="uid-match-container" style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: system-ui, sans-serif; color: #0f172a; position: relative; min-width: 300px;">
            <button id="close-match" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 16px;">✕</button>
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; text-align: center;">Check your phone</h3>
            <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">Enter the following number in the UID.ONE app to approve this login.</p>
            <div style="font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #0f172a; padding: 16px 32px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 8px;">
              ${matchNumber}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 16px;">
               <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
               <span style="font-size: 12px; color: #64748b;">Waiting for approval...</span>
            </div>
            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#close-match')?.addEventListener('click', () => overlay.remove());

      // Open WebSocket
      const wsBase = import.meta.env.VITE_WS_BASE || 'wss://api.uid.one';
      const wsUrl = `${wsBase}/ws/challenges/${challengeId}/`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'APPROVED' && data.encrypted_payload) {
            ws.close();
            const decryptRes = await new Promise<any>((resolve) => {
              chrome.runtime.sendMessage({ type: 'DECRYPT_PAYLOAD', token: challengeId, encrypted_payload: data.encrypted_payload }, resolve);
            });

            const container = overlay.querySelector('#uid-match-container') as HTMLElement;
            if (decryptRes?.success && decryptRes.decrypted_password) {
              if (container) {
                container.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; color: #16a34a;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">Approved!</h3>
                    <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">Login successful. Auto-filling...</p>
                  </div>
                `;
              }
              setTimeout(() => {
                passwordInput.value = decryptRes.decrypted_password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                overlay.remove();
                setTimeout(() => {
                  const submitButton = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
                  if (submitButton) submitButton.click();
                }, 500);
              }, 500);
            } else {
              if (container) {
                container.innerHTML = `
                  <button id="close-match-error" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 16px;">✕</button>
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 16px;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; color: #dc2626;">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #dc2626;">Failed</h3>
                    <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center; max-width: 220px;">Could not inject password.</p>
                  </div>
                `;
                container.querySelector('#close-match-error')?.addEventListener('click', () => overlay.remove());
              }
            }
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WS Error", err);
      };

    } catch (error) {
      console.error('[uid.one] Error:', error);
    }
  };

  icon.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const form = input.closest('form');
    let username = '';
    if (form) {
      const usernameInput = form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"], input[name="email"], input[name="username"]');
      if (usernameInput) username = usernameInput.value.trim();
    }
    if (!username) {
      alert(chrome.i18n.getMessage("errorNoUsernameProvided") || "Please enter your email or username first to use your Passkey.");
      return;
    }
    
    await performOOBAuth(username, input);
  });

  shadowRoot.appendChild(icon);
}



if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

