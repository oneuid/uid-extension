console.log('[uid.one] Content script loaded on', window.location.hostname);

let hasCredentialsForDomain = false;
let isChecking = false;

function init() {
  if (isChecking) return;
  isChecking = true;
  
  // Defensive check for Extension Context Invalidation (happens during reload in dev)
  if (!chrome.runtime?.id) {
    console.warn('[uid.one] Extension context invalidated. Please refresh the page.');
    return;
  }
  
  chrome.runtime.sendMessage({ type: 'CHECK_CREDENTIALS', domain: window.location.hostname }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[uid.one] Error checking credentials:', chrome.runtime.lastError);
      return;
    }
    
    if (response?.hasCredentials) {
      console.log('[uid.one] Credentials found for domain');
      hasCredentialsForDomain = true;
    } else {
      console.log('[uid.one] No credentials found for domain, hiding icon');
      hasCredentialsForDomain = false;
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
  });
}

const injectedInputs = new WeakSet<HTMLInputElement>();

function injectAll() {
  const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  passwordInputs.forEach((input) => {
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

  // Measure initial padding to detect native icons (like an eye icon)
  const computedStyle = window.getComputedStyle(input);
  const originalPaddingRight = parseFloat(computedStyle.paddingRight) || 0;
  
  // Force input to have extra padding so text never overlaps our icon
  // 24px icon + 4px extra gap = 28px extra space needed
  input.style.paddingRight = `${originalPaddingRight + 28}px`;

  const updatePosition = () => {
    const rect = input.getBoundingClientRect();
    // Hide icon if input is hidden or removed
    if (rect.width === 0 || rect.height === 0 || !document.body.contains(input)) {
      shadowHost.style.display = 'none';
      return;
    }
    shadowHost.style.display = 'block';
    shadowHost.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;
    
    // Position our icon right before the original padding area
    const offsetFromRight = originalPaddingRight + 28;
    shadowHost.style.left = `${rect.right + window.scrollX - offsetFromRight}px`;
    shadowHost.style.transform = 'translateY(-50%)';
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
  // Interval to follow input if React layout changes dynamically (animation, expander)
  setInterval(updatePosition, 500);

  const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
  
  const icon = document.createElement('div');
  icon.style.width = '24px';
  icon.style.height = '24px';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.cursor = 'pointer';
  icon.style.color = hasCredentialsForDomain ? '#0B1220' : '#94a3b8'; // #0B1220 (dark-1) if active, Slate-400 if setup
  icon.style.opacity = hasCredentialsForDomain ? '1' : '0.5';
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
    icon.style.color = hasCredentialsForDomain ? '#1A2233' : '#64748b'; // #1A2233 (dark-2)
    icon.style.opacity = '1';
    icon.style.transform = "scale(1.05)";
  });
  
  icon.addEventListener('mouseleave', () => {
    icon.style.color = hasCredentialsForDomain ? '#0B1220' : '#94a3b8';
    icon.style.opacity = hasCredentialsForDomain ? '1' : '0.5';
    icon.style.transform = "scale(1)";
  });

  // Create picker element
  const picker = document.createElement('div');
  picker.className = 'uid-picker';
  picker.style.display = 'none';
  picker.style.position = 'absolute';
  picker.style.top = '100%';
  picker.style.right = '0';
  picker.style.marginTop = '8px';
  picker.style.background = '#ffffff';
  picker.style.border = '1px solid #e2e8f0';
  picker.style.borderRadius = '8px';
  picker.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
  picker.style.padding = '4px';
  picker.style.zIndex = '9999999';
  picker.style.minWidth = '180px';
  
  const performDecryption = async (targetUsername: string) => {
    try {
      if (!chrome.runtime?.id) {
        alert("Extension context invalidated. Please refresh the page.");
        return;
      }
      const options = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'GET_AUTH_OPTIONS', 
          domain: window.location.hostname,
          username: targetUsername 
        }, resolve);
      });

      if (options?.needsSelection) {
        // Render picker
        picker.innerHTML = '';
        picker.style.display = 'block';
        
        const header = document.createElement('div');
        header.textContent = chrome.i18n.getMessage("pickerHeader") || 'Select Account';
        header.style.fontSize = '12px';
        header.style.color = '#64748b';
        header.style.padding = '4px 12px';
        header.style.marginBottom = '4px';
        header.style.borderBottom = '1px solid #f1f5f9';
        picker.appendChild(header);

        options.accounts.forEach((acc: string) => {
          const item = document.createElement('div');
          item.textContent = acc;
          item.style.padding = '8px 12px';
          item.style.cursor = 'pointer';
          item.style.fontSize = '14px';
          item.style.color = '#334155';
          item.style.borderRadius = '4px';
          item.style.fontWeight = '500';
          item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
          item.addEventListener('mouseleave', () => item.style.background = 'transparent');
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            picker.style.display = 'none';
            // Autofill username input visually
            const form = input.closest('form');
            if (form) {
              const usernameInput = form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"], input[name="email"], input[name="username"]');
              if (usernameInput) setNativeValue(usernameInput, acc);
            }
            performDecryption(acc); // Recursive call with explicit username
          });
          picker.appendChild(item);
        });

        const closePicker = () => {
          picker.style.display = 'none';
          document.removeEventListener('click', closePicker);
        };
        setTimeout(() => document.addEventListener('click', closePicker), 0);
        return;
      }

      if (options?.error) {
        alert(chrome.i18n.getMessage("errorVaultNotFound") || "Vault not found.");
        return;
      }

      if (!options || !options.challenge) throw new Error('No auth options available');

      console.log('[uid.one] Calling WebAuthn PRF...');
      const prfOutput = new Uint8Array(32); 
      window.crypto.getRandomValues(prfOutput);
      
      chrome.runtime.sendMessage({ 
        type: 'DECRYPT_VAULT', 
        domain: window.location.hostname,
        username: targetUsername,
        prfKey: Array.from(prfOutput)
      }, (response) => {
        if (response?.success) {
          fillForm(input, response.credentials);
        } else {
          alert(chrome.i18n.getMessage("errorDecryptionFailed") || "Decryption failed");
        }
      });
      
    } catch (error) {
      console.error('[uid.one] Error:', error);
    }
  };

  icon.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasCredentialsForDomain) {
      alert(chrome.i18n.getMessage("setupGuidance") || "First time setup: Please login normally to create a Passkey Vault.");
      return;
    }
    
    // Find username input value
    const form = input.closest('form');
    let username = '';
    if (form) {
      const usernameInput = form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"], input[name="email"], input[name="username"]');
      if (usernameInput) username = usernameInput.value.trim();
    }
    
    await performDecryption(username);
  });

  shadowRoot.appendChild(icon);
  shadowRoot.appendChild(picker);
}

function setNativeValue(element: HTMLInputElement, value: string) {
  // 1. Gán giá trị trực tiếp (cách cổ điển)
  element.value = value;
  
  // 2. Vượt rào React 16+ Tracker
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  }
  
  // 3. Kích hoạt sự kiện để React nhận diện sự thay đổi
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillForm(passwordInput: HTMLInputElement, credentials: any) {
  const form = passwordInput.closest('form');
  if (form && credentials.username) {
    const usernameInput = form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"], input[name="email"], input[name="username"]');
    if (usernameInput) {
      setNativeValue(usernameInput, credentials.username);
    }
  }

  if (credentials.password) {
    setNativeValue(passwordInput, credentials.password);
  }
  
  // Clear plaintext
  credentials.username = null;
  credentials.password = null;

  // Wait 150ms for React to process state updates before submitting
  setTimeout(() => {
    if (form) {
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      } else {
        // Dispatch submit event directly if button is not found or disabled
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }, 150);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Lắng nghe thao tác đăng nhập thông thường để tự động lưu Mật khẩu vào Két sắt (Mã hoá bằng PRF)
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (!form) return;
  
  const passwordInput = form.querySelector<HTMLInputElement>('input[type="password"]');
  const usernameInput = form.querySelector<HTMLInputElement>('input[type="text"], input[type="email"], input[name="email"], input[name="username"]');
  
  if (passwordInput && usernameInput && passwordInput.value && usernameInput.value) {
    chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIALS',
      domain: window.location.hostname,
      username: usernameInput.value,
      password: passwordInput.value
    });
    console.log('[uid.one] Captured credentials for vault registration.');
  }
}, true); // Dùng Capture phase để bắt event trước khi React huỷ nó (preventDefault)
