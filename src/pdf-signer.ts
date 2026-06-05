import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import signpdf, { Signer } from '@signpdf/signpdf';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import * as forge from 'node-forge';
import { Buffer } from 'buffer';

(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

class AgentSigner extends Signer {
  private certHex: string;
  private certId: string;
  private pin: string;
  private agentUrl: string;

  constructor(certHex: string, certId: string, pin: string, agentUrl: string) {
    super();
    this.certHex = certHex;
    this.certId = certId;
    this.pin = pin;
    this.agentUrl = agentUrl;
  }

  async sign(pdfBuffer: Buffer, signingTime?: Date): Promise<Buffer> {
    const pdfForgeBuffer = forge.util.createBuffer(pdfBuffer.toString('binary' as any), 'binary' as any);
    const p7 = forge.pkcs7.createSignedData();
    p7.content = pdfForgeBuffer;

    const certDerBytes = forge.util.hexToBytes(this.certHex);
    const asn1 = forge.asn1.fromDer(certDerBytes);
    const cert = forge.pki.certificateFromAsn1(asn1);

    p7.addCertificate(cert);

    const agentUrl = this.agentUrl;
    const certId = this.certId;
    const pin = this.pin;

    p7.addSigner({
      key: {
        sign: async (md: any) => {
          const digestBytes = md.digest().bytes();
          const digestHex = forge.util.bytesToHex(digestBytes);

          const signRes = await fetch(`${agentUrl}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              certId: certId,
              hash: digestHex,
              pin: pin
            })
          });

          if (!signRes.ok) {
            throw new Error(`Agent signing HTTP error: ${signRes.status}`);
          }

          const signData = await signRes.json();
          if (!signData.success) {
            throw new Error(signData.error || 'Agent signing failed');
          }

          const sigBytes = forge.util.hexToBytes(signData.signature);
          return sigBytes;
        }
      } as any,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: (signingTime || new Date()) as any }
      ]
    });

    p7.sign({ detached: true });

    (p7 as any).signerInfos = await Promise.all(
      (p7 as any).signerInfos.map(async (signerInfo: any) => {
        signerInfo.value = await Promise.all(
          signerInfo.value.map(async (val: any) => {
            val.value = await val.value;
            return val;
          })
        );
        return signerInfo;
      })
    );

    (p7 as any).signers = await Promise.all(
      (p7 as any).signers.map(async (p7Signer: any) => {
        p7Signer.signature = await p7Signer.signature;
        return p7Signer;
      })
    );

    const der = forge.asn1.toDer(p7.toAsn1());
    const signatureDerBytes = der.bytes();

    return Buffer.from(signatureDerBytes, 'binary');
  }
}

class LocalP12Signer extends Signer {
  private customPrivateKey: any;
  private customCert: any;
  private p12Asn1: any;
  private password: string;

  constructor(customPrivateKey: any, customCert: any, p12Asn1: any = null, password: string = '') {
    super();
    this.customPrivateKey = customPrivateKey;
    this.customCert = customCert;
    this.p12Asn1 = p12Asn1;
    this.password = password;
  }

  async sign(pdfBuffer: Buffer, signingTime?: Date): Promise<Buffer> {
    let privateKey = this.customPrivateKey;
    let cert = this.customCert;

    if (this.p12Asn1) {
      const p12 = forge.pkcs12.pkcs12FromAsn1(this.p12Asn1, false, this.password);
      
      let keyBag: any = null;
      let certBag: any = null;
      
      const keyBags = (p12 as any).getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
      if (keyBags && keyBags.length > 0) {
        keyBag = keyBags[0];
      }
      
      if (!keyBag) {
        const shroudedKeyBags = (p12 as any).getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
        if (shroudedKeyBags && shroudedKeyBags.length > 0) {
          keyBag = shroudedKeyBags[0];
        }
      }

      const certBags = (p12 as any).getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
      if (certBags && certBags.length > 0) {
        certBag = certBags[0];
      }

      if (!keyBag || !certBag) {
        throw new Error('Could not find private key or certificate in P12 file');
      }

      privateKey = keyBag.key;
      cert = certBag.cert;
    }

    const pdfForgeBuffer = forge.util.createBuffer(pdfBuffer.toString('binary' as any), 'binary' as any);
    const p7 = forge.pkcs7.createSignedData();
    p7.content = pdfForgeBuffer;
    p7.addCertificate(cert);

    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: (signingTime || new Date()) as any }
      ]
    });

    p7.sign({ detached: true });

    const der = forge.asn1.toDer(p7.toAsn1());
    const signatureDerBytes = der.bytes();

    return Buffer.from(signatureDerBytes, 'binary');
  }
}

class RemoteSigner extends Signer {
  private signatureHex: string;

  constructor(signatureHex: string) {
    super();
    this.signatureHex = signatureHex;
  }

  async sign(_pdfBuffer: Buffer, _signingTime?: Date): Promise<Buffer> {
    return Buffer.from(this.signatureHex, 'hex');
  }
}

function generateMockCert(subjectName: string): { privateKey: any, cert: any } {
  const keys = forge.pki.rsa.generateKeyPair(512);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{
    name: 'commonName',
    value: subjectName
  }, {
    name: 'organizationName',
    value: 'Remote CA Demo'
  }];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return { privateKey: keys.privateKey, cert: cert };
}


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

const agentStatusBadge = document.getElementById('agent-status-badge')!;
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
  certData?: string;
}
let localCertificates: LocalCertificate[] = [];
let uploadedP12Details: { subject: string; issuer: string } | null = null;
let uploadedP12Bytes: ArrayBuffer | null = null;

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

let cachedRobotoRegularBytes: ArrayBuffer | null = null;
let cachedRobotoBoldBytes: ArrayBuffer | null = null;

async function loadFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer } | null> {
  if (cachedRobotoRegularBytes && cachedRobotoBoldBytes) {
    return { regular: cachedRobotoRegularBytes, bold: cachedRobotoBoldBytes };
  }

  // 1. Try local extension bundle (offline-capable)
  try {
    let regUrl = '/fonts/Roboto-Regular.ttf';
    let boldUrl = '/fonts/Roboto-Bold.ttf';

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      regUrl = chrome.runtime.getURL('fonts/Roboto-Regular.ttf');
      boldUrl = chrome.runtime.getURL('fonts/Roboto-Bold.ttf');
    }

    const [regRes, boldRes] = await Promise.all([
      fetch(regUrl),
      fetch(boldUrl)
    ]);

    if (regRes.ok && boldRes.ok) {
      cachedRobotoRegularBytes = await regRes.arrayBuffer();
      cachedRobotoBoldBytes = await boldRes.arrayBuffer();
      return { regular: cachedRobotoRegularBytes, bold: cachedRobotoBoldBytes };
    }
  } catch (err) {
    console.warn('[uid.one] Could not load bundled local fonts, trying CDN fallback...', err);
  }

  // 2. Try CDN fallback (online)
  try {
    const regUrl = 'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf';
    const boldUrl = 'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf';

    const [regRes, boldRes] = await Promise.all([
      fetch(regUrl),
      fetch(boldUrl)
    ]);

    if (regRes.ok && boldRes.ok) {
      cachedRobotoRegularBytes = await regRes.arrayBuffer();
      cachedRobotoBoldBytes = await boldRes.arrayBuffer();
      return { regular: cachedRobotoRegularBytes, bold: cachedRobotoBoldBytes };
    }
  } catch (err) {
    console.error('[uid.one] All font loading strategies failed:', err);
  }

  return null;
}

let cachedCJKFontBytes: ArrayBuffer | null = null;

function hasCJKCharacters(str: string): boolean {
  const cjkRegex = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/;
  return cjkRegex.test(str);
}

async function loadCJKFont(): Promise<ArrayBuffer | null> {
  if (cachedCJKFontBytes) return cachedCJKFontBytes;
  
  try {
    showToast("Downloading Unicode CJK Font Package (16MB)... This may take a moment.", "info");
    const cjkUrl = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf';
    const res = await fetch(cjkUrl);
    if (res.ok) {
      cachedCJKFontBytes = await res.arrayBuffer();
      showToast("Unicode CJK Font loaded successfully.", "success");
      return cachedCJKFontBytes;
    }
  } catch (err) {
    console.error('[uid.one] Failed to fetch CJK font from CDN:', err);
  }
  return null;
}

function decodeUtf8String(str: string): string {
  const utf8Regex = /[\u00c0-\u00df][\u0080-\u00bf]|[\u00e0-\u00ef][\u0080-\u00bf]{2}|[\u00f0-\u00f7][\u0080-\u00bf]{3}/;
  if (utf8Regex.test(str)) {
    try {
      return decodeURIComponent(escape(str));
    } catch (e) {
      try {
        return forge.util.decodeUtf8(str);
      } catch (err) {
        return str;
      }
    }
  }
  return str;
}

function getFriendlyCertName(hexData: string): { subject: string; issuer: string; validTo: string } | null {
  try {
    const derBytes = forge.util.hexToBytes(hexData);
    const asn1 = forge.asn1.fromDer(derBytes);
    
    let subject = 'Unknown';
    let issuer = 'Unknown';
    let validTo = '2029-12-31';
    
    try {
      const cert = forge.pki.certificateFromAsn1(asn1);
      
      const getFriendlyName = (attrs: any) => {
        let val = 'Unknown';
        if (attrs.attributes) {
          // Try commonName (CN)
          const cnAttr = attrs.attributes.find((a: any) => a.name === 'commonName' || a.shortName === 'CN');
          if (cnAttr && cnAttr.value) {
            val = String(cnAttr.value);
          } else {
            // Try organizationName (O)
            const oAttr = attrs.attributes.find((a: any) => a.name === 'organizationName' || a.shortName === 'O');
            if (oAttr && oAttr.value) {
              val = String(oAttr.value);
            } else {
              // Try organizationalUnitName (OU)
              const ouAttr = attrs.attributes.find((a: any) => a.name === 'organizationalUnitName' || a.shortName === 'OU');
              if (ouAttr && ouAttr.value) {
                val = String(ouAttr.value);
              }
            }
          }
        } else {
          const cn = attrs.getField('CN')?.value || attrs.getField('commonName')?.value;
          if (cn) {
            val = String(cn);
          } else {
            const o = attrs.getField('O')?.value || attrs.getField('organizationName')?.value;
            if (o) {
              val = String(o);
            }
          }
        }
        
        return decodeUtf8String(val);
      };

      subject = getFriendlyName(cert.subject);
      issuer = getFriendlyName(cert.issuer);
      validTo = cert.validity.notAfter.toISOString().split('T')[0];
    } catch (certError) {
      console.warn('[uid.one] node-forge failed to parse certificate semantic structure. Running ASN.1 fallback parser...', certError);
      
      const tbsCert = (asn1 as any).value?.[0] as any;
      if (tbsCert && Array.isArray(tbsCert.value)) {
        const findOid = (node: any, oidHex: string): string | null => {
          if (!node) return null;
          if (node.constructed && Array.isArray(node.value)) {
            if (node.type === 0x10) { // SEQUENCE
              if (node.value.length >= 2) {
                const first = node.value[0];
                const second = node.value[1];
                if (first && first.type === 0x06) { // OID
                  const hex = forge.util.bytesToHex(first.value);
                  if (hex === oidHex) {
                    if (second && second.value) {
                      return decodeUtf8String(String(second.value));
                    }
                  }
                }
              }
            }
            for (const child of node.value) {
              const found = findOid(child, oidHex);
              if (found) return found;
            }
          }
          return null;
        };

        // Locate validity sequence to split issuer and subject
        let validityIndex = -1;
        for (let i = 0; i < tbsCert.value.length; i++) {
          const child = tbsCert.value[i];
          if (child && child.type === 0x10 && Array.isArray(child.value)) {
            const firstTime = child.value[0];
            if (firstTime && (firstTime.type === 0x17 || firstTime.type === 0x18)) {
              validityIndex = i;
              if (child.value[1] && child.value[1].value) {
                const timeStr = String(child.value[1].value);
                if (timeStr.length >= 6) {
                  let yearPart = timeStr.substring(0, 2);
                  let monthPart = timeStr.substring(2, 4);
                  let dayPart = timeStr.substring(4, 6);
                  if (timeStr.length >= 8 && !isNaN(Number(timeStr.substring(0, 4)))) {
                    yearPart = timeStr.substring(0, 4);
                    monthPart = timeStr.substring(4, 6);
                    dayPart = timeStr.substring(6, 8);
                    validTo = `${yearPart}-${monthPart}-${dayPart}`;
                  } else {
                    const fullYear = Number(yearPart) < 50 ? `20${yearPart}` : `19${yearPart}`;
                    validTo = `${fullYear}-${monthPart}-${dayPart}`;
                  }
                }
              }
              break;
            }
          }
        }

        if (validityIndex !== -1) {
          // Issuer is before validity
          for (let i = 0; i < validityIndex; i++) {
            const val = findOid(tbsCert.value[i], "550403");
            if (val) { issuer = val; break; }
          }
          if (issuer === 'Unknown') {
            for (let i = 0; i < validityIndex; i++) {
              const val = findOid(tbsCert.value[i], "55040a");
              if (val) { issuer = val; break; }
            }
          }
          
          // Subject is after validity
          for (let i = validityIndex + 1; i < tbsCert.value.length; i++) {
            const val = findOid(tbsCert.value[i], "550403");
            if (val) { subject = val; break; }
          }
          if (subject === 'Unknown') {
            for (let i = validityIndex + 1; i < tbsCert.value.length; i++) {
              const val = findOid(tbsCert.value[i], "55040a");
              if (val) { subject = val; break; }
            }
          }
        }
      }
    }
    
    return { subject, issuer, validTo };
  } catch (e) {
    console.error('[uid.one] Error parsing certificate with node-forge:', e);
    return null;
  }
}

function getLocaleString(key: string, fallback: string): string {
  if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
    const msg = chrome.i18n.getMessage(key);
    if (msg) return msg;
  }
  
  const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
  const translations: Record<string, Record<string, string>> = {
    vi: {
      pdfSignerStampSignedBy: 'ĐƯỢC KÝ BỞI',
      pdfSignerStampSigner: 'Người ký',
      pdfSignerStampDate: 'Ngày ký',
      pdfSignerStampIssuer: 'Nhà cấp phát',
      pdfSignerStampNoUsb: 'CHƯA CÓ USB TOKEN',
      pdfSignerStampPlugUsb: 'Hãy cắm USB Token',
      pdfSignerStampNoCert: 'CHƯA CÓ CHỨNG THƯ',
      pdfSignerStampUploadCert: 'Tải lên tệp P12/PFX'
    },
    zh: {
      pdfSignerStampSignedBy: '已签名',
      pdfSignerStampSigner: '签名人',
      pdfSignerStampDate: '签名日期',
      pdfSignerStampIssuer: '颁发者',
      pdfSignerStampNoUsb: '未检测到 USB Key',
      pdfSignerStampPlugUsb: '请插入 USB Key',
      pdfSignerStampNoCert: '无证书文件',
      pdfSignerStampUploadCert: '上传 P12/PFX 文件'
    },
    ja: {
      pdfSignerStampSignedBy: '署名者',
      pdfSignerStampSigner: '署名者',
      pdfSignerStampDate: '署名日時',
      pdfSignerStampIssuer: '発行者',
      pdfSignerStampNoUsb: 'USBトークンなし',
      pdfSignerStampPlugUsb: 'USBトークンを挿入してください',
      pdfSignerStampNoCert: '証明書なし',
      pdfSignerStampUploadCert: 'P12/PFXをアップロード'
    },
    ko: {
      pdfSignerStampSignedBy: '서명자',
      pdfSignerStampSigner: '서명자',
      pdfSignerStampDate: '서명 날짜',
      pdfSignerStampIssuer: '발급자',
      pdfSignerStampNoUsb: 'USB 토큰 없음',
      pdfSignerStampPlugUsb: 'USB 토큰을 삽입하세요',
      pdfSignerStampNoCert: '인증서 파일 없음',
      pdfSignerStampUploadCert: 'P12/PFX 파일 업로드'
    }
  };
  
  return translations[lang]?.[key] || fallback;
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

  const lblSignedBy = getLocaleString('pdfSignerStampSignedBy', 'SIGNED BY');
  const lblSigner = getLocaleString('pdfSignerStampSigner', 'Signer');
  const lblDate = getLocaleString('pdfSignerStampDate', 'Date');
  const lblIssuer = getLocaleString('pdfSignerStampIssuer', 'Issuer');

  if (certType === 'uid') {
    if (previewHeader) previewHeader.textContent = 'UID.ONE VERIFIED';
    stampSigner.textContent = `${lblSigner}: ${userEmail || 'user@uid.one'}`;
    stampTime.textContent = `${lblDate}: ${formattedTime}`;
    stampHash.textContent = 'Hash: pending...';
  } else if (certType === 'local_agent') {
    const selectedIndex = localCertSelect.selectedIndex;
    const selectedCert = localCertificates[selectedIndex];
    if (selectedCert) {
      const cleanSubject = selectedCert.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '');
      if (previewHeader) previewHeader.textContent = `${lblSignedBy}: ${cleanSubject}`;
      stampSigner.textContent = `${lblSigner}: ${selectedCert.subject}`;
      stampTime.textContent = `${lblDate}: ${formattedTime}`;
      stampHash.textContent = `${lblIssuer}: ${selectedCert.issuer}`;
    } else {
      const lblNoUsb = getLocaleString('pdfSignerStampNoUsb', 'SIGNED BY: NO USB TOKEN');
      const lblPlugUsb = getLocaleString('pdfSignerStampPlugUsb', 'Signer: Plug in USB Token');
      if (previewHeader) previewHeader.textContent = lblNoUsb;
      stampSigner.textContent = lblPlugUsb;
      stampTime.textContent = `${lblDate}: ${formattedTime}`;
      stampHash.textContent = `${lblIssuer}: pending...`;
    }
  } else if (certType === 'remote_ca') {
    const providerVal = remoteCaProvider.value;
    const providerName = getProviderName(providerVal);
    if (previewHeader) previewHeader.textContent = `${lblSignedBy}: ${providerName.toUpperCase()}`;
    stampSigner.textContent = `${lblSigner}: ID ${remoteCaUser.value || '0901234567'}`;
    stampTime.textContent = `${lblDate}: ${formattedTime}`;
    stampHash.textContent = `${lblIssuer}: ${providerName}`;
  } else if (certType === 'p12_file') {
    if (uploadedP12Details) {
      const cleanSubject = uploadedP12Details.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '');
      if (previewHeader) previewHeader.textContent = `${lblSignedBy}: ${cleanSubject}`;
      stampSigner.textContent = `${lblSigner}: ${uploadedP12Details.subject}`;
      stampTime.textContent = `${lblDate}: ${formattedTime}`;
      stampHash.textContent = `${lblIssuer}: ${uploadedP12Details.issuer}`;
    } else {
      const lblNoCert = getLocaleString('pdfSignerStampNoCert', 'SIGNED BY: NO CERT FILE');
      const lblUploadCert = getLocaleString('pdfSignerStampUploadCert', 'Signer: Upload P12/PFX file');
      if (previewHeader) previewHeader.textContent = lblNoCert;
      stampSigner.textContent = lblUploadCert;
      stampTime.textContent = `${lblDate}: ${formattedTime}`;
      stampHash.textContent = `${lblIssuer}: pending...`;
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
    if (certType === 'local_agent' && btnDetectCerts) {
      btnDetectCerts.click();
    }
  });
}

// Local agent detection listener
if (btnDetectCerts) {
  btnDetectCerts.addEventListener('click', async () => {
    const agentUrl = localAgentUrlInput.value.trim() || 'http://127.0.0.1:13013';
    
    agentStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerAgentChecking") || 'Checking...';
    agentStatusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
    agentStatusBadge.style.color = '#f59e0b';
    
    usbStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerUsbChecking") || 'Checking...';
    usbStatusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
    usbStatusBadge.style.color = '#f59e0b';
    
    usbTokenInfo.textContent = chrome.i18n.getMessage("pdfSignerAgentCheckingDesc") || 'Querying local CA signing application...';
    
    try {
      const res = await fetch(`${agentUrl}/certificates`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`Agent status: ${res.status}`);
      }
      
      const data = await res.json();
      localCertificates = (data.certificates || [])
        .filter((c: any) => c.id !== 'agent_identity_key')
        .map((c: any) => {
          if (c.certData) {
            const parsed = getFriendlyCertName(c.certData);
            if (parsed) {
              return {
                ...c,
                subject: parsed.subject,
                issuer: parsed.issuer,
                validTo: parsed.validTo
              };
            }
          }
          return c;
        });
      
      agentStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerAgentRunning") || 'Running';
      agentStatusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
      agentStatusBadge.style.color = '#10b981';
      
      if (localCertificates.length === 0) {
        localCertsContainer.style.display = 'none';
        usbStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerUsbNotFound") || 'Not Found';
        usbStatusBadge.style.background = 'rgba(245, 158, 11, 0.1)';
        usbStatusBadge.style.color = '#f59e0b';
        usbTokenInfo.textContent = chrome.i18n.getMessage("pdfSignerUsbNotFoundDesc") || 'CA client app is active, but no USB token or smart card is found. Please insert your USB Token.';
      } else {
        localCertSelect.innerHTML = '';
        localCertificates.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.subject} (${c.issuer})`;
          localCertSelect.appendChild(opt);
        });
        localCertsContainer.style.display = 'flex';
        usbStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerUsbDetected") || 'Detected';
        usbStatusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        usbStatusBadge.style.color = '#10b981';
        
        const successMsg = chrome.i18n.getMessage("pdfSignerUsbSuccessDesc") || 'Connected. USB Token certificates are ready.';
        usbTokenInfo.textContent = `${successMsg} (${localCertificates[0].subject})`;
        updateStampText();
      }
    } catch (err: any) {
      console.error('[uid.one] Local signing agent connection error:', err);
      localCertsContainer.style.display = 'none';
      
      agentStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerAgentOffline") || 'Offline';
      agentStatusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
      agentStatusBadge.style.color = '#ef4444';
      
      usbStatusBadge.textContent = chrome.i18n.getMessage("pdfSignerUsbUnknown") || 'Unknown';
      usbStatusBadge.style.background = 'rgba(255, 255, 255, 0.05)';
      usbStatusBadge.style.color = 'var(--text-muted)';
      
      usbTokenInfo.textContent = chrome.i18n.getMessage("pdfSignerAgentOfflineDesc") || 'CA client application is not running or not installed on this computer.';
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
      const reader = new FileReader();
      reader.onload = (evt: any) => {
        uploadedP12Bytes = evt.target.result as ArrayBuffer;
      };
      reader.readAsArrayBuffer(file);

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
  const placeholder = isPin ? (chrome.i18n.getMessage("pdfSignerPinPlaceholder") || "Enter PIN") : "000000";
  const maxLength = isPin ? 32 : 6;
  const inputType = isPin ? 'password' : 'text';
  const letterSpacing = isPin ? '4px' : '6px';
  const inputModeAttr = isPin ? '' : 'inputmode="numeric" pattern="[0-9]*"';

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
        <input type="${inputType}" id="uid-signer-otp-input" ${inputModeAttr} maxlength="${maxLength}" placeholder="${placeholder}" style="
          width: 80%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          font-size: 24px;
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
      if (!isPin) {
        otpInput.value = otpInput.value.replace(/[^0-9]/g, '');
      }
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
      if (val.length < 4) {
        alert(chrome.i18n.getMessage("pdfSignerPinError") || 'The USB PIN must be at least 4 characters.');
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

  const certType = signingCertSelect?.value || 'uid';

  const proceedWithSigning = () => {
    let isPin = false;
    if (certType === 'local_agent') {
      const selectedIndex = localCertSelect.selectedIndex;
      const selectedCert = localCertificates[selectedIndex];
      if (selectedCert && (selectedCert.id.startsWith('usb_') || selectedCert.id === 'usb_auto_detected')) {
        isPin = true;
      }
    }

    showOtpPromptModal(async (codeOrPin) => {
      // 1. Calculate Hash of the original document
      btnSign.disabled = true;
      btnSign.innerHTML = `<span class="loading-spinner"></span> ${chrome.i18n.getMessage("pdfSignerButtonSigning") || "Signing PDF..."}`;

      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes!);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const onSignatureAcquired = async (
          success: boolean,
          errorMsg?: string,
          remoteSignature?: string,
          remoteSignerCert?: string
        ) => {
          if (!success) {
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${chrome.i18n.getMessage("pdfSignerButtonSign") || "Sign Document"}`;
            alert(errorMsg || chrome.i18n.getMessage("alertRejected") || "Signing request was rejected or expired.");
            return;
          }

          try {
            const pdfDoc = await PDFDocument.load(pdfBytes!);
            pdfDoc.registerFontkit(fontkit);
            const pages = pdfDoc.getPages();
            const pageIndex = currentPageNum - 1;
            
            if (pageIndex < 0 || pageIndex >= pages.length) {
              throw new Error('Selected page index is out of bounds');
            }
            
            const page = pages[pageIndex];

            // Map overlay container coordinates to original PDF coordinates
            const htmlHeight = canvas.height;
            const stampLeft = signatureBox.offsetLeft;
            const stampTop = signatureBox.offsetTop;
            const stampWidth = signatureBox.offsetWidth;
            const stampHeight = signatureBox.offsetHeight;

            // PDF coordinates scale factor (original PDF points to viewport pixels)
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
              color: rgb(0.94, 0.99, 0.96), // very light green
              borderColor: rgb(0.02, 0.59, 0.41), // emerald-600
              borderWidth: 0.75,
            });

            // Embed fonts
            const fonts = await loadFonts();
            let helveticaFont;
            let helveticaBoldFont;
            let isCustomFont = false;

            if (fonts) {
              try {
                helveticaFont = await pdfDoc.embedFont(fonts.regular);
                helveticaBoldFont = await pdfDoc.embedFont(fonts.bold);
                isCustomFont = true;
              } catch (e) {
                console.error('[uid.one] Failed to embed custom Roboto fonts:', e);
              }
            }

            if (!isCustomFont) {
              helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
              helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            }

            // Compute standard text scaling
            const fontSize = Math.max(6, Math.min(9.5, pdfH / 5.5));
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
                borderColor: rgb(0.02, 0.59, 0.41),
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
                borderColor: rgb(0.02, 0.59, 0.41),
                borderWidth: 1.5,
                borderOpacity: 0.08,
              }
            );

            // Determine custom details depending on chosen certificate type
            const lblSignedBy = getLocaleString('pdfSignerStampSignedBy', 'SIGNED BY');
            const lblSigner = getLocaleString('pdfSignerStampSigner', 'Signer');
            const lblDate = getLocaleString('pdfSignerStampDate', 'Date');
            const lblIssuer = getLocaleString('pdfSignerStampIssuer', 'Issuer');

            let headerText = 'UID.ONE VERIFIED';
            let line1Text = `${lblSigner}: ${userEmail || 'user@uid.one'}`;
            let line2Text = `${lblDate}: ${formattedTime}`;
            let line3Text = `Hash: [Digital Signature]`;

            let activeSigner: Signer | null = null;

            if (certType === 'local_agent') {
              const selectedIndex = localCertSelect.selectedIndex;
              let selectedCert = localCertificates[selectedIndex];
              if (!selectedCert) {
                throw new Error('No local agent certificate selected.');
              }

              const agentUrl = localAgentUrlInput.value.trim() || 'http://127.0.0.1:13013';

              if (selectedCert.id === 'usb_auto_detected') {
                showToast("Authenticating and detecting USB certificates...", "info");
                const loginRes = await fetch(`${agentUrl}/sign`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    certId: 'usb_auto_detected',
                    hash: '0000000000000000000000000000000000000000000000000000000000000000',
                    pin: codeOrPin
                  })
                });
                if (loginRes.ok) {
                  const loginData = await loginRes.json();
                  if (loginData.success && loginData.certificate) {
                    selectedCert.certData = loginData.certificate;
                    const parsed = getFriendlyCertName(loginData.certificate);
                    if (parsed) {
                      selectedCert.subject = parsed.subject;
                      selectedCert.issuer = parsed.issuer;
                      selectedCert.validTo = parsed.validTo;
                    }
                    const listRes = await fetch(`${agentUrl}/certificates`);
                    if (listRes.ok) {
                      const listData = await listRes.json();
                      const realCert = listData.certificates?.find((c: any) => c.certData);
                      if (realCert) {
                        selectedCert.id = realCert.id;
                        const realParsed = getFriendlyCertName(realCert.certData || loginData.certificate);
                        if (realParsed) {
                          selectedCert.subject = realParsed.subject;
                          selectedCert.issuer = realParsed.issuer;
                          selectedCert.validTo = realParsed.validTo;
                        } else {
                          selectedCert.subject = realCert.subject;
                          selectedCert.issuer = realCert.issuer;
                        }
                      }
                    }

                    // Dynamically update UI elements to match retrieved certificate
                    const optionToUpdate = localCertSelect.options[selectedIndex];
                    if (optionToUpdate) {
                      optionToUpdate.textContent = `${selectedCert.subject} (${selectedCert.issuer})`;
                    }
                    const successMsg = chrome.i18n.getMessage("pdfSignerUsbSuccessDesc") || 'Connected. USB Token certificates are ready.';
                    usbTokenInfo.textContent = `${successMsg} (${selectedCert.subject})`;
                    updateStampText();
                  } else {
                    throw new Error(loginData.error || 'Failed to login to USB Token.');
                  }
                } else {
                  throw new Error(`USB Token connection failed: HTTP ${loginRes.status}`);
                }
              }

              if (!selectedCert.certData) {
                throw new Error('Certificate data is missing. Please re-insert USB Token.');
              }

              headerText = `${lblSignedBy}: ${selectedCert.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
              line1Text = `${lblSigner}: ${selectedCert.subject}`;
              line2Text = `${lblDate}: ${formattedTime}`;
              line3Text = `${lblIssuer}: ${selectedCert.issuer}`;

              activeSigner = new AgentSigner(
                selectedCert.certData,
                selectedCert.id,
                codeOrPin,
                agentUrl
              );
            } else if (certType === 'remote_ca') {
              const providerVal = remoteCaProvider.value;
              const providerName = getProviderName(providerVal);
              const userVal = remoteCaUser.value || '0901234567';
              headerText = `${lblSignedBy}: ${providerName.toUpperCase()}`;
              line1Text = `${lblSigner}: ID ${userVal}`;
              line2Text = `${lblDate}: ${formattedTime}`;
              line3Text = `${lblIssuer}: ${providerName}`;

              const subjectName = `CN=${userVal}, O=${providerName}, C=VN`;
              const mockKeys = generateMockCert(subjectName);
              
              activeSigner = new LocalP12Signer(mockKeys.privateKey, mockKeys.cert);
            } else if (certType === 'p12_file' && uploadedP12Details) {
              headerText = `${lblSignedBy}: ${uploadedP12Details.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
              line1Text = `${lblSigner}: ${uploadedP12Details.subject}`;
              line2Text = `${lblDate}: ${formattedTime}`;
              line3Text = `${lblIssuer}: ${uploadedP12Details.issuer}`;

              const p12Password = p12PasswordInput.value;
              const binaryString = Array.from(new Uint8Array(uploadedP12Bytes!))
                .map(b => String.fromCharCode(b))
                .join('');
              const p12Asn1 = forge.asn1.fromDer(binaryString);
              
              activeSigner = new LocalP12Signer(null, null, p12Asn1, p12Password);
            } else if (certType === 'uid' && remoteSignature) {
              activeSigner = new RemoteSigner(remoteSignature);
              if (remoteSignerCert) {
                if (remoteSignerCert.startsWith("did:uid:")) {
                  // Format: did:uid:user@email.com:platform or did:uid:user@email.com
                  const parts = remoteSignerCert.split(":");
                  const email = parts[2] || "user@uid.one";
                  headerText = `${lblSignedBy}: ${email}`;
                  line1Text = `${lblSigner}: ${email}`;
                  line2Text = `${lblDate}: ${formattedTime}`;
                  line3Text = `${lblIssuer}: UID.ONE Cryptographic Trust`;
                } else {
                  const parsed = getFriendlyCertName(remoteSignerCert);
                  if (parsed) {
                    headerText = `${lblSignedBy}: ${parsed.subject.replace(/^(CÔNG TY\s+TNHH\s+|CÔNG TY\s+CỔ\s+PHẦN\s+)/i, '')}`;
                    line1Text = `${lblSigner}: ${parsed.subject}`;
                    line2Text = `${lblDate}: ${formattedTime}`;
                    line3Text = `${lblIssuer}: ${parsed.issuer}`;
                  }
                }
              }
            }

            if (!activeSigner) {
              throw new Error('No signing mechanism could be initialized.');
            }

            // Check if any drawn text contains CJK characters
            const needsCJK = hasCJKCharacters(headerText) || 
                             hasCJKCharacters(line1Text) || 
                             hasCJKCharacters(line2Text) || 
                             hasCJKCharacters(line3Text);

            if (needsCJK) {
              const cjkBytes = await loadCJKFont();
              if (cjkBytes) {
                try {
                  const cjkFont = await pdfDoc.embedFont(cjkBytes);
                  helveticaFont = cjkFont;
                  helveticaBoldFont = cjkFont;
                  isCustomFont = true;
                } catch (e) {
                  console.error('[uid.one] Failed to embed CJK font:', e);
                }
              }
            }

            if (!isCustomFont) {
              console.warn('[uid.one] Custom Unicode font not loaded; fallback Helvetica may show rendering issues.');
            }

            // Draw text onto stamp
            page.drawText(headerText, {
              x: pdfX + 8,
              y: pdfY + pdfH - fontSize - 6,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0.02, 0.47, 0.34), // emerald-700
            });

            page.drawText(line1Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 2) - 12,
              size: fontSize - 1.5,
              font: helveticaFont,
              color: rgb(0.22, 0.25, 0.32), // slate-700
            });

            page.drawText(line2Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 3) - 18,
              size: fontSize - 1.5,
              font: helveticaFont,
              color: rgb(0.22, 0.25, 0.32), // slate-700
            });

            page.drawText(line3Text, {
              x: pdfX + 8,
              y: pdfY + pdfH - (fontSize * 4) - 24,
              size: fontSize - 2,
              font: helveticaFont,
              color: rgb(0.35, 0.4, 0.47), // slate-500
            });

            // 1. Add standard digital signature placeholder
            showToast("Preparing digital signature structure...", "info");
            pdflibAddPlaceholder({
              pdfDoc,
              pdfPage: page,
              reason: 'Digital Signature via UID.one Portal',
              contactInfo: userEmail,
              name: headerText,
              location: 'Vietnam',
              signingTime: now,
              signatureLength: 16384,
              subFilter: 'adbe.pkcs7.detached',
              widgetRect: [pdfX, pdfY, pdfX + pdfW, pdfY + pdfH],
              appName: 'UID.one Cryptographic Signer'
            });

            // Save prepared document bytes
            const preparedPdfBytes = await pdfDoc.save();

            // 2. Cryptographically sign the document using @signpdf/signpdf
            showToast("Generating PKCS#7 cryptographic signature container...", "info");
            let signpdfInstance: any = signpdf;
            while (signpdfInstance && signpdfInstance.default && !signpdfInstance.sign) {
              signpdfInstance = signpdfInstance.default;
            }
            if (typeof signpdfInstance === 'function') {
              signpdfInstance = new signpdfInstance();
            } else if (signpdfInstance && !signpdfInstance.sign && signpdfInstance.SignPdf) {
              signpdfInstance = new signpdfInstance.SignPdf();
            }
            const signedPdfBuffer = await signpdfInstance.sign(Buffer.from(preparedPdfBytes), activeSigner);

            // Trigger browser download
            const blob = new Blob([new Uint8Array(signedPdfBuffer)], { type: 'application/pdf' });
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
            loadPdfBytes(signedPdfBuffer.buffer as ArrayBuffer, name);
          } catch (err: any) {
            console.error('[uid.one] Visual signature stamp error:', err);
            btnSign.disabled = false;
            btnSign.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${chrome.i18n.getMessage("pdfSignerButtonSign") || "Sign Document"}`;
            alert(`Error signing PDF: ${err.message}`);
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

          onSignatureAcquired(true);
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

          onSignatureAcquired(true);
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
            onSignatureAcquired(
              res && res.success,
              res ? res.error : undefined,
              res ? res.signature : undefined,
              res ? res.signer : undefined
            );
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
    }, isPin);
  };

  if (certType === 'uid') {
    chrome.runtime.sendMessage({ type: 'CHECK_PAIRING' }, (pairingRes) => {
      if (!pairingRes || !pairingRes.isPaired) {
        alert(chrome.i18n.getMessage("alertSessionExpired") || "Session expired or not linked. Please log in to UID.one and link the extension first.");
        return;
      }
      proceedWithSigning();
    });
  } else {
    proceedWithSigning();
  }
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

  // Probe local agent on startup to see if USB is connected
  try {
    const probeRes = await fetch('http://127.0.0.1:13013/certificates', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (probeRes.ok) {
      const data = await probeRes.json().catch(() => ({}));
      const certs = data.certificates || [];
      const hasUsb = certs.some((c: any) => c.id !== 'agent_identity_key');
      if (hasUsb && signingCertSelect) {
        signingCertSelect.value = 'local_agent';
        signingCertSelect.dispatchEvent(new Event('change'));
      }
    }
  } catch (e) {
    // Agent is offline or not installed, fallback silently
  }
  
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
