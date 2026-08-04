import { execSync } from 'child_process';
import fs from 'fs';

try {
  const output = execSync('node build.js', { encoding: 'utf8' });
  fs.writeFileSync('build-log.txt', output);
} catch (error) {
  fs.writeFileSync('build-log.txt', `ERROR: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
}
