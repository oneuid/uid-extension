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
  phone: /(?:\+\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{2,6}\b|(?:\+\d{1,4}[\s.-]?)?\d{7,14}\b/g,

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

function stripExifFromJpeg(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const dv = new DataView(arrayBuffer);
  if (dv.byteLength < 4 || dv.getUint16(0) !== 0xFFD8) {
    return arrayBuffer;
  }

  let offset = 2;
  const length = dv.byteLength;
  const newBuffers: ArrayBuffer[] = [];
  let lastCopiedOffset = 0;

  while (offset < length - 1) {
    const marker = dv.getUint16(offset);
    if (marker === 0xFFE1) {
      const segmentLength = dv.getUint16(offset + 2);
      if (offset > lastCopiedOffset) {
        newBuffers.push(arrayBuffer.slice(lastCopiedOffset, offset));
      }
      lastCopiedOffset = offset + 2 + segmentLength;
      offset = lastCopiedOffset;
    } else if (marker >= 0xFFD0 && marker <= 0xFFD9) {
      offset += 2;
    } else {
      const segmentLength = dv.getUint16(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  if (lastCopiedOffset < length) {
    newBuffers.push(arrayBuffer.slice(lastCopiedOffset, length));
  }

  if (newBuffers.length === 0) {
    return arrayBuffer;
  }

  const totalLength = newBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const buf of newBuffers) {
    result.set(new Uint8Array(buf), writeOffset);
    writeOffset += buf.byteLength;
  }
  
  return result.buffer;
}

async function stripMetadata(file: File): Promise<File> {
  const isJpeg = file.type === 'image/jpeg' || 
                 file.name.toLowerCase().endsWith('.jpg') || 
                 file.name.toLowerCase().endsWith('.jpeg');
  
  if (isJpeg) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const cleanBuffer = stripExifFromJpeg(arrayBuffer);
      if (cleanBuffer.byteLength !== arrayBuffer.byteLength) {
        console.log(`[uid.one] CookieGuard / Privacy stripped EXIF metadata from: ${file.name}`);
        try {
          chrome.runtime.sendMessage({ type: 'INC_STAT', key: 'exif_stripped' });
        } catch (e) {}
        return new File([cleanBuffer], file.name, { type: file.type, lastModified: Date.now() });
      }
    } catch (e) {
      console.warn('[uid.one] Failed to strip EXIF from image:', e);
    }
  }
  return file;
}

export class FileUploadInterceptor {
  private observer: MutationObserver | null = null;

  init(): void {
    chrome.storage.local.get('settings_exif_stripper').then(res => {
      if (res.settings_exif_stripper === false) {
        console.log('[uid.one] FileUploadInterceptor (EXIF Stripper) is disabled.');
        return;
      }
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
    });
  }

  private scanFileInputs(inputs: NodeListOf<Element>): void {
    inputs.forEach(input => {
      if (input.getAttribute('data-uid-scanned')) return;
      input.setAttribute('data-uid-scanned', 'true');

      input.addEventListener('change', async (e) => {
        const inputEl = e.target as HTMLInputElement;
        if (inputEl.getAttribute('data-uid-metadata-cleaning') === 'true') {
          return;
        }

        if (inputEl.getAttribute('data-uid-allowed') === 'true') {
          inputEl.removeAttribute('data-uid-allowed');
          return;
        }

        const files = inputEl.files;
        if (!files || files.length === 0) return;

        inputEl.setAttribute('data-uid-metadata-cleaning', 'true');
        try {
          const cleanedFiles: File[] = [];
          let modified = false;
          for (let i = 0; i < files.length; i++) {
            const originalFile = files[i];
            const cleanFile = await stripMetadata(originalFile);
            if (cleanFile !== originalFile) {
              modified = true;
            }
            cleanedFiles.push(cleanFile);
          }

          if (modified) {
            const dataTransfer = new DataTransfer();
            cleanedFiles.forEach(f => dataTransfer.items.add(f));
            inputEl.files = dataTransfer.files;
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        } finally {
          inputEl.removeAttribute('data-uid-metadata-cleaning');
        }

        await this.handleFiles(Array.from(inputEl.files || []), inputEl);
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
    if (e.defaultPrevented) return;

    const targetEl = e.target as HTMLElement;
    if (e.dataTransfer.types.includes('Files') && targetEl.getAttribute('data-uid-dropped-clean') === 'true') {
      targetEl.removeAttribute('data-uid-dropped-clean');
      return;
    }

    const files = Array.from(e.dataTransfer.files);

    // DLP Block Check first
    for (const file of files) {
      const result = await this.scanFile(file);
      if (result.blocked) {
        e.preventDefault();
        e.stopPropagation();
        await showDLPWarning({ context: 'drag_drop', filename: file.name, result });
        return;
      }
    }

    // EXIF strip
    let modified = false;
    const cleanedFiles: File[] = [];
    for (const file of files) {
      const cleanFile = await stripMetadata(file);
      if (cleanFile !== file) {
        modified = true;
      }
      cleanedFiles.push(cleanFile);
    }

    if (modified) {
      e.preventDefault();
      e.stopPropagation();

      targetEl.setAttribute('data-uid-dropped-clean', 'true');

      const dataTransfer = new DataTransfer();
      cleanedFiles.forEach(f => dataTransfer.items.add(f));

      const cleanDropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      targetEl.dispatchEvent(cleanDropEvent);
    }
  }
}

export class ClipboardInterceptor {
  private isDlpActive = true;

  init(): void {
    chrome.storage.local.get('settings_otp_shield').then(res => {
      this.isDlpActive = res.settings_otp_shield !== false;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.settings_otp_shield) {
        this.isDlpActive = changes.settings_otp_shield.newValue !== false;
      }
    });

    document.addEventListener('paste', this.handlePaste.bind(this), true);
    document.addEventListener('copy', this.handleCopy.bind(this), true);
  }

  private async handlePaste(e: ClipboardEvent): Promise<void> {
    if (!this.isDlpActive) return;

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
    if (!this.isDlpActive) return;

    const text = window.getSelection()?.toString();
    if (!text) return;

    const result = scanContent(text);

    let totalSensitiveCount = 0;
    let maxSingleTypeCount = 0;
    const detectedTypes: string[] = [];

    const piiTypes = ['emailBulk', 'phone', 'creditCard', 'apiKey', 'vnId', 'privateKey', 'jwt', 'bankAccount'];

    interface MatchRange {
      start: number;
      end: number;
      type: string;
    }

    const ranges: MatchRange[] = [];

    for (const finding of result.findings) {
      if (piiTypes.includes(finding.type)) {
        detectedTypes.push(finding.type);
        
        const pattern = SENSITIVE_PATTERNS[finding.type as keyof typeof SENSITIVE_PATTERNS];
        if (pattern) {
          pattern.lastIndex = 0;
          let match;
          if (pattern.global) {
            while ((match = pattern.exec(text)) !== null) {
              if (match[0]) {
                ranges.push({
                  start: match.index,
                  end: match.index + match[0].length,
                  type: finding.type
                });
              }
            }
          } else {
            match = pattern.exec(text);
            if (match && match[0]) {
              ranges.push({
                start: match.index,
                end: match.index + match[0].length,
                type: finding.type
              });
            }
          }
        }
      }
    }

    ranges.sort((a, b) => a.start - b.start);

    const merged: MatchRange[] = [];
    for (const r of ranges) {
      if (merged.length === 0) {
        merged.push(r);
      } else {
        const last = merged[merged.length - 1];
        if (r.start < last.end) {
          last.end = Math.max(last.end, r.end);
        } else {
          merged.push(r);
        }
      }
    }

    totalSensitiveCount = merged.length;

    const typeCounts: Record<string, number> = {};
    for (const r of merged) {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    }
    for (const count of Object.values(typeCounts)) {
      if (count > maxSingleTypeCount) {
        maxSingleTypeCount = count;
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
  private isWhitelistedDomain(hostname: string): boolean {
    const whitelist = [
      'uid.one',
      'localhost',
      '127.0.0.1'
    ];
    return whitelist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  }

  init(): void {
    chrome.storage.local.get('settings_otp_shield').then(res => {
      if (res.settings_otp_shield === false) return;

      document.addEventListener('submit', this.handleSubmit.bind(this), true);
      
      document.addEventListener('click', (e) => {
        if (!this.isWhitelistedDomain(window.location.hostname)) return;
        const target = e.target as HTMLElement;
        const btn = target.closest('button, input[type="submit"]');
        if (!btn) return;
        
        const isSubmitBtn = btn.getAttribute('type') === 'submit' || 
                            /submit|login|verify|confirm|pay/i.test(btn.textContent || '') ||
                            /submit|login|verify|confirm|pay/i.test((btn as HTMLInputElement).value || '');
        
        if (isSubmitBtn) {
          const form = btn.closest('form');
          if (form) {
            this.wipeSensitiveInputs(form);
          } else {
            const container = btn.parentElement;
            if (container) {
              const sensitiveInputs = container.querySelectorAll<HTMLInputElement>(
                'input[type="password"], input[name*="otp" i], input[name*="code" i], input[autocomplete*="one-time-code" i], input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i]'
              );
              sensitiveInputs.forEach(input => {
                setTimeout(() => {
                  if (input.value) {
                    input.value = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }, 300);
              });
            }
          }
        }
      }, true);
    });
  }

  private async handleSubmit(e: SubmitEvent): Promise<void> {
    const form = e.target as HTMLFormElement;

    if (form.getAttribute('data-uid-owned')) return;
    
    if (form.getAttribute('data-uid-allowed') === 'true') {
      this.wipeSensitiveInputs(form);
      return;
    }

    const content = this.extractFormContent(form);
    if (!content) {
      this.wipeSensitiveInputs(form);
      return;
    }

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
    } else {
      this.wipeSensitiveInputs(form);
    }
  }

  private wipeSensitiveInputs(form: HTMLFormElement): void {
    if (!this.isWhitelistedDomain(window.location.hostname)) return;
    const sensitiveInputs = form.querySelectorAll<HTMLInputElement>(
      'input[type="password"], input[name*="otp" i], input[name*="code" i], input[autocomplete*="one-time-code" i], input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i]'
    );
    
    sensitiveInputs.forEach(input => {
      setTimeout(() => {
        if (input.value) {
          console.log(`[uid.one] CookieGuard / Privacy wiped sensitive value from input: ${input.name || input.id}`);
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          try {
            chrome.runtime.sendMessage({ type: 'INC_STAT', key: 'otp_cleared' });
          } catch (e) {}
        }
      }, 300);
    });

    try {
      navigator.clipboard.readText().then(text => {
        const result = scanContent(text);
        if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
          navigator.clipboard.writeText('').then(() => {
            console.log('[uid.one] CookieGuard / Privacy wiped sensitive content from clipboard cache.');
            try {
              chrome.runtime.sendMessage({ type: 'INC_STAT', key: 'otp_cleared' });
            } catch (e) {}
          });
        }
      }).catch(() => {});
    } catch (e) {}
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

export class TextDLPShield {
  init(): void {
    chrome.storage.local.get('settings_otp_shield').then(res => {
      if (res.settings_otp_shield === false) return;
      
      const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
      textInputs.forEach(input => {
        if (input.getAttribute('data-uid-dlp-shield')) return;
        input.setAttribute('data-uid-dlp-shield', 'true');
        
        input.addEventListener('blur', (e) => {
          const el = e.target as HTMLInputElement;
          const val = el.value || '';
          if (val.trim()) {
            const scan = scanContent(val);
            if (scan.blocked) {
              chrome.runtime.sendMessage({
                type: 'SHOW_NOTIFICATION',
                title: 'Sensitive Data Alert',
                message: `Potential sensitive data (${scan.findings.map(f => f.type).join(', ')}) detected in input field.`
              });
            }
          }
        });
      });
    });
  }
}
