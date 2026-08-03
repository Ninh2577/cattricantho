# Architecture Guide
Hệ thống **Enterprise Medical SEO Platform** được xây dựng trên nguyên tắc **Module hóa** và **Pure Functions**.

## Core Concepts
- **One-way Data Flow**: Dữ liệu chỉ chảy theo một chiều (Config -> Normalizer -> Metadata -> HTML -> Validator).
- **Clone Architecture**: Không có bất cứ hardcode nào trong HTML/CSS. Mọi thứ đều được lấy từ `config/` (seo, clinic, site, theme). Khi muốn nhân bản (clone) website thứ 2, chỉ cần thay đổi nội dung file config.

## Thư mục cấu trúc
- `config/`: Nơi chứa toàn bộ cấu hình, không logic.
- `utils/`: Nơi chứa các công cụ xử lý. Các công cụ này hoàn toàn độc lập với nhau.
- `pages/`: Nơi chứa Template HTML tĩnh chưa được tiêm dữ liệu.
- `dist/`: Output sau khi build.

## An toàn dữ liệu
- **Rollback Strategy**: Quá trình Build tự động Backup `dist` cũ. Nếu quá trình Build bị lỗi, `dist` cũ sẽ tự động được Restore, đảm bảo Vercel luôn có file chạy hợp lệ mà không bao giờ báo lỗi `404 Not Found`.
