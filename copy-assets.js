import fs from 'fs';
import path from 'path';

// Đường dẫn file logo mới được AI tạo ra trong thư mục lưu trữ
const sourceFile = "C:\\Users\\hoang\\.gemini\\antigravity-ide\\brain\\f04932ea-938f-4555-8952-9ca23216507e\\clinic_logo_favicon_1785812301352.png";

// Đường dẫn đích trong project
const logoDest = path.join(process.cwd(), 'assets', 'images', 'logo.png');
const faviconDest = path.join(process.cwd(), 'favicon.ico');

try {
  // Tạo thư mục nếu chưa có
  const logoDir = path.dirname(logoDest);
  if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
  }

  // Copy và đè file
  fs.copyFileSync(sourceFile, logoDest);
  console.log("✅ Đã cập nhật thành công: " + logoDest);

  fs.copyFileSync(sourceFile, faviconDest);
  console.log("✅ Đã cập nhật thành công: " + faviconDest);

  console.log("👉 Bạn có thể xóa file script này sau khi chạy.");
} catch (error) {
  console.error("❌ Lỗi khi copy file:", error.message);
}
