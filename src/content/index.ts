import QRCode from 'qrcode';

console.log('[uid.one] Content script loaded on', window.location.hostname);

// ================= DLP ENGINE & PATTERNS =================

export const SENSITIVE_PATTERNS = {
  // Vietnamese ID / Passport
  vnId: /\b\d{9}(\d{3})?\b/g,

  // Credit card numbers (Luhn-valid)
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,

  // Bank account (VN format)
  bankAccount: /\b\d{9,16}\b/g,

  // Email addresses in bulk (>3 emails = potential data exfil)
  emailBulk: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,

  // Phone numbers
  phone: /(\+84|0)[0-9]{9,10}/g,

  // API Keys / Secrets (common patterns)
  apiKey: /\b(sk-|pk-|api_key=|secret=)[A-Za-z0-9]{20,}\b/gi,

  // JWT tokens
  jwt: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,

  // Private keys
  privateKey: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/,
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  type: string;
  count: number;
  sample: string;
}

export interface DLPResult {
  blocked: boolean;
  riskLevel: RiskLevel;
  findings: Finding[];
  recommendation: string;
}

export function scanContent(content: string): DLPResult {
  const findings: Finding[] = [];

  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      findings.push({
        type,
        count: matches.length,
        sample: redact(matches[0]),
      });
    }
  }

  if (findings.length === 0) {
    return { blocked: false, riskLevel: 'low', findings: [], recommendation: '' };
  }

  const riskLevel = assessRisk(findings);
  const blocked = riskLevel === 'critical' || riskLevel === 'high';

  return {
    blocked,
    riskLevel,
    findings,
    recommendation: buildRecommendation(findings, riskLevel),
  };
}

function assessRisk(findings: Finding[]): RiskLevel {
  const types = findings.map(f => f.type);

  if (types.includes('privateKey') || types.includes('jwt')) {
    return 'critical';
  }

  if (types.some(t => ['creditCard', 'apiKey', 'vnId'].includes(t))) {
    return 'high';
  }

  if (types.some(t => ['phone', 'emailBulk'].includes(t))) {
    return 'medium';
  }

  return 'low';
}

function redact(sample: string): string {
  if (sample.length <= 8) return '••••••••';
  return sample.slice(0, 4) + '••••' + sample.slice(-4);
}

function buildRecommendation(_findings: Finding[], risk: RiskLevel): string {
  if (risk === 'critical') {
    return 'This content contains credentials or tokens. Sending it could compromise your accounts.';
  }
  if (risk === 'high') {
    return 'This content may contain sensitive personal or financial data.';
  }
  return 'Review this content before sending.';
}

// ================= DLP WARNING UI =================

export interface DLPWarningOptions {
  context: 'file_upload' | 'clipboard_paste' | 'form_submit' | 'drag_drop';
  result: DLPResult;
  filename?: string;
  onAllow?: () => void;
}

export async function showDLPWarning(options: DLPWarningOptions): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    const contextLabel = {
      file_upload: 'File upload',
      clipboard_paste: 'Clipboard paste',
      form_submit: 'Form submission',
      drag_drop: 'File drop',
    }[options.context];

    const riskColor = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#2563eb',
    }[options.result.riskLevel];

    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="
            width:40px;height:40px;border-radius:8px;
            background:${riskColor};display:flex;
            align-items:center;justify-content:center;
            color:white;font-size:20px;flex-shrink:0
          ">⚠</div>
          <div>
            <div style="font-weight:600;font-size:15px;color:#111827;">
              Sensitive data detected
            </div>
            <div style="color:#6b7280;font-size:13px">
              ${contextLabel}${options.filename ? ` — ${options.filename}` : ''}
            </div>
          </div>
        </div>

        <p style="color:#374151;font-size:14px;line-height:1.5;margin:0 0 16px">
          ${options.result.recommendation}
        </p>

        <div style="
          background:#f9fafb;border-radius:8px;
          padding:12px;margin-bottom:20px;
          border:1px solid #e5e7eb
        ">
          ${options.result.findings.map(f => `
            <div style="font-size:13px;color:#374151;padding:2px 0">
              <strong>${f.type}</strong>
              ${f.count > 1 ? `× ${f.count}` : ''}
              — <code style="color:#dc2626">${f.sample}</code>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          ${options.onAllow ? `
            <button id="uid-dlp-allow" style="
              background:none;border:1px solid #d1d5db;
              color:#374151;padding:8px 16px;border-radius:6px;
              cursor:pointer;font-size:14px
            ">Send anyway</button>
          ` : ''}
          <button id="uid-dlp-block" style="
            background:#111827;color:white;
            border:none;padding:8px 20px;border-radius:6px;
            cursor:pointer;font-size:14px;font-weight:500
          ">Don't send</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#uid-dlp-block')?.addEventListener('click', () => {
      overlay.remove();
      resolve();
    });

    overlay.querySelector('#uid-dlp-allow')?.addEventListener('click', () => {
      overlay.remove();
      options.onAllow?.();
      resolve();
    });
  });
}

// ================= DLP INTERCEPTORS =================

export class FileUploadInterceptor {
  private observer: MutationObserver | null = null;

  init(): void {
    this.scanFileInputs(document.querySelectorAll('input[type="file"]'));

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) {
            const inputs = node.querySelectorAll('input[type="file"]');
            this.scanFileInputs(inputs);
          }
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('drop', this.handleDrop.bind(this), true);
  }

  private scanFileInputs(inputs: NodeListOf<Element>): void {
    inputs.forEach(input => {
      if (input.getAttribute('data-uid-scanned')) return;
      input.setAttribute('data-uid-scanned', 'true');

      input.addEventListener('change', async (e) => {
        const inputEl = e.target as HTMLInputElement;
        if (inputEl.getAttribute('data-uid-allowed') === 'true') {
          inputEl.removeAttribute('data-uid-allowed');
          return;
        }

        const files = inputEl.files;
        if (!files || files.length === 0) return;

        await this.handleFiles(Array.from(files), inputEl);
      });
    });
  }

  private async handleFiles(files: File[], input: HTMLInputElement): Promise<void> {
    for (const file of files) {
      const result = await this.scanFile(file);

      if (result.blocked) {
        input.value = '';

        await showDLPWarning({
          context: 'file_upload',
          filename: file.name,
          result,
          onAllow: () => {
            input.setAttribute('data-uid-allowed', 'true');
            // Re-trigger the selection (or alert the page framework if needed)
          },
        });
      }
    }
  }

  private async scanFile(file: File): Promise<DLPResult> {
    const textTypes = ['text/', 'application/json', 'application/xml', 'application/csv', 'application/sql'];
    const isText = textTypes.some(t => file.type.startsWith(t))
                   || file.name.endsWith('.txt')
                   || file.name.endsWith('.csv')
                   || file.name.endsWith('.json')
                   || file.name.endsWith('.sql')
                   || file.name.endsWith('.env')
                   || file.name.endsWith('.key')
                   || file.name.endsWith('.pem');

    if (!isText) return { blocked: false, riskLevel: 'low', findings: [], recommendation: '' };

    const MAX_SCAN_SIZE = 1024 * 1024;
    if (file.size > MAX_SCAN_SIZE) {
      return {
        blocked: false,
        riskLevel: 'medium',
        findings: [{ type: 'large_file', count: 1, sample: `${(file.size / 1024 / 1024).toFixed(1)}MB` }],
        recommendation: 'Large file — please verify it does not contain sensitive data.',
      };
    }

    try {
      const text = await file.text();
      return scanContent(text);
    } catch (e) {
      return { blocked: false, riskLevel: 'low', findings: [], recommendation: '' };
    }
  }

  private async handleDrop(e: DragEvent): Promise<void> {
    if (!e.dataTransfer?.files?.length) return;
    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      const result = await this.scanFile(file);
      if (result.blocked) {
        e.preventDefault();
        e.stopPropagation();
        await showDLPWarning({ context: 'drag_drop', filename: file.name, result });
        break;
      }
    }
  }
}

export class ClipboardInterceptor {
  init(): void {
    document.addEventListener('paste', this.handlePaste.bind(this), true);
    document.addEventListener('copy', this.handleCopy.bind(this), true);
  }

  private async handlePaste(e: ClipboardEvent): Promise<void> {
    const target = e.target as HTMLElement;
    if (target.getAttribute('data-uid-allowed') === 'true') {
      target.removeAttribute('data-uid-allowed');
      return;
    }

    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    const result = scanContent(text);

    if (result.riskLevel === 'critical') {
      e.preventDefault();
      e.stopPropagation();

      await showDLPWarning({
        context: 'clipboard_paste',
        result,
        onAllow: () => {
          target.setAttribute('data-uid-allowed', 'true');
          // Re-insert content
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;
            const val = target.value;
            target.value = val.slice(0, start) + text + val.slice(end);
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
      });
    }
  }

  private handleCopy(e: ClipboardEvent): void {
    const text = window.getSelection()?.toString();
    if (!text) return;

    const result = scanContent(text);

    let totalSensitiveCount = 0;
    let maxSingleTypeCount = 0;
    const detectedTypes: string[] = [];

    const piiTypes = ['emailBulk', 'phone', 'creditCard', 'apiKey', 'vnId', 'privateKey', 'jwt', 'bankAccount'];

    for (const finding of result.findings) {
      if (piiTypes.includes(finding.type)) {
        totalSensitiveCount += finding.count;
        detectedTypes.push(finding.type);
        if (finding.count > maxSingleTypeCount) {
          maxSingleTypeCount = finding.count;
        }
      }
    }

    if (totalSensitiveCount > 0) {
      const isBulk = totalSensitiveCount >= 3 || maxSingleTypeCount >= 3;

      if (isBulk) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', '[SECURE DATA BLOCKED BY UID.ONE]');
        }
        
        chrome.runtime.sendMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Security Alert',
          message: 'Bulk copying of sensitive customer data (email/phone/credentials) is disabled.',
        });

        chrome.runtime.sendMessage({
          type: 'AUDIT_COPY',
          domain: window.location.hostname,
          sensitive_type: detectedTypes.join(','),
          sample: '[BULK COPY BLOCKED]',
          count: totalSensitiveCount,
          blocked: true
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'AUDIT_COPY',
          domain: window.location.hostname,
          sensitive_type: detectedTypes.join(','),
          sample: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          count: totalSensitiveCount,
          blocked: false
        });
      }
    }
  }
}

export class FormInterceptor {
  init(): void {
    document.addEventListener('submit', this.handleSubmit.bind(this), true);
  }

  private async handleSubmit(e: SubmitEvent): Promise<void> {
    const form = e.target as HTMLFormElement;

    if (form.getAttribute('data-uid-owned') || form.getAttribute('data-uid-allowed')) return;

    const content = this.extractFormContent(form);
    if (!content) return;

    const result = scanContent(content);

    if (result.blocked) {
      e.preventDefault();
      e.stopPropagation();

      await showDLPWarning({
        context: 'form_submit',
        result,
        onAllow: () => {
          form.setAttribute('data-uid-allowed', 'true');
          form.requestSubmit();
        },
      });
    }
  }

  private extractFormContent(form: HTMLFormElement): string {
    const data = new FormData(form);
    const parts: string[] = [];

    data.forEach((value, key) => {
      if (value instanceof File) return;
      if (key.toLowerCase().includes('password')) return;
      if (key.toLowerCase().includes('token')) return;
      parts.push(`${key}=${value}`);
    });

    return parts.join('\n');
  }
}

// ================= SCREENSHOT & PRINT PROTECTION =================

export class ScreenshotProtector {
  init(): void {
    console.log('[uid.one] Initializing ScreenshotProtector...');

    // 1. Add print and blur style sheet to document head
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
    `;
    const targetHead = document.head || document.documentElement;
    if (targetHead) {
      targetHead.appendChild(style);
    }

    // 2. Intercept print shortcuts, PrintScreen key, OS screenshot hotkeys, and DevTools shortcuts
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
        // Keep the blur active for 2 seconds to cover the screenshot duration
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

    // 2.5. Disable right click context menu on sensitive fields
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

    // 3. Listen to window blur/focus events to prevent OS screenshots
    window.addEventListener('blur', () => {
      console.log('[uid.one] Window focus lost (blur event), applying blur filter');
      const container = document.body || document.documentElement;
      if (container) container.classList.add('uid-blur-active');
    });

    window.addEventListener('focus', () => {
      console.log('[uid.one] Window focus regained (focus event), removing blur filter');
      const container = document.body || document.documentElement;
      if (container) container.classList.remove('uid-blur-active');
    });

    // 3.5. Listen to mouseleave/mouseenter to cover external utility selections
    document.addEventListener('mouseleave', () => {
      console.log('[uid.one] Mouse left the viewport (mouseleave event), applying blur filter');
      const container = document.body || document.documentElement;
      if (container) container.classList.add('uid-blur-active');
    });

    document.addEventListener('mouseenter', () => {
      if (document.hasFocus()) {
        console.log('[uid.one] Mouse returned and focus active (mouseenter event), removing blur filter');
        const container = document.body || document.documentElement;
        if (container) container.classList.remove('uid-blur-active');
      }
    });

    // 4. Listen to visibility change
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

    // 5. Inject Dynamic Watermark
    this.injectWatermark();

    // 6. Initialize Console DevTools detector
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

// ================= ORIGIN VERIFICATION (Phishing Detection) =================

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

// ================= SESSION CAPTURING =================

function captureSessionToken() {
  try {
    const token = localStorage.getItem('oneuid_access_token');
    if (token) {
      chrome.runtime.sendMessage({ type: 'SET_SESSION_TOKEN', token });
    }
  } catch (e) {
    // ignore iframe/cross-origin localstorage security access restrictions
  }
}

// ================= AUTOFILL ICON INJECTION & AUTH =================

let isChecking = false;

function init() {
  if (isChecking) return;
  isChecking = true;
  
  if (!chrome.runtime?.id) {
    console.warn('[uid.one] Extension context invalidated. Please refresh the page.');
    return;
  }

  console.log('[uid.one] Content script initialized on:', window.location.href);

  // Inject active flag meta tag for handshake verification
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

  // Initialize DLP, Origin verification, and Session capturer
  const interceptors = [
    { name: 'FileUploadInterceptor', run: () => new FileUploadInterceptor().init() },
    { name: 'ClipboardInterceptor', run: () => new ClipboardInterceptor().init() },
    { name: 'FormInterceptor', run: () => new FormInterceptor().init() },
    { name: 'OriginVerifier', run: () => new OriginVerifier().init() },
    { name: 'ScreenshotProtector', run: () => new ScreenshotProtector().init() },
    { name: 'ViewportCleaner', run: () => new ViewportCleaner().init() },
    { name: 'NotificationBlocker', run: () => new NotificationBlocker().init() },
    { name: 'CookieGuard', run: () => new CookieGuard().init() },
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
    if (!chrome.runtime?.id) {
      observer.disconnect();
      return;
    }
    injectAll();
    captureSessionToken();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

const injectedInputs = new WeakSet<HTMLInputElement>();

function injectAll() {
  const nativeMeta = document.querySelector('meta[name="uid-passkey-native"]');
  if (nativeMeta && nativeMeta.getAttribute('content') === 'true') {
    return; 
  }

  // Ensure not run on HTTP (except localhost) and not run on uid.one domains
  const hostname = window.location.hostname;
  const isHttp = window.location.protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1';
  const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');

  if (isHttp || isUidDomain) return;

  const passwordInputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  passwordInputs.forEach((input) => {
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
  input.setAttribute('data-uid-autofill', 'true');

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
      
      const isPairedRes = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, resolve);
      });

      if (!isPairedRes?.isPaired) {
        const reqRes = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'START_OOB_AUTH', domain, device, identifier: targetUsername }, resolve);
        });

        if (!reqRes?.success) return alert("Failed to initiate Pairing");

        const qrUrl = `https://uid.one/qr?challenge=${reqRes.challenge.token}&client_id=uid-extension-client&client_name=Extension`;
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

// -------- DIGITAL SIGNING --------

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'START_PDF_SIGNING') {
    handlePdfSigning(request.url).catch(console.error);
  } else if (request.action === 'START_TEXT_SIGNING') {
    handleTextSigning(request.text).catch(console.error);
  }
});

function showToast(msg: string, type: string) {
  console.log(`[uid.one - ${type}] ${msg}`);
}

async function handleTextSigning(text: string) {
  showToast("Signing selected text...", "info");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  chrome.runtime.sendMessage({
    action: 'REQUEST_DIGITAL_SIGNATURE',
    domain: window.location.hostname,
    user_agent: navigator.userAgent,
    identifier: "Text Signature",
    metadata: {
      text_hash: hashHex,
      text_snippet: text.slice(0, 100)
    }
  }, (res) => {
    if (res && res.success) {
      showSigningDialog(res.data);
    } else {
      showToast("Failed to initiate signing: " + (res?.error || "Unknown error"), "error");
    }
  });
}

async function handlePdfSigning(pdfUrl: string) {
  showToast("Fetching PDF for signing...", "info");
  const response = await fetch(pdfUrl);
  const arrayBuffer = await response.arrayBuffer();
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  chrome.runtime.sendMessage({
    action: 'REQUEST_DIGITAL_SIGNATURE',
    domain: window.location.hostname,
    user_agent: navigator.userAgent,
    identifier: "Digital Signature",
    metadata: {
      pdf_hash: hashHex,
      document_url: pdfUrl
    }
  }, (res) => {
    if (res && res.success) {
      showSigningDialog(res.data);
    } else {
      showToast("Failed to initiate signing: " + (res?.error || "Unknown error"), "error");
    }
  });
}

function showSigningDialog(challengeData: any) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0,0.5);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background-color: #fff;
    padding: 32px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    color: #000;
    font-family: system-ui, sans-serif;
  `;

  const title = document.createElement('h2');
  title.innerText = 'UID.ONE Digital Signature';
  title.style.margin = '0 0 16px 0';

  const matchNum = document.createElement('div');
  matchNum.style.cssText = `
    font-size: 48px;
    font-weight: bold;
    letter-spacing: 8px;
    margin: 24px 0;
  `;
  matchNum.innerText = challengeData.metadata?.match_number || '--';

  const info = document.createElement('p');
  info.innerText = 'Open the UID.ONE Mobile App and tap the matching number to sign this document.';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.innerText = 'Cancel';
  cancelBtn.style.cssText = `
    margin-top: 24px;
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
  `;
  cancelBtn.onclick = () => document.body.removeChild(overlay);

  modal.appendChild(title);
  modal.appendChild(info);
  modal.appendChild(matchNum);
  modal.appendChild(cancelBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const pollInterval = setInterval(() => {
    chrome.runtime.sendMessage({
      action: 'POLL_STATUS',
      token: challengeData.token
    }, (res) => {
      if (res && res.success && res.data.status === 'APPROVED') {
        clearInterval(pollInterval);
        document.body.removeChild(overlay);
        showToast("Signature applied successfully!", "success");
      } else if (res && res.success && (res.data.status === 'EXPIRED' || res.data.status === 'REJECTED')) {
        clearInterval(pollInterval);
        document.body.removeChild(overlay);
        showToast(`Signing failed: ${res.data.status}`, "error");
      }
    });
  }, 2000);
}

export class ViewportCleaner {
  init(): void {
    const hostname = window.location.hostname;
    const isUidDomain = hostname === 'uid.one' || hostname.endsWith('.uid.one');
    const hasPassword = document.querySelector('input[type="password"]') !== null;

    if (!isUidDomain && !hasPassword) return;

    console.log('[uid.one] Initializing ViewportCleaner...');
    
    // Run initial cleanup
    this.clean();

    // Observe DOM modifications to sweep newly injected elements
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
        console.warn('[uid.one] Suspect third-party viewport element hidden:', child);
        (child as HTMLElement).style.setProperty('display', 'none', 'important');
        (child as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (child as HTMLElement).style.setProperty('opacity', '0', 'important');
        (child as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
      }
    });
  }
}

export class CookieGuard {
  private readonly SENSITIVE_COOKIE_PATTERNS = [
    /^_(ga|gid|gat|gac|gcl)/i,    // Google Analytics / Ads
    /^_(fbp|fbc)/i,              // Facebook Pixel
    /^_(uetsid|uetvid)/i,        // Bing Ads
    /^(cluid|hj|pin_)/i,         // Clarity, Hotjar, Pinterest
    /^_tt_enable_cookie/i,       // TikTok
    /^__pt/i,                    // Adroll
    /cookieconsent/i,            // Opt-in consent
    /ad-/i,                      // Generic ad tokens
    /pixel/i,
    /tracking/i
  ];

  init(): void {
    const hostname = window.location.hostname;
    const isWhitelisted = this.isWhitelistedDomain(hostname);
    if (isWhitelisted) return;

    console.log('[uid.one] Initializing CookieGuard...');

    // 1. Inject setter interceptor into the main world
    this.injectMainWorldInterceptor();

    // 2. Perform periodic sweeps to remove cookies written via server headers or prior to load
    this.sweepCookies();
    setInterval(() => this.sweepCookies(), 5000);
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

  private injectMainWorldInterceptor(): void {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const whitelist = [
          'uid.one',
          'trip.express',
          'localhost',
          '127.0.0.1'
        ];
        
        function isWhitelisted() {
          const hostname = window.location.hostname;
          return whitelist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
        }

        if (isWhitelisted()) return;

        const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                         Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
        
        if (!originalCookieDescriptor || !originalCookieDescriptor.set) return;

        const sensitiveCookiePatterns = [
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

        // Regex patterns for sensitive data in values (JWT, Email, Credit Cards, API Keys)
        const sensitiveValuePatterns = {
          creditCard: /\\\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\\\b/,
          email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}/,
          jwt: /eyJ[A-Za-z0-9_-]{10,}\\\\.[A-Za-z0-9_-]{10,}\\\\.[A-Za-z0-9_-]{10,}/,
          apiKey: /\\\\b(sk-|pk-|api_key=|secret=)[A-Za-z0-9]{20,}\\\\b/i
        };

        Object.defineProperty(document, 'cookie', {
          configurable: true,
          enumerable: true,
          get: function() {
            return originalCookieDescriptor.get.call(document);
          },
          set: function(val) {
            const parts = val.split(';');
            const cookieKV = parts[0].trim();
            const eqIdx = cookieKV.indexOf('=');
            if (eqIdx !== -1) {
              const name = cookieKV.substring(0, eqIdx).trim();
              const value = decodeURIComponent(cookieKV.substring(eqIdx + 1));

              const isTracking = sensitiveCookiePatterns.some(p => p.test(name));
              
              let hasSensitiveData = false;
              let sensitiveType = '';
              for (const [type, pattern] of Object.entries(sensitiveValuePatterns)) {
                if (pattern.test(value)) {
                  hasSensitiveData = true;
                  sensitiveType = type;
                  break;
                }
              }

              if (isTracking || hasSensitiveData) {
                console.warn('[uid.one] CookieGuard blocked sensitive cookie registration: ' + name + (hasSensitiveData ? ' (contains sensitive value: ' + sensitiveType + ')' : ''));
                return; // Suppress cookie write
              }
            }
            originalCookieDescriptor.set.call(document, val);
          }
        });
      })();
    `;
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
      script.remove();
    }
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
    // We inject a script into the main world to intercept notification and push request APIs
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const whitelist = [
          'uid.one',
          'trip.express',
          'localhost',
          '127.0.0.1'
        ];
        
        function isWhitelisted() {
          const hostname = window.location.hostname;
          return whitelist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
        }

        // 1. Intercept Notification.requestPermission
        if (window.Notification) {
          const originalRequest = window.Notification.requestPermission;
          window.Notification.requestPermission = function() {
            if (!isWhitelisted()) {
              console.log('[uid.one] Blocked third-party notification request permission prompt on:', window.location.hostname);
              return Promise.resolve('denied');
            }
            return originalRequest.apply(this, arguments);
          };
        }

        // 2. Intercept PushManager.subscribe (Service Worker Push Notifications)
        if (window.PushManager && window.PushManager.prototype.subscribe) {
          const originalSubscribe = window.PushManager.prototype.subscribe;
          window.PushManager.prototype.subscribe = function() {
            if (!isWhitelisted()) {
              console.log('[uid.one] Blocked third-party push subscription on:', window.location.hostname);
              return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
            }
            return originalSubscribe.apply(this, arguments);
          };
        }
      })();
    `;
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
      script.remove();
    }
  }
}
