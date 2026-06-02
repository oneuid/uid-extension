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
              console.log('[uid.one] CookieGuard blocked sensitive cookie registration: ' + name + (hasSensitiveData ? ' (contains sensitive value: ' + sensitiveType + ')' : ''));
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

  try {
    if (window.StorageManager && StorageManager.prototype.getDirectory) {
      StorageManager.prototype.getDirectory = function() {
        console.log('[uid.one] Blocked OPFS (Origin Private File System) access to prevent Frost side-channel SSD tracking.');
        return Promise.reject(new DOMException(
          'OPFS access is disabled by UID Link to protect against Frost side-channel SSD attacks.', 
          'SecurityError'
        ));
      };
    }
  } catch (e) {
    console.warn('[uid.one] Failed to shield OPFS:', e);
  }

  // ================= 4. DIGITAL SIGNATURE CA EMULATOR =================
  try {
    const AGENT_URL = 'http://127.0.0.1:13013';

    // 4.1 VNPT CA Plugin Emulation
    (window as any).vnpt_plugin = {
      getCertificates(callback: Function) {
        fetch(`${AGENT_URL}/certificates`)
          .then(res => res.json())
          .then(data => {
            const certs = (data.certificates || []).map((c: any) => ({
              certId: c.id,
              subject: c.subject,
              issuer: c.issuer,
              validTo: c.validTo,
              certData: c.certData
            }));
            callback({ code: 0, data: certs, error: "" });
          })
          .catch(err => {
            console.error('[uid.one] VNPT Emulator getCertificates failed:', err);
            callback({ code: -1, data: [], error: err.message });
          });
      },
      signXML(dataToSign: string, callback: Function) {
        fetch(`${AGENT_URL}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certId: 'usb_auto_detected',
            hash: dataToSign
          })
        })
          .then(res => res.json())
          .then(resData => {
            if (resData.success) {
              callback({ code: 0, data: resData.signature_base64, error: "" });
            } else {
              callback({ code: -1, data: "", error: resData.error });
            }
          })
          .catch(err => {
            console.error('[uid.one] VNPT Emulator signXML failed:', err);
            callback({ code: -1, data: "", error: err.message });
          });
      },
      signPDF(dataToSign: string, callback: Function) {
        this.signXML(dataToSign, callback);
      }
    };

    // 4.2 VGCA (Government CA) Sign Service Emulation
    (window as any).vgcaplugin = {
      GetCertificates(callback: Function) {
        fetch(`${AGENT_URL}/certificates`)
          .then(res => res.json())
          .then(data => {
            const certs = (data.certificates || []).map((c: any) => ({
              CertificateId: c.id,
              Subject: c.subject,
              Issuer: c.issuer,
              ValidTo: c.validTo,
              CertData: c.certData
            }));
            callback({ Status: 0, Message: "", Certificates: certs });
          })
          .catch(err => {
            console.error('[uid.one] VGCA Emulator GetCertificates failed:', err);
            callback({ Status: -1, Message: err.message, Certificates: [] });
          });
      },
      Sign(dataToSign: string, certId: string, callback: Function) {
        fetch(`${AGENT_URL}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certId: certId || 'usb_auto_detected',
            hash: dataToSign
          })
        })
          .then(res => res.json())
          .then(resData => {
            if (resData.success) {
              callback({ Status: 0, Message: "", Signature: resData.signature_base64 });
            } else {
              callback({ Status: -1, Message: resData.error, Signature: "" });
            }
          })
          .catch(err => {
            console.error('[uid.one] VGCA Emulator Sign failed:', err);
            callback({ Status: -1, Message: err.message, Signature: "" });
          });
      }
    };
  } catch (e) {
    console.warn('[uid.one] Failed to initialize Digital Signature CA Emulators:', e);
  }
})();
