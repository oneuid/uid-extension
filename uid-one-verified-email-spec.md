# UID.one — Verified Email via UID Link
## Tài liệu tham khảo kỹ thuật & chiến lược

---

## 1. Bối cảnh & Vấn đề

Email hiện tại được xây dựng trên giao thức SMTP từ thập niên 70 — không có cơ chế xác thực danh tính người gửi theo nghĩa cryptographic. Hậu quả:

- **Business Email Compromise (BEC)** gây thiệt hại $55B+/năm toàn cầu (FBI 2023)
- CEO fraud — giả email cấp trên yêu cầu chuyển tiền — xảy ra hàng ngày
- Deepfake email từ AI ngày càng tinh vi, không thể phân biệt bằng mắt thường
- Hợp đồng, thỏa thuận quan trọng gửi qua email không có chữ ký số

**Analogy:** Khi xuất hóa đơn, chúng ta bắt buộc phải ký số. Email công việc quan trọng cũng nên như vậy — nhưng hiện tại không có cơ chế nào làm điều đó một cách đơn giản.

---

## 2. Giải pháp — Verified Email via UID Link

### Nguyên lý cốt lõi

Người gửi **đơn phương tạo ra trust signal** — không cần thỏa thuận trước với người nhận, không cần email provider (Gmail, Outlook) tích hợp bất cứ điều gì.

> Chỉ cần một trong hai bên biết về UID.one — người gửi — là đủ để bắt đầu.

### Stack kỹ thuật hiện có

UID.one đã có 3 tầng infrastructure:

```
UID Link (Browser Extension Layer)
    ↓  DLP · Session Binding · Phishing Prevention · Content-aware
UID Vault (Hardware Root of Trust)
    ↓  Private key trong Secure Enclave/StrongBox · Không rời thiết bị
    ↓  WebAuthn/FIDO2 · ZK Authentication · HKDF Backup · W3C VCs
UID Auth SDK (Integration Bridge)
    ↓  JWT RS256 · Local JWKS · OIDC/SAML compatible
    ↓  Relying party nhận token, không nhận data
```

Đây là **một stack dọc liên kết nhau**, không phải 3 sản phẩm rời.

---

## 3. Cơ chế hoạt động — Verified Email

### Luồng kỹ thuật

```
NGƯỜI GỬI (có UID Link)
────────────────────────
1. Soạn email bình thường trong Gmail/Outlook
2. UID Link extension chạy ngầm
3. Trước khi Send:
   - Ký nội dung email bằng Vault private key
   - Tạo hash của nội dung (content integrity)
   - Chèn signature vào email header (ẩn)
   - Thêm signature block vào cuối email (hiển thị)
4. Gửi qua Gmail/Outlook bình thường

NGƯỜI NHẬN
────────────────────────
Trường hợp A — Đã có UID Link:
  → Extension tự động detect signature trong header
  → Hiện badge "✓ Verified" ngay trong inbox
  → Không cần làm gì thêm

Trường hợp B — Chưa có UID Link:
  → Thấy signature block ở cuối email
  → Click link → trang verify web (không cần cài gì)
  → Thấy kết quả xác minh
  → Nếu muốn tự động verify mọi email → cài extension
```

### Signature block hiển thị

```
─────────────────────────────────────────────────
🔐 Email này được ký số bởi UID.one
   Người gửi: nguyen.van.a@company.com
   Thời gian ký: 14:32 — 31/05/2026
   Xác minh danh tính → uid.one/verify/[hash]
─────────────────────────────────────────────────
```

### Trang verify (uid.one/verify/[hash])

Người nhận chưa có extension truy cập link này thấy:

```
✓ Chữ ký hợp lệ
Người gửi: Nguyễn Văn A
Tổ chức: Company ABC
Ký lúc: 14:32 · 31/05/2026
Nội dung không bị thay đổi sau khi ký

[Cài UID Link để tự động xác minh mọi email]
```

---

## 4. Hai chiều xác thực

### A. Xác thực danh tính người gửi
- Private key trong Vault ký email → không thể giả mạo
- BEC fraud, CEO fraud không còn khả thi với người dùng UID.one
- **Đây là priority #1** — 90% thiệt hại tài chính thực tế đến từ vấn đề này

### B. Xác thực nội dung (content integrity)
- Hash nội dung email khi ký → verify khi nhận
- Phát hiện nội dung bị tamper trong quá trình truyền
- **Priority #2** — có giá trị cao trong môi trường pháp lý, hợp đồng

### Quan hệ giữa hai chiều
Khi biết chắc người gửi là ai, AI phân tích nội dung sẽ chính xác hơn vì có verified context. Đây là nền tảng cho AI-native communication ở giai đoạn tiếp theo.

---

## 5. Tại sao không cần Gmail tích hợp

Đây là lợi thế cạnh tranh cốt lõi:

| Giải pháp | Yêu cầu |
|---|---|
| PGP/S-MIME | Cả hai đầu phải setup phức tạp |
| Gmail Confidential | Chỉ trong Gmail ecosystem |
| DocuSign | Phải dùng platform riêng |
| **UID Link** | **Chỉ cần người gửi cài extension** |

UID Link hoạt động như một **layer ngồi trên** bất kỳ email client nào — Gmail, Outlook, Yahoo, Thunderbird — mà không yêu cầu provider thay đổi bất cứ điều gì.

---

## 6. Growth model tự nhiên

Mỗi email được ký = một lần expose UID.one cho người nhận mới.

**Viral loop:**
```
Người gửi ký email
    → Người nhận thấy signature block
    → Click verify → thấy giá trị
    → Cài extension
    → Bắt đầu ký email của họ
    → Người nhận của họ thấy signature block
    → ...
```

Đây là cơ chế tăng trưởng tương tự:
- **DocuSign** — người nhận document không cần account, ký xong thấy giá trị, tự tạo account
- **Dropbox** — share folder kéo người nhận vào ecosystem
- **Calendly** — nhận link đặt lịch → tự dùng Calendly

---

## 7. AI-native Communication — Lộ trình

### Giai đoạn 1 (Hiện tại — có thể build ngay)
Verified Email như mô tả ở trên. Chỉ xác thực danh tính. Stack đã sẵn sàng.

### Giai đoạn 2 (Sau khi có user base)
Thêm content integrity — hash nội dung khi gửi, verify khi nhận. Phát hiện tamper.

### Giai đoạn 3 (AI layer — khi có đủ verified identities)
AI triage on-device: phân loại message dựa trên *verified sender identity* + nội dung.
- Không phải spam filter thông thường
- Mà là **trust filter** — AI biết chắc người gửi là ai trước khi phân tích họ nói gì
- Đây là điểm khác biệt thực sự so với mọi AI email tool hiện có

---

## 8. Competitive moat

Moat của UID.one không phải công nghệ ZK đơn thuần (có thể bị copy), mà là sự kết hợp:

1. **Network of verified identities** — càng nhiều người dùng, càng có giá trị
2. **OIDC compatibility** — zero integration friction cho relying parties
3. **Self-custody vault** — Google/Apple không thể replicate vì model kinh doanh của họ phụ thuộc vào việc giữ data người dùng
4. **Email-native distribution** — không cần platform mới, chạy trên hạ tầng email hiện có

---

## 9. Câu hỏi kỹ thuật cần giải quyết tiếp theo

1. Signature được chèn vào email header theo chuẩn nào? (custom header vs DKIM-style)
2. Trang verify uid.one/verify/[hash] — hash được tạo và lưu như thế nào để stateless?
3. Nếu người gửi forward email — signature có còn hợp lệ không?
4. Mobile client (Gmail app, Outlook app) — extension không chạy được, xử lý thế nào?
5. Recovery flow khi đổi thiết bị — signature key có được migrate không?

---

*Tài liệu này tóm tắt cuộc thảo luận chiến lược và kỹ thuật về hướng phát triển AI-native Communication của UID.one, tập trung vào Verified Email làm bước đầu tiên khả thi nhất.*
