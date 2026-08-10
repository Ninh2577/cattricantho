import { exec } from 'child_process';
exec('node build.js', (err, stdout, stderr) => {
  console.log("STDOUT:", stdout);
  console.error("STDERR:", stderr);
  if (err) console.error("ERROR:", err);
});
