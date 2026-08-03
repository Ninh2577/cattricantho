import { seoConfig } from '../config/seo.config.js';
import { siteConfig } from '../config/site.config.js';

export class SEOManager {
  static generateMetaTags(pageData = {}) {
    const title = pageData.seoTitle || pageData.title || seoConfig.defaultTitle;
    const description = pageData.seoDescription || pageData.excerpt || seoConfig.defaultDescription;
    const ogImage = pageData.featuredImage?.url || seoConfig.defaultOGImage;
    const canonical = pageData.canonicalUrl || `${siteConfig.url}/${pageData.slug}`;

    return `
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- Open Graph -->
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${ogImage}">
      <meta property="og:url" content="${canonical}">
      <meta property="og:type" content="website">
      
      <!-- Canonical & Robots -->
      <link rel="canonical" href="${canonical}">
      <meta name="robots" content="${pageData.robots || seoConfig.robots}">
    `;
  }

  static generateMedicalSchema(articleData) {
    // E-E-A-T MedicalWebPage Schema
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": articleData.schemaType || "MedicalWebPage",
      "headline": articleData.title,
      "datePublished": articleData.createdAt,
      "dateModified": articleData.updatedAt,
      "author": {
        "@type": "Person",
        "name": articleData.author?.name
      },
      "reviewedBy": {
        "@type": "Person",
        "name": articleData.medicalReviewer?.name
      },
      "publisher": {
        "@type": "Organization",
        "name": siteConfig.name,
        "logo": {
          "@type": "ImageObject",
          "url": siteConfig.logo
        }
      }
    });
  }
}
