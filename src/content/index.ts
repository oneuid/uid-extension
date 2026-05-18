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
        chrome.runtime.sendMessage({ 
          type: 'START_OOB_AUTH', 
          domain,
          device,
          identifier: targetUsername 
        }, resolve);
      });

      if (!reqRes?.success) {
        if (reqRes?.error && (reqRes.error.includes('NOT_LOGGED_IN') || reqRes.error.includes('SESSION_EXPIRED'))) {
          alert("Phiên đăng nhập UID.ONE đã hết hạn. Vui lòng mở tiện ích ở góc phải trình duyệt và đăng nhập lại!");
        } else {
          alert("Failed to initiate OOB login: " + (reqRes?.error || "Unknown error"));
        }
        return;
      }

      const token = reqRes.challenge.token;
      
      // 2. Show Overlay
      showOverlay("Waiting for Mobile Approval...", "Please open the UID.ONE app on your phone and scan your face/fingerprint to approve this login.");

      // 3. Poll for Status
      const pollInterval = setInterval(async () => {
        const pollRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'POLL_OOB_STATUS', token }, resolve);
        });

        if (pollRes?.success) {
          if (pollRes.status === 'APPROVED') {
            clearInterval(pollInterval);
            removeOverlay();
            
            if (pollRes.data.decrypted_password) {
              console.log('[uid.one] E2EE Payload received. Injecting password...');
              passwordInput.value = pollRes.data.decrypted_password;
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
              
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
            removeOverlay();
            alert("Login request expired.");
          }
        }
      }, 2000);

    } catch (error) {
      console.error('[uid.one] Error:', error);
      removeOverlay();
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

// UI Overlay Helpers
let overlayHost: HTMLDivElement | null = null;

function showOverlay(title: string, message: string) {
  if (!overlayHost) {
    overlayHost = document.createElement('div');
    overlayHost.style.position = 'fixed';
    overlayHost.style.top = '0';
    overlayHost.style.left = '0';
    overlayHost.style.width = '100vw';
    overlayHost.style.height = '100vh';
    overlayHost.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlayHost.style.backdropFilter = 'blur(4px)';
    overlayHost.style.zIndex = '9999999';
    overlayHost.style.display = 'flex';
    overlayHost.style.alignItems = 'center';
    overlayHost.style.justifyContent = 'center';
    document.body.appendChild(overlayHost);
    
    const shadow = overlayHost.attachShadow({ mode: 'closed' });
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'white';
    modal.style.padding = '32px';
    modal.style.borderRadius = '16px';
    modal.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    modal.style.maxWidth = '400px';
    modal.style.textAlign = 'center';
    modal.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    modal.innerHTML = `
      <div style="margin-bottom: 24px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 600;">${title}</h2>
      <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.5;">${message}</p>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(0.95); }
        }
      </style>
    `;
    shadow.appendChild(modal);
  }
}

function removeOverlay() {
  if (overlayHost) {
    overlayHost.remove();
    overlayHost = null;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

