# Clone Guide - Hướng dẫn nhân bản Website

Nhờ kiến trúc Enterprise, việc nhân bản (clone) một dự án vệ tinh mới cực kỳ nhanh chóng.

## Các bước thực hiện:
1. Copy toàn bộ thư mục mã nguồn sang thư mục mới (vd: `cat-tri-ha-noi`).
2. Mở file `config/site.config.js` và thay đổi Tên Website, Đường dẫn, Logo.
3. Mở file `config/clinic.config.js` và thay đổi Hotline, Địa chỉ phòng khám.
4. Mở file `config/theme.config.js` và đổi màu sắc chủ đạo.
5. Mở file `config/seo.config.js` và chỉnh lại mô tả SEO mặc định.
6. Kết nối Github Repo mới với Vercel.
7. Vercel sẽ tự động chạy lệnh `node build.js` và toàn bộ giao diện, SEO, Metadata, Sitemap sẽ tự động uốn theo thông tin cấu hình mới mà không cần sửa 1 dòng code HTML hay Logic nào.

Chúc bạn xây dựng hệ sinh thái vệ tinh thành công!
