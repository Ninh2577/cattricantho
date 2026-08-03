// utils/sitemap.js
import fs from 'fs';
import path from 'path';
import { siteConfig } from '../config/site.config.js';
import { Logger } from './logger.js';

export class GeneratorEngine {
  
  /**
   * Tạo XML Sitemap (Pages & Posts)
   */
  static generateSitemap(pages = [], outputDir) {
    Logger.info('GeneratorEngine', 'Đang khởi tạo sitemap.xml...');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    pages.forEach(page => {
      const url = `${siteConfig.url}/${page.slug === 'index' ? '' : page.slug}`;
      const lastmod = page.updatedAt ? new Date(page.updatedAt).toISOString() : new Date().toISOString();
      const priority = page.slug === 'index' ? '1.0' : '0.8';

      xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), xml);
    Logger.success('GeneratorEngine', 'Tạo sitemap.xml thành công.');
  }

  /**
   * Tạo RSS Feed
   */
  static generateRss(articles = [], outputDir) {
    Logger.info('GeneratorEngine', 'Đang khởi tạo rss.xml...');
    
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${siteConfig.name}</title>
  <link>${siteConfig.url}</link>
  <description>${siteConfig.description}</description>`;

    articles.forEach(article => {
      const url = `${siteConfig.url}/${article.slug}`;
      const date = new Date(article.createdAt || Date.now()).toUTCString();
      
      rss += `
  <item>
    <title>${article.title}</title>
    <link>${url}</link>
    <description>${article.description || ''}</description>
    <pubDate>${date}</pubDate>
  </item>`;
    });

    rss += `\n</channel>\n</rss>`;
    
    fs.writeFileSync(path.join(outputDir, 'rss.xml'), rss);
    Logger.success('GeneratorEngine', 'Tạo rss.xml thành công.');
  }

  /**
   * Tạo JSON Feed
   */
  static generateJsonFeed(articles = [], outputDir) {
    Logger.info('GeneratorEngine', 'Đang khởi tạo feed.json...');
    
    const feed = {
      version: "https://jsonfeed.org/version/1",
      title: siteConfig.name,
      home_page_url: siteConfig.url,
      feed_url: `${siteConfig.url}/feed.json`,
      items: articles.map(a => ({
        id: `${siteConfig.url}/${a.slug}`,
        url: `${siteConfig.url}/${a.slug}`,
        title: a.title,
        content_text: a.description,
        date_published: new Date(a.createdAt || Date.now()).toISOString()
      }))
    };

    fs.writeFileSync(path.join(outputDir, 'feed.json'), JSON.stringify(feed, null, 2));
    Logger.success('GeneratorEngine', 'Tạo feed.json thành công.');
  }
}
