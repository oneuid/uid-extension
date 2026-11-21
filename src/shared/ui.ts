export interface ShieldConfig {
  id: string;
  storageKey: string;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
}

export const SHIELD_CONFIGS: ShieldConfig[] = [
  {
    id: 'toggle-dlp',
    storageKey: 'settings_otp_shield',
    titleKey: 'shieldDlpTitle',
    titleFallback: 'DLP input and paste shield',
    descKey: 'shieldDlpDesc',
    descFallback: 'Scan form submissions, uploads, and sensitive pastes',
  },
  {
    id: 'toggle-exif',
    storageKey: 'settings_exif_stripper',
    titleKey: 'shieldExifTitle',
    titleFallback: 'EXIF metadata stripper',
    descKey: 'shieldExifDesc',
    descFallback: 'Strip JPEG location and camera metadata on upload',
  },
  {
    id: 'toggle-cookie',
    storageKey: 'settings_cookie_guard',
    titleKey: 'shieldCookieTitle',
    titleFallback: 'Tracking cookie guard',
    descKey: 'shieldCookieDesc',
    descFallback: 'Sweep known third-party analytics cookies',
  },
  {
    id: 'toggle-audit',
    storageKey: 'settings_clipboard_audit',
    titleKey: 'shieldAuditTitle',
    titleFallback: 'Clipboard audit metadata',
    descKey: 'shieldAuditDesc',
    descFallback: 'Log copy type, count, and length without content',
  },
  {
    id: 'toggle-screen',
    storageKey: 'settings_screen_shield',
    titleKey: 'shieldScreenTitle',
    titleFallback: 'Tab-switch blur (UID.one)',
    descKey: 'shieldScreenDesc',
    descFallback: 'Blur UID.one pages when the tab is hidden',
  },
];

export function t(key: string, fallback = '', substitutions?: string | string[]): string {
  try {
    const msg = chrome.i18n?.getMessage?.(key, substitutions);
    if (msg) return msg;
  } catch {
    // Ignore i18n lookup errors outside extension runtime
  }
  if (substitutions && fallback) {
    const list = Array.isArray(substitutions) ? substitutions : [substitutions];
    return list.reduce((acc, item, idx) => acc.replace(`$${idx + 1}`, item), fallback);
  }
  return fallback;
}

export function syncLocale(): string {
  const uiLang = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').trim();
  document.documentElement.lang = uiLang;
  document.documentElement.dir = uiLang.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
  return uiLang;
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatTimestamp(epochMs: number | null | undefined, locale: string): string {
  if (!epochMs || !Number.isFinite(epochMs)) return '—';
  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(epochMs));
  } catch {
    return new Date(epochMs).toISOString();
  }
}

export function renderShieldRows(shields: ShieldConfig[]): string {
  return shields
    .map((shield) => {
      const title = escapeHtml(t(shield.titleKey, shield.titleFallback));
      const desc = escapeHtml(t(shield.descKey, shield.descFallback));
      return `
        <div class="card-row">
          <div class="row-left">
            <div class="row-content">
              <div class="row-title">${title}</div>
              <div class="row-desc">${desc}</div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" id="${shield.id}" aria-label="${title}">
            <span class="slider"></span>
          </label>
        </div>
      `;
    })
    .join('');
}

export function bindShieldToggles(shields: ShieldConfig[]): void {
  const storageKeys = shields.map((s) => s.storageKey);
  chrome.storage.local.get(storageKeys).then((res) => {
    for (const shield of shields) {
      const el = document.getElementById(shield.id) as HTMLInputElement | null;
      if (!el) continue;
      el.checked = res[shield.storageKey] === true;
      el.addEventListener('change', () => {
        chrome.storage.local.set({ [shield.storageKey]: el.checked });
      });
    }
  });
}
