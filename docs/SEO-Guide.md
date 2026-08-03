# SEO & Schema Guide

## SEO Configuration
Mọi cấu hình SEO mặc định được đặt tại `config/seo.config.js`. 
- Để ép Google không index môi trường Test (Preview/Dev), hệ thống tự đọc biến môi trường `process.env`.
- Cấu hình thẻ chuẩn hóa tự động:
  - `forceHttps`: Tự động thêm `https://`
  - `removeWww`: Tự động gỡ bỏ `www.`
  - `removeTrailingSlash`: Gỡ bỏ dấu `/` ở cuối đường dẫn (Ví dụ: `/cat-tri/` thành `/cat-tri`).
  - `forceLowercase`: Ép đường dẫn thành chữ thường.

## Schema Factory
Thay vì copy paste Schema, hệ thống sở hữu **Schema Factory** (`utils/schema.js`).
Đây là các hàm thuần túy (Pure Functions) nhận biến đầu vào và trả về chuỗi JSON-LD hợp lệ.
Đã tích hợp các Schema chuyên y khoa (Medical YMYL) cho Website:
- `Organization` & `MedicalClinic`
- `FAQPage`
- `MedicalWebPage` & `Article`
- `Person` (vai trò `Doctor` hoặc `MedicalReviewer`).

## Nội bộ Linking
Sử dụng `utils/internal-link.js` để tự động dò tìm các cụm từ quan trọng (Contextual Keywords) và chèn thẻ `<a>` vào bài viết mà không làm vỡ HTML.
