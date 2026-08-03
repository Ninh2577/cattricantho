// utils/rollback.js
import fs from 'fs';
import path from 'path';
import { Logger } from './logger.js';

export class RollbackManager {
  static backupDist(projectDir) {
    const distDir = path.join(projectDir, 'dist');
    const backupDir = path.join(projectDir, 'dist_backup');

    if (fs.existsSync(distDir)) {
      Logger.info('RollbackManager', 'Đang tạo bản backup cho thư mục dist hiện tại...');
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      fs.cpSync(distDir, backupDir, { recursive: true });
      Logger.success('RollbackManager', 'Tạo backup thành công.');
    }
  }

  static restoreDist(projectDir) {
    const distDir = path.join(projectDir, 'dist');
    const backupDir = path.join(projectDir, 'dist_backup');

    if (fs.existsSync(backupDir)) {
      Logger.warning('RollbackManager', 'Khôi phục bản backup do quá trình build thất bại...');
      if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
      }
      fs.renameSync(backupDir, distDir);
      Logger.success('RollbackManager', 'Khôi phục thành công. Hệ thống an toàn.');
    } else {
      Logger.warning('RollbackManager', 'Không tìm thấy bản backup nào để khôi phục.');
    }
  }

  static cleanupBackup(projectDir) {
    const backupDir = path.join(projectDir, 'dist_backup');
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
      Logger.info('RollbackManager', 'Đã xóa bản backup sau khi build thành công.');
    }
  }
}
