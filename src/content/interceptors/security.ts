import { isSuspiciousUidHostname, isUidHostname } from '../../shared/origins';

/**
 * Optional tab-switch privacy blur strictly for UID.one pages.
 * Default-off (`settings_screen_shield === true` required). Never blocks
 * printing, DevTools, context menus, screenshots, or ordinary inputs.
 */
export class ScreenshotProtector {
  private styleEl: HTMLStyleElement | null = null;
  private isEnabled = false;
  private readonly onVisibilityChange = () => {
    if (!this.isEnabled) return;
    const container = document.body || document.documentElement;
    if (!container) return;
    if (document.hidden) {
      container.classList.add('uid-blur-active');
    } else {
      container.classList.remove('uid-blur-active');
    }
  };

  init(): void {
    if (!isUidHostname(window.location.hostname)) return;

    chrome.storage.local.get('settings_screen_shield').then((res) => {
      if (res.settings_screen_shield === true) {
        this.enable();
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.settings_screen_shield) {
        if (changes.settings_screen_shield.newValue === true) {
          this.enable();
        } else {
          this.disable();
        }
      }
    });
  }

  private enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.id = 'uid-screen-shield-style';
      this.styleEl.textContent = `
        .uid-blur-active {
          filter: blur(20px) !important;
          transition: filter 0.1s ease-in-out !important;
        }
      `;
      const targetHead = document.head || document.documentElement;
      if (targetHead) {
        targetHead.appendChild(this.styleEl);
      }
    }

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const container = document.body || document.documentElement;
    if (container) {
      container.classList.remove('uid-blur-active');
    }
    if (this.styleEl) {
      this.styleEl.remove();
      this.styleEl = null;
    }
  }
}

export class OriginVerifier {
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
    return isUidHostname(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
  }

  private isSuspiciousUIDDomain(hostname: string): boolean {
    return isSuspiciousUidHostname(hostname);
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
    const msgSpan = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = 'Phishing warning:';
    msgSpan.append('⚠ ', strong, ` This page (${hostname}) may be impersonating UID.one. Do not enter your credentials.`);

    const dismissBtn = document.createElement('button');
    dismissBtn.id = 'uid-phish-dismiss';
    dismissBtn.type = 'button';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText =
      'background:none;border:1px solid white;color:white;padding:4px 12px;border-radius:4px;cursor:pointer';
    dismissBtn.addEventListener('click', () => banner.remove());

    banner.append(msgSpan, dismissBtn);
    document.body.prepend(banner);
  }

  private monitorFormSubmissions(): void {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      if (!form.querySelector('[data-uid-autofill]')) return;

      let action: URL;
      try {
        action = new URL(form.action || window.location.href);
      } catch {
        try {
          action = new URL(window.location.href);
        } catch {
          return;
        }
      }

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
      title: 'Insecure form blocked',
      message: `${hostname} uses HTTP. Your credentials were not submitted.`,
    });
  }
}

/**
 * Opt-in tracking cookie sweeper. Default-off (`settings_cookie_guard === true`
 * required). Matches only known third-party analytics cookie prefixes; never
 * deletes consent-preference cookies or matches catch-all substrings.
 */
export class CookieGuard {
  private readonly TRACKER_COOKIE_PATTERNS = [
    /^_(ga|gid|gat|gac|gcl)(_|$)/i,
    /^_(fbp|fbc)$/i,
    /^_(uetsid|uetvid)$/i,
    /^_tt_enable_cookie$/i,
  ];
  private timer: ReturnType<typeof setInterval> | null = null;

  init(): void {
    const hostname = window.location.hostname;
    if (this.isWhitelistedDomain(hostname)) return;

    chrome.storage.local.get('settings_cookie_guard').then((res) => {
      if (res.settings_cookie_guard === true) {
        this.start();
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.settings_cookie_guard) {
        if (changes.settings_cookie_guard.newValue === true) {
          this.start();
        } else {
          this.stop();
        }
      }
    });
  }

  private start(): void {
    if (this.timer !== null) return;
    this.sweepCookies();
    this.timer = setInterval(() => this.sweepCookies(), 5000);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private isWhitelistedDomain(hostname: string): boolean {
    return isUidHostname(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
  }

  private sweepCookies(): void {
    if (typeof document === 'undefined' || !document.cookie) return;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqIdx = cookie.indexOf('=');
      if (eqIdx === -1) continue;
      const name = cookie.substring(0, eqIdx).trim();

      const isTracking = this.TRACKER_COOKIE_PATTERNS.some((p) => p.test(name));
      if (isTracking) {
        this.deleteCookie(name);
        try {
          chrome.runtime.sendMessage({ type: 'INC_STAT', key: 'cookies_blocked' });
        } catch {}
      }
    }
  }

  private deleteCookie(name: string): void {
    const domains = [
      '',
      window.location.hostname,
      '.' + window.location.hostname,
      this.getCookieDomain(),
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
