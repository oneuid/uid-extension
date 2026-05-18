import './style.css'

const API_BASE = "https://api.uid.one";
const CLIENT_ID = "uid_extension_client";

async function checkAuth() {
  const data = await chrome.storage.local.get(['access_token', 'user_email']);
  if (data.access_token) {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="auth-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">Vault Connected</h2>
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">Logged in as: <strong>${data.user_email || 'Active'}</strong></p>
        <button id="logout" class="btn btn-outline" style="width: 100%;">Disconnect Vault</button>
      </div>
    `;

    document.getElementById('logout')?.addEventListener('click', () => {
      chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email'], () => {
        checkAuth();
      });
    });
  } else {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="auth-form">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; margin-left: auto; margin-right: auto; display: block;">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h2 style="text-align: center; margin: 0 0 24px 0; color: #0f172a; font-size: 18px;">Unlock UID Passkey</h2>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 12px;">
          <input type="email" id="email" placeholder="Email address" required class="input" />
          <input type="password" id="password" placeholder="Master Password" required class="input" />
          <button type="submit" class="btn btn-primary" id="loginBtn" style="margin-top: 8px;">Connect to UID.ONE</button>
          <div id="errorMsg" style="color: #ef4444; font-size: 13px; text-align: center; display: none; margin-top: 8px;"></div>
        </form>
      </div>
    `;

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      const btn = document.getElementById('loginBtn') as HTMLButtonElement;
      const errorMsg = document.getElementById('errorMsg') as HTMLDivElement;
      
      btn.textContent = "Connecting...";
      btn.disabled = true;
      errorMsg.style.display = 'none';

      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', CLIENT_ID);
        params.append('username', email);
        params.append('password', password);

        const res = await fetch(`${API_BASE}/o/token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        });

        const data = await res.json();
        
        if (res.ok && data.access_token) {
          await chrome.storage.local.set({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user_email: email
          });
          checkAuth();
        } else {
          errorMsg.textContent = data.error_description || data.error || "Invalid credentials.";
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        errorMsg.textContent = "Network error connecting to UID.ONE";
        errorMsg.style.display = 'block';
      } finally {
        btn.textContent = "Connect to UID.ONE";
        btn.disabled = false;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', checkAuth);
