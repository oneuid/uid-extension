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
  // 1. Generate local RSA-OAEP Key Pair
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

  // 3. Send OOB Request with Public Key (No auth required for QR)
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

// 1. Identity Token Management
async function getIdentityToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(['identity_token']);
  return (result.identity_token as string) || null;
}

async function handleSavePairing(request: any) {
  // Called by content script after polling indicates SUCCESS
  await chrome.storage.local.set({ 'identity_token': request.token });
  return { success: true };
}

// 3. Push Request (Number Matching)
async function handlePushRequest(request: any) {
  const identityToken = await getIdentityToken();
  if (!identityToken) {
    throw new Error('Device not paired. Please pair first.');
  }

  // Generate ephemeral Session Key
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
  return data; // Returns { token, match_number }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_PAIRING') {
    getIdentityToken().then(token => sendResponse({ isPaired: !!token }));
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
  else if (request.type === 'DECRYPT_PAYLOAD') {
    // Decrypt payload received via WebSocket in content script
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
});
