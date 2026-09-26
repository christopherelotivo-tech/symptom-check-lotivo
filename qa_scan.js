const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('git ls-files src/', {encoding:'utf8'}).split('\n').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let issues = [];
let logs = [];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');

  // 1. Dynamic react-native import crash pattern
  if (code.includes("import('react-native')")) {
    issues.push('[CRASH] Dynamic react-native import: ' + file);
  }

  // 2. JSON.parse without try/catch
  const jsonParseCount = (code.match(/JSON\.parse\(/g) || []).length;
  const tryCatchCount = (code.match(/try\s*\{/g) || []).length;
  if (jsonParseCount > 0 && tryCatchCount === 0) {
    issues.push('[UNSAFE] JSON.parse with no try/catch: ' + file);
  }

  // 3. console.log (debug noise)
  const logCount = (code.match(/console\.log/g) || []).length;
  if (logCount > 0) {
    logs.push('[INFO] console.log x' + logCount + ' in ' + file);
  }

  // 4. Missing key prop warnings - .map without key
  const mapsWithoutKey = [...code.matchAll(/\.map\(([^)]+)\)\s*=>\s*\(/g)];
  // (just informational, hard to check statically without AST)

  // 5. Unhandled promise - fire-and-forget async calls
  const fireAndForget = [...code.matchAll(/(?<!await )(fetch|database\.|runAsync|getAllAsync|getFirstAsync)\(/g)];
  if (fireAndForget.length > 0) {
    issues.push('[WARN] Possible unhandled promise (' + fireAndForget.length + ' hits) in ' + file);
  }

  // 6. Empty catch blocks
  const emptyCatch = [...code.matchAll(/catch\s*\([^)]*\)\s*\{\s*\}/g)];
  if (emptyCatch.length > 0) {
    issues.push('[WARN] Empty catch block in ' + file);
  }
});

console.log('\n====== QA SCAN RESULTS ======');
if (issues.length === 0) {
  console.log('[PASS] No critical issues found!');
} else {
  console.log('ISSUES:');
  issues.forEach(i => console.log(' ', i));
}
console.log('\nINFO (non-blocking):');
logs.forEach(l => console.log(' ', l));
console.log('=============================\n');
