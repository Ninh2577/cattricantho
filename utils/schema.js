// utils/schema.js
import { schemaConfig } from '../config/schema.config.js';

/**
 * Enterprise Medical Schema Factory
 * Tạo các nút (Nodes) độc lập, thuần túy (Pure Functions).
 * Sẽ được gom lại thành @graph bởi SEOManager.
 */
export class SchemaFactory {
  
  static getBaseUrl() {
    return schemaConfig.versioning.siteNamespace;
  }

  static generateOrganization() {
    return {
      "@type": "Organization",
      "@id": `${this.getBaseUrl()}/#organization`,
      "name": schemaConfig.registry.publisher.name,
      "url": this.getBaseUrl(),
      "logo": {
        "@type": "ImageObject",
        "@id": `${this.getBaseUrl()}/#logo`,
        "url": schemaConfig.registry.publisher.logoUrl,
        "width": 512,
        "height": 512,
        "caption": `${schemaConfig.registry.publisher.name} Logo`
      },
      "image": {"@id": `${this.getBaseUrl()}/#logo`},
      "sameAs": schemaConfig.registry.publisher.socialLinks,
      "foundingDate": schemaConfig.registry.publisher.foundingDate,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "areaServed": schemaConfig.registry.country,
        "availableLanguage": schemaConfig.registry.availableLanguages
      }
    };
  }

  static generateMedicalClinic() {
    return {
      "@type": ["MedicalClinic", "LocalBusiness"],
      "@id": `${this.getBaseUrl()}/#clinic`,
      "name": schemaConfig.registry.publisher.name,
      "url": this.getBaseUrl(),
      "logo": {"@id": `${this.getBaseUrl()}/#logo`},
      "image": {"@id": `${this.getBaseUrl()}/#logo`},
      "priceRange": schemaConfig.registry.priceRange,
      "medicalSpecialty": schemaConfig.registry.medicalSpecialty.map(s => `https://schema.org/${s}`),
      "address": {
        "@type": "PostalAddress",
        "addressCountry": schemaConfig.registry.country,
        "addressLocality": "Cần Thơ"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": schemaConfig.registry.geo.latitude,
        "longitude": schemaConfig.registry.geo.longitude
      },
      "openingHoursSpecification": schemaConfig.registry.openingHoursSpecification,
      "parentOrganization": {"@id": `${this.getBaseUrl()}/#organization`}
    };
  }

  static generateWebSite() {
    return {
      "@type": "WebSite",
      "@id": `${this.getBaseUrl()}/#website`,
      "url": this.getBaseUrl(),
      "name": schemaConfig.registry.publisher.name,
      "publisher": {"@id": `${this.getBaseUrl()}/#organization`},
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.getBaseUrl()}/tim-kiem?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  static generateWebPage(url, title, description) {
    return {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      "url": url,
      "name": title,
      "description": description,
      "isPartOf": {"@id": `${this.getBaseUrl()}/#website`},
      "about": {"@id": `${this.getBaseUrl()}/#organization`}
    };
  }

  static generatePerson(authorData, role = "MedicalProfessional") {
    if (!authorData || !authorData.name) return null;
    
    const normalizedName = authorData.name.toLowerCase().trim();
    const genericPatterns = [
      /^đội ngũ y khoa/, /^đội ngũ chuyên gia/, /^đội ngũ bác sĩ/,
      /^đội ngũ chuyên khoa/, /^ban biên tập/, /^ban cố vấn/,
      /^hội đồng y khoa/, /^chuyên gia y tế/, /^editorial team/, /^medical team/
    ];
    
    const isGeneric = genericPatterns.some(pattern => pattern.test(normalizedName));
    
    if (isGeneric) {
      if (role === "MedicalReviewer") {
        return null; // Không tự động fallback reviewer về Organization
      }
      return {
        "@id": `${this.getBaseUrl()}/#organization`
      };
    }
    
    let slugId = normalizedName
      .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
    if (!slugId) slugId = "chuyen-gia";
    
    return {
      "@type": "Person",
      "@id": `${this.getBaseUrl()}/chuyen-gia/${slugId}#person`,
      "name": authorData.name,
      "jobTitle": authorData.role || role,
      "worksFor": {"@id": `${this.getBaseUrl()}/#organization`},
      "sameAs": authorData.sameAs || [],
      "url": `${this.getBaseUrl()}/chuyen-gia/${slugId}`
    };
  }

  static generateMedicalCondition(name) {
    const slugId = name.toLowerCase().replace(/\\s+/g, '-');
    return {
      "@type": "MedicalCondition",
      "@id": `${this.getBaseUrl()}/benh-ly/${slugId}#condition`,
      "name": name,
      "associatedAnatomy": {
        "@type": "AnatomicalStructure",
        "name": "Anorectal Region"
      }
    };
  }

  static generateArticle(articleData) {
    const articleUrl = `${this.getBaseUrl()}/${articleData.slug}`;
    const authorEntity = this.generatePerson(articleData.author, "Doctor");
    const reviewerEntity = this.generatePerson(articleData.reviewer, "MedicalReviewer");
    const imageEntity = {
      "@type": "ImageObject",
      "@id": `${articleUrl}#primaryimage`,
      "url": articleData.image,
      "width": 1200,
      "height": 630
    };

    const graph = [];
    if (authorEntity && authorEntity["@type"] === "Person") graph.push(authorEntity);
    if (reviewerEntity && reviewerEntity["@type"] === "Person") graph.push(reviewerEntity);
    if (imageEntity && imageEntity.url) graph.push(imageEntity);

    const articleSchema = {
      "@type": ["Article", "MedicalWebPage"],
      "@id": `${articleUrl}#article`,
      "url": articleUrl,
      "headline": articleData.title,
      "datePublished": articleData.datePublished,
      "dateModified": articleData.dateModified,
      "publisher": {"@id": `${this.getBaseUrl()}/#organization`},
      "mainEntityOfPage": {"@id": `${articleUrl}#webpage`},
      "inLanguage": "vi-VN"
    };

    if (articleData.description) articleSchema.description = articleData.description;
    if (imageEntity && imageEntity.url) articleSchema.image = {"@id": `${articleUrl}#primaryimage`};
    if (authorEntity) articleSchema.author = {"@id": authorEntity["@id"]};
    if (reviewerEntity) articleSchema.reviewedBy = {"@id": reviewerEntity["@id"]};
    if (articleData.wordCount > 0) articleSchema.wordCount = articleData.wordCount;
    if (articleData.medicalSpecialty) articleSchema.medicalSpecialty = `https://schema.org/${articleData.medicalSpecialty}`;
    
    if (articleData.keywords && articleData.keywords.length > 0) {
      articleSchema.about = articleData.keywords.map(kw => this.generateMedicalCondition(kw));
    }

    graph.push(articleSchema);
    return graph;
  }

  static generateBreadcrumbList(breadcrumbs, currentUrl) {
    return {
      "@type": "BreadcrumbList",
      "@id": `${currentUrl}#breadcrumb`,
      "itemListElement": breadcrumbs.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "item": item.url
      }))
    };
  }

  static generateFAQPage(faqs, currentUrl) {
    return {
      "@type": "FAQPage",
      "@id": `${currentUrl}#faq`,
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }
}
