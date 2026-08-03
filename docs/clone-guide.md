# Clone Guide (Nhân bản Website)

Tài liệu hướng dẫn quy trình "Zero-code Clone" tạo website vệ tinh mới (Ví dụ: `NamKhoaCanTho`) trong chưa đầy 30 phút.

## Quy trình 5 bước:

### Bước 1: Fork Repository
Clone mã nguồn từ Github Repo `enterprise-clinic-platform` sang thư mục mới.

### Bước 2: Thay đổi Cấu hình (Configuration)
Không được sửa vào HTML/CSS/JS Core. Chỉ sửa thư mục `/config`:
- **`site.config.js`**: Đổi tên website, đổi API Endpoint của CMS mới.
- **`clinic.config.js`**: Đổi thông tin Hotline, Zalo, Địa chỉ.
- **`theme.config.js`**: Nếu website Nam Khoa dùng màu Đỏ, đổi `primary` thành `#dc2626`.

### Bước 3: Thiết lập Hygraph CMS
- Duplicate project trên Hygraph.
- Lấy Endpoint API điền vào `site.config.js`.

### Bước 4: Chạy CI/CD Testing
Khởi chạy bộ test `npm run test`. Nếu 100% Pass, chuyển sang Bước 5.

### Bước 5: Deploy lên Vercel
Kết nối Github Repo với Vercel. Nhấn Deploy.
Hệ thống tự động apply Security Headers, Cache và Cấu hình tự động.
