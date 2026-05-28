(function() {
  const whitelist = [
    'uid.one',
    'trip.express',
    'localhost',
    '127.0.0.1'
  ];
  
  function isWhitelisted() {
    try {
      const hostname = window.location.hostname;
      return whitelist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
    } catch (e) {
      return false;
    }
  }

  if (isWhitelisted()) return;

  // ================= 1. GLOBAL PRIVACY CONTROL & DNT =================
  try {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      writable: false,
      configurable: false
    });
  } catch (e) {
    console.warn('[uid.one] Failed to define globalPrivacyControl on navigator:', e);
  }

  try {
    Object.defineProperty(navigator, 'doNotTrack', {
      value: '1',
      writable: false,
      configurable: false
    });
    Object.defineProperty(window, 'doNotTrack', {
      value: '1',
      writable: false,
      configurable: false
    });
  } catch (e) {
    console.warn('[uid.one] Failed to define doNotTrack properties:', e);
  }

  // ================= 2. COOKIE GUARD INTERCEPTOR =================
  try {
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                     Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
    
    if (originalCookieDescriptor && originalCookieDescriptor.set && originalCookieDescriptor.get) {
      const originalGet = originalCookieDescriptor.get;
      const originalSet = originalCookieDescriptor.set;
      
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

      const sensitiveValuePatterns = {
        creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/,
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        jwt: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
        apiKey: /\b(sk-|pk-|api_key=|secret=)[A-Za-z0-9]{20,}\b/i
      };

      Object.defineProperty(document, 'cookie', {
        configurable: true,
        enumerable: true,
        get: function() {
          return originalGet.call(document);
        },
        set: function(val) {
          // Dynamic toggle check
          if (document.documentElement.dataset.uidCookieGuard === 'false') {
            originalSet.call(document, val);
            return;
          }

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
          originalSet.call(document, val);
        }
      });
    }
  } catch (e) {
    console.warn('[uid.one] Failed to define CookieGuard setter:', e);
  }

  // ================= 3. NOTIFICATION BLOCKER INTERCEPTOR =================
  try {
    if (window.Notification) {
      window.Notification.requestPermission = function() {
        console.log('[uid.one] Blocked third-party notification request permission prompt on:', window.location.hostname);
        return Promise.resolve('denied');
      };
    }
  } catch (e) {
    console.warn('[uid.one] Failed to block Notification.requestPermission:', e);
  }

  try {
    if (window.PushManager && window.PushManager.prototype.subscribe) {
      window.PushManager.prototype.subscribe = function() {
        console.log('[uid.one] Blocked third-party push subscription on:', window.location.hostname);
        return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
      };
    }
  } catch (e) {
    console.warn('[uid.one] Failed to block PushManager.subscribe:', e);
  }
})();
