import path from 'path';
import { fileURLToPath } from 'url';
import { ProductionAuditor } from './utils/production-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

try {
  ProductionAuditor.run(DIST_DIR);
} catch (error) {
  console.error('\n[\x1b[31mCRITICAL\x1b[0m] Audit failed to execute:', error.message);
  process.exit(1);
}
