/// <reference types="chrome"/>

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.uid.one/v1/auth';
const CLIENT_ID = 'uid-extension-client';

// Memory store: token -> privateKey
const pendingKeys = new Map<string, CryptoKey>();
let activeSessionToken: string | null = null;

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ================= SESSION BINDING CLIENT =================

export class SessionBinding {
  async bindSession(sessionToken: string): Promise<string> {
    const fingerprint = await this.getDeviceFingerprint();
    const bindingKey = await this.hmac(fingerprint, sessionToken);

    const key = `binding_${sessionToken.slice(-16)}`;
    await chrome.storage.local.set({
      [key]: {
        bindingKey,
        createdAt: Date.now(),
      }
    });

    // Register with backend server
    try {
      await fetch(`${API_BASE}/session-binding/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ binding_key: bindingKey })
      });
    } catch (err) {
      console.error('[uid.one] Failed to register session binding on server:', err);
    }

    return bindingKey;
  }

  async getBindingHeader(sessionToken: string): Promise<string | null> {
    const key = `binding_${sessionToken.slice(-16)}`;
    const stored = await chrome.storage.local.get(key);

    if (!stored[key]) return null;

    const fingerprint = await this.getDeviceFingerprint();
    return await this.hmac(fingerprint, sessionToken);
  }

  private async getDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth?.toString() || '24',
      screen.width?.toString() || '1920',
      screen.height?.toString() || '1080',
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency?.toString() || '8',
    ];

    const raw = components.join('|');
    return await this.sha256(raw);
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hmac(keyStr: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(keyStr);
    const messageBuffer = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageBuffer
    );

    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

async function getActiveSessionToken(): Promise<string | null> {
  if (activeSessionToken) return activeSessionToken;
  const stored = await chrome.storage.local.get(['oneuid_access_token', 'identity_token']);
  const access = stored.oneuid_access_token as string | undefined;
  const identity = stored.identity_token as string | undefined;
  return access || identity || null;
}

// ================= OUTGOING REQUEST INTERCEPTOR =================

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // We cannot use await directly inside onBeforeSendHeaders if blocking is expected to run synchronously.
    // However, in Manifest V3, blocking requests require rules in declarativeNetRequest or we can run synchronously if the value is cached.
    // Let's resolve the cached session token sync-like or run the check:
    // To inject headers dynamically, we can use declarativeNetRequest or blocking webRequest in chrome.
    // Since webRequestBlocking is in permissions, we can block or modify headers.
    // In order to perform async storage lookup inside synchronous webRequest handler, we can keep the session token in RAM (activeSessionToken).
    if (activeSessionToken) {
      const binding = new SessionBinding();
      // Since screen/navigator fingerprinting doesn't change, we can cache the final binding header value in memory.
      // Let's retrieve from local storage and update memory cache.
      
      // Let's compute binding header value
      // Note: we can compute it asynchronously but update header dynamically.
      // A cleaner way in MV3 is using chrome.declarativeNetRequest to inject headers, but since we need session token binding,
      // let's do synchronous injection using a memory-cached binding header.
      const cachedHeaderKey = `cached_binding_header_${activeSessionToken.slice(-16)}`;
      chrome.storage.local.get(cachedHeaderKey).then(res => {
        if (res[cachedHeaderKey]) {
          // Already cached in storage
          return;
        }
        binding.getBindingHeader(activeSessionToken!).then(headerValue => {
          if (headerValue) {
            chrome.storage.local.set({ [cachedHeaderKey]: headerValue });
          }
        });
      });

      // Synchronously retrieve from memory if we loaded it, or wait for next.
      // To ensure it is injected, we check if we have it in storage.
      // As a fallback, we can read/cache it.
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["*://*.uid.one/*"] },
  ["requestHeaders", "extraHeaders"]
);

// We can also inject the header asynchronously using declarativeNetRequest dynamic rules!
// This is the modern, highly recommended MV3 way which is extremely reliable.
async function updateDeclarativeRules(token: string) {
  const binding = new SessionBinding();
  const headerValue = await binding.getBindingHeader(token);
  if (!headerValue) return;

  const ruleId = 1;
  const rule = {
    id: ruleId,
    priority: 1,
    action: {
      type: "modifyRequestHeader",
      requestHeaders: [
        {
          header: "X-UID-Session-Binding",
          operation: "set",
          value: headerValue
        }
      ]
    },
    condition: {
      urlFilter: "||uid.one",
      resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"]
    }
  };

  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
      addRules: [rule as any]
    });
    console.log('[uid.one] Declarative session rule set successfully.');
  } catch (err) {
    console.error('[uid.one] Failed to set declarative session rules:', err);
  }
}

// ================= CORE BACKGROUND HANDLERS =================

async function handleStartOOB(request: any) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const spkiBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = bufferToBase64(spkiBuffer);

  const res = await fetch(`${API_BASE}/challenges/request/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'QR',
      domain: request.domain,
      device: request.device,
      identifier: request.identifier,
      public_key: publicKeyBase64
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request challenge');

  if (data.token) {
    pendingKeys.set(data.token, keyPair.privateKey);
  }

  return data;
}

async function handlePollStatus(request: any) {
  const res = await fetch(`${API_BASE}/challenges/${request.token}/status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to poll status');

  if (data.status === 'APPROVED' && data.encrypted_payload) {
    const privateKey = pendingKeys.get(request.token);
    if (!privateKey) {
      throw new Error('Private key not found in memory for this challenge.');
    }

    try {
      const encryptedBuffer = base64ToBuffer(data.encrypted_payload);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBuffer
      );
      
      data.decrypted_password = new TextDecoder().decode(decryptedBuffer);
      
    } catch (e) {
      console.error('[uid.one] Decryption failed:', e);
      throw new Error('Failed to decrypt the payload. Invalid key or corrupted data.');
    } finally {
      pendingKeys.delete(request.token);
    }
  } else if (data.status === 'EXPIRED') {
    pendingKeys.delete(request.token);
  }

  return data;
}

async function handleSavePairing(request: any) {
  await chrome.storage.local.set({ 'identity_token': request.token });
  return { success: true };
}

async function handlePushRequest(request: any) {
  const identityToken = await getActiveSessionToken();
  if (!identityToken) {
    throw new Error('Device not paired. Please pair first.');
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["encrypt", "decrypt"]
  );
  const spkiBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = bufferToBase64(spkiBuffer);

  const res = await fetch(`${API_BASE}/challenges/request/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${identityToken}`
    },
    body: JSON.stringify({
      method: 'EXTENSION',
      domain: request.domain,
      public_key: publicKeyBase64
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request push');

  pendingKeys.set(data.token, keyPair.privateKey);
  return data;
}

// Initialize active token on start
getActiveSessionToken().then(token => {
  if (token) {
    activeSessionToken = token;
    updateDeclarativeRules(token);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_PAIRING') {
    getActiveSessionToken().then(token => sendResponse({ isPaired: !!token }));
    return true;
  }
  else if (request.type === 'INC_STAT') {
    const key = request.key;
    chrome.storage.local.get(key).then(res => {
      const current = (res[key] || 0) as number;
      chrome.storage.local.set({ [key]: current + 1 });
    });
    sendResponse({ success: true });
    return true;
  }
  else if (request.type === 'GET_STATS') {
    chrome.storage.local.get(['cookies_blocked', 'exif_stripped', 'otp_cleared', 'gpc_signals']).then(res => {
      sendResponse({
        cookies_blocked: res.cookies_blocked || 0,
        exif_stripped: res.exif_stripped || 0,
        otp_cleared: res.otp_cleared || 0,
        gpc_signals: res.gpc_signals || 0,
      });
    });
    return true;
  }
  else if (request.type === 'SET_SESSION_TOKEN') {
    const token = request.token;
    activeSessionToken = token;
    chrome.storage.local.set({ 'oneuid_access_token': token }).then(() => {
      const binding = new SessionBinding();
      binding.bindSession(token)
        .then(() => updateDeclarativeRules(token))
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.toString() }));
    });
    return true;
  }
  else if (request.type === 'START_OOB_AUTH') {
    handleStartOOB(request)
      .then(challenge => sendResponse({ success: true, challenge }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true; 
  } 
  else if (request.type === 'POLL_OOB_STATUS') {
    handlePollStatus(request)
      .then(data => sendResponse({ success: true, status: data.status, data }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true; 
  }
  else if (request.type === 'SAVE_PAIRING') {
    handleSavePairing(request)
      .then(data => sendResponse(data))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }
  else if (request.type === 'PUSH_REQUEST') {
    handlePushRequest(request)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }
  else if (request.action === 'POLL_STATUS') {
    handlePollStatus(request)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  else if (request.action === 'REQUEST_DIGITAL_SIGNATURE') {
    getActiveSessionToken().then(token => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(`${API_BASE}/challenges/request/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          method: 'DIGITAL_SIGNATURE',
          domain: request.domain,
          user_agent: request.user_agent,
          identifier: request.identifier,
          metadata: request.metadata
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        sendResponse({ success: true, data });
      })
      .catch(err => sendResponse({ success: false, error: err.message }));
    });
    return true;
  }
  else if (request.type === 'DECRYPT_PAYLOAD') {
    const privateKey = pendingKeys.get(request.token);
    if (!privateKey) {
      sendResponse({ success: false, error: 'Private key not found' });
      return true;
    }
    try {
      const encryptedBuffer = base64ToBuffer(request.encrypted_payload);
      crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedBuffer)
        .then(decryptedBuffer => {
          const password = new TextDecoder().decode(decryptedBuffer);
          pendingKeys.delete(request.token);
          sendResponse({ success: true, decrypted_password: password });
        })
        .catch(err => {
          console.error(err);
          sendResponse({ success: false, error: 'Decryption failed' });
        });
    } catch (e) {
      sendResponse({ success: false, error: 'Decryption setup failed' });
    }
    return true;
  }
  else if (request.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: request.title,
      message: request.message,
      priority: 2
    });
    sendResponse({ success: true });
    return true;
  }
  else if (request.type === 'AUDIT_COPY') {
    getActiveSessionToken().then(token => {
      if (!token) {
        console.warn('[uid.one] Audit failed: no active session token');
        sendResponse({ success: false, error: 'No active session' });
        return;
      }
      const auditUrl = `${API_BASE.replace('/auth', '/audit')}/copy/`;
      fetch(auditUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: request.domain,
          sensitive_type: request.sensitive_type,
          sample: request.sample,
          count: request.count,
          blocked: request.blocked
        })
      }).then(res => {
        if (!res.ok) {
          console.warn('[uid.one] Audit server returned status:', res.status);
        }
        sendResponse({ success: res.ok });
      }).catch(err => {
        console.error('[uid.one] Audit log network error:', err);
        sendResponse({ success: false, error: err.toString() });
      });
    });
    return true;
  }
});

// ================= CONTEXT MENUS INTEGRATION =================

chrome.runtime.onInstalled.addListener(() => {
  // Setup Context Menus
  chrome.contextMenus.create({
    id: "sign-pdf",
    title: "Sign PDF with UID.ONE",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "sign-text",
    title: "Sign selected text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "sign-pdf" && info.linkUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: "START_PDF_SIGNING",
      url: info.linkUrl
    });
  } else if (info.menuItemId === "sign-text" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "START_TEXT_SIGNING",
      text: info.selectionText
    });
  }
});
