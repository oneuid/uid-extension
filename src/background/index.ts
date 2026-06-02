/// <reference types="chrome"/>

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'https://api.uid.one/v1/auth';

async function getApiBase(): Promise<string> {
  const res = await chrome.storage.local.get(['oneuid_api_base']);
  return res.oneuid_api_base || DEFAULT_API_BASE;
}

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
      const apiBase = await getApiBase();
      await fetch(`${apiBase}/session-binding/register/`, {
        method: 'POST',
        credentials: 'omit',
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
    const hasScreen = typeof screen !== 'undefined';
    const components = [
      navigator.userAgent,
      navigator.language,
      hasScreen ? screen.colorDepth?.toString() || '24' : '24',
      hasScreen ? screen.width?.toString() || '1920' : '1920',
      hasScreen ? screen.height?.toString() || '1080' : '1080',
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
    if (activeSessionToken) {
      const binding = new SessionBinding();
      const cachedHeaderKey = `cached_binding_header_${activeSessionToken.slice(-16)}`;
      chrome.storage.local.get(cachedHeaderKey).then(res => {
        if (res[cachedHeaderKey]) {
          return;
        }
        binding.getBindingHeader(activeSessionToken!).then(headerValue => {
          if (headerValue) {
            chrome.storage.local.set({ [cachedHeaderKey]: headerValue });
          }
        });
      });
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ["*://*.uid.one/*"] },
  ["requestHeaders", "extraHeaders"]
);

async function updateDeclarativeRules(token: string) {
  const binding = new SessionBinding();
  const headerValue = await binding.getBindingHeader(token);
  if (!headerValue) return;

  const ruleId = 1;
  const rule = {
    id: ruleId,
    priority: 1,
    action: {
      type: "modifyHeaders",
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

  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/challenges/request/`, {
    method: 'POST',
    credentials: 'omit',
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
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/challenges/${request.token}/status/`, {
    method: 'POST',
    credentials: 'omit',
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

async function handleApproveChallenge(token: string) {
  const identityToken = await getActiveSessionToken();
  if (!identityToken) {
    throw new Error('Device not paired. Please pair first.');
  }

  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/challenges/${token}/approve/`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${identityToken}`
    },
    body: JSON.stringify({})
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to approve challenge');
  return data;
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

  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/challenges/request/`, {
    method: 'POST',
    credentials: 'omit',
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

// Initialize active token on start with retry to handle Chrome SW registration races
async function initializeActiveTokenWithRetry(retries = 5, delay = 200): Promise<void> {
  try {
    const token = await getActiveSessionToken();
    if (token) {
      activeSessionToken = token;
      await updateDeclarativeRules(token);
      syncTokenToAgent(token);
    }
  } catch (err: any) {
    const errMsg = err.message || '';
    if (retries > 0 && (errMsg.includes('No SW') || errMsg.includes('context invalidated') || errMsg.includes('invalidated'))) {
      console.warn(`[uid.one] Startup initialization failed (${errMsg}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializeActiveTokenWithRetry(retries - 1, delay * 1.5);
    }
    console.error('[uid.one] Failed to initialize active token on startup:', err);
  }
}

initializeActiveTokenWithRetry();

function waitForChallengeApproval(token: string): Promise<any> {
  return new Promise((resolve) => {
    let resolved = false;
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    const cleanup = () => {
      resolved = true;
      if (ws) {
        try { ws.close(); } catch(e){}
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };

    const handleSuccess = (signature: string) => {
      if (resolved) return;
      cleanup();
      resolve({ success: true, signature });
    };

    const handleFailure = (error: string) => {
      if (resolved) return;
      cleanup();
      resolve({ success: false, error });
    };

    // 1. Setup WebSocket connection
    getApiBase().then(apiBase => {
      try {
        const wsBase = import.meta.env.VITE_WS_BASE || (apiBase.includes('api.uid.one') ? 'wss://api.uid.one' : 'ws://127.0.0.1:8001');
        const wsUrl = `${wsBase}/ws/challenges/${token}/`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status === 'APPROVED') {
              const signature = data.signature || data.encrypted_payload || 'DEMO_SIGNATURE_VALUE';
              handleSuccess(signature);
            } else if (data.status === 'REJECTED' || data.status === 'EXPIRED') {
              handleFailure(data.status.toLowerCase());
            }
          } catch (e) {
            console.error('[uid.one] WebSocket message parsing error:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[uid.one] WebSocket error, relying on polling fallback:', err);
        };
      } catch (e) {
        console.warn('[uid.one] Failed to initialize WebSocket, relying on polling fallback:', e);
      }
    });

    // 2. Setup Polling Fallback (runs every 2 seconds)
    pollInterval = setInterval(async () => {
      if (resolved) return;
      try {
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/challenges/${token}/status/`, {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, client_id: CLIENT_ID })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'APPROVED') {
          const signature = data.signature || data.encrypted_payload || 'DEMO_SIGNATURE_VALUE';
          handleSuccess(signature);
        } else if (data.status === 'REJECTED' || data.status === 'EXPIRED') {
          handleFailure(data.status.toLowerCase());
        }
      } catch (err) {
        console.error('[uid.one] Polling fallback error:', err);
      }
    }, 2000);

    // 3. Timeout after 5 minutes (300 seconds)
    setTimeout(() => {
      if (!resolved) {
        handleFailure('timeout');
      }
    }, 300000);
  });
}

function syncTokenToAgent(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    const payload = JSON.parse(decoded);
    
    const email = payload.email || payload.username || payload.sub || 'user@uid.one';
    const name = payload.name || payload.display_name || email.split('@')[0];
    const avatar = payload.picture || '';

    fetch('http://127.0.0.1:13013/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        user: { name, email, avatar }
      })
    }).catch(err => console.warn('[uid.one] Extension failed to sync to local agent:', err));
  } catch (e) {
    console.error('[uid.one] Error decoding token for agent sync:', e);
  }
}

function syncLogoutToAgent() {
  fetch('http://127.0.0.1:13013/auth/logout', { method: 'POST' })
    .catch(err => console.warn('[uid.one] Extension failed to sync logout to local agent:', err));
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'HEARTBEAT') {
    sendResponse({ success: true });
    return true;
  }
  else if (request.type === 'FETCH_AND_HASH_PDF') {
    fetch(request.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.arrayBuffer();
      })
      .then(arrayBuffer => crypto.subtle.digest('SHA-256', arrayBuffer))
      .then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        sendResponse({ success: true, hashHex });
      })
      .catch(err => {
        console.error('[uid.one] FETCH_AND_HASH_PDF failed:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  else if (request.type === 'CHECK_PAIRING') {
    getActiveSessionToken().then(token => sendResponse({ isPaired: !!token }));
    return true;
  }
  else if (request.type === 'GET_PROFILE') {
    chrome.storage.local.get(['oneuid_access_token', 'identity_token']).then(async (stored) => {
      const access = stored.oneuid_access_token as string | undefined;
      const identity = stored.identity_token as string | undefined;
      
      console.log('[uid.one] GET_PROFILE stored keys:', Object.keys(stored));
      
      let jwtToken: string | null = null;
      if (access && access.split('.').length >= 2) {
        jwtToken = access;
      } else if (identity && identity.split('.').length >= 2) {
        jwtToken = identity;
      }
      
      if (jwtToken) {
        try {
          const parts = jwtToken.split('.');
          const base64Url = parts[1];
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const decoded = atob(base64);
          const payload = JSON.parse(decoded);
          
          const exp = payload.exp;
          const now = Math.floor(Date.now() / 1000);
          if (exp && now >= exp) {
            console.warn('[uid.one] GET_PROFILE JWT token is expired.');
            chrome.storage.local.remove(['oneuid_access_token', 'identity_token']);
            sendResponse({ success: false, error: 'Session expired' });
            return;
          }
          
          const email = payload.email || payload.username || payload.sub || 'user@uid.one';
          console.log('[uid.one] GET_PROFILE JWT success:', email);
          sendResponse({ success: true, email, sub: payload.sub });
          return;
        } catch (err: any) {
          console.error('[uid.one] GET_PROFILE JWT parsing failed, falling back to API:', err.message);
        }
      }
      
      const opaqueToken = access || identity;
      if (!opaqueToken) {
        console.warn('[uid.one] GET_PROFILE failed: No active token found in storage.');
        sendResponse({ success: false, error: 'Not paired' });
        return;
      }
      
      try {
        console.log('[uid.one] Fetching profile from backend using token...');
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/me/`, {
          method: 'GET',
          credentials: 'omit',
          headers: {
            'Authorization': `Bearer ${opaqueToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            chrome.storage.local.remove(['oneuid_access_token', 'identity_token']);
          }
          throw new Error(`API returned status ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const email = data.email || data.username || 'user@uid.one';
        console.log('[uid.one] GET_PROFILE API success:', email);
        sendResponse({ success: true, email, sub: data.uuid || data.id || data.sub });
      } catch (err: any) {
        console.error('[uid.one] GET_PROFILE API fetch failed:', err.message);
        sendResponse({ success: false, error: `Failed to retrieve profile: ${err.message}` });
      }
    });
    return true;
  }
  else if (request.type === 'SET_CONTEXT_MENU_ENABLED') {
    const isEnabled = request.enabled !== false;
    chrome.contextMenus.update("sign-text", { enabled: isEnabled }, () => {
      if (chrome.runtime.lastError) {
        // Ignore error if menu item not registered yet
      }
    });
    chrome.contextMenus.update("sign-pdf", { enabled: isEnabled }, () => {
      if (chrome.runtime.lastError) {
        // Ignore error if menu item not registered yet
      }
    });
    chrome.contextMenus.update("sign-pdf-page", { enabled: isEnabled }, () => {
      if (chrome.runtime.lastError) {
        // Ignore error if menu item not registered yet
      }
    });
    sendResponse({ success: true });
    return false;
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
  else if (request.type === 'GET_USER_PUBKEY') {
    const identifier = request.identifier;
    getApiBase().then(async (apiBase) => {
      let res: Response | null = null;
      try {
        res = await fetch(`${apiBase}/users/${identifier}/pubkey/`, { credentials: 'omit' });
      } catch (e) {
        console.warn(`[uid.one] Fetch public key failed on ${apiBase}:`, e);
      }

      try {
        if ((!res || !res.ok) && apiBase !== 'https://api.uid.one/v1/auth') {
          console.log(`[uid.one] Key not found or fetch failed on ${apiBase}, trying production backend...`);
          res = await fetch(`https://api.uid.one/v1/auth/users/${identifier}/pubkey/`, { credentials: 'omit' });
        }
        if (!res || !res.ok) throw new Error('User public key not found');
        const data = await res.json();
        if (data.status === 'success' && data.public_key) {
          sendResponse({ success: true, publicKey: data.public_key });
        } else {
          sendResponse({ success: false, error: data.message || 'Key lookup failed' });
        }
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
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
    const origin = request.origin || '';
    
    let resolvedApiBase = import.meta.env.VITE_API_BASE || 'https://api.uid.one/v1/auth';
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('http://') || origin.includes(':3000')) {
      resolvedApiBase = 'http://127.0.0.1:8001/v1/auth';
    } else if (origin.includes('uid.one')) {
      resolvedApiBase = 'https://api.uid.one/v1/auth';
    }
    
    activeSessionToken = token;
    
    chrome.storage.local.set({ 
      'oneuid_access_token': token,
      'identity_token': token,
      'oneuid_api_base': resolvedApiBase
    }).then(() => {
      syncTokenToAgent(token);
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
  else if (request.action === 'APPROVE_CHALLENGE' || request.type === 'APPROVE_CHALLENGE') {
    handleApproveChallenge(request.token)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }
  else if (request.action === 'REQUEST_DIGITAL_SIGNATURE') {
    Promise.all([getActiveSessionToken(), getApiBase()]).then(([token, apiBase]) => {
      console.log('[uid.one] REQUEST_DIGITAL_SIGNATURE sending to:', `${apiBase}/challenges/request/`);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(`${apiBase}/challenges/request/`, {
        method: 'POST',
        credentials: 'omit',
        headers,
        body: JSON.stringify({
          method: 'DIGITAL_SIGNATURE',
          domain: request.domain,
          user_agent: request.user_agent,
          identifier: request.identifier,
          metadata: request.metadata,
          otp_code: request.otp_code
        })
      })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            chrome.storage.local.remove(['oneuid_access_token', 'identity_token']);
            throw new Error(chrome.i18n.getMessage("alertSessionExpired") || 'Session expired or not linked. Please log in to UID.one and click "Link Extension" to continue.');
          }
          return res.text().then(text => {
            let message = '';
            try {
              const errData = JSON.parse(text);
              message = errData.error || errData.detail || JSON.stringify(errData);
            } catch (e) {
              message = text || `HTTP Error ${res.status}: ${res.statusText}`;
            }
            throw new Error(message);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        
        if (data.signature) {
          sendResponse({ success: true, signature: data.signature, signer: data.signer });
          return;
        }
        
        waitForChallengeApproval(data.token)
          .then(result => {
            sendResponse(result);
          })
          .catch(err => {
            sendResponse({ success: false, error: err.message });
          });
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
    Promise.all([getActiveSessionToken(), getApiBase()]).then(([token, apiBase]) => {
      if (!token) {
        console.warn('[uid.one] Audit failed: no active session token');
        sendResponse({ success: false, error: 'No active session' });
        return;
      }
      const auditUrl = `${apiBase.replace('/auth', '/audit')}/copy/`;
      fetch(auditUrl, {
        method: 'POST',
        credentials: 'omit',
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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.oneuid_access_token) {
      const newValue = changes.oneuid_access_token.newValue as string | undefined;
      if (newValue) {
        syncTokenToAgent(newValue);
      } else {
        syncLogoutToAgent();
      }
    }
  }
});

// ================= CONTEXT MENUS INTEGRATION =================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sign-pdf",
    title: chrome.i18n.getMessage("contextMenuSignPdf") || "Sign PDF with UID.one",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "sign-pdf-page",
    title: chrome.i18n.getMessage("contextMenuSignPdf") || "Sign PDF with UID.one",
    contexts: ["page", "frame"],
    documentUrlPatterns: [
      "*://*/*.pdf",
      "*://*/*.pdf?*",
      "*://*/*.PDF",
      "*://*/*.PDF?*",
      "file://*/*.pdf",
      "file://*/*.PDF",
      "file:///*/*.pdf",
      "file:///*/*.PDF"
    ]
  });
  chrome.contextMenus.create({
    id: "sign-text",
    title: chrome.i18n.getMessage("contextMenuTitle") || "Sign text with UID.one",
    contexts: ["selection", "editable"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "sign-pdf" || info.menuItemId === "sign-pdf-page") {
    const pdfUrl = info.linkUrl || info.pageUrl || tab.url;
    if (pdfUrl) {
      if (pdfUrl.startsWith('file://')) {
        chrome.tabs.sendMessage(tab.id, {
          action: "FETCH_PDF_BYTES",
          url: pdfUrl
        }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            console.warn('[uid.one] Could not fetch local PDF bytes via content script, opening signer page with direct URL:', chrome.runtime.lastError?.message || response?.error);
            chrome.tabs.create({
              url: chrome.runtime.getURL(`pdf-signer.html?url=${encodeURIComponent(pdfUrl)}`)
            });
          } else {
            const cacheKey = `pdf_cache_${Date.now()}`;
            chrome.storage.local.set({ [cacheKey]: response.base64 }).then(() => {
              chrome.tabs.create({
                url: chrome.runtime.getURL(`pdf-signer.html?cacheKey=${cacheKey}&url=${encodeURIComponent(pdfUrl)}`)
              });
            });
          }
        });
      } else {
        chrome.tabs.create({
          url: chrome.runtime.getURL(`pdf-signer.html?url=${encodeURIComponent(pdfUrl)}`)
        });
      }
    }
  } else if (info.menuItemId === "sign-text") {
    chrome.tabs.sendMessage(tab.id, {
      action: "START_TEXT_SIGNING",
      text: info.selectionText || ""
    }).catch(err => {
      console.warn('[uid.one] Could not send START_TEXT_SIGNING message to tab (receiving end might not exist yet):', err);
    });
  }
});

chrome.tabs.onActivated.addListener(() => {
  chrome.contextMenus.update("sign-text", { enabled: true }, () => {
    if (chrome.runtime.lastError) {}
  });
  chrome.contextMenus.update("sign-pdf", { enabled: true }, () => {
    if (chrome.runtime.lastError) {}
  });
  chrome.contextMenus.update("sign-pdf-page", { enabled: true }, () => {
    if (chrome.runtime.lastError) {}
  });
});

function startAgentSyncPoller() {
  setInterval(async () => {
    try {
      const token = await getActiveSessionToken();
      if (!token) return;

      // Check if Agent is authenticated
      const res = await fetch('http://127.0.0.1:13013/auth/profile');
      if (res.ok) {
        const data = await res.json();
        if (!data.authenticated) {
          console.log('[uid.one] Agent is offline but extension has session. Syncing...');
          syncTokenToAgent(token);
        }
      }
    } catch (e) {
      // Agent is probably not running, ignore
    }
  }, 5000); // Check every 5 seconds
}

startAgentSyncPoller();

