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
   * Tiêm (Inject) Contextual Links vào nội dung bài viết
   * @param {string} content Nội dung HTML của bài viết
   * @param {Array} keywords Mảng các keyword và link tương ứng [{keyword: 'cắt trĩ', url: '/cat-tri'}]
   */
  static injectContextualLinks(content, keywords = []) {
    if (!content) return content;
    let modifiedContent = content;

    keywords.forEach(kw => {
      // Chỉ replace từ khóa đầu tiên tìm thấy (để tránh spam link)
      // Regex này đảm bảo không replace các text đã nằm trong thẻ <a>
      const regex = new RegExp(`(?!(?:[^<]+>|[^>]+<\\/a>))\\b(${kw.keyword})\\b`, 'i');
      modifiedContent = modifiedContent.replace(regex, `<a href="${kw.url}" class="skmd-internal-link">$1</a>`);
    });

    return modifiedContent;
  }
}
