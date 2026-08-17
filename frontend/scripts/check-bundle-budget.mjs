import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const MAX_GZIP_KIB = 180;
const nextRoot = join(process.cwd(), ".next");
const manifest = JSON.parse(readFileSync(join(nextRoot, "app-build-manifest.json"), "utf8"));
const files = new Set(
  ["/layout", "/page"].flatMap((route) => manifest.pages?.[route] ?? []).filter((file) => file.endsWith(".js")),
);

if (!files.size) {
  throw new Error("No production home-route JavaScript chunks were found. Run `pnpm build` first.");
}

let rawBytes = 0;
let gzipBytes = 0;
for (const file of files) {
  const path = join(nextRoot, file);
  rawBytes += statSync(path).size;
  gzipBytes += gzipSync(readFileSync(path), { level: 9 }).byteLength;
}

const gzipKib = gzipBytes / 1024;
const rawKib = rawBytes / 1024;
console.log(`Home-route JavaScript: ${rawKib.toFixed(1)} KiB raw / ${gzipKib.toFixed(1)} KiB gzip (budget: ${MAX_GZIP_KIB} KiB gzip)`);
if (gzipKib > MAX_GZIP_KIB) {
  throw new Error(`Home-route JavaScript exceeds the ${MAX_GZIP_KIB} KiB gzip budget.`);
}
