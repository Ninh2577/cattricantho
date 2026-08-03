# Build Pipeline Guide
Quá trình Build được quản lý hoàn toàn bởi **Orchestrator** (`build.js`).

## Luồng hoạt động (Lifecycle)
1. **Validation**: Quét cấu hình gốc (`validator.js`).
2. **Rollback Backup**: Lưu trữ `dist` cũ (`rollback.js`).
3. **Copy Assets**: Đưa các file tĩnh qua `dist`.
4. **Data Normalization**: (Được tích hợp vào Component Injection).
5. **HTML Injection & Metadata**: Tiêm Component, biến, và Dynamic Metadata Layer (`seo.js`).
6. **Security Injection**: Thêm các header bảo mật cấp trình duyệt (`security.js`).
7. **Validation**: Kiểm thử H1, Canonical, Alt Text (`html-validator.js`).
8. **Manifest & QA**: Sinh `manifest.json` và báo cáo HTML `seo-report.html` (`qa-report.js`).
9. **Cleanup**: Xóa thư mục Backup nếu thành công.

## Troubleshooting
Nếu build lỗi, hãy mở Terminal/CMD và chạy `node build.js` nội bộ, hệ thống **Structured Logging** sẽ báo lỗi bằng màu đỏ (ERROR) rất rõ ràng ở dòng nào và module nào gây lỗi.
