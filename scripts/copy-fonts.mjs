import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "assets", "fonts");

const files = [
  // DM Sans — latin + latin-ext (Türkçe karakterler)
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-ext-400-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-ext-500-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-ext-600-normal.woff2",
  "node_modules/@fontsource/dm-sans/files/dm-sans-latin-ext-700-normal.woff2",
  // Oswald
  "node_modules/@fontsource/oswald/files/oswald-latin-400-normal.woff2",
  "node_modules/@fontsource/oswald/files/oswald-latin-500-normal.woff2",
  "node_modules/@fontsource/oswald/files/oswald-latin-600-normal.woff2",
  "node_modules/@fontsource/oswald/files/oswald-latin-ext-400-normal.woff2",
  "node_modules/@fontsource/oswald/files/oswald-latin-ext-500-normal.woff2",
  "node_modules/@fontsource/oswald/files/oswald-latin-ext-600-normal.woff2",
];

fs.mkdirSync(outDir, { recursive: true });

for (const rel of files) {
  const from = path.join(root, rel);
  const to = path.join(outDir, path.basename(from));
  if (!fs.existsSync(from)) {
    console.warn(`Skip missing: ${rel}`);
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`font: ${path.basename(to)}`);
}
