import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Configs & Utilities
import { siteConfig } from './config/site.config.js';
import { clinicConfig } from './config/clinic.config.js';
import { SEOManager } from './utils/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

// Ensure dist exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Function to copy directory recursively
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

// Copy assets, config, services, utils to dist
['assets', 'config', 'services', 'utils'].forEach(folder => {
  const src = path.join(SRC_DIR, folder);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(DIST_DIR, folder));
  }
});

// Build HTML Pages
const pagesDir = path.join(SRC_DIR, 'pages');
const distPagesDir = path.join(DIST_DIR, 'pages');
if (!fs.existsSync(distPagesDir)) fs.mkdirSync(distPagesDir, { recursive: true });

function injectComponentsAndVars(htmlContent) {
  // 1. Inject Components
  const componentRegex = /<!--\s*INJECT_COMPONENT:\s*([^>]+)\s*-->/g;
  let compiledHtml = htmlContent.replace(componentRegex, (match, compPath) => {
    const fullPath = path.join(SRC_DIR, compPath.trim());
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return match;
  });

  // 2. Inject Variables
  compiledHtml = compiledHtml
    .replace(/<!--\s*INJECT_SITE_NAME\s*-->/g, siteConfig.name)
    .replace(/<!--\s*INJECT_SITE_DESC\s*-->/g, siteConfig.description)
    .replace(/<!--\s*INJECT_LOGO\s*-->/g, siteConfig.logo)
    .replace(/<!--\s*INJECT_HOTLINE\s*-->/g, clinicConfig.hotlineDisplay)
    .replace(/<!--\s*INJECT_ADDRESS\s*-->/g, clinicConfig.address.full)
    .replace(/<!--\s*INJECT_ZALO\s*-->/g, clinicConfig.zaloLink)
    .replace(/<!--\s*INJECT_SEO_TAGS\s*-->/g, SEOManager.generateMetaTags());

  return compiledHtml;
}

const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));
htmlFiles.forEach(file => {
  let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  content = injectComponentsAndVars(content); // First pass
  content = injectComponentsAndVars(content); // Second pass for nested components
  fs.writeFileSync(path.join(distPagesDir, file), content);
  console.log(`Built: ${file}`);
});

// Also copy vercel.json if it needs to be at root (Vercel reads it before build, so it's fine in root)
console.log('Build completed successfully!');
