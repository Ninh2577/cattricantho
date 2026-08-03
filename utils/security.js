// utils/security.js
import fs from 'fs';
import path from 'path';
import { Logger } from './logger.js';

export class SecurityManager {
  
  /**
   * Tạo Manifest Build Version
   */
  static generateManifest(outputDir, metrics) {
    Logger.info('SecurityManager', 'Đang sinh Build Manifest...');
    const manifest = {
      buildVersion: `v1.0.${Date.now()}`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      metrics: metrics
    };
    
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  /**
   * Xây dựng chuỗi Content Security Policy (CSP)
   */
  static getCSP() {
    return "default-src 'self' https://*.hygraph.com https://*.google-analytics.com https://*.facebook.net; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;";
  }

  /**
   * Sinh các thẻ Security tĩnh để nhúng vào HTML (Phòng trường hợp không dùng vercel.json headers)
   */
  static generateSecurityMetaTags() {
    return `
      <!-- Security Headers -->
      <meta http-equiv="Content-Security-Policy" content="${this.getCSP()}">
      <meta name="referrer" content="strict-origin-when-cross-origin">
      <meta http-equiv="X-Content-Type-Options" content="nosniff">
    `;
  }
}
