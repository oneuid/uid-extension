import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="auth-success" style="text-align: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">UID.ONE Passkey</h2>
    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">
      Extension is active. Click the fingerprint icon on any password field to authenticate via your mobile device.
    </p>
  </div>
`;
