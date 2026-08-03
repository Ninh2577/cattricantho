// config/redirect.config.js
export const redirectConfig = {
  // 301 Permanent Redirects
  permanent: [
    {
      source: "/trang-chu",
      destination: "/"
    },
    {
      source: "/cam-nang",
      destination: "/kien-thuc"
    }
  ],
  // 302 Temporary Redirects
  temporary: [
    {
      source: "/khuyen-mai",
      destination: "/chi-phi"
    }
  ],
  // 410 Gone (Removed Content)
  gone: [
    "/bac-si-cu",
    "/dich-vu-cu"
  ]
};
