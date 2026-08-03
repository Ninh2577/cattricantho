# Architecture Decision Record (ADR) 001

**Title:** Chọn kiến trúc Multi-site Component-based
**Date:** 2026-08-03
**Status:** Approved

## Context
Hệ sinh thái cần nhân bản hàng chục website vệ tinh (Cắt trĩ, Nam khoa, Phụ khoa) trong thời gian ngắn mà vẫn đảm bảo tính nhất quán, dễ bảo trì và tối ưu SEO. Kiến trúc nguyên khối (Monolith) cũ không đáp ứng được tốc độ scale và dễ sinh Technical Debt.

## Decision
- Áp dụng kiến trúc tách bạch Config Layer (Configuration-driven).
- Mọi logic và UI dùng chung sẽ được trích xuất thành Shared Components.
- Vercel được dùng để tự động CI/CD và apply Cache/Security headers.
- Hygraph CMS là Single Source of Truth cho nội dung Y khoa (YMYL).

## Consequences
- Clone website mới chỉ tốn < 30 phút.
- Rủi ro lỗi đồng bộ giảm thiểu vì code core nằm chung.
- Cần tuân thủ kỷ luật nghiêm ngặt: Không sửa core cho các tính năng đặc thù của 1 site.
