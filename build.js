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
      if (cmsArticles && cmsArticles.length > 0) {
        Logger.info('Orchestrator', `Đã tìm thấy ${cmsArticles.length} bài viết từ Hygraph CMS. Đang tạo trang tĩnh...`);
        const singleTemplatePath = path.join(pagesDir, 'single.html');
        if (fs.existsSync(singleTemplatePath)) {
          const singleTemplate = fs.readFileSync(singleTemplatePath, 'utf8');
          for (const article of cmsArticles) {
            try {
              const articleSlug = article.slug || `bai-viet-${article.id}`;
              const pageData = {
                title: article.title,
                slug: articleSlug,
                description: article.excerpt || article.seoDescription,
                seoTitle: article.seoTitle || article.title,
                seoDescription: article.seoDescription || article.excerpt,
                featuredImage: article.featuredImage,
                author: article.author,
                reviewer: article.medicalReviewer,
                createdAt: article.createdAt,
                updatedAt: article.updatedAt
              };
              
              let articleHtml = singleTemplate;
              
              // ---- INJECT CMS DATA VÀO PLACEHOLDERS ----
              const authorName = article.author?.name || 'Đội ngũ y khoa';
              const authorAvatar = article.author?.avatar?.url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100';
              const reviewerName = article.medicalReviewer?.name || authorName;
              const reviewerRole = article.medicalReviewer?.role || 'Chuyên gia y khoa';
              const reviewerAvatar = article.medicalReviewer?.avatar?.url || authorAvatar;
              const category = article.category?.name || 'Kiến Thức Y Khoa';
              const wordCount = article.content?.text?.split(' ').length || 0;
              const readingTime = Math.max(1, Math.ceil(wordCount / 200));
              const dateFormatted = article.createdAt 
                ? new Date(article.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '';
              const featuredImageHtml = article.featuredImage?.url 
                ? `<img src="${article.featuredImage.url}" alt="${article.title}" class="skmd-article-featured-img" style="width:100%;border-radius:var(--radius-md);margin:24px 0;">`
                : '';

              articleHtml = articleHtml
                .replace(/<!-- INJECT_ARTICLE_TITLE -->/g, article.title || '')
                .replace(/<!-- INJECT_ARTICLE_CATEGORY -->/g, category)
                .replace(/<!-- INJECT_ARTICLE_EXCERPT -->/g, article.excerpt || '')
                .replace(/<!-- INJECT_ARTICLE_CONTENT -->/g, article.content?.html || '')
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
