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
    const slugId = authorData.name.toLowerCase().replace(/\\s+/g, '-');
    return {
      "@type": "Person",
      "@id": `${this.getBaseUrl()}/chuyen-gia/${slugId}#person`,
      "name": authorData.name,
      "jobTitle": authorData.role || role,
      "worksFor": {"@id": `${this.getBaseUrl()}/#organization`},
      "sameAs": authorData.sameAs || [],
      "knowsAbout": schemaConfig.registry.medicalSpecialty,
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

    return [
      authorEntity,
      reviewerEntity,
      imageEntity,
      {
        "@type": ["Article", "MedicalWebPage"],
        "@id": `${articleUrl}#article`,
        "url": articleUrl,
        "headline": articleData.title,
        "description": articleData.description,
        "image": {"@id": `${articleUrl}#primaryimage`},
        "thumbnailUrl": articleData.image,
        "datePublished": articleData.datePublished,
        "dateModified": articleData.dateModified,
        "author": {"@id": authorEntity["@id"]},
        "reviewedBy": {"@id": reviewerEntity["@id"]},
        "publisher": {"@id": `${this.getBaseUrl()}/#organization`},
        "mainEntityOfPage": {"@id": `${articleUrl}#webpage`},
        "wordCount": articleData.wordCount,
        "timeRequired": `PT${articleData.readingTime}M`,
        "inLanguage": "vi-VN",
        "medicalSpecialty": `https://schema.org/${articleData.medicalSpecialty}`,
        "medicalAudience": "Patients",
        "factChecked": articleData.factChecked,
        "speakable": {
          "@type": "SpeakableSpecification",
          "xpath": [
            "//h1",
            "//meta[@name='description']/@content"
          ]
        },
        "about": articleData.keywords.map(kw => this.generateMedicalCondition(kw))
      }
    ];
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
