// utils/qa-report.js
import fs from 'fs';
import path from 'path';
import { Logger } from './logger.js';

export class QAReportGenerator {
  
  static generate(outputDir, stats) {
    Logger.info('QAReportGenerator', 'Đang sinh Báo cáo SEO QA...');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO QA Report - Enterprise Build</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
    .card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-bottom: 24px; }
    h1 { color: #0369a1; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px; }
    .metric-box { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; }
    .metric-box h3 { margin: 0; font-size: 24px; }
    .success { color: #15803d; border-color: #15803d; background: #f0fdf4; }
    .error { color: #b91c1c; border-color: #b91c1c; background: #fef2f2; }
    .warning { color: #b45309; border-color: #b45309; background: #fffbeb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SEO QA Report - Build Summary</h1>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'Development'}</p>
    
    <div class="metrics">
      <div class="metric-box success">
        <h3>${stats.generated}</h3>
        <p>Pages Generated</p>
      </div>
      <div class="metric-box error">
        <h3>${stats.failed}</h3>
        <p>Pages Failed</p>
      </div>
      <div class="metric-box warning">
        <h3>${stats.warnings}</h3>
        <p>A11y/HTML Warnings</p>
      </div>
      <div class="metric-box">
        <h3>${stats.duration}ms</h3>
        <p>Build Duration</p>
      </div>
    </div>
    
    <h2 style="margin-top: 40px;">Validation Errors</h2>
    <ul>
      ${stats.errorLogs.length > 0 ? stats.errorLogs.map(e => `<li>${e}</li>`).join('') : '<li>Không có lỗi nghiêm trọng. SEO hoàn hảo!</li>'}
    </ul>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(path.join(outputDir, 'seo-report.html'), html);
    Logger.success('QAReportGenerator', 'Báo cáo SEO QA đã được lưu tại dist/seo-report.html');
  }
}
