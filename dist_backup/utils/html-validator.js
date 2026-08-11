// utils/html-validator.js
import { Logger } from './logger.js';

export class HtmlValidator {
  
  /**
   * Validate toàn bộ HTML Output sau khi gen
   * @param {string} html String HTML của trang
   * @param {string} filename Tên file đang kiểm tra
   * @returns {Object} { status: 'PASS'|'FAIL', warnings: [], errors: [] }
   */
  static validate(html, filename) {
    const results = {
      status: 'PASS',
      warnings: [],
      errors: []
    };

    // 1. Kiểm tra thẻ H1 (Chỉ được phép có đúng 1 thẻ H1)
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 0) {
      results.errors.push('Thiếu thẻ <h1>.');
    } else if (h1Count > 1) {
      results.errors.push(`Có nhiều hơn 1 thẻ <h1> (Số lượng: ${h1Count}).`);
    }

    // 2. Kiểm tra Title & Meta Description
    if (!/<title>.*<\/title>/i.test(html)) {
      results.errors.push('Thiếu thẻ <title>.');
    }
    if (!/<meta\s+name=["']description["']/i.test(html)) {
      results.errors.push('Thiếu <meta name="description">.');
    }

    // 3. Kiểm tra Canonical
    if (!/<link\s+rel=["']canonical["']/i.test(html)) {
      results.errors.push('Thiếu thẻ Canonical.');
    }

    // 4. Accessibility (A11y): Thiếu alt trong ảnh
    const imgTags = html.match(/<img[^>]+>/gi) || [];
    imgTags.forEach(img => {
      if (!/alt=["'][^"']*["']/i.test(img)) {
        results.warnings.push(`Ảnh thiếu thuộc tính alt: ${img.substring(0, 50)}...`);
      }
    });

    // 5. Schema Validation (Có tồn tại Schema không)
    if (!/<script\s+type=["']application\/ld\+json["']/i.test(html)) {
      results.warnings.push('Trang này không có Schema Markup.');
    }
    
    // 6. TOC Integrity Validation
    const tocMatch = html.match(/<nav\s+class=["']skmd-toc["'][^>]*>(.*?)<\/nav>/is);
    if (tocMatch) {
      const tocHtml = tocMatch[1];
      const linkRegex = /<a[^>]+href=["']#([^"']+)["'][^>]*>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(tocHtml)) !== null) {
        const targetId = linkMatch[1];
        // Check if the target ID actually exists on a heading in the document
        const idRegex = new RegExp(`<h[23][^>]+id=["']${targetId}["']`, 'i');
        if (!idRegex.test(html)) {
          results.errors.push(`TOC INTEGRITY ERROR: Mục lục chứa liên kết trỏ đến ID '#${targetId}' nhưng không tìm thấy heading nào có ID này.`);
        }
      }
    }

    if (results.errors.length > 0) {
      results.status = 'FAIL';
      Logger.error('HtmlValidator', `[${filename}] Validation Failed!`, new Error(results.errors.join(' | ')));
    } else if (results.warnings.length > 0) {
      Logger.warning('HtmlValidator', `[${filename}] Validation Warnings: ${results.warnings.length} cảnh báo.`);
    }

    return results;
  }
}
