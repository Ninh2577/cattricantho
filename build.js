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

function skmdRewriteUrl(url, slug) {
  if (!url) return url;
  const match = url.match(/graphassets\.com\/([^\/]+)\/([^\/]+)$/);
  if (match) {
     const id = match[2];
     const cleanSlug = slug ? slug.replace(/[^a-z0-9-]/gi, '') : 'image';
     return `/image/${id}/${cleanSlug}.jpg`;
  }
  return url;
}

function skmdMinifyHtml(html) {
  if (!html) return '';
  return html
    .replace(/<!--(?!\s*INJECT|\s*ACTIVE)[^>]+-->/g, '') // Xóa comments an toàn
    .replace(/>\s+</g, '><') // Xóa khoảng trắng giữa các tags
    .trim();
}

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

    // Step 3: Load CMS Data & Normalize
    Logger.info('Orchestrator', 'Đang kết nối Hygraph CMS để đồng bộ bài viết tự động...');
    let cmsArticles = [];
    let latestArticlesHtml = { featured: '', smalls: '' };
    const articlesByCategory = {
      'tri': { name: 'Trĩ', slug: 'tri', articles: [] },
      'tri-noi': { name: 'Trĩ nội', slug: 'tri-noi', articles: [] },
      'tri-ngoai': { name: 'Trĩ ngoại', slug: 'tri-ngoai', articles: [] },
      'tri-hon-hop': { name: 'Trĩ hỗn hợp', slug: 'tri-hon-hop', articles: [] },
      'ro-hau-mon': { name: 'Rò hậu môn', slug: 'ro-hau-mon', articles: [] },
      'kien-thuc': { name: 'Tất cả bài viết', slug: 'kien-thuc', articles: [] },
    };

    try {
      cmsArticles = await apiService.getAllArticles();
      if (cmsArticles) {
        Logger.info('Orchestrator', `Đã tìm thấy ${cmsArticles.length} bài viết từ Hygraph CMS.`);
        
        const catSlugMap = {
          'tri': 'tri',
          'tri_noi': 'tri-noi',
          'tri_ngoai': 'tri-ngoai',
          'tri_hon_hop': 'tri-hon-hop',
          'ro_hau_mon': 'ro-hau-mon'
        };
        
        // Categorize articles
        for (const article of cmsArticles) {
          const rawCat = article.danhMuc || 'tri';
          const categorySlug = catSlugMap[rawCat] || 'tri';
          if (articlesByCategory[categorySlug]) {
            articlesByCategory[categorySlug].articles.push(article);
          }
          // Add to 'all' category
          articlesByCategory['kien-thuc'].articles.push(article);
        }
        
        // Build Latest Articles HTML for Homepage (Carousel) and Sidebar
        const latestArticles = [...cmsArticles].sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)).slice(0, 9);
        if (latestArticles.length > 0) {
          latestArticlesHtml.sidebar = latestArticles.slice(0, 5).map(art => {
            const aSlug = art.slug || `bai-viet-${art.id}`;
            const rawImgUrl = (Array.isArray(art.anh) ? art.anh[0]?.url : art.anh?.url);
            const aImg = rawImgUrl ? skmdRewriteUrl(rawImgUrl, aSlug) : 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=300';
            return `
              <a href="/${aSlug}" style="display: flex; gap: 12px; text-decoration: none; color: inherit; align-items: flex-start;">
                <img src="${aImg}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" alt="${art.title}">
                <h4 style="margin: 0; font-size: 0.95rem; line-height: 1.4; color: var(--color-text-main); font-weight: 500;">${art.title}</h4>
              </a>
            `;
          }).join('');

          latestArticlesHtml.carousel = latestArticles.map(art => {
            const aSlug = art.slug || `bai-viet-${art.id}`;
            const aDate = art.ngayDang ? new Date(art.ngayDang).toLocaleDateString('vi-VN') : '';
            const rawImgUrl = (Array.isArray(art.anh) ? art.anh[0]?.url : art.anh?.url);
            const aImg = rawImgUrl ? skmdRewriteUrl(rawImgUrl, aSlug) : 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=300';
            const aCatName = articlesByCategory[catSlugMap[art.danhMuc || 'tri'] || 'tri']?.name || 'Tin Tức';
            
            return `
        <article class="skmd-article-card skmd-carousel-slide" style="flex: 0 0 calc(33.333% - 16px); min-width: 280px; box-sizing: border-box; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden;">
          <a href="/${aSlug}" class="skmd-article__link" style="text-decoration: none; color: inherit; display: block; height: 100%;">
            <div class="skmd-article__image skmd-ratio skmd-ratio--4-3" style="width: 100%; aspect-ratio: 4/3; overflow: hidden; position: relative;">
              <img src="${aImg}" alt="${art.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="skmd-article__content" style="padding: 16px;">
              <div class="skmd-article__meta" style="margin-bottom: 8px;">
                <span class="skmd-badge skmd-badge--outline" style="font-size: 0.75rem; padding: 2px 8px; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: 12px;">${aCatName}</span>
                <span class="skmd-article__date" style="font-size: 0.75rem; color: var(--color-text-light); margin-left: 8px;">${aDate}</span>
              </div>
              <h4 class="skmd-article__title" style="font-size: 1.125rem; margin: 0 0 8px 0; color: var(--color-text-dark); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${art.title}</h4>
              <p class="skmd-article__excerpt" style="font-size: 0.875rem; color: var(--color-text-main); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${art.tomtat || ''}</p>
            </div>
          </a>
        </article>`;
          }).join('');
        }
      }
    } catch (err) {
      Logger.error('Orchestrator', 'Lỗi khi tải dữ liệu CMS:', err);
    }

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
      
      const pageData = {
        title: fileSlug === 'index' ? siteConfig.name : fileSlug,
        slug: fileSlug === 'index' ? '' : fileSlug
      }; // Fallback data
      
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
        .replace(/<!--\s*INJECT_CAROUSEL_ARTICLES\s*-->/g, latestArticlesHtml.carousel || '')
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
          
          const minifiedHtml = skmdMinifyHtml(content);
          fs.writeFileSync(path.join(distPagesDir, file), minifiedHtml);
          
          // Fix for Vercel 404: Vercel expects 404.html at the root of the output directory
          if (file === '404.html') {
            fs.writeFileSync(path.join(DIST_DIR, '404.html'), minifiedHtml);
          }
        }
      } catch (e) {
        buildStats.failed++;
        buildStats.errorLogs.push(`[${file}] Runtime Error: ${e.message}`);
      }
    });

    // Step 4.5: Hygraph CMS Dynamic SSG Article Builder
    Logger.info('Orchestrator', 'Đang tạo các trang tĩnh bài viết (Single & Category)...');
    try {
      if (cmsArticles && cmsArticles.length > 0) {
        const singleTemplatePath = path.join(pagesDir, 'single.html');
        if (fs.existsSync(singleTemplatePath)) {
          const singleTemplate = fs.readFileSync(singleTemplatePath, 'utf8');
          
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
              
              let articleHtml = singleTemplate;
              
              // ---- INJECT CMS DATA VÀO PLACEHOLDERS ----
              const authorName = article.createdBy?.name || 'Đội ngũ y khoa';
              const authorInitials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const authorAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100';
              const reviewerName = 'Đội ngũ y khoa';
              const reviewerRole = 'Chuyên gia y khoa';
              const reviewerAvatar = authorAvatar;
              const wordCount = article.noiDung?.text?.split(' ').length || 0;
              const readingTime = article.thoiGianDoc || Math.max(1, Math.ceil(wordCount / 200));
              const dateFormatted = article.ngayDang 
                ? new Date(article.ngayDang).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const featuredImgUrl = article.anh?.url ? skmdRewriteUrl(article.anh.url, articleSlug) : '';
              const featuredImageHtml = featuredImgUrl 
                ? `<img src="${featuredImgUrl}" alt="${article.title}" class="skmd-article-featured-img" style="width:100%;border-radius:var(--radius-md);margin:24px 0;" fetchpriority="high">`
                : '';

              articleHtml = articleHtml
                .replace(/<!-- INJECT_ARTICLE_TITLE -->/g, article.title || '')
                .replace(/<!-- INJECT_ARTICLE_CATEGORY -->/g, articlesByCategory[categorySlug]?.name || 'Trĩ')
                .replace(/<!-- INJECT_CATEGORY_SLUG -->/g, categorySlug)
                .replace(/<!-- INJECT_ARTICLE_EXCERPT -->/g, article.tomtat || '')
                .replace(/<!-- INJECT_ARTICLE_CONTENT -->/g, article.noiDung?.html || '')
                .replace(/<!-- INJECT_ARTICLE_FEATURED_IMAGE -->/g, featuredImageHtml)
                .replace(/<!-- INJECT_ARTICLE_DATE -->/g, dateFormatted)
                .replace(/<!-- INJECT_READING_TIME -->/g, readingTime)
                .replace(/<!-- INJECT_AUTHOR_NAME -->/g, authorName)
                .replace(/<!-- INJECT_AUTHOR_INITIALS -->/g, authorInitials)
                .replace(/<!-- INJECT_AUTHOR_AVATAR -->/g, authorAvatar)
                .replace(/<!-- INJECT_REVIEWER_NAME -->/g, reviewerName)
                .replace(/<!-- INJECT_REVIEWER_ROLE -->/g, reviewerRole)
                .replace(/<!-- INJECT_REVIEWER_AVATAR -->/g, reviewerAvatar)
                .replace(/<!-- INJECT_SIDEBAR_LATEST -->/g, latestArticlesHtml.sidebar || '');

              // Inject components & SEO tags with article page data
              articleHtml = injectComponentsAndVars(articleHtml, articleSlug);
              fs.writeFileSync(path.join(distPagesDir, `${articleSlug}.html`), skmdMinifyHtml(articleHtml));
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
              const pageSize = 10;
              const totalPages = Math.ceil(catData.articles.length / pageSize) || 1;
              
              for (let page = 1; page <= totalPages; page++) {
                let currentPageHtml = categoryTemplate;
                currentPageHtml = currentPageHtml.replace(/<!-- INJECT_CATEGORY_TITLE -->/g, catData.name);
                currentPageHtml = currentPageHtml.replace(/<!-- INJECT_CATEGORY_DESC -->/g, `Danh sách các bài viết y khoa thuộc chuyên mục ${catData.name}.`);
                
                const activeCatKey = catSlug.replace(/-/g, '_').toUpperCase();
                currentPageHtml = currentPageHtml.replace(`<!-- ACTIVE_${activeCatKey} -->`, 'background: var(--color-primary) !important; color: white !important; border-color: var(--color-primary) !important;');
                currentPageHtml = currentPageHtml.replace(/<!-- ACTIVE_[A-Z_]+ -->/g, ''); 
                
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
                  const startIdx = (page - 1) * pageSize;
                  const endIdx = startIdx + pageSize;
                  const pageArticles = catData.articles.slice(startIdx, endIdx);
                  
                  for (const art of pageArticles) {
                    const dateFormatted = art.ngayDang ? new Date(art.ngayDang).toLocaleDateString('vi-VN') : '';
                    const rawImgUrl = art.anh?.url;
                    const img = rawImgUrl ? skmdRewriteUrl(rawImgUrl, art.slug || `bai-viet-${art.id}`) : 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400';
                    articlesHtml += `
                <article class="skmd-article-small" style="background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;">
                  <a href="/${art.slug}" class="skmd-article__link" style="display:flex; gap:24px; width:100%;">
                    <div class="skmd-article__image" style="width:250px; flex-shrink:0;">
                      <img src="${img}" alt="${art.title}" style="border-radius: var(--radius-sm); object-fit: cover; height: 160px; width: 100%;" loading="lazy">
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
                
                let paginationHtml = '';
                if (totalPages > 1) {
                  paginationHtml += '<div style="display: flex; justify-content: center; gap: 8px; margin-top: 40px;">';
                  for (let i = 1; i <= totalPages; i++) {
                    const pageUrl = i === 1 ? `/${catSlug}` : `/${catSlug}-page-${i}`;
                    const btnClass = i === page ? 'skmd-btn skmd-btn--primary' : 'skmd-btn skmd-btn--outline';
                    paginationHtml += `<a href="${pageUrl}" class="${btnClass}" style="min-width:40px; text-align:center;">${i}</a>`;
                  }
                  paginationHtml += '</div>';
                }
                
                currentPageHtml = currentPageHtml.replace(/<!-- INJECT_CATEGORY_ARTICLES -->/g, articlesHtml);
                currentPageHtml = currentPageHtml.replace(/<!-- INJECT_PAGINATION -->/g, paginationHtml);
                
                const currentSlug = page === 1 ? catSlug : `${catSlug}-page-${page}`;
                currentPageHtml = injectComponentsAndVars(currentPageHtml, currentSlug);
                fs.writeFileSync(path.join(distPagesDir, `${currentSlug}.html`), skmdMinifyHtml(currentPageHtml));
                buildStats.generated++;
              }
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
    const pagesForSitemap = [];
    pagesForSitemap.push({ slug: 'index', updatedAt: new Date().toISOString(), title: siteConfig.name, description: siteConfig.description });
    const allowedCategories = ['tri', 'tri-noi', 'tri-ngoai', 'tri-hon-hop', 'ro-hau-mon'];
    for (const cat of allowedCategories) {
       pagesForSitemap.push({ slug: cat, updatedAt: new Date().toISOString(), title: cat, description: `Danh mục ${cat}` });
    }
    if (cmsArticles && cmsArticles.length > 0) {
      for (const article of cmsArticles) {
         pagesForSitemap.push({
            slug: article.slug || `bai-viet-${article.id}`,
            updatedAt: article.ngayDang || new Date().toISOString(),
            title: article.title,
            description: article.tomtat
         });
      }
    }
    
    GeneratorEngine.generateSitemap(pagesForSitemap, DIST_DIR);
    GeneratorEngine.generateRss(pagesForSitemap, DIST_DIR);
    GeneratorEngine.generateJsonFeed(pagesForSitemap, DIST_DIR);
    
    if (fs.existsSync(path.join(SRC_DIR, 'vercel.json'))) {
      fs.copyFileSync(path.join(SRC_DIR, 'vercel.json'), path.join(DIST_DIR, 'vercel.json'));
    }
    
    if (fs.existsSync(path.join(SRC_DIR, 'favicon.ico'))) {
      fs.copyFileSync(path.join(SRC_DIR, 'favicon.ico'), path.join(DIST_DIR, 'favicon.ico'));
    }

    // Generate robots.txt
    const robotsTxtContent = `User-agent: *
Allow: /
Sitemap: ${siteConfig.url}/sitemap.xml`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxtContent);

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
