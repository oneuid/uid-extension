import { isWebmailSite, isContextValid } from './utils';
import { findComposerSenderEmail, detectWebmailUserEmail, normalizeEmail } from './adapters/webmail';
import { FileUploadInterceptor, ClipboardInterceptor, FormInterceptor, TextDLPShield } from './interceptors/dlp';
import { ScreenshotProtector, OriginVerifier, ViewportCleaner, CookieGuard, NotificationBlocker, GPCEnforcer } from './interceptors/security';
import { captureSessionToken, injectAll } from './autofill';
import { EmailSignatureGuard, EmailSendInterceptor, ComposerFloatingSignButton } from './signature';

console.log('[uid.one] Content script loaded on', window.location.hostname);

export let lastRightClickedElement: HTMLElement | null = null;

export function setLastRightClickedElement(el: HTMLElement | null) {
  lastRightClickedElement = el;
}

document.addEventListener('contextmenu', (e) => {
  if (!isContextValid()) return;
  lastRightClickedElement = e.target as HTMLElement;
  
  const isEditable = lastRightClickedElement.closest('[contenteditable="true"]') || 
                     lastRightClickedElement.tagName === 'INPUT' || 
                     lastRightClickedElement.tagName === 'TEXTAREA';
                     
  if (isEditable) {
    let senderEmail = findComposerSenderEmail(lastRightClickedElement);
    if (!senderEmail) {
      senderEmail = detectWebmailUserEmail();
    }
    
    if (senderEmail) {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (profileRes) => {
        if (profileRes && profileRes.success && profileRes.email) {
          const linkedEmail = normalizeEmail(profileRes.email);
          const senderEmailNormalized = normalizeEmail(senderEmail);
          if (linkedEmail !== senderEmailNormalized) {
            chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: false });
            return;
          }
        }
        chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: true });
      });
    } else {
      const isWebmail = isWebmailSite();
      if (isWebmail) {
        chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: false });
      } else {
        chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: true });
      }
    }
  } else {
    chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: true });
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'START_PDF_SIGNING') {
    handlePdfSigning(request.url).catch(console.error);
  } else if (request.action === 'START_TEXT_SIGNING') {
    handleTextSigning(request.text).catch(console.error);
  } else if (request.action === 'FETCH_PDF_BYTES') {
    fetch(request.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        const blob = new Blob([buffer]);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          sendResponse({ success: true, base64 });
        };
        reader.onerror = () => {
          sendResponse({ success: false, error: 'Failed to read array buffer' });
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // keep channel open for async response
  }
});

function showToast(msg: string, type: string) {
  console.log(`[uid.one - ${type}] ${msg}`);
}

function showOtpPromptModal(callback: (otp: string) => void, cancelCallback: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'uid-otp-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999999;
    font-family: system-ui, -apple-system, sans-serif;
    color: #e4e4e7;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(10, 10, 10, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    width: 90%;
    max-width: 400px;
    padding: 32px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    text-align: center;
  `;

  modal.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="display: inline-flex; width: 56px; height: 56px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; align-items: center; justify-content: center; margin-bottom: 12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 6px 0;">${chrome.i18n.getMessage("otpPromptTitle") || "Google Authenticator"}</h3>
      <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">${chrome.i18n.getMessage("otpPromptDesc") || "Please enter the 6-digit OTP code to verify your digital signature:"}</p>
    </div>

    <div style="margin-bottom: 24px;">
      <input type="text" id="uid-otp-input" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="000000" style="
        width: 80%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        font-size: 28px;
        letter-spacing: 6px;
        text-align: center;
        color: #fff;
        font-family: monospace;
        outline: none;
        box-sizing: border-box;
      ">
    </div>

    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="uid-otp-cancel" style="
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #a1a1aa;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      ">${chrome.i18n.getMessage("otpCancel") || "Cancel"}</button>
      <button id="uid-otp-confirm" style="
        flex: 1;
        background: #10b981;
        border: none;
        color: #fff;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      ">${chrome.i18n.getMessage("otpConfirm") || "Sign"}</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const otpInput = overlay.querySelector('#uid-otp-input') as HTMLInputElement;
  if (otpInput) {
    otpInput.focus();
    
    otpInput.addEventListener('focus', () => {
      otpInput.style.borderColor = 'rgba(16, 185, 129, 0.5)';
    });
    otpInput.addEventListener('blur', () => {
      otpInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/[^0-9]/g, '');
    });

    otpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirm();
      }
    });
  }

  const confirm = () => {
    const val = otpInput?.value || '';
    if (val.length !== 6) {
      alert(chrome.i18n.getMessage("otpErrorLength") || 'The OTP code must be exactly 6 digits.');
      return;
    }
    overlay.remove();
    callback(val);
  };

  overlay.querySelector('#uid-otp-cancel')?.addEventListener('click', () => {
    overlay.remove();
    cancelCallback();
  });

  overlay.querySelector('#uid-otp-confirm')?.addEventListener('click', confirm);
}

export async function handleTextSigning(text: string) {
  let targetEl = lastRightClickedElement;
  if (!targetEl) {
    showToast("No target element to sign", "error");
    return;
  }

  const editableParent = targetEl.closest('[contenteditable="true"]') as HTMLElement | null;
  if (editableParent) {
    targetEl = editableParent;
  }

  let textToSign = text;
  if (!textToSign) {
    textToSign = targetEl.innerText || (targetEl as HTMLInputElement).value || '';
  }

  if (textToSign.replace(/\s/g, '').length === 0) {
    alert(chrome.i18n.getMessage("alertEnterContent") || "Please enter content before signing.");
    return;
  }

  chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (profileRes) => {
    if (!profileRes || !profileRes.success) {
      const errorMsg = profileRes?.error || '';
      if (errorMsg.includes('403') || errorMsg.includes('401') || errorMsg.includes('paired') || errorMsg.includes('Not paired') || errorMsg.includes('expired')) {
        alert(chrome.i18n.getMessage("alertSessionExpired") || "Session expired or not linked. Please log in to UID.one and click 'Link Extension' to continue.");
      } else {
        const fallbackError = errorMsg || "Failed to retrieve account details.";
        alert(chrome.i18n.getMessage("errorVerification", [fallbackError]) || `Verification error: ${fallbackError}`);
      }
      return;
    }
    const userEmail = profileRes.email;

    showOtpPromptModal((otpCode) => {
      showToast("Signing selected text...", "info");
      const encoder = new TextEncoder();
      const data = encoder.encode(textToSign);
      crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const heartbeatInterval = setInterval(() => {
          chrome.runtime.sendMessage({ type: 'HEARTBEAT' }, () => {
            if (chrome.runtime.lastError) {
              console.warn('[uid.one] Heartbeat error:', chrome.runtime.lastError.message);
            }
          });
        }, 10000);

        chrome.runtime.sendMessage({
          action: 'REQUEST_DIGITAL_SIGNATURE',
          domain: window.location.hostname,
          user_agent: navigator.userAgent,
          identifier: "Text Signature",
          otp_code: otpCode,
          metadata: {
            text_hash: hashHex,
            text_snippet: textToSign.slice(0, 100)
          }
        }, (res) => {
          clearInterval(heartbeatInterval);
          if (res && res.success) {
            insertSignatureIntoElement(targetEl!, res.signature, userEmail, hashHex, res.signer);
            showToast("Signature applied successfully!", "success");
          } else {
            const errorMsg = res?.error || chrome.i18n.getMessage("alertRejected") || "Signing request was rejected or expired.";
            alert(errorMsg);
          }
        });
      });
    }, () => {
      showToast("Signing cancelled by user.", "info");
    });
  });
}

async function handlePdfSigning(pdfUrl: string) {
  chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, async (profileRes) => {
    if (!profileRes || !profileRes.success) {
      const errorMsg = profileRes?.error || '';
      if (errorMsg.includes('403') || errorMsg.includes('401') || errorMsg.includes('paired') || errorMsg.includes('Not paired') || errorMsg.includes('expired')) {
        alert(chrome.i18n.getMessage("alertSessionExpired") || "Session expired or not linked. Please log in to UID.one and click 'Link Extension' to continue.");
      } else {
        const fallbackError = errorMsg || "Failed to retrieve account details.";
        alert(chrome.i18n.getMessage("errorVerification", [fallbackError]) || `Verification error: ${fallbackError}`);
      }
      return;
    }

    showToast("Fetching and hashing PDF...", "info");

    const proceedWithHash = (hashHex: string) => {
      const heartbeatInterval = setInterval(() => {
        chrome.runtime.sendMessage({ type: 'HEARTBEAT' }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[uid.one] Heartbeat error:', chrome.runtime.lastError.message);
          }
        });
      }, 10000);

      showOtpPromptModal((otpCode) => {
        chrome.runtime.sendMessage({
          action: 'REQUEST_DIGITAL_SIGNATURE',
          domain: window.location.hostname,
          user_agent: navigator.userAgent,
          identifier: "Digital Signature",
          otp_code: otpCode,
          metadata: {
            pdf_hash: hashHex,
            text_hash: hashHex, // fallback for legacy backend compatibility
            document_url: pdfUrl
          }
        }, (res) => {
          clearInterval(heartbeatInterval);
          if (res && res.success) {
            showToast("PDF signed successfully!", "success");
            alert(chrome.i18n.getMessage("pdfSignedSuccess") || "PDF digitally signed successfully!");
          } else {
            showToast("PDF signing failed or was rejected: " + (res?.error || "Unknown error"), "error");
            alert(res?.error || "Unknown error");
          }
        });
      }, () => {
        clearInterval(heartbeatInterval);
        showToast("PDF signing cancelled by user", "info");
      });
    };

    // Try to fetch and hash locally within the content script to bypass extension CORS
    fetch(pdfUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.arrayBuffer();
      })
      .then(arrayBuffer => crypto.subtle.digest('SHA-256', arrayBuffer))
      .then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        proceedWithHash(hashHex);
      })
      .catch(err => {
        console.warn('[uid.one] Local PDF fetch failed, falling back to background helper:', err.message);
        chrome.runtime.sendMessage({ type: 'FETCH_AND_HASH_PDF', url: pdfUrl }, (hashRes) => {
          if (!hashRes || !hashRes.success) {
            showToast("Failed to process PDF: " + (hashRes?.error || "CORS or download error"), "error");
            alert(chrome.i18n.getMessage("errorFetchPdf") || "Failed to fetch or hash PDF. Please make sure the link is accessible.");
            return;
          }
          proceedWithHash(hashRes.hashHex);
        });
      });
  });
}

function injectComposeHeaderBadge(targetEl: HTMLElement) {
  let composeWindow = targetEl.closest('div[role="dialog"], .M9, .AD, .zmCompose, .compose-box');
  
  if (!composeWindow && window.parent && window.parent !== window) {
    try {
      const iframes = window.parent.document.querySelectorAll('iframe');
      for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow === window) {
          composeWindow = iframes[i].closest('div[role="dialog"], .M9, .AD, .zmCompose, .compose-box');
          break;
        }
      }
    } catch (e) {}
  }

  if (!composeWindow) {
    const doc = targetEl.ownerDocument;
    composeWindow = doc.querySelector('.zmCompose, .compose-box, [role="dialog"]') as HTMLElement;
    if (!composeWindow && window.parent && window.parent !== window) {
      try {
        composeWindow = window.parent.document.querySelector('.zmCompose, .compose-box, [role="dialog"]') as HTMLElement;
      } catch (e) {}
    }
  }

  if (!composeWindow) return;

  const header = composeWindow.querySelector('.aYy, .hz, [role="heading"], .co, .zmCompose-header, .compose-header');
  if (!header) return;

  const doc = header.ownerDocument;
  if (header.querySelector('.uid-compose-signed-badge')) return;

  const badge = doc.createElement('span');
  badge.className = 'uid-compose-signed-badge';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #047857;
    padding: 2px 8px;
    border-radius: 6px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 600;
    margin-left: 12px;
    vertical-align: middle;
    user-select: none;
  `;
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 2px;">
      <path d="M20 6L9 17l-5-5"></path>
    </svg>
    <span>Signed by UID.one</span>
  `;
  
  header.appendChild(badge);
}

function insertSignatureIntoElement(
  targetEl: HTMLElement,
  signature: string,
  userEmail: string,
  hashHex: string,
  signerDid?: string
) {
  const now = new Date();
  const locale = chrome.i18n.getUILanguage() || 'en-US';
  const formattedTime = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) + ' — ' + now.toLocaleDateString(locale);
  
  const finalSigner = signerDid || `did:uid:${userEmail}`;

  const payload = {
    sig: signature,
    signer: finalSigner,
    hash: hashHex
  };
  const payloadStr = JSON.stringify(payload);
  const base64Str = btoa(payloadStr);
  const encodedData = base64Str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const verifyUrl = `https://uid.one/verify/#data=${encodedData}`;

  const isContentEditable = targetEl.isContentEditable || targetEl.getAttribute('contenteditable') === 'true';

  if (isContentEditable) {
    const loadingSig = targetEl.querySelector('.uid-email-signature-loading-block');
    if (loadingSig) {
      loadingSig.remove();
    }
    const existingSigBlock = targetEl.querySelector('.uid-email-signature-block');
    if (existingSigBlock) {
      existingSigBlock.remove();
    }
    const existingSig = targetEl.querySelector('#uid-one-signature');
    if (existingSig) {
      existingSig.remove();
    }

    const doc = targetEl.ownerDocument;
    const hiddenEl = doc.createElement('div');
    hiddenEl.id = 'uid-one-signature';
    hiddenEl.setAttribute('data-signer', finalSigner);
    hiddenEl.setAttribute('data-sig', signature);
    hiddenEl.style.display = 'none';

    const sigBlock = doc.createElement('div');
    sigBlock.className = 'uid-email-signature-block';
    sigBlock.setAttribute('contenteditable', 'false');
    sigBlock.style.cssText = `
      position: relative;
      border-top: 1px solid #e2e8f0;
      margin-top: 24px;
      padding-top: 12px;
      padding-bottom: 12px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      color: #475569;
      max-width: 500px;
      display: block;
      user-select: none;
      text-align: left;
      overflow: hidden;
    `;
    
    sigBlock.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #059669; margin-bottom: 2px; position: relative; z-index: 1;">
        <span style="font-size: 14px; margin-right: 4px; display: inline-block; vertical-align: middle;">🔐</span>
        <a href="${verifyUrl}" class="uid-signature-link-text" style="color: #059669; text-decoration: none; font-weight: 600; font-family: system-ui, -apple-system, sans-serif; display: inline-block; vertical-align: middle;">
          ${chrome.i18n.getMessage("signatureTitle") || "This email is digitally signed by UID.one"}
        </a>
      </div>
      <div style="font-size: 11px; color: #64748b; line-height: 1.5; position: relative; z-index: 1; padding-left: 0;">
        ${chrome.i18n.getMessage("signatureSigner") || "Signer"}: <span style="font-family: monospace; color: #0f172a; font-weight: 500;">${finalSigner}</span><br>
        ${chrome.i18n.getMessage("signatureTime") || "Signing Time"}: ${formattedTime}
        <a href="${verifyUrl}" class="uid-verify-link" style="display:none !important; width:0; height:0; opacity:0; visibility:hidden;" aria-hidden="true"></a>
      </div>
    `;

    if (targetEl.firstChild) {
      targetEl.insertBefore(hiddenEl, targetEl.firstChild);
    } else {
      targetEl.appendChild(hiddenEl);
    }
    targetEl.appendChild(sigBlock);

    injectComposeHeaderBadge(targetEl);
  } else if (targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement) {
    const plainTextSig = `\n\n[🔐 ${chrome.i18n.getMessage("signatureTitle") || "Digitally signed by UID.one"}]\n${chrome.i18n.getMessage("signatureSigner") || "Signer"}: ${userEmail}\n${chrome.i18n.getMessage("signatureTime") || "Time"}: ${formattedTime}`;
    targetEl.value += plainTextSig;
  }

  targetEl.dispatchEvent(new Event('input', { bubbles: true }));
  targetEl.dispatchEvent(new Event('change', { bubbles: true }));
}

let isChecking = false;

function init() {
  if (isChecking) return;
  isChecking = true;
  
  if (!chrome.runtime?.id) {
    console.warn('[uid.one] Extension context invalidated. Please refresh the page.');
    return;
  }

  console.log('[uid.one] Content script initialized on:', window.location.href);

  const meta = document.createElement('meta');
  meta.name = 'uid-extension-client-active';
  meta.content = 'true';
  const targetHead = document.head || document.documentElement;
  if (targetHead) {
    targetHead.appendChild(meta);
  }
  
  try {
    injectAll();
  } catch (err) {
    console.error('[uid.one] injectAll failed:', err);
  }

  const interceptors = [
    { name: 'FileUploadInterceptor', run: () => new FileUploadInterceptor().init() },
    { name: 'ClipboardInterceptor', run: () => new ClipboardInterceptor().init() },
    { name: 'FormInterceptor', run: () => new FormInterceptor().init() },
    { name: 'OriginVerifier', run: () => new OriginVerifier().init() },
    { name: 'ScreenshotProtector', run: () => new ScreenshotProtector().init() },
    { name: 'ViewportCleaner', run: () => new ViewportCleaner().init() },
    { name: 'NotificationBlocker', run: () => new NotificationBlocker().init() },
    { name: 'CookieGuard', run: () => new CookieGuard().init() },
    { name: 'GPCEnforcer', run: () => new GPCEnforcer().init() },
    { name: 'TextDLPShield', run: () => new TextDLPShield().init() },
    { name: 'EmailSignatureGuard', run: () => new EmailSignatureGuard().init() },
    { name: 'EmailSendInterceptor', run: () => new EmailSendInterceptor().init() },
    { name: 'ComposerFloatingSignButton', run: () => new ComposerFloatingSignButton().init() },
    { name: 'captureSessionToken', run: () => captureSessionToken() }
  ];

  for (const interceptor of interceptors) {
    try {
      interceptor.run();
      console.log(`[uid.one] Subsystem ${interceptor.name} loaded successfully.`);
    } catch (err) {
      console.error(`[uid.one] Failed to initialize ${interceptor.name}:`, err);
    }
  }

  const observer = new MutationObserver(() => {
    if (!isContextValid()) {
      observer.disconnect();
      return;
    }
    injectAll();
    captureSessionToken();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
