// utils/seo.js
import { seoConfig } from '../config/seo.config.js';
import { siteConfig } from '../config/site.config.js';

export class SEOManager {
  /**
   * Cấu hình chuẩn hóa Canonical URL
   */
  static generateCanonicalUrl(rawSlug) {
    let slug = rawSlug || '';
    
    if (seoConfig.canonicalStrategy.forceLowercase) {
      slug = slug.toLowerCase();
    }
    if (seoConfig.canonicalStrategy.removeTrailingSlash && slug.endsWith('/')) {
      slug = slug.substring(0, slug.length - 1);
    }
    if (slug.startsWith('/')) {
      slug = slug.substring(1);
    }
    
    const baseUrl = seoConfig.canonicalStrategy.removeWww 
      ? siteConfig.url.replace('www.', '') 
      : siteConfig.url;

    const protocol = seoConfig.canonicalStrategy.forceHttps ? 'https://' : 'http://';
    const cleanBaseUrl = baseUrl.replace(/^https?:\/\//, '');

    return slug ? `${protocol}${cleanBaseUrl}/${slug}` : `${protocol}${cleanBaseUrl}`;
  }

  /**
   * Xác định môi trường hiện tại để trả về thẻ Robots phù hợp
   */
  static getRobotsMeta(pageRobotsOverride) {
    if (pageRobotsOverride) return pageRobotsOverride;

    // Default env fallback logic
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    
    if (env === 'production') {
      return seoConfig.environments.production.robots;
    } else if (env === 'preview') {
      return seoConfig.environments.preview.robots;
    }
    
    return seoConfig.environments.development.robots;
  }

  /**
   * Khởi tạo Dynamic Metadata Layer & JSON-LD
   */
  static generateMetaTags(pageData = {}, pageSchemas = []) {
    const title = pageData.normalized?.title || pageData.seoTitle || pageData.title || seoConfig.defaultTitle;
    const description = pageData.normalized?.description || pageData.seoDescription || pageData.excerpt || seoConfig.defaultDescription;
    const ogImage = pageData.normalized?.featuredImage || pageData.featuredImage?.url || seoConfig.defaultOGImage;
    const canonical = this.generateCanonicalUrl(pageData.normalized?.slug || pageData.slug);
    const robots = this.getRobotsMeta(pageData.robots);
    const themeColor = seoConfig.themeColor;
    const hreflang = seoConfig.hreflang.defaultLanguage;

    return `
      <!-- Dynamic Metadata Layer -->
      <title>${title}</title>
      <meta name="description" content="${description}">
      <meta name="theme-color" content="${themeColor}">
      <meta name="robots" content="${robots}">
      <meta name="google-site-verification" content="hCfJiIHx9r5Wy0vuxkLKxQmqQXLYvtHV9CM2v6I6syA" />
      
      <!-- Favicon & Icons -->
      <link rel="icon" type="image/x-icon" href="${siteConfig.favicon}">
      <link rel="icon" type="image/png" sizes="32x32" href="${siteConfig.logo}">
      <link rel="apple-touch-icon" sizes="180x180" href="${siteConfig.logo}">
      
      <!-- Canonical & Hreflang -->
      <link rel="canonical" href="${canonical}">
      <link rel="alternate" hreflang="${hreflang}" href="${canonical}">
      <link rel="alternate" hreflang="x-default" href="${canonical}">
      
      <!-- Open Graph -->
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${ogImage}">
      <meta property="og:url" content="${canonical}">
      <meta property="og:type" content="website">
      <meta property="og:locale" content="${hreflang.replace('-', '_')}">
      <meta property="og:site_name" content="${siteConfig.name}">
      
      <!-- Twitter Card -->
      <meta name="twitter:card" content="${seoConfig.twitterCard}">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${ogImage}">
      ${this.generateGraphSchema(pageSchemas)}
    `;
  }

  /**
   * Tạo @graph Schema và khử trùng lặp
   */
  static generateGraphSchema(schemas = []) {
    if (!schemas || schemas.length === 0) return '';
    
    // Flatten in case schemas contain arrays (like Article returns [Author, Reviewer, Image, Article])
    const flatSchemas = schemas.flat(Infinity).filter(Boolean);
    
    // Deduplicate by @id
    const seenIds = new Set();
    const uniqueSchemas = flatSchemas.filter(schema => {
      if (schema["@id"]) {
        if (seenIds.has(schema["@id"])) return false;
        seenIds.add(schema["@id"]);
      }
      return true;
    });

    const graphObject = {
      "@context": "https://schema.org",
      "@graph": uniqueSchemas
    };

    return `\n      <!-- Enterprise Schema Graph -->\n      <script type="application/ld+json">\n${JSON.stringify(graphObject, null, 2)}\n      </script>`;
  }
}
