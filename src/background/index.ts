/// <reference types="chrome"/>

const API_BASE = 'https://api.uid.one/v1/auth';
const CLIENT_ID = 'uid_extension_client';

// Memory store: token -> privateKey
const pendingKeys = new Map<string, CryptoKey>();

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

async function handleStartOOB(request: any) {
  const storageData = await chrome.storage.local.get(['access_token', 'refresh_token']);
  if (!storageData.access_token) {
    throw new Error('NOT_LOGGED_IN');
  }

  // 1. Generate Ephemeral RSA-OAEP Keypair
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

  // 2. Export Public Key to SPKI Base64
  const spkiBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = bufferToBase64(spkiBuffer);

  // 3. Send OOB Request with Public Key
  let res = await fetch(`${API_BASE}/challenges/request/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storageData.access_token}`
    },
    body: JSON.stringify({
      method: 'EXTENSION',
      domain: request.domain,
      device: request.device,
      identifier: request.identifier,
      public_key: publicKeyBase64
    })
  });

  // 3b. Handle Token Expiration
  if (res.status === 401 && storageData.refresh_token) {
    const refreshParams = new URLSearchParams();
    refreshParams.append('grant_type', 'refresh_token');
    refreshParams.append('client_id', CLIENT_ID);
    refreshParams.append('refresh_token', storageData.refresh_token as string);

    const refreshRes = await fetch(`https://api.uid.one/o/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: refreshParams
    });

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      await chrome.storage.local.set({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
      
      // Retry request
      res = await fetch(`${API_BASE}/challenges/request/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify({
          method: 'EXTENSION',
          domain: request.domain,
          device: request.device,
          identifier: request.identifier,
          public_key: publicKeyBase64
        })
      });
    } else {
      await chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email']);
      throw new Error('SESSION_EXPIRED');
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request challenge');

  // 4. Temporarily store the private key in RAM
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

  // 5. Decrypt the payload if approved
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'START_OOB_AUTH') {
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
  else if (request.type === 'OPEN_LOGIN_WINDOW') {
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 360,
      height: 480
    });
    sendResponse({ success: true });
    return true;
  }
});
