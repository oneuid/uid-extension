# UID Link (Extensión de navegador) - Español

**UID Link** es una extensión de navegador de alto rendimiento diseñada para el ecosistema de identidad soberana **UID.ONE**. Actúa como el agente de seguridad a nivel del navegador, aplicando políticas Zero-Trust, DLP (prevención de pérdida de datos) contextual y enlace de sesión criptográfica en tiempo real directamente en el lado del cliente.

---

## 🛡️ Características del motor de seguridad

### 1. Enlace criptográfico de sesión
Previene el secuestro de sesión y el robo de tokens. Una vez autenticado, UID Link bloquea la sesión mediante:
* Generación de una huella digital del dispositivo de hardware local.
* Creación de una firma vinculada por HMAC para el `sessionToken` activo.
* Registro seguro del enlace en la API del backend `/v1/auth/session-binding/register/`.
* Verificación de la firma localmente antes de permitir peticiones privilegiadas.

### 2. Verificación de origen (Escudo antiphishing)
Comprueba activamente los dominios visitados para detectar suplantación de identidad, typosquatting e intentos de phishing dirigidos a la marca UID.one:
* Coincidencia con patrones de expresiones regulares dirigidos a variaciones de dominio como `uid-one-login.com`, `uidone-secure.com` y `uid.one.evil.com`.
* Inyección automática de un banner rojo de advertencia si se detecta una página falsa, impidiendo que el usuario introduzca sus credenciales.

### 3. Prevención de pérdida de datos a nivel de navegador (DLP)
Inspecciona las acciones del lado del cliente para evitar filtraciones involuntarias de información de identificación personal (PII), credenciales o documentos confidenciales:
* **Modo Presentación (Presentation Mode):** Active mediante `Alt+Shift+P` para difuminar dinámicamente y ocultar todos los patrones de texto plano sensibles (como números de teléfono, correos electrónicos, identificaciones ciudadanas, números de tarjeta de crédito) en las páginas web. Pase el ratón (hover) para ver temporalmente.
* **Interceptor de subida de archivos:** Escucha los eventos de subida de archivos (input y drag & drop). Los archivos se analizan en el cliente, bloqueando los archivos inseguros con una advertencia superpuesta.
* **Interceptor de portapapeles:** Intercepta eventos de copiar y pegar. Bloquea pegados sospechosos mediante modales de confirmación e informa al copiar datos sensibles.
* **Form Interceptor:** Analiza la conformidad de los formularios antes de que los datos salgan del contexto del navegador.

### 4. Cookie Guard & Anti-Tracking
Protege la privacidad del usuario incluso cuando hace clic en "Aceptar todo" en los banners de consentimiento de cookies:
* Intercepta la escritura en `document.cookie` para bloquear el registro de cookies de seguimiento/publicidad (por ejemplo, `_ga`, `_gid`, `_fbp`, `_fbc`, `hj*`, `cluid`).
* Detecta y bloquea cookies que contienen datos personales confidenciales (como correos electrónicos, tarjetas de crédito, JWT y claves de API).
* Limpia periódicamente (cada 5 segundos) las cookies de seguimiento establecidas a través de las cabeceras HTTP de respuesta.

### 5. Dynamic EXIF & Metadata Stripper
Elimina automáticamente los metadatos de ubicación y dispositivo de las imágenes subidas:
* Intercepta las subidas de imágenes (JPEG/JPG) a través de las entradas de archivos o arrastrar y soltar.
* Elimina las coordenadas GPS, el modelo de cámara y la marca de tiempo de creación (segmento APP1) en el cliente antes del envío.

### 6. OTP autodestructivo / Limpieza de caché de campos
Evita la filtración de credenciales sensibles o códigos OTP en entornos compartidos o comprometidos:
* Detecta campos de OTP, 2FA, contraseñas y tarjetas de crédito durante el envío de formularios.
* Borra automáticamente los valores de los campos y elimina el historial de autocompletado del navegador 300 ms después del envío.
* Vacía inmediatamente el portapapeles si contiene valores personales sensibles.

### 7. Global Privacy Control (GPC) & DNT
Afirma el derecho soberano del usuario a la privacidad:
* Inyecta las señales de privacidad estándar (`navigator.globalPrivacyControl = true` y `navigator.doNotTrack = '1'`) en el contexto global de todas las páginas web.

### 8. Limpiador de Viewport & Escudo Protector
* **Bloqueador de notificaciones:** Intercepta el registro de service worker y los permisos de notificación para bloquear notificaciones push molestas de terceros.
* **Limpiador de Viewport:** Oculta elementos flotantes sospechosos y keyloggers potenciales en páginas seguras.
* **Desenfoque de pestañas (Tab Focus Blurring):** Desenfoca automáticamente la página solo cuando la pestaña se oculta (`document.hidden`), protegiendo la pantalla de miradas indiscretas.

---

## 🚀 Cómo instalar

Elija uno de los dos métodos sencillos siguientes para instalar la extensión:

### Opción 1: Instalar la versión precompilada (Recomendado y más sencillo)
1. Descargue **`uid-link-chrome.zip`** (para Chrome, Edge, Brave) o **`uid-link-firefox.zip`** (para Firefox) desde la raíz de este repositorio.
2. Extraiga el archivo zip descargado en una carpeta de su ordenador.
3. Abra su navegador y acceda a `chrome://extensions/` (o `about:debugging` en Firefox).
4. Active el **"Modo desarrollador"** en la esquina superior derecha.
5. Haga clic en **"Cargar descomprimida"** y seleccione la carpeta extraída.

---

### Opción 2: Clonar y compilar desde el código fuente
1. Clone este repositorio en su ordenador:
   ```bash
   git clone https://github.com/oneuid/uid-extension.git
   cd uid-extension
   ```
2. Instale las dependencias y compile:
   ```bash
   npm install
   npm run build
   ```
3. Abra `chrome://extensions/`, active el **"Modo desarrollador"**, haga clic en **"Cargar descomprimida"** y seleccione la carpeta compilada **`dist/chrome/`**.

---

## 📂 Configuración de Native Messaging

Para verificar las funciones de integración con el sistema operativo (como controles de seguridad de hardware), asegúrese de que el manifiesto del host de mensajería nativa esté instalado en el directorio del sistema correspondiente:

* **Linux:** `~/.config/google-chrome/NativeMessagingHosts/`
* **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
* **Windows:** Clave de registro `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 Licencia

Este proyecto está bajo la [Licencia Source-Available de UID.ONE](LICENSE).

Al hacer visible nuestro código fuente, garantizamos una total transparencia en cómo se aplican sus políticas de seguridad. Bajo esta licencia:
* Puede auditar y ejecutar el software localmente para verificación personal de seguridad.
* La redistribución comercial por parte de terceros, la publicación en tiendas de extensiones públicas y las bifurcaciones comerciales están estrictamente prohibidas.
* Los clientes B2B autorizados de UID.ONE están totalmente autorizados a usar el software en sus operaciones diarias.
