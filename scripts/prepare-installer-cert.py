import os
import base64
import subprocess
import getpass

def main():
    print("=== TOOL TẠO CHỨNG CHỈ INSTALLER TRÊN LINUX ===")
    
    # 1. Đọc file base64_cert.txt hoặc hỏi người dùng paste trực tiếp
    base64_path = 'base64_cert.txt'
    b64_content = ""
    
    if os.path.exists(base64_path):
        with open(base64_path, 'r') as f:
            b64_content = f.read().strip()
        print("1. Đã tìm thấy file 'base64_cert.txt' trên ổ đĩa.")
    else:
        print("Không tìm thấy file 'base64_cert.txt'.")
        print("Bạn có thể copy mã Base64 của certificate từ GitHub Secrets.")
        b64_content = input("Hãy paste mã Base64 của certificate tại đây và nhấn Enter:\n").strip()
    
    if not b64_content:
        print("Lỗi: Mã Base64 trống!")
        return
    
    try:
        # Làm sạch chuỗi base64 (loại bỏ khoảng trắng, xuống dòng)
        b64_content = "".join(b64_content.split())
        p12_data = base64.b64decode(b64_content)
        with open('distribution.p12', 'wb') as f:
            f.write(p12_data)
        print("Đã tái tạo thành công file 'distribution.p12' cũ.")
    except Exception as e:
        print(f"Lỗi giải mã base64: {e}")
        return

    # 2. Hỏi mật khẩu của file P12 cũ
    p12_password = getpass.getpass("Nhập mật khẩu file P12 cũ của bạn: ")

    # 3. Tạo Key và CSR mới cho Mac Installer (chỉ tạo nếu chưa có)
    if not os.path.exists('installer.key') or not os.path.exists('installer.csr'):
        print("\n2. Đang tạo Private Key và CSR cho chứng chỉ Installer mới...")
        subprocess.run([
            'openssl', 'genrsa', '-out', 'installer.key', '2048'
        ])
        subprocess.run([
            'openssl', 'req', '-new', '-key', 'installer.key', '-out', 'installer.csr',
            '-subj', '/CN=Mac Installer/O=TRIP EXPRESS VIETNAM COMPANY LIMITED/C=VN'
        ])
    else:
        print("\n2. Đã tìm thấy 'installer.key' và 'installer.csr' cũ. Bỏ qua việc tạo mới để tránh làm lệch khóa của file 'installer.cer' hiện tại.")
    
    print("\n=======================================================")
    print("BƯỚC TIẾP THEO (BẠN THỰC HIỆN TRÊN TRÌNH DUYỆT):")
    print("1. Truy cập: https://developer.apple.com/account/resources/certificates/add")
    print("2. Chọn loại: 'Mac Installer Distribution' (hoặc '3rd Party Mac Developer Installer').")
    print("3. Tải lên file 'installer.csr' vừa được tạo trong thư mục dự án này.")
    print("4. Nhấn Generate và tải file chứng chỉ về máy, đặt tên là 'installer.cer' và lưu vào thư mục dự án này.")
    print("=======================================================\n")
    
    input("Sau khi đã tải về và lưu file 'installer.cer' vào thư mục dự án, nhấn Enter để tiếp tục...")
    
    if not os.path.exists('installer.cer'):
        print("Lỗi: Không tìm thấy file 'installer.cer' trong thư mục dự án!")
        return

    # 4. Trích xuất Cert cũ & Key cũ ra file PEM tạm thời
    print("\n3. Đang trích xuất thông tin chứng chỉ cũ...")
    extract_cmd = [
        'openssl', 'pkcs12', '-in', 'distribution.p12', '-nodes', 
        '-out', 'distribution.pem', '-password', f'pass:{p12_password}',
        '-legacy'
    ]
    res = subprocess.run(extract_cmd, capture_output=True)
    if res.returncode != 0:
        print("Lỗi: Mật khẩu file P12 cũ không chính xác!")
        return

    # 5. Chuyển installer.cer từ định dạng DER sang PEM
    subprocess.run([
        'openssl', 'x509', '-in', 'installer.cer', '-inform', 'der', '-out', 'installer.pem'
    ])

    # 6. Đóng gói thành file installer.p12 mới
    print("4. Đang đóng gói thành file 'installer.p12'...")
    new_password = getpass.getpass("Thiết lập mật khẩu cho file P12 mới: ")
    subprocess.run([
        'openssl', 'pkcs12', '-export', '-legacy', '-out', 'installer.p12', 
        '-inkey', 'installer.key', '-in', 'installer.pem', '-password', f'pass:{new_password}'
    ])

    # 7. Mã hóa cả hai file và ghép lại thành một chuỗi phân tách bởi dấu phẩy
    if os.path.exists('distribution.p12') and os.path.exists('installer.p12'):
        with open('distribution.p12', 'rb') as f:
            dist_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open('installer.p12', 'rb') as f:
            inst_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        combined_b64 = f"{dist_b64},{inst_b64}"
        
        with open('new_base64_cert.txt', 'w') as f:
            f.write(combined_b64)
            
        print("\n=== THÀNH CÔNG! ===")
        print("1. File Base64 kết hợp mới đã được lưu vào 'new_base64_cert.txt'.")
        print("2. Bạn hãy copy toàn bộ nội dung file này cập nhật vào Secret 'BUILD_CERTIFICATE_BASE64' trên GitHub.")
        print(f"3. Cập nhật Secret 'P12_PASSWORD' trên GitHub thành mật khẩu mới: {new_password}")
        print("====================")
        
        # Dọn dẹp file tạm
        for temp_file in ['distribution.pem', 'installer.pem', 'distribution.p12', 'installer.p12']:
            if os.path.exists(temp_file):
                os.remove(temp_file)
    else:
        print("Thất bại trong việc tạo file P12 mới.")

if __name__ == '__main__':
    main()
