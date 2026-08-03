# Component Documentation

## Table of Contents (TOC) Component
**Purpose:** Tự động quét thẻ H2, H3 trong bài viết để tạo Menu điều hướng nội dung nhanh chóng, đáp ứng tiêu chuẩn SEO UX.
**Inputs:** Cần chứa class `.platform-article-content` để JS quét thẻ heading.
**Variants:** Thu gọn (Collapsed) và Mở rộng (Expanded).
**Accessibility:** Có thuộc tính `aria-label` trên nút Toggle.
**Example Usage:**
```html
<div class="toc-container">
  <!-- INJECT_COMPONENT: components/toc.html -->
</div>
```

## Breadcrumb Component
**Purpose:** Điều hướng và báo hiệu vị trí phân cấp của URL. Tích hợp Schema BreadcrumbList chuẩn YMYL.
**Inputs:** Array các object { name, url }.
**Example Usage:** Tự động gen theo JSON schema.

## Dynamic CTA Component
**Purpose:** Hiển thị thanh công cụ điều hướng hành động người dùng (Zalo, Hotline, Đặt lịch). Tự động dính dưới cùng màn hình trên Mobile (Sticky Bottom Bar).
**Inputs:** Zalo Link, Hotline (từ config Layer).
