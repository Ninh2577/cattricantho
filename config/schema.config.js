// config/schema.config.js
import { siteConfig } from './site.config.js';
import { clinicConfig } from './clinic.config.js';

export const schemaConfig = {
  // 1. Versioning & Namespace (Tránh xung đột @id giữa các site vệ tinh)
  versioning: {
    schemaVersion: "13.0", // Dựa trên schema.org version
    platformVersion: "2.0.0", // Enterprise Multi-site Platform
    generator: "Skedify Medical Enterprise Generator",
    buildNumber: process.env.VERCEL_GIT_COMMIT_SHA || "local-build",
    siteNamespace: siteConfig.url // Base URL dùng làm Namespace cho @id
  },

  // 2. Feature Flags (Bật tắt từng loại Schema theo ý muốn)
  features: {
    enableOrganization: true,
    enableMedicalClinic: true,
    enableWebSite: true,
    enableLocalBusiness: true,
    enableSearchAction: true,
    enableBreadcrumb: true,
    enableFAQ: true,
    enableArticle: true,
    enableMedicalWebPage: true,
    enableKnowledgeGraphPerson: true,
    enableImageObject: true
  },

  // 3. Entity Registry (Dữ liệu tĩnh dùng chung cho hệ sinh thái)
  registry: {
    publisher: {
      name: siteConfig.name,
      logoUrl: siteConfig.url + siteConfig.logo,
      foundingDate: "2015-01-01",
      socialLinks: []
    },
    medicalSpecialty: [
      "Gastroenterologic",
      "Surgical"
    ],
    availableLanguages: ["Vietnamese", "English"],
    currency: "VND",
    priceRange: "$$", // SEO Indicator
    country: "VN",
    geo: {
      latitude: 10.0278,
      longitude: 105.7721
    },
    openingHoursSpecification: [
      {
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00"
      }
    ]
  },

  // 4. Default Schema Values (Dự phòng khi CMS thiếu dữ liệu)
  defaults: {
    author: {
      name: "Đội ngũ chuyên gia y tế Cắt Trĩ Cần Thơ",
      jobTitle: "Medical Professional",
      sameAs: [siteConfig.url]
    },
    reviewer: {
      name: "Ban cố vấn y khoa",
      jobTitle: "Medical Reviewer",
      sameAs: [siteConfig.url]
    },
    image: {
      url: `${siteConfig.url}/assets/images/default-schema.jpg`,
      width: 1200,
      height: 630,
      caption: "Hình ảnh y khoa minh họa"
    }
  }
};
