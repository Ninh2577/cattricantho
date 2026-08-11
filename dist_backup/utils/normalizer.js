// utils/normalizer.js
import { seoConfig } from '../config/seo.config.js';
import { siteConfig } from '../config/site.config.js';

export class DataNormalizer {
  /**
   * Chuẩn hóa dữ liệu bài viết từ CMS
   * @param {Object} articleData Dữ liệu thô từ CMS
   * @returns {Object} Dữ liệu đã được chuẩn hóa
   */
  static normalizeArticle(articleData) {
    if (!articleData) return null;

    // Chuẩn hóa SEO Metadata
    const title = articleData.seoTitle || articleData.title || seoConfig.defaultTitle;
    const description = articleData.seoDescription || articleData.excerpt || seoConfig.defaultDescription;
    
    // Chuẩn hóa Slug & Canonical
    let slug = articleData.slug ? articleData.slug.toLowerCase().trim() : '';
    if (slug.startsWith('/')) slug = slug.substring(1);
    if (slug.endsWith('/')) slug = slug.substring(0, slug.length - 1);
    const canonicalUrl = `${siteConfig.url}/${slug}`;

    // Chuẩn hóa Ảnh
    const featuredImage = articleData.featuredImage?.url || seoConfig.defaultOGImage;

    // Chuẩn hóa Date
    const createdAt = articleData.createdAt ? new Date(articleData.createdAt).toISOString() : new Date().toISOString();
    const updatedAt = articleData.updatedAt ? new Date(articleData.updatedAt).toISOString() : createdAt;

    // Chuẩn hóa Author & Reviewer
    const authorName = articleData.author?.name || siteConfig.name;
    const reviewerName = articleData.medicalReviewer?.name || "Hội đồng Chuyên môn Y khoa";

    return {
      ...articleData,
      normalized: {
        title,
        description,
        slug,
        canonicalUrl,
        featuredImage,
        createdAt,
        updatedAt,
        authorName,
        reviewerName
      }
    };
  }

  /**
   * Chuẩn hóa danh sách bài viết
   */
  static normalizeList(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.map(this.normalizeArticle);
  }
}
