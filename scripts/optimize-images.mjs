import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "assets", "img");
const outDir = path.join(root, "src", "assets", "img");
const assetsOut = path.join(root, "src", "assets");

const jobs = [
  {
    from: "mert-duman-portre.jpg",
    widths: [360, 540, 720],
    base: "mert-duman-portre",
    quality: 82,
  },
  {
    from: "basketboltopu.jpg",
    widths: [640],
    base: "basketboltopu",
    quality: 80,
  },
  {
    from: "md-logo.jpg",
    widths: [240, 480],
    base: "md-logo",
    quality: 88,
  },
  {
    from: "hero-banner.jpg",
    widths: [960, 1440, 1920],
    base: "hero-banner",
    quality: 82,
  },
];

async function writeWebp(input, output, width, quality) {
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(output);

  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  console.log(
    `${path.basename(input)} → ${path.basename(output)}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`
  );
}

async function writeSquarePng(input, output, size) {
  await sharp(input)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`favicon → ${path.basename(output)} (${size}x${size})`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(assetsOut, { recursive: true });

  for (const job of jobs) {
    const input = path.join(srcDir, job.from);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${job.from}`);
      continue;
    }

    for (const width of job.widths) {
      const name =
        job.widths.length === 1
          ? `${job.base}.webp`
          : `${job.base}-${width}.webp`;
      await writeWebp(input, path.join(outDir, name), width, job.quality);
    }

    // OG / legacy alias = largest size
    if (job.widths.length > 1) {
      const largest = Math.max(...job.widths);
      const fromName = `${job.base}-${largest}.webp`;
      const alias = `${job.base}.webp`;
      fs.copyFileSync(path.join(outDir, fromName), path.join(outDir, alias));
      console.log(`alias: ${fromName} → ${alias}`);
    }
  }

  const logoInput = path.join(srcDir, "md-logo.jpg");
  if (fs.existsSync(logoInput)) {
    await writeSquarePng(logoInput, path.join(assetsOut, "favicon-32.png"), 32);
    await writeSquarePng(logoInput, path.join(assetsOut, "favicon-48.png"), 48);
    await writeSquarePng(logoInput, path.join(assetsOut, "apple-touch-icon.png"), 180);
    await writeSquarePng(logoInput, path.join(assetsOut, "icon-192.png"), 192);
    // Default favicon.ico-compatible PNG at /assets/favicon.png
    await writeSquarePng(logoInput, path.join(assetsOut, "favicon.png"), 32);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
