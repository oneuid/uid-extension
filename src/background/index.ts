/// <reference types="chrome"/>

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Lắng nghe messages từ Content Script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SAVE_CREDENTIALS') {
    handleSaveCredentials(request).then(() => sendResponse({ success: true }));
    return true;
  } 
  else if (request.type === 'CHECK_CREDENTIALS') {
    chrome.storage.local.get(null).then((result) => {
      // Check if any vault exists for this domain
      const prefix = `vault_${request.domain}_`;
      const hasCredentials = Object.keys(result).some(key => key.startsWith(prefix));
      sendResponse({ hasCredentials });
    });
    return true;
  } 
  else if (request.type === 'GET_AUTH_OPTIONS') {
    const key = `vault_${request.domain}_${request.username}`;
    chrome.storage.local.get([key]).then((result) => {
      const vault = result[key] as any;
      if (vault) {
        // Trả về salt đã lưu để Content Script gọi WebAuthn PRF
        sendResponse({ 
          challenge: Array.from(crypto.getRandomValues(new Uint8Array(32))), 
          salt: Array.from(new Uint8Array(base64ToBuffer(vault.saltBase64))) 
        });
      } else {
        sendResponse({ error: 'No vault found for this username' });
      }
    });
    return true;
  } 
  else if (request.type === 'DECRYPT_VAULT') {
    handleDecryptVault(request)
      .then(credentials => sendResponse({ success: true, credentials }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleSaveCredentials(request: any) {
  const encoder = new TextEncoder();
  
  // 1. Giả lập tạo WebAuthn Passkey mới -> Lấy ra PRF Key (Mock)
  const prfKey = new Uint8Array(32);
  crypto.getRandomValues(prfKey);
  
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);

  // 2. Dùng PRF Key làm khoá AES-GCM 256-bit
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    prfKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // 3. Mã hoá mật khẩu (Vault)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedPasswordBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(request.password)
  );

  // 4. Lưu vào storage với key chứa cả domain và username
  const vaultData = {
    username: request.username,
    encryptedPasswordBase64: bufferToBase64(encryptedPasswordBuffer),
    ivBase64: bufferToBase64(iv.buffer),
    saltBase64: bufferToBase64(salt.buffer),
    // Lưu tạm prfKey để mock test
    mockPrfKeyBase64: bufferToBase64(prfKey.buffer) 
  };

  const key = `vault_${request.domain}_${request.username}`;
  await chrome.storage.local.set({ [key]: vaultData });
  console.log(`[uid.one] Saved encrypted vault for ${key}`);
}

async function handleDecryptVault(request: any) {
  const key = `vault_${request.domain}_${request.username}`;
  const result = await chrome.storage.local.get([key]);
  const vault = result[key] as any;
  if (!vault) throw new Error("Vault not found for this username");

  const prfKey = new Uint8Array(base64ToBuffer(vault.mockPrfKeyBase64));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    prfKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const iv = new Uint8Array(base64ToBuffer(vault.ivBase64));
  const encryptedPassword = base64ToBuffer(vault.encryptedPasswordBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedPassword
  );

  const decoder = new TextDecoder();
  return {
    username: vault.username,
    password: decoder.decode(decryptedBuffer)
  };
}
