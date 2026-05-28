# UID Link (浏览器扩展程序) - 中文

**UID Link** 是一款为 **UID.ONE** 主权身份生态系统设计的高性能跨浏览器扩展程序。它作为浏览器安全代理，在客户端直接执行零信任策略、上下文感知型数据防泄露 (DLP) 以及实时加密会话绑定。

---

## 🛡️ 安全引擎功能

### 1. 加密会话绑定 (Cryptographic Session Binding)
防止会话劫持和令牌窃取。身份验证成功后，UID Link 通过以下方式锁定会话：
* 生成本地硬件设备指纹。
* 为当前活动的 `sessionToken` 创建基于 HMAC 的绑定签名。
* 向后端 API `/v1/auth/session-binding/register/` 安全注册绑定信息。
* 在允许执行特权请求前对本地签名进行验证。

### 2. 域名源验证 (Origin Verification - 反钓鱼盾牌)
主动检查访问的域名，以检测针对 UID.one 品牌的仿冒、拼写纠错攻击和网络钓鱼企图：
* 匹配针对形如 `uid-one-login.com`、`uidone-secure.com` 和 `uid.one.evil.com` 等域名变体的正则表达式模式。
* 如果检测到恶意模仿网页，自动注入权威的红色警告横幅，阻止用户输入凭据。

### 3. 浏览器层数据防泄露 (Browser-Layer DLP)
检查客户端行为，防止无意中泄漏 PII（个人身份信息）、凭据或敏感文档：
* **演示模式 (Presentation Mode):** 通过快捷键 `Alt+Shift+P` 切换，以动态模糊和隐藏网页上的所有敏感纯文本模式（如电话号码、电子邮件、越南公民身份证、信用卡号）。这可确保屏幕共享和截图不会泄露业务细节。将鼠标悬停 (hover) 即可临时查看。
* **文件上传拦截器 (File Upload Interceptor):** 监听文件输入和拖放事件。文件将在客户端进行分析，阻止不安全的文件并显示警告覆盖图层。
* **剪贴板拦截器 (Clipboard Interceptor):** 拦截复制和粘贴事件。通过确认模态框阻止不安全的剪贴板粘贴，而在复制敏感信息时触发浏览器原生通知提示。
* **表单拦截器 (Form Interceptor):** 在表单提交的数据离开浏览器上下文之前进行合规性扫描。

### 4. Cookie 卫士与反追踪 (Cookie Guard & Anti-Tracking)
保护用户隐私，即使在流行的 Cookie 同意横幅上点击 "接受全部"：
* 拦截在网页上下文中对 `document.cookie` 的写入，阻止注册追踪/广告 Cookie（例如 `_ga`、`_gid`、`_fbp`、`_fbc`、`hj*`、`cluid`）。
* 检测并阻止包含敏感 PII 值（如原始电子邮件地址、信用卡号、JWT 和 API 密钥）的 Cookie。
* 每 5 秒进行一次定期扫描，清理通过 HTTP 响应头设置的追踪 Cookie。

### 5. 动态 EXIF 和元数据清除 (Dynamic EXIF & Metadata Stripper)
自动实时清除可能泄露隐私的图片元数据：
* 拦截通过文件输入和拖放事件上传的图片 (JPEG/JPG)。
* 在重新组装和提交前，在客户端清除 GPS 坐标、相机型号和创建时间戳等头部信息（APP1 段）。

### 6. 自毁型 OTP / 输入缓存擦除
防止敏感输入和验证码在共享或受损环境中泄露：
* 在标准提交或基于 AJAX 的表单提交过程中检测 OTP、二步验证码、密码和信用卡字段。
* 提交 300ms 后自动擦除输入框中的数值，并清除浏览器的自动填充历史记录。
* 如果剪贴板包含高度敏感的 PII 值，立即清空剪贴板内容。

### 7. 全球隐私控制 (GPC) 和 DNT 执行
在所有网络交互中维护用户的自主隐私权：
* 将标准的隐私信号（`navigator.globalPrivacyControl = true` 和 `navigator.doNotTrack = '1'`）注入所有网页的全局 window 上下文中。

### 8. 视口清理器与阻断盾牌
* **通知阻断器:** 拦截 Service Worker 注册和通知权限，以阻止烦人的第三方推送通知。
* **视口清理器 (Viewport Cleaner):** 扫描并隐藏安全页面上的悬浮元素、悬浮图层以及潜在的按键记录器 (keylogger) 以保护输入框。
* **失焦模糊 (Tab Focus Blurring):** 仅在标签页完全隐藏或切换时（`document.hidden`）自动模糊页面视口，防止窥屏。

---

## 🚀 如何安装

选择以下两种简单方法之一来安装扩展程序：

### 方法 1：安装预构建包 (推荐，最简单)
1. 从本代码仓库的根目录下载 **`uid-link-chrome.zip`** (适用于 Chrome, Edge, Brave 浏览器) 或 **`uid-link-firefox.zip`** (适用于 Firefox 浏览器)。
2. 将下载的 zip 文件解压到您电脑的一个文件夹中。
3. 打开浏览器并导航至 `chrome://extensions/`（在 Firefox 中为 `about:debugging`）。
4. 开启右上角的 **"开发者模式"**。
5. 点击 **"加载已解压的扩展程序"**，然后选择刚才解压的文件夹。

---

### 方法 2：克隆并从源码编译
1. 将本代码仓库克隆到您的计算机：
   ```bash
   git clone https://github.com/oneuid/uid-extension.git
   cd uid-extension
   ```
2. 安装依赖并进行编译：
   ```bash
   npm install
   npm run build
   ```
3. 打开 `chrome://extensions/`，开启 **"开发者模式"**，点击 **"加载已解压的扩展程序"** 并选择编译生成的 **`dist/chrome/`** 文件夹。

---

## 📂 本地消息传递配置 (Native Messaging)

要验证本地消息传递功能（例如安全硬件检查或操作系统集成），请确保将本地消息传递主机的 manifest 配置文件正确安装在对应的系统目录中：

* **Linux:** `~/.config/google-chrome/NativeMessagingHosts/`
* **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
* **Windows:** 注册表项 `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 许可证

本项目根据 [UID.ONE Source-Available 许可证](LICENSE) 进行授权。

公开我们的源代码能确保零信任策略和数据防泄露政策在您的浏览器中如何执行的完全透明。在此许可证下：
* 您可以审计并在本地运行该软件，以进行个人安全验证。
* 严禁第三方商业分发、发布到公共扩展商店以及商业衍生版。
* 获得授权的 UID.ONE 企业级 (B2B) 客户完全允许在日常业务运营中使用本软件。
