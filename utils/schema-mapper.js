// utils/schema-mapper.js
import { schemaConfig } from '../config/schema.config.js';

/**
 * Lớp trừu tượng hóa dữ liệu (Mapping Layer)
 * 1. Định nghĩa Strategy Matrix cho từng loại trang.
 * 2. Ưu tiên (Priority) xử lý để tránh conflict.
 * 3. Chuẩn hóa dữ liệu thô từ CMS/Config trước khi đưa vào SchemaFactory.
 */
export class SchemaMapper {
  
  /**
   * SCHEMA STRATEGY MATRIX
   * Xác định chính xác bộ Schema nào được phép render cho trang nào.
   */
  static getStrategy(pageType) {
    const baseGlobal = [];
    if (schemaConfig.features.enableOrganization) baseGlobal.push('Organization');
    if (schemaConfig.features.enableWebSite) baseGlobal.push('WebSite');
    if (schemaConfig.features.enableMedicalClinic) baseGlobal.push('MedicalClinic');
    if (schemaConfig.features.enableLocalBusiness) baseGlobal.push('LocalBusiness');
    if (schemaConfig.features.enableSearchAction) baseGlobal.push('SearchAction');

    switch (pageType) {
      case 'home':
        return [...baseGlobal, 'FAQPage', 'BreadcrumbList', 'WebPage'];
      case 'category':
        return [...baseGlobal, 'CollectionPage', 'BreadcrumbList', 'ItemList', 'FAQPage', 'WebPage'];
      case 'article':
        return [
          ...baseGlobal, 
          'Article', 
          'MedicalWebPage', 
          'BreadcrumbList', 
          'PersonAuthor', 
          'PersonReviewer', 
          'MedicalCondition', 
          'MedicalProcedure', 
          'FAQPage', 
          'ImageObject'
        ];
      case 'landing':
        return [...baseGlobal, 'MedicalProcedure', 'FAQPage', 'BreadcrumbList', 'Service', 'WebPage'];
      case 'contact':
        return [...baseGlobal, 'ContactPage', 'BreadcrumbList', 'WebPage'];
      case '404':
      default:
        // Trang 404 hoặc không xác định thì chỉ để WebPage cơ bản (NoIndex sẽ được xử lý ở Meta)
        return ['WebPage'];
    }
  }

  /**
   * Bóc tách và chuẩn hóa dữ liệu từ CMS cho Article
   */
  static mapArticleData(rawData) {
    if (!rawData) return null;
    
    // Normalize dữ liệu để ngăn lỗi Null Pointer trong Factory
    return {
      title: rawData.title || '',
      description: rawData.description || '',
      slug: rawData.slug || '',
      content: rawData.content || '',
      wordCount: rawData.content ? rawData.content.split(' ').length : 0,
      readingTime: rawData.content ? Math.ceil(rawData.content.split(' ').length / 200) : 1, // 200 từ/phút
      image: rawData.featuredImage?.url || schemaConfig.defaults.image.url,
      datePublished: rawData.createdAt || new Date().toISOString(),
      // Đảm bảo dateModified >= datePublished
      dateModified: rawData.updatedAt && new Date(rawData.updatedAt) >= new Date(rawData.createdAt) 
        ? rawData.updatedAt 
        : (rawData.createdAt || new Date().toISOString()),
      author: {
        name: rawData.author?.name || schemaConfig.defaults.author.name,
        role: rawData.author?.role || schemaConfig.defaults.author.jobTitle
      },
      reviewer: {
        name: rawData.reviewer?.name || schemaConfig.defaults.reviewer.name,
        role: rawData.reviewer?.role || schemaConfig.defaults.reviewer.jobTitle
      },
      keywords: rawData.seoKeywords || [],
      medicalSpecialty: rawData.specialty || schemaConfig.registry.medicalSpecialty[0],
      factChecked: rawData.factChecked !== false
    };
  }

  /**
   * Map dữ liệu FAQ
   */
  static mapFAQData(faqsRaw) {
    if (!faqsRaw || !Array.isArray(faqsRaw) || faqsRaw.length === 0) return null;
    
    return faqsRaw.map(item => ({
      question: item.question || item.q || '',
      answer: item.answer || item.a || ''
    })).filter(faq => faq.question && faq.answer);
  }

  /**
   * Map dữ liệu Breadcrumbs
   */
  static mapBreadcrumbData(pathsRaw) {
    if (!pathsRaw || !Array.isArray(pathsRaw) || pathsRaw.length === 0) return null;
    
    return pathsRaw.map((path, index) => ({
      position: index + 1,
      name: path.name,
      url: path.url.startsWith('http') ? path.url : `${schemaConfig.versioning.siteNamespace}${path.url.startsWith('/') ? '' : '/'}${path.url}`
    }));
  }
}
