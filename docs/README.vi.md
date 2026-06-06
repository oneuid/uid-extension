# UID Link (Browser Extension) - Tiếng Việt

**UID Link** là một tiện ích mở rộng đa trình duyệt với hiệu suất cao được thiết kế cho Hệ sinh thái định danh chủ quyền **UID.ONE**. Nó đóng vai trò là tác nhân bảo mật ở lớp trình duyệt, thực thi các chính sách Zero-Trust, DLP (Ngăn ngừa mất mát dữ liệu) theo ngữ cảnh và liên kết phiên mã hóa thời gian thực trực tiếp ở phía máy khách.

---

## 🤝 Cặp đôi hoàn hảo: UID Link & UID Agent

Để đạt được cấp độ bảo mật và độ tin cậy phía máy khách cao nhất, **UID Link** (Tiện ích mở rộng trình duyệt) và [**UID Agent**](https://github.com/oneuid/uid-agent) (Ứng dụng máy tính & Daemon) được thiết kế để hoạt động song song như một hệ sinh thái thống nhất.

| Hợp phần | Lớp xử lý | Vai trò bảo mật cốt lõi |
| :--- | :--- | :--- |
| **UID Link (Browser Extension)** | Trình duyệt & Phiên | Khóa phiên thời gian thực, chống lừa đảo, DLP lớp trình duyệt, chặn cookie theo dõi, kích hoạt ký số văn bản/PDF trực tuyến. |
| **[UID Agent](https://github.com/oneuid/uid-agent) (Desktop App)** | Phần cứng & Hệ điều hành | Giám sát toàn vẹn thiết bị đầu cuối (SOC 2), khóa bảo mật phần cứng PKCS#11 (USB Token), hộp cát ứng dụng an toàn (Docker + Wine). |

### 🚀 Sức mạnh Hiệp đồng Hệ sinh thái
1. **Ký số Xác thực bằng Phần cứng:** Khi bạn thực hiện ký số tài liệu hoặc văn bản trên trình duyệt thông qua UID Link, tiện ích sẽ giao tiếp với **UID Agent** cục bộ qua cổng native an toàn để truy cập các khóa bảo mật USB (Token PKCS#11/smartcard) đang cắm trên máy, thực hiện quá trình ký trực tiếp trên thiết bị mà không làm lộ khóa riêng tư.
2. **Xác thực Thiết bị & Toàn vẹn Phiên:** UID Link chủ động xác minh xem **UID Agent** tin cậy có đang chạy trên thiết bị hay không. Agent sẽ đồng bộ trạng thái ủy quyền và đảm bảo thiết bị đáp ứng các tiêu chuẩn tuân thủ an toàn (mã hóa ổ đĩa, tường lửa hoạt động) trước khi cho phép truy cập.

👉 **Tải UID Agent:** Xem hướng dẫn tại [UID Agent Setup Guide](https://github.com/oneuid/uid-agent) (hoặc `../../uid-agent/README.md` nếu nhân bản cục bộ cạnh nhau) để tự biên dịch và cài đặt bảng điều khiển desktop cho Linux, macOS, hoặc Windows.

---

## 🛡 Tính năng của Động cơ Bảo mật

### 1. Liên kết Phiên mã hóa (Cryptographic Session Binding)
Ngăn chặn đánh cắp phiên (session hijacking) và đánh cắp mã token. Khi xác thực thành công, UID Link khóa phiên làm việc bằng cách:
* Tạo dấu vân tay thiết bị phần cứng cục bộ.
* Tạo chữ ký liên kết HMAC cho tệp tin `sessionToken` hiện hoạt.
* Đăng ký liên kết bảo mật với API backend `/v1/auth/session-binding/register/`.
* Xác thực chữ ký cục bộ trước khi cho phép thực hiện các yêu cầu có đặc quyền.

### 2. Xác thực Nguồn gốc (Origin Verification - Lá chắn chống lừa đảo)
Chủ động kiểm tra các tên miền đã truy cập để phát hiện hành vi giả mạo thương hiệu UID.one:
* Khớp với các mẫu biểu thức chính quy (regex) nhắm vào các biến thể tên miền như `uid-one-login.com`, `uidone-secure.com`, và `uid.one.evil.com`.
* Tự động hiển thị biểu ngữ cảnh báo màu đỏ nếu phát hiện trang web giả mạo, ngăn người dùng nhập thông tin đăng nhập.

### 3. Ngăn ngừa Mất mát Dữ liệu ở Lớp Trình duyệt (Browser-Layer DLP)
Kiểm tra các hành động phía client để ngăn chặn rò rỉ PII, thông tin đăng nhập hoặc tài liệu nhạy cảm một cách vô ý:
* **Chế độ Trình chiếu (Presentation Mode):** Bật/tắt qua phím tắt `Alt+Shift+P` để tự động làm mờ và ẩn toàn bộ các định dạng văn bản nhạy cảm (như số điện thoại, email, CCCD Việt Nam, số thẻ tín dụng) trên các trang web. Di chuột (hover) để xem tạm thời.
* **Bộ chặn Tải tệp lên (File Upload Interceptor):** Lắng nghe các sự kiện tải tệp lên qua đầu vào file và kéo thả. Tệp tin được phân tích ở phía client, chặn các tệp không an toàn và hiển thị cảnh báo.
* **Bộ chặn Clipboard (Clipboard Interceptor):** Chặn các sự kiện copy và paste. Chặn dán dữ liệu không an toàn bằng modal xác nhận, đồng thời thông báo khi sao chép thông tin nhạy cảm.
* **Bộ chặn Biểu mẫu (Form Interceptor):** Quét các biểu mẫu gửi đi để đảm bảo tính tuân thủ trước khi dữ liệu rời khỏi trình duyệt.

### 4. Vệ sĩ Cookie & Chống Theo dõi (Cookie Guard & Anti-Tracking)
Bảo vệ quyền riêng tư của người dùng ngay cả khi họ bấm "Chấp nhận tất cả" trên các biểu ngữ chấp thuận cookie:
* Chặn ghi đè vào `document.cookie` trong ngữ cảnh trang, ngăn việc đăng ký cookie theo dõi/quảng cáo (như `_ga`, `_gid`, `_fbp`, `_fbc`, `hj*`, `cluid`).
* Phát hiện và chặn cookie chứa dữ liệu định danh nhạy cảm (như email, thẻ tín dụng, JWT và API Key).
* Quét định kỳ mỗi 5 giây để làm sạch các cookie theo dõi được thiết lập qua header phản hồi HTTP.

### 5. Xóa Siêu dữ liệu Hình ảnh (Dynamic EXIF & Metadata Stripper)
Tự động loại bỏ siêu dữ liệu có khả năng rò rỉ quyền riêng tư của hình ảnh:
* Chặn hình ảnh tải lên (JPEG/JPG) qua thẻ input hoặc thao tác kéo thả.
* Loại bỏ tọa độ GPS, dòng máy ảnh và dấu thời gian khởi tạo (phần APP1 EXIF) trước khi tái cấu trúc tệp tin gửi đi.

### 6. Tự động Hủy mã OTP / Xóa Bộ nhớ đệm Ô nhập liệu
Ngăn rò rỉ mã xác thực và dữ liệu nhạy cảm trong các môi trường dùng chung hoặc bị xâm nhập:
* Phát hiện các ô nhập mã OTP, 2FA, mật khẩu và thẻ tín dụng trong quá trình gửi biểu mẫu.
* Tự động xóa sạch các giá trị trong ô nhập liệu và xóa lịch sử tự động điền của trình duyệt sau 300ms.
* Xóa ngay lập tức nội dung clipboard nếu phát hiện chứa thông tin nhạy cảm.

### 7. Tín hiệu Quyền riêng tư Toàn cầu (GPC) & Thực thi DNT
Khẳng định quyền riêng tư tối cao của người dùng trên mọi tương tác web:
* Tự động chèn các tín hiệu quyền riêng tư (`navigator.globalPrivacyControl = true` và `navigator.doNotTrack = '1'`) vào ngữ cảnh cửa sổ toàn cục của tất cả các trang web.

### 8. Dọn dẹp Cửa sổ Xem & Lá chắn Ngăn chặn
* **Chặn Thông báo:** Chặn đăng ký service worker và quyền thông báo để ngăn các thông báo đẩy phiền hà từ bên thứ ba.
* **Dọn dẹp Viewport:** Quét và ẩn các phần tử nổi, lớp phủ đáng ngờ và các công cụ ghi nhận phím nhấn (keylogger) tiềm ẩn trên các trang bảo mật.
* **Làm mờ khi Mất Tập trung (Tab Focus Blurring):** Tự động làm mờ viewport của trang chỉ khi tab bị ẩn hoặc chuyển sang tab khác (`document.hidden`), bảo vệ khỏi việc nhìn lén màn hình.

---

## 🚀 Hướng dẫn cài đặt

Chọn một trong hai cách dưới đây để cài đặt tiện ích mở rộng:

### Cách 1: Cài đặt nhanh từ file Zip (Khuyên dùng)
1. Tải về tệp tin **`uid-link-chrome.zip`** (cho các trình duyệt Chrome, Edge, Brave) hoặc **`uid-link-firefox.zip`** (cho trình duyệt Firefox) ở thư mục gốc của repository này.
2. Giải nén tệp zip đã tải xuống thành một thư mục trên máy tính của bạn.
3. Mở trình duyệt và truy cập trang quản lý tiện ích `chrome://extensions/` (hoặc `about:debugging` đối với Firefox).
4. Bật **"Developer mode"** (Chế độ nhà phát triển) ở góc trên bên phải màn hình.
5. Bấm nút **"Load unpacked"** (Tải tiện ích đã giải nén) và chọn thư mục bạn vừa giải nén ở Bước 2.

---

### Cách 2: Tự biên dịch từ mã nguồn
1. Tải mã nguồn dự án về máy tính:
   ```bash
   git clone https://github.com/oneuid/uid-extension.git
   cd uid-extension
   ```
2. Cài đặt các gói phụ thuộc và tiến hành biên dịch:
   ```bash
   npm install
   npm run build
   ```
3. Mở trang quản lý tiện ích `chrome://extensions/`, bật chế độ nhà phát triển, bấm **"Load unpacked"** và chọn thư mục đầu ra **`dist/chrome/`** vừa được tạo.

---

## 📂 Cấu hình Native Messaging

Để kiểm tra các tính năng tương tác hệ điều hành (như kiểm tra phần cứng bảo mật), hãy đảm bảo tệp manifest của host Native Messaging được cài đặt đúng vào thư mục hệ thống tương ứng:

* **Linux:** `~/.config/google-chrome/NativeMessagingHosts/`
* **macOS:** `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
* **Windows:** Khóa Registry `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`

---

## 📄 Bản quyền

Dự án này được cấp phép theo điều khoản của [Bản quyền Nguồn mở Có sẵn UID.ONE (Source-Available License)](LICENSE).

Việc công khai mã nguồn giúp đảm bảo tính minh bạch tuyệt đối trong cách các chính sách Zero-Trust và DLP được thực thi trên trình duyệt của bạn. Dưới điều khoản này:
* Bạn được phép kiểm tra và chạy phần mềm cục bộ để phục vụ mục đích xác minh bảo mật cá nhân.
* Nghiêm cấm phân phối lại thương mại bên thứ ba, xuất bản lên các kho ứng dụng tiện ích công cộng và tạo các nhánh thương mại.
* Các khách hàng doanh nghiệp (B2B) được cấp quyền của UID.ONE hoàn toàn có quyền sử dụng phần mềm trong hoạt động kinh doanh hàng ngày.
