export class ScreenshotProtector {
  init(): void {
    console.log('[uid.one] Initializing ScreenshotProtector...');

    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body {
          display: none !important;
        }
        html {
          display: none !important;
        }
      }
      .uid-blur-active {
        filter: blur(25px) !important;
        transition: filter 0.1s ease-in-out !important;
      }
      
      input[type="password"]:not(:focus):not(:hover),
      input[name*="otp" i]:not(:focus):not(:hover),
      input[name*="code" i]:not(:focus):not(:hover),
      input[autocomplete*="one-time-code" i]:not(:focus):not(:hover),
      input[name*="card" i]:not(:focus):not(:hover),
      input[name*="cvv" i]:not(:focus):not(:hover),
      input[name*="cvc" i]:not(:focus):not(:hover) {
        filter: blur(5px) !important;
        transition: filter 0.15s ease-in-out !important;
      }
    `;
    const targetHead = document.head || document.documentElement;
    if (targetHead) {
      targetHead.appendChild(style);
    }

    document.addEventListener('keydown', (e) => {
      const isPrintKey = e.key === 'PrintScreen';
      const isPrintShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p';
      const isWinScreenshot = e.metaKey && e.shiftKey && e.key.toLowerCase() === 's'; // Win+Shift+S
      const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'); // Cmd+Shift+3 or 4
      
      const isF12 = e.key === 'F12';
      const isInspectShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'j');
      const isSourceShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u';

      if (isPrintKey || isPrintShortcut || isWinScreenshot || isMacScreenshot) {
        console.log('[uid.one] Keydown screenshot/print event detected:', e.key);
        const container = document.body || document.documentElement;
        if (container) container.classList.add('uid-blur-active');

        if (isPrintKey || isPrintShortcut) {
          e.preventDefault();
          e.stopPropagation();
          this.showWarningToast("Printing and screen capturing are disabled by UID.ONE.");
        }
        setTimeout(() => {
          if (document.hasFocus()) {
            const currentContainer = document.body || document.documentElement;
            if (currentContainer) currentContainer.classList.remove('uid-blur-active');
          }
        }, 2000);
      } else if (isF12 || isInspectShortcut || isSourceShortcut) {
        const hostname = window.location.hostname;
        const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
        const hasPassword = document.querySelector('input[type="password"]') !== null;
        if (isUidDomain || hasPassword) {
          e.preventDefault();
          e.stopPropagation();
          this.showWarningToast("Developer tools are disabled on secure pages.");
        }
      }
    }, true);

    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const hostname = window.location.hostname;
      const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
      const isPasswordInput = target.closest('input[type="password"]');

      if (isUidDomain || isPasswordInput) {
        e.preventDefault();
        e.stopPropagation();
        this.showWarningToast("Context menu options are disabled on secure domains/inputs.");
      }
    }, true);

    document.addEventListener('visibilitychange', () => {
      const container = document.body || document.documentElement;
      if (document.hidden) {
        console.log('[uid.one] Visibility hidden, applying blur filter');
        if (container) container.classList.add('uid-blur-active');
      } else {
        console.log('[uid.one] Visibility visible, removing blur filter');
        if (container) container.classList.remove('uid-blur-active');
      }
    });

    this.injectWatermark();
    this.initDevToolsDetector();
  }

  private initDevToolsDetector(): void {
    const hostname = window.location.hostname;
    const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
    const hasPassword = document.querySelector('input[type="password"]') !== null;

    if (!isUidDomain && !hasPassword) return;

    console.log('[uid.one] Enabling DevTools console getter detector...');
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        console.log('[uid.one] DevTools console evaluated target object, triggering blur');
        const container = document.body || document.documentElement;
        if (container) container.classList.add('uid-blur-active');
        chrome.runtime.sendMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Security Alert',
          message: 'Developer tools detected. Content has been secured.'
        });
        return 'uid-secure';
      }
    });

    setInterval(() => {
      console.log(element);
    }, 1000);
  }

  private injectWatermark(): void {
    const hostname = window.location.hostname;
    const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
    const hasPassword = document.querySelector('input[type="password"]') !== null;

    if (!isUidDomain && !hasPassword) return;

    if (document.getElementById('uid-watermark-overlay')) return;

    console.log('[uid.one] Generating and injecting dynamic watermark overlay');
    const watermark = document.createElement('div');
    watermark.id = 'uid-watermark-overlay';
    watermark.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483640;
      pointer-events: none;
      opacity: 0.03;
      display: flex;
      flex-wrap: wrap;
      align-content: space-around;
      justify-content: space-around;
      overflow: hidden;
      user-select: none;
    `;
    
    const userAgent = navigator.userAgent.includes("Mac") ? "macOS" : "Windows/Linux";
    const text = `UID.ONE | SECURE SESSION | ${userAgent}`;
    
    for (let i = 0; i < 20; i++) {
      const item = document.createElement('div');
      item.style.cssText = `
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        font-weight: 600;
        transform: rotate(-25deg);
        white-space: nowrap;
        margin: 50px;
        color: #000000;
      `;
      item.textContent = text;
      watermark.appendChild(item);
    }

    const container = document.body || document.documentElement;
    if (container) {
      container.appendChild(watermark);
    }
  }

  private showWarningToast(message: string): void {
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      title: 'Security Alert',
      message: message,
    });
  }
}

export class OriginVerifier {
  private readonly SUSPICIOUS_PATTERNS = [
    /uid\.one\./i,           // uid.one.evil.com
    /uid-one/i,              // uid-one-login.com
    /uidone/i,               // uidone-secure.com
    /uid_one/i,
  ];

  init(): void {
    this.checkCurrentPage();
    this.monitorFormSubmissions();
  }

  private checkCurrentPage(): void {
    const hostname = window.location.hostname;
    const isLegit = this.isLegitimateUIDDomain(hostname);
    const isFake = this.isSuspiciousUIDDomain(hostname);

    if (isFake && !isLegit) {
      this.showPhishingWarning(hostname);
    }
  }

  private isLegitimateUIDDomain(hostname: string): boolean {
    const LEGIT_DOMAINS = [
      'uid.one',
      'auth.uid.one',
      'api.uid.one',
    ];
    return LEGIT_DOMAINS.some(d =>
      hostname === d || hostname.endsWith(`.${d}`) || hostname === 'localhost' || hostname === '127.0.0.1'
    );
  }

  private isSuspiciousUIDDomain(hostname: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(p => p.test(hostname));
  }

  private showPhishingWarning(hostname: string): void {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      font-family: sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    banner.innerHTML = `
      <span>
        ⚠ <strong>Phishing warning:</strong>
        This page (${hostname}) may be impersonating UID.one.
        Do not enter your credentials.
      </span>
      <button id="uid-phish-dismiss"
        style="background:none;border:1px solid white;color:white;
               padding:4px 12px;border-radius:4px;cursor:pointer">
        Dismiss
      </button>
    `;
    document.body.prepend(banner);
    banner.querySelector('#uid-phish-dismiss')?.addEventListener('click', () => banner.remove());
  }

  private monitorFormSubmissions(): void {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      if (!form.querySelector('[data-uid-autofill]')) return;

      const action = new URL(form.action || window.location.href);
      const isSecure = action.protocol === 'https:' || action.hostname === 'localhost' || action.hostname === '127.0.0.1';

      if (!isSecure) {
        e.preventDefault();
        this.showInsecureSubmitWarning(action.hostname);
      }
    }, true);
  }

  private showInsecureSubmitWarning(hostname: string): void {
    chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      title: 'Insecure Form Blocked',
      message: `${hostname} uses HTTP. Your credentials were not submitted.`,
    });
  }
}

export class ViewportCleaner {
  init(): void {
    const hostname = window.location.hostname;
    const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
    const hasPassword = document.querySelector('input[type="password"]') !== null;

    if (isUidDomain || !hasPassword) return;

    console.log('[uid.one] Initializing ViewportCleaner...');
    
    this.clean();

    const observer = new MutationObserver(() => {
      this.clean();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  private clean(): void {
    const mainContainers = [
      '#kc-container',
      '.login-pf-page',
      '#app',
      '#__next',
      '#root'
    ];

    const mainEl = document.querySelector(mainContainers.join(','));
    const rootChildren = Array.from(document.body ? document.body.children : []);
    
    rootChildren.forEach(child => {
      if (mainEl && (child === mainEl || mainEl.contains(child))) return;
      if (child.id === 'uid-watermark-overlay' || child.id === 'uid-security-enforcer-banner') return;
      
      const style = window.getComputedStyle(child);
      const isFloating = style.position === 'fixed' || style.position === 'absolute';
      const zIndex = parseInt(style.zIndex, 10);

      if (isFloating && (zIndex > 100 || isNaN(zIndex))) {
        const opacity = parseFloat(style.opacity);
        const isTransparent = style.opacity === '0' || 
                              (!isNaN(opacity) && opacity < 0.15) || 
                              style.backgroundColor === 'transparent' || 
                              (style.backgroundColor.includes('rgba') && 
                               (style.backgroundColor.endsWith(', 0)') || style.backgroundColor.endsWith(',0)')));

        if (isTransparent) {
          console.log('[uid.one] Suspect third-party viewport element hidden:', child);
          (child as HTMLElement).style.setProperty('display', 'none', 'important');
          (child as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          (child as HTMLElement).style.setProperty('opacity', '0', 'important');
          (child as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
        }
      }
    });
  }
}

export class CookieGuard {
  private readonly SENSITIVE_COOKIE_PATTERNS = [
    /^_(ga|gid|gat|gac|gcl)/i,
    /^_(fbp|fbc)/i,
    /^_(uetsid|uetvid)/i,
    /^(cluid|hj|pin_)/i,
    /^_tt_enable_cookie/i,
    /^__pt/i,
    /cookieconsent/i,
    /ad-/i,
    /pixel/i,
    /tracking/i
  ];

  init(): void {
    const hostname = window.location.hostname;
    const isWhitelisted = this.isWhitelistedDomain(hostname);
    if (isWhitelisted) return;

    chrome.storage.local.get('settings_cookie_guard').then(res => {
      if (res.settings_cookie_guard === false) {
        console.log('[uid.one] CookieGuard is disabled by policy.');
        document.documentElement.dataset.uidCookieGuard = 'false';
        return;
      }
      console.log('[uid.one] Initializing CookieGuard...');

      this.sweepCookies();
      setInterval(() => this.sweepCookies(), 5000);
    });
  }

  private isWhitelistedDomain(hostname: string): boolean {
    const whitelist = [
      'uid.one',
      'trip.express',
      'localhost',
      '127.0.0.1'
    ];
    return whitelist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  }

  private sweepCookies(): void {
    if (typeof document === 'undefined' || !document.cookie) return;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqIdx = cookie.indexOf('=');
      if (eqIdx === -1) continue;
      const name = cookie.substring(0, eqIdx).trim();

      const isTracking = this.SENSITIVE_COOKIE_PATTERNS.some(p => p.test(name));
      if (isTracking) {
        console.log('[uid.one] CookieGuard sweeping tracking cookie:', name);
        this.deleteCookie(name);
        try {
          chrome.runtime.sendMessage({ type: 'INC_STAT', key: 'cookies_blocked' });
        } catch (e) {}
      }
    }
  }

  private deleteCookie(name: string): void {
    const domains = [
      '',
      window.location.hostname,
      '.' + window.location.hostname,
      this.getCookieDomain()
    ];
    
    for (const domain of domains) {
      const domainAttr = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}`;
    }
  }

  private getCookieDomain(): string {
    const parts = window.location.hostname.split('.');
    if (parts.length >= 2) {
      return '.' + parts.slice(-2).join('.');
    }
    return window.location.hostname;
  }
}

export class NotificationBlocker {
  init(): void {
    console.log('[uid.one] NotificationBlocker registered in main world.');
  }
}

export class GPCEnforcer {
  init(): void {
    console.log('[uid.one] GPCEnforcer registered in main world.');
  }
}
