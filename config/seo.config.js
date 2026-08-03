// config/seo.config.js
export const seoConfig = {
  defaultTitle: "Cắt Trĩ Cần Thơ | Phòng Khám Hậu Môn Trực Tràng Uy Tín",
  defaultDescription: "Phòng khám chuyên khoa hậu môn trực tràng tại Cần Thơ, chuyên cắt trĩ nội, trĩ ngoại, rò hậu môn bằng phương pháp hiện đại, không đau, hồi phục nhanh.",
  defaultOGImage: "/assets/images/og-default.jpg",
  twitterCard: "summary_large_image",
  themeColor: "#0284c7", // Blue medical
  
  // Environment Specifics
  environments: {
    production: {
      robots: "index, follow",
    },
    preview: {
      robots: "noindex, nofollow",
    },
    development: {
      robots: "noindex, nofollow",
    }
  },
  
  // Canonical Strategy
  canonicalStrategy: {
    forceHttps: true,
    removeWww: true,
    removeTrailingSlash: true,
    forceLowercase: true
  },
  
  // Hreflang
  hreflang: {
    defaultLanguage: "vi-VN",
    supportedLanguages: ["vi"]
  },

  // Schema configs
  schema: {
    organization: true,
    medicalClinic: true
  },
  
  // Plugin-ready settings
  plugins: {
    analytics: true,
    tagManager: false
  }
};
