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
// 2. Core SEO Infrastructure
import { siteConfig } from './config/site.config.js';
import { clinicConfig } from './config/clinic.config.js';
import { SEOManager } from './utils/seo.js';

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

    function injectComponentsAndVars(htmlContent) {
      const componentRegex = /<!--\s*INJECT_COMPONENT:\s*([^>]+)\s*-->/g;
      let compiledHtml = htmlContent.replace(componentRegex, (match, compPath) => {
        const fullPath = path.join(SRC_DIR, compPath.trim());
        if (fs.existsSync(fullPath)) {
          return fs.readFileSync(fullPath, 'utf8');
        }
        return match;
      });

      compiledHtml = compiledHtml
        .replace(/<!--\s*INJECT_SITE_NAME\s*-->/g, siteConfig.name)
        .replace(/<!--\s*INJECT_BRAND\s*-->/g, siteConfig.name)
        .replace(/<!--\s*INJECT_SITE_DESC\s*-->/g, siteConfig.description)
        .replace(/<!--\s*INJECT_LOGO\s*-->/g, siteConfig.logo)
        .replace(/<!--\s*INJECT_HOTLINE\s*-->/g, clinicConfig.hotlineDisplay)
        .replace(/<!--\s*INJECT_ADDRESS\s*-->/g, clinicConfig.address.full)
        .replace(/<!--\s*INJECT_ZALO\s*-->/g, clinicConfig.zaloLink)
        .replace(/<!--\s*INJECT_SEO_TAGS\s*-->/g, SEOManager.generateMetaTags());
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

    htmlFiles.forEach(file => {
      try {
        let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
        content = injectComponentsAndVars(content); // First pass
        content = injectComponentsAndVars(content); // Second pass for nested
        
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

    // Generate Build Manifest & QA Report
    buildStats.duration = Date.now() - startTime;
    SecurityManager.generateManifest(DIST_DIR, buildStats);
    QAReportGenerator.generate(DIST_DIR, buildStats);

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
