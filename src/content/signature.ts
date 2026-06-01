import { isContextValid, isWebmailSite, getParentHostname } from './utils';
import { findComposerSenderEmail, detectWebmailUserEmail, normalizeEmail } from './adapters/webmail';
import { urgentKeywords, priorityKeywords } from '../data/urgentKeywords';
import { handleTextSigning, setLastRightClickedElement } from './index';

export class EmailSignatureGuard {
  init(): void {
    console.log('[uid.one] Initializing EmailSignatureGuard...');
    
    const style = document.createElement('style');
    style.textContent = `
      .uid-email-verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #ecfdf5;
        border: 1px solid #10b981;
        color: #047857;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        font-weight: 600;
        margin: 8px 0;
      }
      .uid-email-warning-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fef2f2;
        border: 1px solid #f87171;
        color: #b91c1c;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        font-weight: 500;
        margin: 12px 0;
      }
    ` + EmailAITrustFilter.getStyles();
    
    const targetHead = document.head || document.documentElement;
    if (targetHead) {
      targetHead.appendChild(style);
    }

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement | null;
      if (link && link.href && link.href.includes('/verify/#data=')) {
        e.preventDefault();
        e.stopPropagation();
        
        const dataUrl = new URL(link.href);
        const hash = dataUrl.hash;
        if (hash && hash.startsWith('#data=')) {
          const encoded = hash.substring(6);
          this.showVerificationDetailsModal(encoded);
        }
      }
    });

    this.scanEmails();
    
    const observer = new MutationObserver(() => {
      this.scanEmails();
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  private async showVerificationDetailsModal(encodedData: string): Promise<void> {
    try {
      const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      const signer = payload.signer;
      const hash = payload.hash;
      const email = signer.replace('did:uid:', '');

      const overlay = document.createElement('div');
      overlay.className = 'uid-sig-overlay';
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
        z-index: 999999;
        font-family: system-ui, -apple-system, sans-serif;
        color: #e4e4e7;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: rgba(10, 10, 10, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        width: 100%;
        max-width: 500px;
        padding: 32px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s ease;
      `;

      modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; align-items: center; justify-content: center; margin-bottom: 16px; position: relative;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px 0; tracking: -0.025em;">Signature Authenticated</h3>
          <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #10b981;">Sovereign Verification System</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
          <div>
            <div style="font-size: 11px; color: #71717a; font-weight: 500; margin-bottom: 4px;">Signer Identity (DID)</div>
            <div style="font-size: 13px; font-weight: 600; color: #fff; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 10px; word-break: break-all;">${signer}</div>
          </div>

          <div>
            <div style="font-size: 11px; color: #71717a; font-weight: 500; margin-bottom: 4px;">Content Integrity Hash (SHA-256)</div>
            <div style="font-size: 12px; font-family: monospace; color: #a1a1aa; background: #000; border: 1px solid rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 10px; word-break: break-all; user-select: all;">${hash}</div>
          </div>

          <div id="uid-modal-key-section">
            <div style="font-size: 11px; color: #71717a; font-weight: 500; margin-bottom: 4px;">Active Public Key (RSA 2048-bit)</div>
            <div style="font-size: 11px; color: #a1a1aa; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 10px;" id="uid-modal-toggle-key">
              <span>Show Sovereign Public Key PEM</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="uid-modal-arrow" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <textarea readonly id="uid-modal-pubkey-text" style="display: none; width: 100%; height: 100px; background: #000; color: #52525b; font-family: monospace; font-size: 9px; border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 8px; margin-top: 8px; resize: none; box-sizing: border-box; outline: none;"></textarea>
          </div>
        </div>

        <div style="margin-top: 28px;">
          <button id="uid-modal-close-btn" style="width: 100%; padding: 12px; border-radius: 12px; background: #27272a; border: 1px solid rgba(255, 255, 255, 0.04); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Close</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      setTimeout(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'translateY(0)';
      }, 50);

      chrome.runtime.sendMessage(
        { type: 'GET_USER_PUBKEY', identifier: email },
        (response) => {
          if (response && response.success && response.publicKey) {
            const textarea = modal.querySelector('#uid-modal-pubkey-text') as HTMLTextAreaElement;
            if (textarea) textarea.value = response.publicKey;
          }
        }
      );

      let isKeyVisible = false;
      const toggleBtn = modal.querySelector('#uid-modal-toggle-key');
      const keyTextarea = modal.querySelector('#uid-modal-pubkey-text') as HTMLElement;
      const arrowSvg = modal.querySelector('#uid-modal-arrow') as HTMLElement;
      if (toggleBtn && keyTextarea) {
        toggleBtn.addEventListener('click', () => {
          isKeyVisible = !isKeyVisible;
          keyTextarea.style.display = isKeyVisible ? 'block' : 'none';
          arrowSvg.style.transform = isKeyVisible ? 'rotate(180deg)' : 'rotate(0deg)';
        });
      }

      const closeModal = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        setTimeout(() => {
          overlay.remove();
        }, 300);
      };

      const closeBtn = modal.querySelector('#uid-modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    } catch (e) {
      console.error('[uid.one] Failed to show verification modal:', e);
    }
  }

  private scanEmails(): void {
    if (!isContextValid()) return;
    const containers = new Set<HTMLElement>();
    
    const roleSelectors = '[role="document"], [role="article"], article';
    document.querySelectorAll(roleSelectors).forEach(el => {
      if (el.getAttribute('contenteditable') === 'true' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        return;
      }
      containers.add(el as HTMLElement);
    });

    const commonSelectors = [
      '.a3s', 
      '.rps_code', 
      '.zmMailContent', '.zmContent', '.zmContentMain', '.zmcContent', '[id^="mailContent_"]', '.zmc-mailview-body', 
      '.message-body-container', '.message-content', 
      '.email-wrapped', '.message_body', '.msg-body', 
      '#messagebody', 
      '.v-Message-body' 
    ].join(', ');

    document.querySelectorAll(commonSelectors).forEach(el => {
      if (el.tagName !== 'IFRAME') {
        containers.add(el as HTMLElement);
      }
    });

    const signatureElements = document.querySelectorAll('#uid-one-signature, .uid-email-signature-block');
    signatureElements.forEach(sigEl => {
      const container = this.findEmailContainer(sigEl as HTMLElement);
      if (container) {
        containers.add(container);
      }
    });

    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('uid.one') && (href.includes('verify') || href.includes('data'))) {
        const container = this.findEmailContainer(link as HTMLElement);
        if (container) {
          containers.add(container);
        }
      }
    });

    if (window !== window.top) {
      const hostname = window.location.hostname || getParentHostname();
      const isWebmail = hostname.includes('mail.') || hostname.includes('proton') || hostname.includes('outlook') || hostname.includes('zoho') || hostname.includes('ymail');
      if (isWebmail && document.body && document.body.textContent && document.body.textContent.trim().length > 10) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width > 200 && height > 200) {
          containers.add(document.body);
        }
      }
    }

    const finalContainers = Array.from(containers).filter(c => {
      if (c.classList.contains('uid-email-signature-block') || c.closest('.uid-email-signature-block')) {
        return false;
      }
      return true;
    }).filter(c1 => {
      return !Array.from(containers).some(c2 => c1 !== c2 && c1.contains(c2));
    });

    finalContainers.forEach(container => {
      const textContent = container.textContent || '';
      const currentHash = `${textContent.length}_${textContent.slice(0, 100).replace(/\s/g, '')}`;
      const savedHash = container.getAttribute('data-uid-content-hash');
      
      if (savedHash && savedHash !== currentHash) {
        container.removeAttribute('data-uid-processed');
        container.removeAttribute('data-uid-processing');
        container.querySelectorAll('.uid-ai-triage-badge, .uid-email-warning-banner, .uid-email-verified-badge').forEach(el => el.remove());
      }

      if (
        container.querySelector('.uid-email-warning-banner, .uid-email-verified-badge, .uid-ai-triage-badge') ||
        container.getAttribute('data-uid-processing') === 'true' ||
        container.getAttribute('data-uid-processed') === 'true' ||
        container.querySelector('[contenteditable="true"]') ||
        container.closest('div[role="dialog"], .M9, .AD')
      ) {
        return;
      }

      const sigElement = container.querySelector('#uid-one-signature') || container.querySelector('.uid-email-signature-block');
      const hasVerifyLink = container.querySelector('a[href*="uid.one/verify"], a[href*="/verify/#data="]') !== null || 
                            /uid\.one[\/|%2F]verify[\/|%2F]/i.test(container.innerHTML);
      const sigTextMatch = textContent.match(/(ký số bởi|digitally signed by) UID\.one/i);
      
      if (sigElement || sigTextMatch || hasVerifyLink) {
        container.setAttribute('data-uid-processing', 'true');
        container.setAttribute('data-uid-content-hash', currentHash);
        this.processVerification(container, sigElement as HTMLElement)
          .finally(() => {
            container.removeAttribute('data-uid-processing');
            container.setAttribute('data-uid-processed', 'true');
          });
      } else if (textContent.trim().length > 10) {
        if (isWebmailSite()) {
          container.setAttribute('data-uid-processing', 'true');
          container.setAttribute('data-uid-content-hash', currentHash);
          new EmailAITrustFilter().triage(container, false, '')
            .then(() => {
              container.setAttribute('data-uid-processed', 'true');
            })
            .catch(console.error)
            .finally(() => {
              container.removeAttribute('data-uid-processing');
            });
        } else {
          container.setAttribute('data-uid-content-hash', currentHash);
          container.setAttribute('data-uid-processed', 'true');
        }
      }
    });
  }

  private findEmailContainer(el: HTMLElement): HTMLElement {
    let cur: HTMLElement | null = el.parentElement;
    while (cur && cur !== document.body) {
      if (cur.matches('.a3s, .rps_code, .zmContent, .zmContentMain, .zmcContent, [id^="mailContent_"], .zmc-mailview-body, .message-body-container, .message-content, .email-wrapped, .message_body, .msg-body, #messagebody, .v-Message-body')) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return document.body;
  }

  private processVerification(container: HTMLElement, sigElement: HTMLElement | null): Promise<void> {
    if (!isContextValid()) return Promise.resolve();
    return new Promise<void>((resolve) => {
      try {
        let dataSig = '';
        let signer = '';
        let textHash = '';
        
        if (sigElement) {
          dataSig = sigElement.getAttribute('data-sig') || '';
          signer = sigElement.getAttribute('data-signer') || '';
        }
        
        if (!signer) {
          const containerText = container.innerHTML || '';
          const verifyLinkMatch = containerText.match(/uid\.one[\/|%2F]verify[\/|%2F](?:#|%23)data(?:=|%3D)([A-Za-z0-9_-]+)/i);
          if (verifyLinkMatch && verifyLinkMatch[1]) {
            try {
              const rawData = atob(verifyLinkMatch[1].replace(/-/g, '+').replace(/_/g, '/'));
              const parsed = JSON.parse(rawData);
              dataSig = parsed.sig || '';
              signer = parsed.signer || '';
              textHash = parsed.hash || '';
            } catch (e) {
              console.warn('[uid.one] Failed to decode verify link hash:', e);
            }
          }
        }

        if (!signer) {
          const sigError = chrome.i18n.getMessage("warningInvalidSignature") || "Invalid signature or email has been tampered with.";
          new EmailAITrustFilter().triage(container, false, '', sigError).catch(console.error);
          resolve();
          return;
        }

        console.log(`[uid.one] Verifying signature for ${signer} (hash: ${textHash || 'DOM'}, sig: ${dataSig.slice(0, 10)}...)`);

        chrome.runtime.sendMessage(
          { type: 'GET_USER_PUBKEY', identifier: signer.replace('did:uid:', '') },
          async (keyRes) => {
            try {
              if (!keyRes || !keyRes.success || !keyRes.publicKey) {
                throw new Error(keyRes?.error || 'Public key lookup failed');
              }
              
              const pemContents = keyRes.publicKey
                .replace('-----BEGIN PUBLIC KEY-----', '')
                .replace('-----END PUBLIC KEY-----', '')
                .replace(/\s+/g, '');
              
              const binaryKey = atob(pemContents);
              const keyBuffer = new Uint8Array(binaryKey.length);
              for (let i = 0; i < binaryKey.length; i++) {
                keyBuffer[i] = binaryKey.charCodeAt(i);
              }

              const publicKey = await crypto.subtle.importKey(
                "spki",
                keyBuffer.buffer,
                {
                  name: "RSASSA-PKCS1-v1_5",
                  hash: { name: "SHA-256" }
                },
                false,
                ["verify"]
              );

              const sigBinary = atob(dataSig.replace(/-/g, '+').replace(/_/g, '/'));
              const sigBuffer = new Uint8Array(sigBinary.length);
              for (let i = 0; i < sigBinary.length; i++) {
                sigBuffer[i] = sigBinary.charCodeAt(i);
              }

              let textToVerify = textHash;
              let calculatedHashHex = '';
              let calculatedHashBuffer: ArrayBuffer | null = null;
              
              const clonedContainer = container.cloneNode(true) as HTMLElement;
              const sigBlock = clonedContainer.querySelector('.uid-email-signature-block');
              if (sigBlock) sigBlock.remove();
              const banners = clonedContainer.querySelectorAll('.uid-ai-triage-badge, .uid-email-warning-banner, .uid-email-verified-badge');
              banners.forEach(b => b.remove());
              const bodyText = clonedContainer.innerText || clonedContainer.textContent || '';
              const normalizedText = bodyText.replace(/\r\n/g, '\n').trim();
              
              const encoder = new TextEncoder();
              const dataBuffer = encoder.encode(normalizedText);
              
              calculatedHashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
              const hashArray = Array.from(new Uint8Array(calculatedHashBuffer));
              calculatedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

              let isValid = false;

              if (textToVerify) {
                const verifyBuffer = encoder.encode(textToVerify);
                isValid = await crypto.subtle.verify(
                  "RSASSA-PKCS1-v1_5",
                  publicKey,
                  sigBuffer,
                  verifyBuffer
                );
              }

              if (!isValid) {
                isValid = await crypto.subtle.verify(
                  "RSASSA-PKCS1-v1_5",
                  publicKey,
                  sigBuffer,
                  dataBuffer
                );
              }

              if (!isValid) {
                const hashHexBuffer = encoder.encode(calculatedHashHex);
                isValid = await crypto.subtle.verify(
                  "RSASSA-PKCS1-v1_5",
                  publicKey,
                  sigBuffer,
                  hashHexBuffer
                );
              }

              if (!isValid && calculatedHashBuffer) {
                isValid = await crypto.subtle.verify(
                  "RSASSA-PKCS1-v1_5",
                  publicKey,
                  sigBuffer,
                  calculatedHashBuffer
                );
              }

              if (isValid) {
                console.log(`[uid.one] Cryptographic signature VERIFIED successfully for ${signer}`);
                
                // Clear any warnings
                container.querySelectorAll('.uid-ai-triage-badge, .uid-email-warning-banner').forEach(el => el.remove());
                
                // Inject verified badge at the top
                if (!container.querySelector('.uid-email-verified-badge')) {
                  const verifiedBadge = document.createElement('div');
                  verifiedBadge.className = 'uid-email-verified-badge';
                  verifiedBadge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>${chrome.i18n.getMessage("alertVerifiedSender", [signer.replace('did:uid:', '')]) || `This email is digitally signed and verified by UID.one for sender: ${signer.replace('did:uid:', '')}`}</span>
                  `;
                  container.insertBefore(verifiedBadge, container.firstChild);
                }
                
                const verifyLinks = container.querySelectorAll('.uid-verify-link, a[href*="/verify/#data="]');
                verifyLinks.forEach(link => {
                  (link as HTMLElement).style.setProperty('display', 'none', 'important');
                });
              } else {
                console.warn(`[uid.one] Cryptographic signature VERIFICATION FAILED for ${signer}`);
                const sigError = chrome.i18n.getMessage("warningContentTampered") || "Digital signature does not match email content (Content has been modified).";
                new EmailAITrustFilter().triage(container, false, '', sigError).catch(console.error);
              }
            } catch (err: any) {
              console.warn(`[uid.one] Cryptographic verification error:`, err);
              const sigError = chrome.i18n.getMessage("warningVerifyError", [err.message]) || `Technical error verifying signature: ${err.message}`;
              new EmailAITrustFilter().triage(container, false, '', sigError).catch(console.warn);
            } finally {
              resolve();
            }
          }
        );
      } catch (e) {
        const sigError = chrome.i18n.getMessage("warningVerificationFailed") || "Digital signature verification failed.";
        new EmailAITrustFilter().triage(container, false, '', sigError).catch(console.error);
        resolve();
      }
    });
  }
}

export class EmailSendInterceptor {
  init(): void {
    console.log('[uid.one] Initializing EmailSendInterceptor...');

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const button = target.closest('[role="button"], button, input[type="submit"], input[type="button"]') as HTMLElement | null;
      if (!button) return;

      const btnText = (button.innerText || button.textContent || '').trim().toLowerCase();
      const btnLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const btnTitle = (button.getAttribute('title') || '').toLowerCase();
      const btnTooltip = (button.getAttribute('data-tooltip') || '').toLowerCase();

      const isSend = btnText === 'send' || btnText === 'gửi' || btnText === 'envoyer' || btnText === 'enviar' ||
                     btnLabel.includes('send') || btnLabel.includes('gửi') ||
                     btnTitle.includes('send') || btnTitle.includes('gửi') ||
                     btnTooltip.includes('send') || btnTooltip.includes('gửi') ||
                     button.classList.contains('aoO');

      if (isSend) {
        this.cleanupLoadingBlocks();
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.cleanupLoadingBlocks();
      }
    }, true);
  }

  private cleanupLoadingBlocks(): void {
    const loadingBlocks = document.querySelectorAll('.uid-email-signature-loading-block');
    if (loadingBlocks.length > 0) {
      console.log(`[uid.one] Cleaning up ${loadingBlocks.length} signature loading blocks before send.`);
      loadingBlocks.forEach(block => {
        const parent = block.parentElement;
        block.remove();
        if (parent) {
          parent.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  }
}

export class ComposerFloatingSignButton {
  private activeButton: HTMLElement | null = null;
  private activeTarget: HTMLElement | null = null;
  private activeIframe: HTMLIFrameElement | null = null;

  init(): void {
    if (window !== window.top) return;

    if (!isWebmailSite()) return;

    document.addEventListener('focusin', (e) => {
      if (!isContextValid()) return;
      const target = e.target as HTMLElement;
      if (!target) return;

      const isEditable = target.closest('[contenteditable="true"]') || 
                         target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA';
      
      if (isEditable && (target.clientHeight > 80 || target.getAttribute('role') === 'textbox')) {
        this.showButton(target, null);
      }
    });

    document.addEventListener('click', (e) => {
      if (!isContextValid()) return;
      const target = e.target as HTMLElement;
      if (this.activeButton && !this.activeButton.contains(target) && this.activeTarget && !this.activeTarget.contains(target)) {
        this.hideButton();
      }
    });

    const scanIframes = () => {
      if (!isContextValid()) return;
      document.querySelectorAll('iframe').forEach(iframe => {
        this.bindToIframe(iframe);
      });
    };
    
    scanIframes();
    const iframeInterval = setInterval(() => {
      if (!isContextValid()) {
        clearInterval(iframeInterval);
        return;
      }
      scanIframes();
    }, 1000);

    const positionInterval = setInterval(() => {
      if (!isContextValid()) {
        clearInterval(positionInterval);
        return;
      }
      if (this.activeTarget && this.activeButton) {
        if (this.activeIframe && !document.body.contains(this.activeIframe)) {
          this.hideButton();
          return;
        }
        
        const doc = this.activeIframe ? (this.activeIframe.contentDocument || this.activeIframe.contentWindow?.document) : document;
        if (!doc || !doc.body.contains(this.activeTarget) || this.activeTarget.offsetWidth === 0) {
          this.hideButton();
          return;
        }
        this.updatePosition();
      }
    }, 500);
  }

  private bindToIframe(iframe: HTMLIFrameElement): void {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      // @ts-ignore
      if (doc.__uidBound) return;
      // @ts-ignore
      doc.__uidBound = true;

      doc.addEventListener('focusin', (e) => {
        if (!isContextValid()) return;
        const target = e.target as HTMLElement;
        if (!target) return;

        const isEditable = target.closest('[contenteditable="true"]') || 
                           target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA';
        
        const isIframeBody = target.tagName === 'BODY' && target.ownerDocument !== document;
        if (isEditable && (isIframeBody || target.clientHeight > 80 || target.getAttribute('role') === 'textbox')) {
          this.showButton(target, iframe);
        }
      });

      doc.addEventListener('click', (e) => {
        if (!isContextValid()) return;
        const target = e.target as HTMLElement;
        if (this.activeButton && !this.activeButton.contains(target) && this.activeTarget && !this.activeTarget.contains(target)) {
          this.hideButton();
        }
      });

      doc.addEventListener('contextmenu', (e) => {
        if (!isContextValid()) return;
        const target = e.target as HTMLElement;
        const isEditable = target.closest('[contenteditable="true"]') || 
                           target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA';
                           
        if (isEditable) {
          setLastRightClickedElement(target);
          let senderEmail = findComposerSenderEmail(target);
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
            chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: false });
          }
        } else {
          chrome.runtime.sendMessage({ type: 'SET_CONTEXT_MENU_ENABLED', enabled: true });
        }
      });
    } catch (err) {
      // Cross-origin iframe, ignore safely
    }
  }

  private showButton(target: HTMLElement, iframe: HTMLIFrameElement | null): void {
    this.activeTarget = target;
    this.activeIframe = iframe;
    
    let senderEmail = findComposerSenderEmail(target);
    if (!senderEmail) {
      senderEmail = detectWebmailUserEmail();
    }

    chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (profileRes) => {
      let isMatch = false;
      let linkedEmail = '';
      let hasProfile = false;
      if (profileRes && profileRes.success && profileRes.email) {
        hasProfile = true;
        linkedEmail = profileRes.email;
        if (senderEmail) {
          isMatch = normalizeEmail(profileRes.email) === normalizeEmail(senderEmail);
        }
      }

      if (hasProfile && !isMatch) {
        this.hideButton();
        return;
      }

      if (!this.activeButton) {
        const rootDoc = document;
        this.activeButton = rootDoc.createElement('div');
        this.activeButton.className = 'uid-floating-sign-btn';
        rootDoc.body.appendChild(this.activeButton);
      }

      this.activeButton.style.display = 'flex';
      
      this.activeButton.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        background: ${isMatch ? '#2563eb' : '#94a3b8'};
        border: 1px solid ${isMatch ? '#1d4ed8' : '#cbd5e1'};
        color: #ffffff;
      `;

      this.activeButton.onmouseenter = () => {
        if (this.activeButton) {
          this.activeButton.style.transform = 'scale(1.1)';
          if (!isMatch) {
            this.activeButton.style.background = '#64748b';
            this.activeButton.style.borderColor = '#475569';
          } else {
            this.activeButton.style.background = '#1d4ed8';
          }
        }
      };

      this.activeButton.onmouseleave = () => {
        if (this.activeButton) {
          this.activeButton.style.transform = 'scale(1)';
          if (!isMatch) {
            this.activeButton.style.background = '#94a3b8';
            this.activeButton.style.borderColor = '#cbd5e1';
          } else {
            this.activeButton.style.background = '#2563eb';
          }
        }
      };

      this.activeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-lock-check">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v.5" />
          <path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
          <path d="M8 11v-4a4 4 0 1 1 8 0v4" />
          <path d="M15 19l2 2l4 -4" />
        </svg>
      `;

      const rootDoc = this.activeButton.ownerDocument || document;
      const tooltip = rootDoc.createElement('div');
      tooltip.className = 'uid-floating-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        bottom: 42px;
        right: 0;
        background: #0f172a;
        color: #f8fafc;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #334155;
      `;
      
      if (!isMatch) {
        tooltip.textContent = chrome.i18n.getMessage("floatingTooltipMismatch", [senderEmail || 'unknown', linkedEmail || 'none']) || `Sender email mismatch`;
        tooltip.style.background = '#881337';
        tooltip.style.borderColor = '#fda4af';
        tooltip.style.color = '#ffe4e6';
      } else {
        tooltip.textContent = chrome.i18n.getMessage("floatingTooltipSign") || "Sign this email with UID.one";
      }
      this.activeButton.appendChild(tooltip);

      this.activeButton.onmouseover = () => {
        tooltip.style.opacity = '1';
      };
      this.activeButton.onmouseout = () => {
        tooltip.style.opacity = '0';
      };

      this.activeButton.onclick = (e) => {
        e.stopPropagation();
        if (!isMatch) {
          alert(tooltip.textContent);
          return;
        }
        this.handleSignAction();
      };

      this.updatePosition();
    });
  }

  private updatePosition(): void {
    if (!this.activeTarget || !this.activeButton) return;
    
    let top = 0;
    let left = 0;

    if (this.activeIframe) {
      const iframeRect = this.activeIframe.getBoundingClientRect();
      const targetRect = this.activeTarget.getBoundingClientRect();
      top = iframeRect.top + targetRect.bottom - 46;
      left = iframeRect.left + targetRect.right - 46;
    } else {
      const rect = this.activeTarget.getBoundingClientRect();
      top = rect.bottom - 46;
      left = rect.right - 46;
    }
    
    this.activeButton.style.top = `${top}px`;
    this.activeButton.style.left = `${left}px`;
  }

  private hideButton(): void {
    if (this.activeButton) {
      this.activeButton.style.display = 'none';
    }
    this.activeTarget = null;
    this.activeIframe = null;
  }

  private handleSignAction(): void {
    if (!this.activeTarget) return;
    
    setLastRightClickedElement(this.activeTarget);
    
    const targetWindow = this.activeIframe ? this.activeIframe.contentWindow : window;
    const selection = targetWindow?.getSelection()?.toString() || '';
    const textToSign = selection || (this.activeTarget.tagName === 'INPUT' || this.activeTarget.tagName === 'TEXTAREA'
      ? (this.activeTarget as HTMLInputElement | HTMLTextAreaElement).value
      : this.activeTarget.innerText || '');

    handleTextSigning(textToSign).catch(console.error);
  }
}

export class EmailAITrustFilter {
  static getStyles(): string {
    return `
      .uid-ai-triage-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        font-weight: 600;
        margin: 8px 4px;
      }
      .uid-ai-priority {
        background: #fef3c7;
        border: 1px solid #d97706;
        color: #92400e;
      }
      .uid-ai-safe {
        background: #eff6ff;
        border: 1px solid #3b82f6;
        color: #1e40af;
      }
      .uid-ai-unverified {
        background: #fff1f2;
        border: 1px solid #f43f5e;
        color: #9f1239;
        animation: uid-pulse 2s infinite;
      }
      @keyframes uid-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
  }

  async triage(container: HTMLElement, isSigned: boolean, signer: string, sigError?: string): Promise<void> {
    if (container.querySelector('.uid-ai-triage-badge')) {
      return;
    }

    const emailBody = container.textContent || '';
    
    let category: 'PRIORITY' | 'SAFE' | 'UNVERIFIED_SUSPICIOUS' = 'SAFE';
    let reasoning = '';
    
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.ai && window.ai.assistant) {
        // @ts-ignore
        const assistant = await window.ai.assistant.create();
        const prompt = `
          Analyze this email.
          - Signed state: ${isSigned ? 'SIGNED & VERIFIED BY ' + signer : (sigError ? 'INVALID SIGNATURE: ' + sigError : 'UNSIGNED / UNVERIFIED SENDER')}
          - Content: "${emailBody.slice(0, 1000)}"
          
          Respond in exactly this JSON format:
          {
            "category": "PRIORITY" (if verified urgent action), "SAFE" (if normal trusted message), or "UNVERIFIED_SUSPICIOUS" (if unsigned or looks like BEC/phishing),
            "reason": "short 1 sentence explanation in Vietnamese"
          }
        `;
        const response = await assistant.prompt(prompt);
        const parsed = JSON.parse(response);
        category = parsed.category || 'SAFE';
        reasoning = parsed.reason || '';
        if (sigError && category === 'UNVERIFIED_SUSPICIOUS') {
          reasoning = `${reasoning} ${sigError}`;
        }
      } else {
        const lowerBody = emailBody.toLowerCase();
        
        const urgentPattern = new RegExp(urgentKeywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');
        const containsUrgent = urgentPattern.test(lowerBody);

        if (!isSigned) {
          category = 'UNVERIFIED_SUSPICIOUS';
          
          let contextWarning = '';
          if (containsUrgent) {
            contextWarning = chrome.i18n.getMessage("reasonUnsignedSensitive") || "Unsigned email contains sensitive financial keywords.";
          } else {
            contextWarning = chrome.i18n.getMessage("reasonUnsigned") || "Email is not signed.";
          }
          
          if (sigError) {
            reasoning = `${contextWarning} ${sigError}`;
          } else {
            category = containsUrgent ? 'UNVERIFIED_SUSPICIOUS' : 'SAFE';
            reasoning = contextWarning;
          }
        } else {
          const priorityPattern = new RegExp(priorityKeywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');
          const containsPriority = priorityPattern.test(lowerBody);

          category = containsPriority ? 'PRIORITY' : 'SAFE';
          reasoning = containsPriority
            ? (chrome.i18n.getMessage("reasonSignedImportant") || "Email from trusted partner contains important action request.")
            : (chrome.i18n.getMessage("reasonSignedSafe") || "Safe email from partner.");
        }
      }
    } catch (e) {
      category = isSigned ? 'SAFE' : 'UNVERIFIED_SUSPICIOUS';
      reasoning = isSigned
        ? (chrome.i18n.getMessage("reasonTrustedVerified") || "Trusted source has been verified.")
        : (sigError ? `${chrome.i18n.getMessage("reasonNotSigned") || "Sender is unsigned."} ${sigError}` : (chrome.i18n.getMessage("reasonNotSigned") || "Sender is unsigned."));
    }

    this.injectBadge(container, category, reasoning);
  }

  private injectBadge(container: HTMLElement, category: string, reasoning: string): void {
    if (category !== 'UNVERIFIED_SUSPICIOUS') {
      return;
    }
    if (container.querySelector('.uid-email-warning-banner, .uid-email-verified-badge')) {
      return;
    }
    const badge = document.createElement('div');
    badge.className = 'uid-ai-triage-badge uid-ai-unverified';
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0;
      background: #fff1f2;
      border: 1px solid #f43f5e;
      color: #9f1239;
    `;
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${chrome.i18n.getMessage("filterWarning", [reasoning]) || `UID Trust Shield: Warning (${reasoning})`}</span>
    `;

    container.insertBefore(badge, container.firstChild);
  }
}
