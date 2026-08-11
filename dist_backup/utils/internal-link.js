// utils/internal-link.js

export class InternalLinkingEngine {
  
  /**
   * Lấy danh sách bài viết liên quan dựa trên chuyên mục (category)
   */
  static getRelatedArticles(currentArticle, allArticles, limit = 4) {
    if (!currentArticle || !allArticles) return [];
    
    return allArticles
      .filter(a => a.category === currentArticle.category && a.slug !== currentArticle.slug)
      .slice(0, limit);
  }

  /**
   * Lấy bài viết trước và sau (Prev/Next) để điều hướng
   */
  static getPrevNextArticles(currentArticle, allArticles) {
    const index = allArticles.findIndex(a => a.slug === currentArticle.slug);
    if (index === -1) return { prev: null, next: null };

    return {
      prev: index > 0 ? allArticles[index - 1] : null,
      next: index < allArticles.length - 1 ? allArticles[index + 1] : null
    };
  }

  /**
   * Tiêm (Inject) Contextual Links vào nội dung bài viết một cách an toàn
   * @param {string} content Nội dung HTML của bài viết
   * @param {Array} keywords Mảng các keyword và link tương ứng [{keyword: 'cắt trĩ', url: '/cat-tri'}]
   * @returns {Object} { html: string, stats: Object }
   */
  static injectContextualLinks(content, keywords = []) {
    if (!content) return { html: content, stats: {} };
    
    let html = '';
    let currentIndex = 0;
    
    // Các thẻ cần bỏ qua toàn bộ nội dung bên trong
    const forbiddenTags = ['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'script', 'style', 'noscript', 'textarea'];
    
    let injectedCount = 0;
    let skippedCount = 0;
    
    // Theo dõi keyword đã được gắn chưa (chỉ gắn 1 lần mỗi keyword/bài)
    const usedKeywords = new Set();
    
    while (currentIndex < content.length) {
      const openBracketIdx = content.indexOf('<', currentIndex);
      
      if (openBracketIdx === -1) {
        // Không còn thẻ nào, xử lý đoạn text cuối cùng
        let textPart = content.substring(currentIndex);
        html += processTextNode(textPart);
        break;
      }
      
      // Lấy phần text trước thẻ (nếu có)
      if (openBracketIdx > currentIndex) {
        let textPart = content.substring(currentIndex, openBracketIdx);
        html += processTextNode(textPart);
      }
      
      // Xử lý bản thân cái thẻ
      const closeBracketIdx = content.indexOf('>', openBracketIdx);
      if (closeBracketIdx === -1) {
        html += content.substring(openBracketIdx);
        break;
      }
      
      const tagContent = content.substring(openBracketIdx, closeBracketIdx + 1);
      html += tagContent;
      currentIndex = closeBracketIdx + 1;
      
      // Xác định tên thẻ
      const tagNameMatch = tagContent.match(/<\s*([a-z0-9]+)/i);
      if (tagNameMatch) {
        const tagName = tagNameMatch[1].toLowerCase();
        
        // Nếu là thẻ cấm, tìm thẻ đóng tương ứng và bỏ qua xử lý text bên trong
        if (forbiddenTags.includes(tagName) && !tagContent.endsWith('/>')) {
          const closingTag = `</${tagName}>`;
          const closingIdx = content.indexOf(closingTag, currentIndex);
          
          if (closingIdx !== -1) {
            // Thêm nguyên xi phần nội dung bên trong và thẻ đóng
            html += content.substring(currentIndex, closingIdx + closingTag.length);
            currentIndex = closingIdx + closingTag.length;
          }
        }
      }
    }
    
    function processTextNode(text) {
      let result = text;
      keywords.forEach(kw => {
        if (usedKeywords.has(kw.keyword)) return;
        
        // Match exact word boundaries
        const regex = new RegExp(`\\b(${kw.keyword})\\b`, 'i');
        const match = result.match(regex);
        
        if (match) {
          result = result.replace(regex, `<a href="${kw.url}" class="skmd-internal-link">$1</a>`);
          usedKeywords.add(kw.keyword);
          injectedCount++;
        }
      });
      return result;
    }
    
    return {
      html: html,
      stats: {
        injected: injectedCount,
        skipped: skippedCount,
        keywordsUsed: Array.from(usedKeywords)
      }
    };
  }
}
