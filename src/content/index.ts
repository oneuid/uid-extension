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
      
      // 1. Request Challenge
      const reqRes = await new Promise<any>((resolve) => {
        try {
          chrome.runtime.sendMessage({ 
            type: 'START_OOB_AUTH', 
            domain,
            device,
            identifier: targetUsername 
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("[uid.one] Runtime error:", chrome.runtime.lastError);
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response);
            }
          });
        } catch (e: any) {
          resolve({ success: false, error: e.toString() });
        }
      });

      console.log("[uid.one] START_OOB_AUTH response:", reqRes);

      if (!reqRes?.success) {
        alert("Failed to initiate OOB login: " + (reqRes?.error || "Unknown error"));
        return;
      }
      
      if (!reqRes?.challenge?.token) {
        alert("Failed to initiate OOB login: Invalid response from extension background (missing token). Please refresh and try again.");
        return;
      }

      // Display QR Code Overlay
      const qrUrl = `https://uid.one/qr?challenge=${reqRes.challenge.token}&client_name=Extension`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 2, width: 200 });

      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(2, 8, 23, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999999;">
          <div style="background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: system-ui, sans-serif; color: #0f172a; position: relative;">
            <button id="close-qr" style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; cursor: pointer; color: #64748b; font-size: 16px;">✕</button>
            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Scan to Unlock</h3>
            <div style="padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <img src="${qrDataUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
            </div>
            <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center; max-width: 220px;">
              Open the UID.ONE mobile app and scan this code to securely inject your password.
            </p>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#close-qr')?.addEventListener('click', () => {
        overlay.remove();
      });

      const token = reqRes.challenge.token;
      
      // 3. Poll for Status
      const pollInterval = setInterval(async () => {
        const pollRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'POLL_OOB_STATUS', token }, resolve);
        });

        if (pollRes?.success) {
          if (pollRes.status === 'APPROVED') {
            clearInterval(pollInterval);
            overlay.remove();
            
            if (pollRes.data.decrypted_password) {
              console.log('[uid.one] E2EE Payload received. Injecting password...');
              passwordInput.value = pollRes.data.decrypted_password;
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
              
              // Optional: auto-submit the form
              const form = passwordInput.closest('form');
              if (form) {
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
                if (submitBtn) submitBtn.click();
                else form.submit();
              }
            } else {
              console.log('[uid.one] OOB Login Approved. Tokens received:', pollRes.data);
              alert("Login Approved! (SSO Token Received)");
            }
            
          } else if (pollRes.status === 'EXPIRED') {
            clearInterval(pollInterval);
            overlay.remove();
            alert("This Passkey request has expired. Please try again.");
          }
        } else {
          clearInterval(pollInterval);
          overlay.remove();
          alert("Failed to poll status: " + (pollRes?.error || "Unknown error"));
        }
      }, 2000);

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

