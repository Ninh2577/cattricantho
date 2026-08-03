import { execSync } from 'child_process';
import fs from 'fs';

try {
  const output = execSync('node build.js', { encoding: 'utf-8', cwd: 'c:/xampp/htdocs/cattricantho' });
  fs.writeFileSync('c:/xampp/htdocs/cattricantho/build_output.txt', 'SUCCESS:\n' + output);
} catch (error) {
  fs.writeFileSync('c:/xampp/htdocs/cattricantho/build_output.txt', 'ERROR:\n' + error.message + '\nSTDOUT:\n' + error.stdout + '\nSTDERR:\n' + error.stderr);
}
