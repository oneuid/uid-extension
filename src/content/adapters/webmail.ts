import { getParentHostname } from '../utils';

export interface WebmailAdapter {
  isMatch(hostname: string): boolean;
  detectSender(target: HTMLElement): string | null;
  detectLoggedInUser(): string | null;
}

class GmailAdapter implements WebmailAdapter {
  isMatch(hostname: string): boolean {
    return hostname.includes('mail.google.com');
  }

  detectSender(target: HTMLElement): string | null {
    const localComposer = target.closest('form, [role="dialog"], .composer, .M9, .compose-box, #compose-container');
    if (!localComposer) return null;

    const text = localComposer.textContent || '';
    const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
    if (angleMatch) return angleMatch[1];

    const select = localComposer.querySelector('select[name="from"], select.agP, .compose-from select') as HTMLSelectElement | null;
    if (select) {
      const match = select.value?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    return null;
  }

  detectLoggedInUser(): string | null {
    const accountLink = document.querySelector('a[href*="SignOutOptions"], a[aria-label*="Google Account" i], [aria-label*="@gmail.com" i]');
    if (accountLink) {
      const label = accountLink.getAttribute('aria-label') || accountLink.getAttribute('title') || '';
      const match = label.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    const headerUser = document.querySelector('.gb_A, .gb_B, .gb_d');
    if (headerUser) {
      const title = headerUser.getAttribute('title') || '';
      const match = title.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    return null;
  }
}

class OutlookAdapter implements WebmailAdapter {
  isMatch(hostname: string): boolean {
    return hostname.includes('outlook.live.com') || hostname.includes('outlook.office.com') || hostname.includes('outlook.office365.com');
  }

  detectSender(target: HTMLElement): string | null {
    const localComposer = target.closest('form, [role="dialog"], .composer, .compose-box');
    if (!localComposer) return null;

    const text = localComposer.textContent || '';
    const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
    if (angleMatch) return angleMatch[1];

    const fromContainer = localComposer.querySelector('[role="combobox"][aria-label*="From" i], .compose-sender, .sender-field');
    if (fromContainer) {
      const match = fromContainer.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    return null;
  }

  detectLoggedInUser(): string | null {
    const accountButton = document.querySelector('#O365_HeaderRightRegion, #meInitialsButton, #O365_MainLink_Me, button[aria-label*="Account manager" i]');
    if (accountButton) {
      const text = accountButton.textContent || accountButton.getAttribute('aria-label') || '';
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    return null;
  }
}

class ZohoMailAdapter implements WebmailAdapter {
  isMatch(hostname: string): boolean {
    return hostname.includes('zoho.com');
  }

  detectSender(target: HTMLElement): string | null {
    let composerContainer: Element | null = null;

    if (window.parent && window.parent.document && window.parent.document !== target.ownerDocument) {
      let activeIframe: HTMLIFrameElement | null = null;
      try {
        const iframes = window.parent.document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
          if (iframes[i].contentDocument === target.ownerDocument || iframes[i].contentWindow === target.ownerDocument.defaultView) {
            activeIframe = iframes[i];
            break;
          }
        }
      } catch (e) {
        console.warn('[uid.one] Could not access parent document:', e);
      }

      if (activeIframe) {
        let parent: HTMLElement | null = activeIframe.parentElement;
        while (parent && parent !== window.parent.document.body) {
          const id = parent.id || '';
          const role = parent.getAttribute('role') || '';
          if (
            parent.classList.contains('zm-composer') ||
            parent.classList.contains('zmail-composer') ||
            parent.classList.contains('zm-compose-tab') ||
            parent.tagName === 'FORM' ||
            role === 'tabpanel' ||
            role === 'dialog' ||
            id.toLowerCase().includes('compose')
          ) {
            composerContainer = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
    }

    if (!composerContainer) {
      composerContainer = target.closest('form, [role="dialog"], .composer, .zm-composer') || target.ownerDocument.body;
    }

    // 1. Try specific "From" selectors inside composerContainer first (very precise)
    const selectors = ['.zm-c-from-email', '.zm-composer-from', '.zm-c-from', '[data-fieldname="from"]', '.compose-from', '.zm-c-from-email-val'];
    for (const selector of selectors) {
      const el = composerContainer.querySelector(selector);
      if (el) {
        const text = el.textContent || '';
        const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
        if (angleMatch) return angleMatch[1];
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) return match[0];
      }
    }

    // 2. Clone and extract text excluding iframe/editor to avoid matching body text
    try {
      const clone = composerContainer.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('iframe, textarea, [contenteditable="true"]').forEach(el => el.remove());
      const headerText = clone.textContent || '';
      
      const angleMatch = headerText.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
      if (angleMatch) return angleMatch[1];

      const match = headerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    } catch (e) {
      const text = composerContainer.textContent || '';
      const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
      if (angleMatch) return angleMatch[1];
    }

    return null;
  }

  detectLoggedInUser(): string | null {
    const zohoUser = document.querySelector('.zm-user-email, .zmail-user-email, .zm-profile-email');
    if (zohoUser) {
      const text = zohoUser.getAttribute('title') || zohoUser.textContent || '';
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    const profileBubble = document.querySelector('.zm-profile-icon, #top_profile_bubble, .zm-user-pic');
    if (profileBubble) {
      const text = profileBubble.getAttribute('title') || profileBubble.textContent || '';
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    const profileContainers = ['#top_profile_bubble', '.zm-profile-card', '#zm-profile', '.zm-profile'];
    for (const containerSel of profileContainers) {
      const container = document.querySelector(containerSel);
      if (container) {
        const text = container.getAttribute('title') || container.textContent || '';
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) return match[0];
      }
    }
    return null;
  }
}

class YahooMailAdapter implements WebmailAdapter {
  isMatch(hostname: string): boolean {
    return hostname.includes('mail.yahoo.com');
  }

  detectSender(target: HTMLElement): string | null {
    const localComposer = target.closest('form, .composer, .compose-box');
    if (!localComposer) return null;

    const text = localComposer.textContent || '';
    const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
    if (angleMatch) return angleMatch[1];

    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0];

    return null;
  }

  detectLoggedInUser(): string | null {
    const yahooUser = document.querySelector('.ybar-menu-header-email, #ybarAccountMenuOpener, [data-redirect-url*="mail.yahoo.com"]');
    if (yahooUser) {
      const text = yahooUser.textContent || yahooUser.getAttribute('aria-label') || '';
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) return match[0];
    }
    return null;
  }
}

export const adapters: WebmailAdapter[] = [
  new GmailAdapter(),
  new OutlookAdapter(),
  new ZohoMailAdapter(),
  new YahooMailAdapter()
];

export function getAdapter(): WebmailAdapter | null {
  const hostname = window.location.hostname || getParentHostname();
  return adapters.find(a => a.isMatch(hostname)) || null;
}

export function findComposerSenderEmail(target: HTMLElement): string | null {
  if (!target) return null;

  const adapter = getAdapter();
  if (adapter) {
    const email = adapter.detectSender(target);
    if (email) return email;
  }

  const localComposer = target.closest('form, [role="dialog"], .composer, .M9, .compose-box, #compose-container, .zm-composer, .zmail-composer') || target.ownerDocument.body;
  
  // Clone and remove inputs/editor to prevent matching email body content
  try {
    const clone = localComposer.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('iframe, textarea, [contenteditable="true"]').forEach(el => el.remove());
    const headerText = clone.textContent || '';
    
    const angleMatch = headerText.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
    if (angleMatch) return angleMatch[1];

    const match = headerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0];
  } catch (e) {}

  const text = localComposer.textContent || '';
  const angleMatch = text.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
  if (angleMatch) return angleMatch[1];

  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (match) return match[0];

  return null;
}

export function normalizeEmail(email: string): string {
  const clean = email.toLowerCase().trim();
  if (clean.endsWith('@gmail.com')) {
    const parts = clean.split('@');
    const local = parts[0].replace(/\./g, '');
    return `${local}@gmail.com`;
  }
  return clean;
}

export function detectWebmailUserEmail(): string | null {
  const adapter = getAdapter();
  if (adapter) {
    const email = adapter.detectLoggedInUser();
    if (email) return email;
  }

  const selectors = '.username, .username-span, #username, #skin_container_username, .userName, .user-name';
  let userEl = document.querySelector(selectors);
  if (!userEl && window.parent !== window) {
    try {
      userEl = window.parent.document.querySelector(selectors);
    } catch (e) {}
  }
  if (userEl) {
    const text = (userEl.textContent || '').trim();
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0];
  }

  const headerSelectors = 'header [title*="@"], .header [title*="@"], #header [title*="@"]';
  let headerEmails = Array.from(document.querySelectorAll(headerSelectors));
  if (headerEmails.length === 0 && window.parent !== window) {
    try {
      headerEmails = Array.from(window.parent.document.querySelectorAll(headerSelectors));
    } catch (e) {}
  }
  for (let i = 0; i < headerEmails.length; i++) {
    const title = headerEmails[i].getAttribute('title') || '';
    const match = title.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0];
  }

  return null;
}
