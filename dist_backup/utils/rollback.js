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
      try {
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true });
        }
        fs.cpSync(distDir, backupDir, { recursive: true });
        Logger.success('RollbackManager', 'Tạo backup thành công.');
      } catch (err) {
        Logger.warning('RollbackManager', 'Không thể tạo backup do lỗi hệ thống (có thể do file đang mở): ' + err.message);
      }
    }
  }

  static restoreDist(projectDir) {
    const distDir = path.join(projectDir, 'dist');
    const backupDir = path.join(projectDir, 'dist_backup');

    if (fs.existsSync(backupDir)) {
      Logger.warning('RollbackManager', 'Khôi phục bản backup do quá trình build thất bại...');
      try {
        if (fs.existsSync(distDir)) {
          fs.rmSync(distDir, { recursive: true, force: true });
        }
        // Thử cpSync thay vì renameSync để tránh EPERM trên Windows khi lock file
        fs.cpSync(backupDir, distDir, { recursive: true });
        Logger.success('RollbackManager', 'Khôi phục thành công. Hệ thống an toàn.');
      } catch (err) {
        Logger.error('RollbackManager', 'Lỗi khi khôi phục bản backup: ' + err.message);
      }
    } else {
      Logger.warning('RollbackManager', 'Không tìm thấy bản backup nào để khôi phục.');
    }
  }

  static cleanupBackup(projectDir) {
    const backupDir = path.join(projectDir, 'dist_backup');
    if (fs.existsSync(backupDir)) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
        Logger.info('RollbackManager', 'Đã xóa bản backup sau khi build thành công.');
      } catch (err) {
        Logger.warning('RollbackManager', 'Không thể xóa bản backup (file đang bị lock). Bỏ qua dọn dẹp.');
      }
    }
  }
}
