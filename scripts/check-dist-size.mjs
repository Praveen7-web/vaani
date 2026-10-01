import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const LIMIT = 10 * 1024 * 1024;

function size(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = join(dir, e.name);
    return sum + (e.isDirectory() ? size(p) : statSync(p).size);
  }, 0);
}

const total = size("dist");
console.log(`dist size: ${(total / 1024 / 1024).toFixed(2)} MB`);
if (total >= LIMIT) {
  console.error("FAIL: dist must be below 10 MB");
  process.exit(1);
}
