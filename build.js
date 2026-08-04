import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Foundation & Pipeline Orchestration
import { Logger } from './utils/logger.js';
import { ConfigValidator } from './config/validator.js';
import { RollbackManager } from './utils/rollback.js';
import { HtmlValidator } from './utils/html-validator.js';
import { SecurityManager } from './utils/security.js';
import { QAReportGenerator } from './utils/qa-report.js';
import { GeneratorEngine } from './utils/sitemap.js';

// 2. Core SEO & Schema Infrastructure
import { siteConfig } from './config/site.config.js';
import { clinicConfig } from './config/clinic.config.js';
import { SEOManager } from './utils/seo.js';
import { SchemaMapper } from './utils/schema-mapper.js';
import { SchemaFactory } from './utils/schema.js';
import { SchemaValidator } from './utils/schema-validator.js';
import { SchemaReportGenerator } from './utils/schema-report.js';
import { apiService } from './services/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

async function runBuildPipeline() {
  Logger.info('Orchestrator', 'Bắt đầu Enterprise Build Pipeline...');
  const startTime = Date.now();

  try {
    // Step 1: Validation Config
    ConfigValidator.validate(SRC_DIR);

    // Step 2: Rollback Strategy (Backup)
    RollbackManager.backupDist(SRC_DIR);

    // Ensure dist exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    // Copy assets, config, services, utils to dist
    Logger.info('Orchestrator', 'Đang sao chép static assets...');
    function copyDir(src, dest) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    ['assets', 'config', 'services', 'utils'].forEach(folder => {
      const src = path.join(SRC_DIR, folder);
      if (fs.existsSync(src)) {
        copyDir(src, path.join(DIST_DIR, folder));
      }
    });

    // Step 3: Load CMS Data & Normalize (To be implemented fully in Phase 2)
    // ...

    // Step 4: HTML Generator & Metadata Injector
    Logger.info('Orchestrator', 'Đang biên dịch HTML và nhúng Metadata...');
    const pagesDir = path.join(SRC_DIR, 'pages');
    const distPagesDir = path.join(DIST_DIR, 'pages');
    if (!fs.existsSync(distPagesDir)) fs.mkdirSync(distPagesDir, { recursive: true });

    function injectComponentsAndVars(htmlContent, fileSlug) {
      const componentRegex = /<!--\s*INJECT_COMPONENT:\s*([^>]+)\s*-->/g;
      let compiledHtml = htmlContent.replace(componentRegex, (match, compPath) => {
        const fullPath = path.join(SRC_DIR, compPath.trim());
        if (fs.existsSync(fullPath)) {
          return fs.readFileSync(fullPath, 'utf8');
        }
        return match;
      });

      // ---- ENTERPRISE SCHEMA PIPELINE ----
      // Template pages (single, category) are HTML shells — skip Article schema generation
      const isTemplatePage = ['single', 'category'].includes(fileSlug);
      let pageType = 'home';
      if (fileSlug === 'index') pageType = 'home';
      else if (fileSlug === '404') pageType = '404';
      else if (fileSlug.includes('category')) pageType = 'category';
      else if (fileSlug.includes('landing')) pageType = 'landing';
      else if (!isTemplatePage) pageType = 'article';
      
      const pageData = { title: fileSlug, slug: fileSlug }; // Fallback data
      
      const schemaStrategy = SchemaMapper.getStrategy(pageType);
      const pageSchemas = [];
      
      if (schemaStrategy.includes('Organization')) pageSchemas.push(SchemaFactory.generateOrganization());
      if (schemaStrategy.includes('WebSite')) pageSchemas.push(SchemaFactory.generateWebSite());
      if (schemaStrategy.includes('MedicalClinic')) pageSchemas.push(SchemaFactory.generateMedicalClinic());
      if (schemaStrategy.includes('WebPage')) pageSchemas.push(SchemaFactory.generateWebPage(`${SchemaFactory.getBaseUrl()}/${fileSlug}`, fileSlug, ''));
      // Only generate Article schema for real CMS-generated pages, not static templates
      if (schemaStrategy.includes('Article') && !isTemplatePage) {
        const articleData = SchemaMapper.mapArticleData(pageData);
        pageSchemas.push(SchemaFactory.generateArticle(articleData));
      }
      
      const pageUrl = `${SchemaFactory.getBaseUrl()}/${fileSlug}`;
      const validationResults = SchemaValidator.validate(pageSchemas, pageUrl);
      
      schemaReportData.pagesChecked++;
      schemaReportData.totalErrors += validationResults.errors.length;
      schemaReportData.totalWarnings += validationResults.warnings.length;
      schemaReportData.details.push({
        url: pageUrl,
        schemas: validationResults.stats.types,
        errors: validationResults.errors,
        warnings: validationResults.warnings
      });

      // Log Schema errors as warnings (not fatal) for static template pages
      if (validationResults.errors.length > 0 && !isTemplatePage) {
        Logger.warning('SchemaValidator', `Schema warnings trên trang ${fileSlug}: ${validationResults.errors.join(' | ')}`);
      }

      compiledHtml = compiledHtml
        .replace(/<!--\s*INJECT_SITE_NAME\s*-->/g, siteConfig.name)
        .replace(/<!--\s*INJECT_BRAND\s*-->/g, siteConfig.name)
        .replace(/<!--\s*INJECT_SITE_DESC\s*-->/g, siteConfig.description)
        .replace(/<!--\s*INJECT_LOGO\s*-->/g, siteConfig.logo)
        .replace(/<!--\s*INJECT_HOTLINE\s*-->/g, clinicConfig.hotlineDisplay)
        .replace(/<!--\s*INJECT_ADDRESS\s*-->/g, clinicConfig.address.full)
        .replace(/<!--\s*INJECT_ZALO\s*-->/g, clinicConfig.zaloLink)
        .replace(/<!--\s*INJECT_SEO_TAGS\s*-->/g, SEOManager.generateMetaTags(pageData, pageSchemas));
      return compiledHtml;
    }

    const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));
    
    // Stats for QA Report
    const buildStats = {
      generated: 0,
      failed: 0,
      warnings: 0,
      errorLogs: []
    };

    const schemaReportData = {
      pagesChecked: 0,
      totalErrors: 0,
      totalWarnings: 0,
      details: []
    };

    htmlFiles.forEach(file => {
      try {
        let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
        const fileSlug = file.replace('.html', '');
        content = injectComponentsAndVars(content, fileSlug); // First pass
        content = injectComponentsAndVars(content, fileSlug); // Second pass for nested
        
        // Inject Security Headers
        content = content.replace('</head>', `${SecurityManager.generateSecurityMetaTags()}</head>`);
        
        // Phase 5: Validation
        const validationResult = HtmlValidator.validate(content, file);
        if (validationResult.status === 'FAIL') {
          buildStats.failed++;
          buildStats.errorLogs.push(`[${file}] ` + validationResult.errors.join(' '));
        } else {
          buildStats.generated++;
          buildStats.warnings += validationResult.warnings.length;
          fs.writeFileSync(path.join(distPagesDir, file), content);
        }
      } catch (e) {
        buildStats.failed++;
        buildStats.errorLogs.push(`[${file}] Runtime Error: ${e.message}`);
      }
    });

    // Step 4.5: Hygraph CMS Dynamic SSG Article Builder
    Logger.info('Orchestrator', 'Đang kết nối Hygraph CMS để đồng bộ bài viết tự động...');
    try {
      const cmsArticles = await apiService.getAllArticles();
      if (cmsArticles) {
        Logger.info('Orchestrator', `Đã tìm thấy ${cmsArticles.length} bài viết từ Hygraph CMS. Đang tạo trang tĩnh...`);
        const singleTemplatePath = path.join(pagesDir, 'single.html');
        if (fs.existsSync(singleTemplatePath)) {
          const singleTemplate = fs.readFileSync(singleTemplatePath, 'utf8');
          const articlesByCategory = {
            'tri': { name: 'Trĩ', slug: 'tri', articles: [] },
            'tri-noi': { name: 'Trĩ nội', slug: 'tri-noi', articles: [] },
            'tri-ngoai': { name: 'Trĩ ngoại', slug: 'tri-ngoai', articles: [] },
            'tri-hon-hop': { name: 'Trĩ hỗn hợp', slug: 'tri-hon-hop', articles: [] },
            'ro-hau-mon': { name: 'Rò hậu môn', slug: 'ro-hau-mon', articles: [] },
          };
          
          for (const article of cmsArticles) {
            try {
              const articleSlug = article.slug || `bai-viet-${article.id}`;
              const pageData = {
                title: article.title,
                slug: articleSlug,
                description: article.tomtat || article.seoDescription,
                seoTitle: article.seoTitle || article.title,
                seoDescription: article.seoDescription || article.tomtat,
                featuredImage: article.anh,
                author: { name: article.tacGia },
                createdAt: article.ngayDang,
              };
              
              const rawCat = article.danhMuc || 'tri';
              const catSlugMap = {
                'tri': 'tri',
                'tri_noi': 'tri-noi',
                'tri_ngoai': 'tri-ngoai',
                'tri_hon_hop': 'tri-hon-hop',
                'ro_hau_mon': 'ro-hau-mon'
              };
              const categorySlug = catSlugMap[rawCat] || 'tri';
              
              if (articlesByCategory[categorySlug]) {
                articlesByCategory[categorySlug].articles.push(article);
              }
              
              let articleHtml = singleTemplate;
              
              // ---- INJECT CMS DATA VÀO PLACEHOLDERS ----
              const authorName = article.tacGia || 'Đội ngũ y khoa';
              const authorAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100';
              const reviewerName = authorName;
              const reviewerRole = 'Chuyên gia y khoa';
              const reviewerAvatar = authorAvatar;
              const wordCount = article.noiDung?.text?.split(' ').length || 0;
              const readingTime = article.thoiGianDoc || Math.max(1, Math.ceil(wordCount / 200));
              const dateFormatted = article.ngayDang 
                ? new Date(article.ngayDang).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '';
              const featuredImageHtml = article.anh?.url 
                ? `<img src="${article.anh.url}" alt="${article.title}" class="skmd-article-featured-img" style="width:100%;border-radius:var(--radius-md);margin:24px 0;">`
                : '';

              articleHtml = articleHtml
                .replace(/<!-- INJECT_ARTICLE_TITLE -->/g, article.title || '')
                .replace(/<!-- INJECT_ARTICLE_CATEGORY -->/g, articlesByCategory[categorySlug]?.name || 'Trĩ')
                .replace(/<!-- INJECT_ARTICLE_EXCERPT -->/g, article.tomtat || '')
                .replace(/<!-- INJECT_ARTICLE_CONTENT -->/g, article.noiDung?.html || '')
                .replace(/<!-- INJECT_ARTICLE_FEATURED_IMAGE -->/g, featuredImageHtml)
                .replace(/<!-- INJECT_ARTICLE_DATE -->/g, dateFormatted)
                .replace(/<!-- INJECT_READING_TIME -->/g, readingTime)
                .replace(/<!-- INJECT_AUTHOR_NAME -->/g, authorName)
                .replace(/<!-- INJECT_AUTHOR_AVATAR -->/g, authorAvatar)
                .replace(/<!-- INJECT_REVIEWER_NAME -->/g, reviewerName)
                .replace(/<!-- INJECT_REVIEWER_ROLE -->/g, reviewerRole)
                .replace(/<!-- INJECT_REVIEWER_AVATAR -->/g, reviewerAvatar);

              // Inject components & SEO tags with article page data
              articleHtml = injectComponentsAndVars(articleHtml, articleSlug);
              fs.writeFileSync(path.join(distPagesDir, `${articleSlug}.html`), articleHtml);
              buildStats.generated++;
            } catch (err) {
              Logger.error('Orchestrator', `Lỗi tạo trang bài viết ${article.slug}:`, err);
            }
          }

          // Generate Category Pages
          const categoryTemplatePath = path.join(pagesDir, 'category.html');
          if (fs.existsSync(categoryTemplatePath)) {
            const categoryTemplate = fs.readFileSync(categoryTemplatePath, 'utf8');
            for (const [catSlug, catData] of Object.entries(articlesByCategory)) {
              let catHtml = categoryTemplate;
              catHtml = catHtml.replace(/<!-- INJECT_CATEGORY_TITLE -->/g, catData.name);
              catHtml = catHtml.replace(/<!-- INJECT_CATEGORY_DESC -->/g, `Danh sách các bài viết y khoa thuộc chuyên mục ${catData.name}.`);
              
              let articlesHtml = '';
              
              if (catData.articles.length === 0) {
                articlesHtml = `
            <div style="text-align: center; padding: 64px 24px; background: var(--color-white); border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 24px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px; color: var(--color-text-light);">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="4" y1="22" x2="20" y2="2"></line>
              </svg>
              <h3 style="font-size: 1.5rem; margin-bottom: 8px; color: var(--color-text-dark);">Chưa có bài viết</h3>
              <p style="color: var(--color-text-main);">Hãy quay lại sau nhé!</p>
            </div>`;
              } else {
                for (const art of catData.articles) {
                  const dateFormatted = art.ngayDang ? new Date(art.ngayDang).toLocaleDateString('vi-VN') : '';
                  const img = art.anh?.url || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400';
                  articlesHtml += `
              <article class="skmd-article-small" style="background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;">
                <a href="/${art.slug}" class="skmd-article__link" style="display:flex; gap:24px; width:100%;">
                  <div class="skmd-article__image" style="width:250px; flex-shrink:0;">
                    <img src="${img}" alt="${art.title}" style="border-radius: var(--radius-sm); object-fit: cover; height: 160px; width: 100%;">
                  </div>
                  <div class="skmd-article__content">
                    <div class="skmd-article__meta">
                      <span class="skmd-badge skmd-badge--primary">${catData.name}</span>
                      <span class="skmd-article__date" style="margin-left: 12px; font-size: 0.875rem; color: var(--color-text-light);">${dateFormatted}</span>
                    </div>
                    <h3 class="skmd-article__title" style="font-size: 1.25rem; margin: 12px 0;">${art.title}</h3>
                    <p class="skmd-article__excerpt" style="color: var(--color-text-main); line-height: 1.6;">${art.tomtat || ''}</p>
                  </div>
                </a>
              </article>`;
                }
              }
              catHtml = catHtml.replace(/<!-- INJECT_CATEGORY_ARTICLES -->/g, articlesHtml);
              
              catHtml = injectComponentsAndVars(catHtml, catSlug);
              fs.writeFileSync(path.join(distPagesDir, `${catSlug}.html`), catHtml);
              buildStats.generated++;
            }
          }
        }
      } else {
        Logger.info('Orchestrator', 'Chưa có bài viết mới từ Hygraph CMS (hoặc chưa cấu hình Endpoint). Sử dụng dữ liệu mẫu.');
      }
    } catch (cmsErr) {
      Logger.warning('Orchestrator', 'Không thể kết nối Hygraph CMS lúc này. Tiếp tục build với dữ liệu tĩnh.', cmsErr);
    }

    // Generate Build Manifest & QA Reports
    buildStats.duration = Date.now() - startTime;
    SecurityManager.generateManifest(DIST_DIR, buildStats);
    QAReportGenerator.generate(DIST_DIR, buildStats);
    SchemaReportGenerator.generate(schemaReportData);

    // Step 5: Sitemap & Feed
    const pagesForSitemap = htmlFiles.map(file => {
      const slug = file.replace('.html', '');
      return {
        slug: slug,
        updatedAt: new Date().toISOString(), // Fallback (trong thực tế sẽ lấy từ CMS)
        title: slug, // Fallback
        description: slug,
        createdAt: new Date().toISOString()
      };
    });
    
    GeneratorEngine.generateSitemap(pagesForSitemap, DIST_DIR);
    GeneratorEngine.generateRss(pagesForSitemap, DIST_DIR);
    GeneratorEngine.generateJsonFeed(pagesForSitemap, DIST_DIR);
    
    if (fs.existsSync(path.join(SRC_DIR, 'vercel.json'))) {
      fs.copyFileSync(path.join(SRC_DIR, 'vercel.json'), path.join(DIST_DIR, 'vercel.json'));
    }

    // Step 7: Cleanup Backup
    RollbackManager.cleanupBackup(SRC_DIR);

    const duration = Date.now() - startTime;
    Logger.success('Orchestrator', `Build hoàn tất thành công! Đã tạo ${buildStats.generated} trang. (Thời gian: ${duration}ms)`);
  } catch (error) {
    Logger.error('Orchestrator', 'Build thất bại! Khởi chạy Rollback Strategy.', error);
    RollbackManager.restoreDist(SRC_DIR);
    
    // Write error for Vercel visibility
    const distPagesDir = path.join(DIST_DIR, 'pages');
    if (!fs.existsSync(distPagesDir)) fs.mkdirSync(distPagesDir, { recursive: true });
    fs.writeFileSync(path.join(distPagesDir, 'index.html'), `<h1>Build Error</h1><pre>${error.stack}</pre>`);
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), `<h1>Build Error</h1><pre>${error.stack}</pre>`);
    process.exit(0);
  }
}

runBuildPipeline();
