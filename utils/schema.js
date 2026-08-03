// utils/schema.js
import { siteConfig } from '../config/site.config.js';
import { clinicConfig } from '../config/clinic.config.js';

export class SchemaFactory {
  
  static generateOrganization() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteConfig.name,
      "url": siteConfig.url,
      "logo": siteConfig.logo,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": clinicConfig.hotlineDisplay,
        "contactType": "customer service"
      }
    };
  }

  static generateMedicalClinic() {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalClinic",
      "name": siteConfig.name,
      "image": siteConfig.logo,
      "@id": siteConfig.url,
      "url": siteConfig.url,
      "telephone": clinicConfig.hotlineDisplay,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": clinicConfig.address.street,
        "addressLocality": clinicConfig.address.district,
        "addressRegion": clinicConfig.address.city,
        "addressCountry": "VN"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ],
        "opens": "08:00",
        "closes": "20:00"
      },
      "medicalSpecialty": [
        "https://schema.org/Gastroenterologic",
        "https://schema.org/Surgical"
      ]
    };
  }

  static generateWebSite() {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteConfig.name,
      "url": siteConfig.url,
      "potentialAction": this.generateSearchAction()
    };
  }

  static generateSearchAction() {
    return {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/tim-kiem?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    };
  }

  static generateBreadcrumbList(breadcrumbs = []) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };
  }

  static generatePerson(name, role = "MedicalProfessional") {
    return {
      "@type": "Person",
      "name": name,
      "jobTitle": role,
      "affiliation": {
        "@type": "Organization",
        "name": siteConfig.name
      }
    };
  }

  static generateMedicalWebPage(articleData) {
    const isArticle = articleData.isArticle !== false;
    const type = isArticle ? ["MedicalWebPage", "Article"] : "MedicalWebPage";
    
    return {
      "@context": "https://schema.org",
      "@type": type,
      "headline": articleData.normalized.title,
      "description": articleData.normalized.description,
      "image": articleData.normalized.featuredImage,
      "datePublished": articleData.normalized.createdAt,
      "dateModified": articleData.normalized.updatedAt,
      "author": this.generatePerson(articleData.normalized.authorName, "Doctor"),
      "reviewedBy": this.generatePerson(articleData.normalized.reviewerName, "MedicalReviewer"),
      "publisher": this.generateOrganization(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleData.normalized.canonicalUrl
      },
      // E-E-A-T Specific Medical Elements
      "medicalAudience": {
        "@type": "MedicalAudience",
        "audienceType": "Patients"
      },
      "hasPart": articleData.medicalDisclaimer ? {
        "@type": "WebPageElement",
        "isAccessibleForFree": "True",
        "text": "Disclaimer: Information provided is for educational purposes only and does not substitute professional medical advice."
      } : undefined
    };
  }

  static generateFAQPage(faqs = []) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
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

  static generateMedicalCondition(name, description) {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalCondition",
      "name": name,
      "description": description,
      "associatedAnatomy": {
        "@type": "AnatomicalStructure",
        "name": "Anus/Rectum"
      }
    };
  }

  static generateMedicalProcedure(name, description) {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      "name": name,
      "description": description,
      "procedureType": "SurgicalProcedure"
    };
  }
}
