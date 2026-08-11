// utils/schema-report.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

export class SchemaReportGenerator {
  static generate(reportData) {
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }

    // 1. Generate JSON Report (Machine Readable for CI/CD)
    const jsonReport = {
      timestamp: new Date().toISOString(),
      platform: "Enterprise Medical Schema Platform",
      summary: {
        totalPagesChecked: reportData.pagesChecked || 0,
        totalErrors: reportData.totalErrors || 0,
        totalWarnings: reportData.totalWarnings || 0,
      },
      details: reportData.details || []
    };
    
    fs.writeFileSync(
      path.join(distPath, 'schema-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );

    // 2. Generate HTML Report (Human Readable Dashboard)
    const htmlReport = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Enterprise Schema QA Report</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .stat-box { display: inline-block; padding: 20px; margin: 10px; border-radius: 8px; color: white; min-width: 150px; text-align: center; }
    .stat-errors { background: #ef4444; }
    .stat-warnings { background: #f59e0b; }
    .stat-success { background: #10b981; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; }
    .error-text { color: #ef4444; font-weight: bold; }
    .warning-text { color: #f59e0b; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Enterprise Medical Schema Platform - QA Dashboard</h1>
    <div>
      <div class="stat-box stat-success">
        <h2>${jsonReport.summary.totalPagesChecked}</h2>
        <p>Pages Checked</p>
      </div>
      <div class="stat-box ${jsonReport.summary.totalErrors > 0 ? 'stat-errors' : 'stat-success'}">
        <h2>${jsonReport.summary.totalErrors}</h2>
        <p>Critical Errors</p>
      </div>
      <div class="stat-box stat-warnings">
        <h2>${jsonReport.summary.totalWarnings}</h2>
        <p>Warnings</p>
      </div>
    </div>
    
    <h2>Chi tiết theo trang</h2>
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Schemas</th>
          <th>Status</th>
          <th>Logs</th>
        </tr>
      </thead>
      <tbody>
        ${jsonReport.details.map(page => `
          <tr>
            <td><a href="${page.url}" target="_blank">${page.url}</a></td>
            <td>${page.schemas.join('<br>')}</td>
            <td>
              ${page.errors.length > 0 ? '<span class="error-text">FAIL</span>' : (page.warnings.length > 0 ? '<span class="warning-text">WARNING</span>' : '<span style="color:#10b981">PASS</span>')}
            </td>
            <td>
              ${page.errors.map(e => `<div class="error-text">❌ ${e}</div>`).join('')}
              ${page.warnings.map(w => `<div class="warning-text">⚠️ ${w}</div>`).join('')}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(path.join(distPath, 'schema-report.html'), htmlReport);
    console.log("✅ Schema QA Report generated: dist/schema-report.json & dist/schema-report.html");
  }
}
