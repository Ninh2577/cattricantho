// config/validator.js
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';

export class ConfigValidator {
  static validate(projectDir) {
    Logger.info('ConfigValidator', 'Bắt đầu kiểm tra tính hợp lệ của cấu hình...');
    
    const requiredFiles = [
      'config/site.config.js',
      'config/clinic.config.js',
      'config/theme.config.js',
      'config/seo.config.js'
    ];

    let hasError = false;

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(projectDir, file))) {
        Logger.error('ConfigValidator', `Thiếu file cấu hình bắt buộc: ${file}`);
        hasError = true;
      }
    }

    if (hasError) {
      Logger.error('ConfigValidator', 'Kiểm tra cấu hình thất bại. Vui lòng bổ sung các file còn thiếu.');
      throw new Error('Config Validation Failed');
    }

    Logger.success('ConfigValidator', 'Toàn bộ cấu hình hợp lệ.');
    return true;
  }
}
