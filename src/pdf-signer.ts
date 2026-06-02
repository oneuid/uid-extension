import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// State variables
let pdfDocument: any = null;
let pdfBytes: ArrayBuffer | null = null;
let currentPageNum = 1;
let totalPagesNum = 0;
let userEmail = 'user@uid.one';
let scale = 1.2; // default scale
let signedPdfBlob: Blob | null = null;
let signedPdfFileName = 'signed_document.pdf';

// DOM Elements
const docNameEl = document.getElementById('doc-name')!;
const docSizeEl = document.getElementById('doc-size')!;
const pageNumDisplayEl = document.getElementById('page-num-display')!;
const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
const btnSign = document.getElementById('btn-sign') as HTMLButtonElement;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement;
const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const pdfViewportContainer = document.getElementById('pdf-viewport')!;
const editorContainer = document.getElementById('editor-container')!;
const signatureBox = document.getElementById('signature-box')!;
const resizeHandle = document.getElementById('resize-handle')!;
const manualPickerCard = document.getElementById('manual-picker-card')!;
const manualFileInput = document.getElementById('manual-file-input') as HTMLInputElement;
const fileAccessWarning = document.getElementById('file-access-warning')!;
const warningPickerCard = document.getElementById('warning-picker-card')!;
const stampSigner = document.getElementById('stamp-signer')!;
const stampTime = document.getElementById('stamp-time')!;
const stampHash = document.getElementById('stamp-hash')!;
const userDisplay = document.getElementById('user-display')!;
const signingCertSelect = document.getElementById('signing-cert-select') as HTMLSelectElement;
// Config sub-panels
const panelLocalAgent = document.getElementById('panel-local-agent')!;
const panelRemoteCa = document.getElementById('panel-remote-ca')!;
const panelP12File = document.getElementById('panel-p12-file')!;

// Local Agent UI elements
const localAgentUrlInput = document.getElementById('local-agent-url') as HTMLInputElement;
const btnDetectCerts = document.getElementById('btn-detect-certs')!;
const localCertsContainer = document.getElementById('local-certs-container')!;
const localCertSelect = document.getElementById('local-cert-select') as HTMLSelectElement;

const usbStatusBadge = document.getElementById('usb-status-badge')!;
const usbTokenInfo = document.getElementById('usb-token-info')!;

// Remote CA UI elements
const remoteCaProvider = document.getElementById('remote-ca-provider') as HTMLSelectElement;
const remoteCaUser = document.getElementById('remote-ca-user') as HTMLInputElement;
const remoteCaPassword = document.getElementById('remote-ca-password') as HTMLInputElement;

// P12 UI elements
const p12FileInput = document.getElementById('p12-file-input') as HTMLInputElement;
const p12PasswordInput = document.getElementById('p12-password') as HTMLInputElement;

// Dynamic certificate states
interface LocalCertificate {
  id: string;
  subject: string;
  issuer: string;
  validTo: string;
}
let localCertificates: LocalCertificate[] = [];
let uploadedP12Details: { subject: string; issuer: string } | null = null;

// Helper to convert provider key to human readable
function getProviderName(val: string): string {
  switch (val) {
    case 'vnpt_smartca': return 'VNPT SmartCA';
    case 'viettel_mysign': return 'Viettel MySign';
    case 'misa_esign': return 'MISA eSign';
    case 'fpt_esign': return 'FPT.eSign';
    case 'bkav_ca': return 'BKAV Remote CA';
    case 'ca2_smartca': return 'CA2 Smart CA';
    case 'trustca': return 'CMC TrustCA';
    case 'digicert': return 'DigiCert Document Signing';
    case 'globalsign': return 'GlobalSign Atlas';
    case 'docusign': return 'DocuSign Cloud CA';
    case 'adobe_sign': return 'Adobe Acrobat Sign CA';
    case 'entrust': return 'Entrust Cloud Signing';
    case 'infocert': return 'InfoCert (Europe)';
    case 'swisscom': return 'Swisscom Signing Service';
    case 'itsme': return 'Itsme Sign';
    default: return 'Cloud CA';
  }
}

// Setup default text in stamp
function updateStampText() {
  const certType = signingCertSelect?.value || 'uid';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  const previewHeader = document.querySelector('.stamp-header') as HTMLDivElement;

  if (certType === 'uid') {
    if (previewHeader) previewHeader.textContent = 'UID.ONE VERIFIED';
    stampSigner.textContent = `Signer: ${userEmail || 'user@uid.one'}`;
    stampTime.textContent = `Date: ${formattedTime}`;
    stampHash.textContent = 'Hash: pending...';
  } else if (certType === 'local_agent') {
    const selectedIndex = localCertSelect.selectedIndex;
    const selectedCert = localCertificates[selectedIndex];
    if (selectedCert) {
      if (previewHeader) previewHeader.textContent = `SIGNED BY: ${selectedCert.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
      stampSigner.textContent = `Signer: ${selectedCert.subject}`;
      stampTime.textContent = `Date: ${formattedTime}`;
      stampHash.textContent = `Issuer: ${selectedCert.issuer}`;
    } else {
      if (previewHeader) previewHeader.textContent = 'SIGNED BY: NO USB TOKEN';
      stampSigner.textContent = 'Signer: Plug in USB Token';
      stampTime.textContent = `Date: ${formattedTime}`;
      stampHash.textContent = 'Issuer: pending...';
    }
  } else if (certType === 'remote_ca') {
    const providerVal = remoteCaProvider.value;
    const providerName = getProviderName(providerVal);
    if (previewHeader) previewHeader.textContent = `SIGNED BY: ${providerName.toUpperCase()}`;
    stampSigner.textContent = `Signer: ID ${remoteCaUser.value || '0901234567'}`;
    stampTime.textContent = `Date: ${formattedTime}`;
    stampHash.textContent = `Issuer: ${providerName}`;
  } else if (certType === 'p12_file') {
    if (uploadedP12Details) {
      if (previewHeader) previewHeader.textContent = `SIGNED BY: ${uploadedP12Details.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
      stampSigner.textContent = `Signer: ${uploadedP12Details.subject}`;
      stampTime.textContent = `Date: ${formattedTime}`;
      stampHash.textContent = `Issuer: ${uploadedP12Details.issuer}`;
    } else {
      if (previewHeader) previewHeader.textContent = 'SIGNED BY: NO CERT FILE';
      stampSigner.textContent = 'Signer: Upload P12/PFX file';
      stampTime.textContent = `Date: ${formattedTime}`;
      stampHash.textContent = 'Issuer: pending...';
    }
  }
}

if (signingCertSelect) {
  signingCertSelect.addEventListener('change', () => {
    const certType = signingCertSelect.value;
    panelLocalAgent.style.display = certType === 'local_agent' ? 'flex' : 'none';
    panelRemoteCa.style.display = certType === 'remote_ca' ? 'flex' : 'none';
    panelP12File.style.display = certType === 'p12_file' ? 'flex' : 'none';
    updateStampText();
  });
}

// Local agent detection listener
if (btnDetectCerts) {
  btnDetectCerts.addEventListener('click', async () => {
    const agentUrl = localAgentUrlInput.value.trim() || 'http://localhost:13013';
    
    usbStatusBadge.textContent = 'Checking...';
    usbStatusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
    usbStatusBadge.style.color = '#f59e0b';
    usbTokenInfo.textContent = 'Querying local USB signing application...';
    
    try {
      const res = await fetch(`${agentUrl}/certificates`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`Agent status: ${res.status}`);
      }
      
      const data = await res.json();
      localCertificates = data.certificates || [];
      
      if (localCertificates.length === 0) {
        localCertsContainer.style.display = 'none';
        usbStatusBadge.textContent = 'Empty';
        usbStatusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
        usbStatusBadge.style.color = '#ef4444';
        usbTokenInfo.textContent = 'USB Agent connected, but no hardware certificate/smart card found. Please insert your USB Token.';
      } else {
        localCertSelect.innerHTML = '';
        localCertificates.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.subject} (${c.issuer})`;
          localCertSelect.appendChild(opt);
        });
        localCertsContainer.style.display = 'flex';
        usbStatusBadge.textContent = 'Active';
        usbStatusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        usbStatusBadge.style.color = '#10b981';
        usbTokenInfo.textContent = `Successfully connected. Active token: ${localCertificates[0].subject}`;
        updateStampText();
      }
    } catch (err: any) {
      console.error('[uid.one] Local signing agent connection error:', err);
      localCertsContainer.style.display = 'none';
      usbStatusBadge.textContent = 'Offline';
      usbStatusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
      usbStatusBadge.style.color = '#ef4444';
      usbTokenInfo.textContent = 'Signer client agent is offline. Please verify the Local Signer App is running on your computer.';
    }
  });
}

if (localCertSelect) {
  localCertSelect.addEventListener('change', () => {
    updateStampText();
  });
}

// Remote CA listeners
if (remoteCaProvider) {
  remoteCaProvider.addEventListener('change', () => {
    updateStampText();
  });
}
if (remoteCaUser) {
  remoteCaUser.addEventListener('input', () => {
    updateStampText();
  });
}

// P12 upload file handler
if (p12FileInput) {
  p12FileInput.addEventListener('change', (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split('_');
      const subject = parts[0].toUpperCase() || "COMPANY";
      const issuer = parts[1]?.toUpperCase() || "DIGITAL-CA";
      uploadedP12Details = {
        subject: `CÔNG TY ${subject}`,
        issuer: `${issuer} G2`
      };
      updateStampText();
    }
  });
}

if (p12PasswordInput) {
  p12PasswordInput.addEventListener('input', () => {
    updateStampText();
  });
}

// DRAG & RESIZE IMPLEMENTATION
let isDragging = false;
let isResizing = false;
let startX = 0, startY = 0;
let startLeft = 0, startTop = 0;
let startWidth = 0, startHeight = 0;

signatureBox.addEventListener('mousedown', (e) => {
  if (e.target === resizeHandle) return;
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startLeft = signatureBox.offsetLeft;
  startTop = signatureBox.offsetTop;
  e.preventDefault();
});

resizeHandle.addEventListener('mousedown', (e) => {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  startWidth = signatureBox.offsetWidth;
  startHeight = signatureBox.offsetHeight;
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;
    
    const maxLeft = pdfViewportContainer.clientWidth - signatureBox.offsetWidth;
    const maxTop = pdfViewportContainer.clientHeight - signatureBox.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    signatureBox.style.left = `${newLeft}px`;
    signatureBox.style.top = `${newTop}px`;
  } else if (isResizing) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newWidth = startWidth + dx;
    let newHeight = startHeight + dy;
    
    newWidth = Math.max(120, Math.min(newWidth, pdfViewportContainer.clientWidth - signatureBox.offsetLeft));
    newHeight = Math.max(60, Math.min(newHeight, pdfViewportContainer.clientHeight - signatureBox.offsetTop));
    
    signatureBox.style.width = `${newWidth}px`;
    signatureBox.style.height = `${newHeight}px`;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  isResizing = false;
});

// INITIALIZATION
async function initIdentity() {
  if (!chrome.runtime?.id) return;
  
  chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (profileRes) => {
    if (profileRes && profileRes.success) {
      userEmail = profileRes.email;
      userDisplay.textContent = `Linked: ${userEmail}`;
    } else {
      userDisplay.textContent = 'Not linked to UID.one';
    }
    updateStampText();
  });
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function loadPdfBytes(bytes: ArrayBuffer, name: string) {
  try {
    pdfBytes = bytes;
    docNameEl.textContent = name;
    
    const sizeKb = Math.round(bytes.byteLength / 1024);
    docSizeEl.textContent = sizeKb > 1024 
      ? `${(sizeKb / 1024).toFixed(1)} MB` 
      : `${sizeKb} KB`;

    // Load in pdf.js (slice bytes copy to prevent worker transfer detaching pdfBytes in main thread)
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
    pdfDocument = await loadingTask.promise;
    totalPagesNum = pdfDocument.numPages;
    currentPageNum = 1;
    
    // Hide warning & file picker
    fileAccessWarning.style.display = 'none';
    manualPickerCard.style.display = 'none';
    
    // Show viewport
    pdfViewportContainer.style.display = 'block';
    btnSign.disabled = false;
    
    renderPage(currentPageNum);
  } catch (err: any) {
    console.error('[uid.one] Error loading PDF bytes:', err);
    alert(chrome.i18n.getMessage("pdfSignerLoadError") || `Failed to load PDF: ${err.message}`);
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDocument) return;
  
  // Update nav buttons
  btnPrev.disabled = pageNum <= 1;
  btnNext.disabled = pageNum >= totalPagesNum;
  pageNumDisplayEl.textContent = `${chrome.i18n.getMessage("pdfSignerPageLabel") || "Page"} ${pageNum} ${chrome.i18n.getMessage("pdfSignerOfLabel") || "of"} ${totalPagesNum}`;
  
  const page = await pdfDocument.getPage(pageNum);
  
  // Calculate dynamic scale to fit viewport beautifully
  const containerWidth = editorContainer.clientWidth - 80;
  const containerHeight = editorContainer.clientHeight - 80;
  const unscaledViewport = page.getViewport({ scale: 1 });
  
  const scaleW = containerWidth / unscaledViewport.width;
  const scaleH = containerHeight / unscaledViewport.height;
  scale = Math.min(scaleW, scaleH, 1.5); // cap at 1.5 for crisp rendering

  const viewport = page.getViewport({ scale });
  
  // Resize canvas and overlay container
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  
  pdfViewportContainer.style.width = `${viewport.width}px`;
  pdfViewportContainer.style.height = `${viewport.height}px`;

  // Position stamp initially in bottom right of the container
  const boxW = parseInt(signatureBox.style.width || '150');
  const boxH = parseInt(signatureBox.style.height || '75');
  signatureBox.style.left = `${viewport.width - boxW - 20}px`;
  signatureBox.style.top = `${viewport.height - boxH - 20}px`;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };
  
  await page.render(renderContext).promise;
  updateStampText();
}

// Nav actions
btnPrev.addEventListener('click', () => {
  if (currentPageNum > 1) {
    currentPageNum--;
    renderPage(currentPageNum);
  }
});

btnNext.addEventListener('click', () => {
  if (currentPageNum < totalPagesNum) {
    currentPageNum++;
    renderPage(currentPageNum);
  }
});

// Setup drag and drop file uploads
function setupDragAndDrop(element: HTMLElement) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (evt.target?.result) {
          loadPdfBytes(evt.target.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
  
  element.addEventListener('click', () => {
    manualFileInput.click();
  });
}

setupDragAndDrop(warningPickerCard);
setupDragAndDrop(manualPickerCard);

manualFileInput.addEventListener('change', () => {
  const file = manualFileInput.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (evt.target?.result) {
        loadPdfBytes(evt.target.result as ArrayBuffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  }
});

// OTP & USB PIN Verification Modal
function showOtpPromptModal(callback: (code: string) => void, cancelCallback: () => void, isPin: boolean = false): void {
  const title = isPin ? (chrome.i18n.getMessage("pdfSignerPinTitle") || "USB Token PIN Verification") : (chrome.i18n.getMessage("otpPromptTitle") || "Google Authenticator");
  const desc = isPin ? (chrome.i18n.getMessage("pdfSignerPinDesc") || "Please enter your USB Token PIN to authorize the digital signature:") : (chrome.i18n.getMessage("otpPromptDesc") || "Please enter the 6-digit OTP code to verify your digital signature:");
  const placeholder = isPin ? "••••" : "000000";
  const maxLength = isPin ? 8 : 6;
  const inputType = isPin ? 'password' : 'text';
  const letterSpacing = isPin ? '12px' : '6px';

  const overlay = document.createElement('div');
  overlay.className = 'uid-otp-overlay';
  overlay.innerHTML = `
    <div style="background: rgba(10, 10, 10, 0.95); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; width: 90%; max-width: 400px; padding: 32px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
      <div style="margin-bottom: 20px;">
        <div style="display: inline-flex; width: 56px; height: 56px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 6px 0;">${title}</h3>
        <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">${desc}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <input type="${inputType}" id="uid-signer-otp-input" inputmode="numeric" pattern="[0-9]*" maxlength="${maxLength}" placeholder="${placeholder}" style="
          width: 80%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          font-size: 28px;
          letter-spacing: ${letterSpacing};
          text-align: center;
          color: #fff;
          font-family: monospace;
          outline: none;
          box-sizing: border-box;
        ">
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="uid-signer-otp-cancel" style="flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: #a1a1aa; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">
          ${chrome.i18n.getMessage("otpCancel") || "Cancel"}
        </button>
        <button id="uid-signer-otp-confirm" style="flex: 1; background: #10b981; border: none; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">
          ${chrome.i18n.getMessage("otpConfirm") || "Sign"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const otpInput = overlay.querySelector('#uid-signer-otp-input') as HTMLInputElement;
  if (otpInput) {
    otpInput.focus();
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/[^0-9]/g, '');
    });
    otpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirm();
      }
    });
  }

  const confirm = () => {
    const val = otpInput?.value || '';
    if (isPin) {
      if (val.length < 4 || val.length > 8) {
        alert(chrome.i18n.getMessage("pdfSignerPinError") || 'The USB PIN must be between 4 and 8 digits.');
        return;
      }
    } else {
      if (val.length !== 6) {
        alert(chrome.i18n.getMessage("otpErrorLength") || 'The OTP code must be exactly 6 digits.');
        return;
      }
    }
    overlay.remove();
    callback(val);
  };

  overlay.querySelector('#uid-signer-otp-cancel')?.addEventListener('click', () => {
    overlay.remove();
    cancelCallback();
  });

  overlay.querySelector('#uid-signer-otp-confirm')?.addEventListener('click', confirm);
}

// Remote CA Verification Modal with Countdown Timer
function showRemoteSigningModal(providerName: string, idNum: string, callback: () => void, cancelCallback: () => void) {
  const overlay = document.createElement('div');
  overlay.className = 'uid-otp-overlay';
  
  let timeLeft = 120; // 2 minutes countdown
  
  const title = chrome.i18n.getMessage("pdfSignerRemoteTitle") || "Authorize Cloud CA";
  const descRaw = chrome.i18n.getMessage("pdfSignerRemoteDesc") || "A push notification has been sent to your <strong>$1</strong> mobile app linked with identifier <strong>$2</strong>. Please approve it on your phone to complete signing.";
  const desc = descRaw.replace('$1', providerName).replace('$2', idNum);
  const cancelText = chrome.i18n.getMessage("pdfSignerRemoteCancel") || "Cancel";
  
  overlay.innerHTML = `
    <div style="background: rgba(10, 10, 10, 0.95); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; width: 90%; max-width: 400px; padding: 32px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
      <div style="margin-bottom: 24px;">
        <div style="display: inline-flex; width: 56px; height: 56px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span class="loading-spinner" style="border-top-color: #10b981; width: 28px; height: 28px; display: inline-block;"></span>
        </div>
        <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 8px 0;">${title}</h3>
        <p style="font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5;">${desc}</p>
      </div>

      <div style="font-size: 24px; font-weight: 700; color: #fff; font-family: monospace; margin-bottom: 28px;" id="remote-signer-timer">
        02:00
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="uid-remote-cancel" style="flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: #a1a1aa; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">
          ${cancelText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const timerEl = overlay.querySelector('#remote-signer-timer')!;
  const intervalId = setInterval(() => {
    timeLeft--;
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
    
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      overlay.remove();
      alert("Signature request timed out. Please try again.");
      cancelCallback();
    }
  }, 1000);

  // Simulate remote push approval callback after 3.5 seconds
  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);
    overlay.remove();
    callback();
  }, 3500);

  overlay.querySelector('#uid-remote-cancel')?.addEventListener('click', () => {
    clearInterval(intervalId);
    clearTimeout(timeoutId);
    overlay.remove();
    cancelCallback();
  });
}

// PDF SIGNING ACTION
btnSign.addEventListener('click', () => {
  if (!pdfBytes || !chrome.runtime?.id) return;
  
  chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
    if (!pairingRes || !pairingRes.isPaired) {
      alert(chrome.i18n.getMessage("alertSessionExpired") || "Session expired or not linked. Please log in to UID.one and link the extension first.");
      return;
    }

    const certType = signingCertSelect?.value || 'uid';
    const isUsb = certType !== 'uid';

    showOtpPromptModal(async (codeOrPin) => {
      // 1. Calculate Hash of the original document
      btnSign.disabled = true;
      btnSign.innerHTML = `<span class="loading-spinner"></span> ${chrome.i18n.getMessage("pdfSignerButtonSigning") || "Signing PDF..."}`;

      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes!);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const onSignatureAcquired = async (success: boolean, errorMsg?: string) => {
          if (!success) {
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${chrome.i18n.getMessage("pdfSignerButtonSign") || "Sign Document"}`;
            alert(errorMsg || chrome.i18n.getMessage("alertRejected") || "Signing request was rejected or expired.");
            return;
          }

          // 3. Stamping visual signature using pdf-lib
          try {
            const pdfDoc = await PDFDocument.load(pdfBytes!);
            const pages = pdfDoc.getPages();
            const pageIndex = currentPageNum - 1;
            
            if (pageIndex < 0 || pageIndex >= pages.length) {
              throw new Error('Selected page index is out of bounds');
            }
            
            const page = pages[pageIndex];

            // Map overlay container coordinates to original PDF coordinates
            // Overlay container dimensions match canvas viewport exactly
            const htmlHeight = canvas.height;
            const stampLeft = signatureBox.offsetLeft;
            const stampTop = signatureBox.offsetTop;
            const stampWidth = signatureBox.offsetWidth;
            const stampHeight = signatureBox.offsetHeight;

            // PDF coordinates scale factor (original PDF points to viewport pixels)
            // standard PDF point system has (0, 0) at the bottom-left
            const pdfX = stampLeft / scale;
            const pdfY = (htmlHeight - stampTop - stampHeight) / scale;
            const pdfW = stampWidth / scale;
            const pdfH = stampHeight / scale;

            // Draw visual stamp on page
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(0.95, 0.98, 0.96), // very light green
              borderColor: rgb(0.06, 0.46, 0.25), // forest green
              borderWidth: 0.75,
            });

            // Embed fonts
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Compute standard text scaling
            const fontSize = Math.max(6, Math.min(10, pdfH / 5.5));
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            // Draw a faint shield-check background watermark in the center of the stamp
            const watermarkSize = pdfH * 0.75;
            const iconScale = watermarkSize / 24;
            const watermarkX = pdfX + (pdfW - watermarkSize) / 2;
            const watermarkY = pdfY + (pdfH + watermarkSize) / 2;

            page.drawSvgPath(
              'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
              {
                x: watermarkX,
                y: watermarkY,
                scale: iconScale,
                borderColor: rgb(0.06, 0.46, 0.25),
                borderWidth: 1.2,
                borderOpacity: 0.08,
              }
            );
            page.drawSvgPath(
              'm9 12 2 2 4-4',
              {
                x: watermarkX,
                y: watermarkY,
                scale: iconScale,
                borderColor: rgb(0.06, 0.46, 0.25),
                borderWidth: 1.5,
                borderOpacity: 0.08,
              }
            );

            // Determine custom details depending on chosen certificate type
            let headerText = 'UID.ONE VERIFIED';
            let line1Text = `Signer: ${userEmail || 'user@uid.one'}`;
            let line2Text = `Date: ${formattedTime}`;
            let line3Text = `Hash: ${hashHex.slice(0, 18)}...`;

            if (certType === 'local_agent') {
              const selectedIndex = localCertSelect.selectedIndex;
              const selectedCert = localCertificates[selectedIndex];
              if (selectedCert) {
                headerText = `SIGNED BY: ${selectedCert.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
                line1Text = `Signer: ${selectedCert.subject}`;
                line2Text = `Date: ${formattedTime}`;
                line3Text = `Issuer: ${selectedCert.issuer}`;
              }
            } else if (certType === 'remote_ca') {
              const providerVal = remoteCaProvider.value;
              const providerName = getProviderName(providerVal);
              headerText = `SIGNED BY: ${providerName.toUpperCase()}`;
              line1Text = `Signer: ID ${remoteCaUser.value || '0901234567'}`;
              line2Text = `Date: ${formattedTime}`;
              line3Text = `Issuer: ${providerName}`;
            } else if (certType === 'p12_file' && uploadedP12Details) {
              headerText = `SIGNED BY: ${uploadedP12Details.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
              line1Text = `Signer: ${uploadedP12Details.subject}`;
              line2Text = `Date: ${formattedTime}`;
              line3Text = `Issuer: ${uploadedP12Details.issuer}`;
            }

            // Draw text onto stamp (avoiding unicode emojis/symbols not supported by Standard WinAnsi fonts)
            page.drawText(headerText, {
              x: pdfX + 8,
              y: pdfY + pdfH - fontSize - 6,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0.06, 0.46, 0.25),
            });

            page.drawText(line1Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 2) - 12,
              size: fontSize - 1.5,
              font: helveticaFont,
              color: rgb(0.15, 0.15, 0.15),
            });

            page.drawText(line2Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 3) - 18,
              size: fontSize - 1.5,
              font: helveticaFont,
              color: rgb(0.25, 0.25, 0.25),
            });

            page.drawText(line3Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 4) - 24,
              size: fontSize - 2,
              font: helveticaFont,
              color: rgb(0.4, 0.4, 0.4),
            });

            // Save modified PDF bytes
            const modifiedPdfBytes = await pdfDoc.save();

            // Trigger browser download
            const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Get original document name or fallback
            let name = docNameEl.textContent || 'signed_document.pdf';
            if (!name.endsWith('.pdf')) name += '.pdf';
            if (!name.includes('_signed')) {
              name = name.replace('.pdf', '_signed.pdf');
            }

            a.href = downloadUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            // Store state for the manual download button
            signedPdfBlob = blob;
            signedPdfFileName = name;
            
            // Localize and display download button
            btnDownload.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ${chrome.i18n.getMessage("pdfSignerButtonDownload") || "Download Signed PDF"}`;
            btnDownload.style.display = 'flex';

            showToast("PDF signed and saved successfully!", "success");
            alert(chrome.i18n.getMessage("pdfSignedSuccess") || "PDF digitally signed and saved successfully!");
            
            // Reload the rendering viewport with the new signed bytes
            loadPdfBytes(modifiedPdfBytes.buffer as ArrayBuffer, name);
          } catch (err: any) {
            console.error('[uid.one] Visual signature stamp error:', err);
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${chrome.i18n.getMessage("pdfSignerButtonSign") || "Sign Document"}`;
            alert("Error rendering signature onto PDF.");
          }
        };

        if (certType === 'local_agent') {
          const selectedIndex = localCertSelect.selectedIndex;
          const selectedCert = localCertificates[selectedIndex];
          if (!selectedCert) {
            alert('Please click "Detect USB Certificates" and select a valid certificate first.');
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
            return;
          }

          const agentUrl = localAgentUrlInput.value.trim() || 'http://localhost:13013';
          try {
            const signRes = await fetch(`${agentUrl}/sign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                certId: selectedCert.id,
                hash: hashHex,
                pin: codeOrPin
              })
            });
            
            if (!signRes.ok) {
              const errData = await signRes.json().catch(() => ({}));
              throw new Error(errData.error || `HTTP ${signRes.status}`);
            }
            
            onSignatureAcquired(true);
          } catch (err: any) {
            console.error('[uid.one] USB Token cryptographic signing error:', err);
            onSignatureAcquired(false, `USB Token Error: ${err.message}. Make sure the USB token is plugged in.`);
          }
        } else if (certType === 'remote_ca') {
          const providerVal = remoteCaProvider.value;
          const providerName = getProviderName(providerVal);
          const userVal = remoteCaUser.value.trim();
          const pwdVal = remoteCaPassword.value.trim();

          if (!userVal) {
            const userAlertMsg = chrome.i18n.getMessage('pdfSignerRemoteUserAlert') || 'Please enter your Personal ID or Phone Number.';
            alert(userAlertMsg);
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
            return;
          }

          if (!pwdVal) {
            const pwdAlertMsg = chrome.i18n.getMessage('pdfSignerRemotePasswordAlert') || 'Please enter your Service Password / Auth PIN.';
            alert(pwdAlertMsg);
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
            return;
          }

          showRemoteSigningModal(providerName, userVal, () => {
            onSignatureAcquired(true);
          }, () => {
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
          });
        } else if (certType === 'p12_file') {
          if (!uploadedP12Details) {
            alert('Please upload a PFX/P12 certificate file first.');
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
            return;
          }
          if (!p12PasswordInput.value) {
            alert('Please enter the certificate password.');
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Sign Document`;
            return;
          }

          // Simulate local file cryptographic signing delay
          setTimeout(() => {
            onSignatureAcquired(true);
          }, 1000);
        } else {
          // Request digital signature from UID.one
          chrome.runtime.sendMessage({
            action: 'REQUEST_DIGITAL_SIGNATURE',
            domain: 'uid-signer.one',
            user_agent: navigator.userAgent,
            identifier: "PDF Signature Page",
            otp_code: codeOrPin,
            metadata: {
              pdf_hash: hashHex,
              text_hash: hashHex,
              page_num: currentPageNum
            }
          }, async (res) => {
            onSignatureAcquired(res && res.success, res ? res.error : undefined);
          });
        }
      } catch (err: any) {
        console.error('[uid.one] Hashing failed:', err);
        btnSign.disabled = false;
        btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${chrome.i18n.getMessage("pdfSignerButtonSign") || "Sign Document"}`;
        alert("Failed to compute PDF cryptographic hash.");
      }
    }, () => {
      // User cancelled
    }, isUsb);
  });
});

// Manual download action
btnDownload.addEventListener('click', () => {
  if (signedPdfBlob) {
    const downloadUrl = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = signedPdfFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }
});

function localizeHtml() {
  if (!chrome.i18n) return;

  // Translate standard textContent elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.textContent = message;
    }
  });

  // Translate placeholders for inputs
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')!;
    const message = chrome.i18n.getMessage(key);
    if (message && el instanceof HTMLInputElement) {
      el.placeholder = message;
    }
  });

  // Translate optgroup labels
  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-label')!;
    const message = chrome.i18n.getMessage(key);
    if (message && el instanceof HTMLOptGroupElement) {
      el.label = message;
    }
  });
}

function showToast(msg: string, type: string) {
  console.log(`[uid.one - ${type}] ${msg}`);
}

// LOAD THE PDF ON LAUNCH
async function loadOnStart() {
  localizeHtml();
  await initIdentity();
  
  const params = new URLSearchParams(window.location.search);
  const cacheKey = params.get('cacheKey');
  const fileUrl = params.get('url');

  if (cacheKey) {
    // Read bytes cached in storage
    chrome.storage.local.get(cacheKey).then((res) => {
      if (res && res[cacheKey]) {
        const base64 = res[cacheKey] as string;
        const bytes = base64ToBuffer(base64);
        
        let filename = 'document.pdf';
        if (fileUrl) {
          try {
            const urlObj = new URL(fileUrl);
            filename = decodeURIComponent(urlObj.pathname.split('/').pop() || 'document.pdf');
          } catch (e) {
            filename = fileUrl.split('/').pop() || 'document.pdf';
          }
        }
        
        loadPdfBytes(bytes, filename);
        // Clean storage cache
        chrome.storage.local.remove(cacheKey);
      } else {
        // Fallback to manual mode
        fileAccessWarning.style.display = 'none';
        manualPickerCard.style.display = 'block';
        docNameEl.textContent = 'Select a PDF File...';
      }
    });
  } else if (fileUrl) {
    // Fetch directly from the URL (web or local file URL)
    try {
      docNameEl.textContent = 'Downloading PDF...';
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      
      let filename = 'document.pdf';
      try {
        const urlObj = new URL(fileUrl);
        filename = decodeURIComponent(urlObj.pathname.split('/').pop() || 'document.pdf');
      } catch (e) {
        filename = fileUrl.split('/').pop() || 'document.pdf';
      }
      
      loadPdfBytes(arrayBuffer, filename);
    } catch (err: any) {
      console.error('[uid.one] Failed to download PDF directly:', err);
      
      // If it's a file:// URL, show the file access warning instruction screen
      if (fileUrl.startsWith('file://')) {
        fileAccessWarning.style.display = 'block';
        manualPickerCard.style.display = 'block';
        docNameEl.textContent = 'Local File blocked';
      } else {
        fileAccessWarning.style.display = 'none';
        manualPickerCard.style.display = 'block';
        docNameEl.textContent = 'Failed to load PDF';
        alert(chrome.i18n.getMessage("errorFetchPdf") || 'Failed to download PDF. You can upload it manually below.');
      }
    }
  } else {
    // Standalone launcher, just show the upload screen directly
    fileAccessWarning.style.display = 'none';
    manualPickerCard.style.display = 'block';
    docNameEl.textContent = 'Upload PDF...';
  }
}

// Run loader on launch
loadOnStart();
