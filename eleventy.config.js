/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function shortHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

module.exports = function (eleventyConfig) {
  const cssHash = shortHash("./src/styles.css");
  const jsHash = shortHash("./src/app.js");
  const cssFile = `styles.${cssHash}.css`;
  const jsFile = `app.${jsHash}.js`;

  eleventyConfig.addGlobalData("assets", {
    css: `/${cssFile}`,
    js: `/${jsFile}`,
    cssFile,
    jsFile,
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addWatchTarget("src/styles.css");
  eleventyConfig.addWatchTarget("src/app.js");

  eleventyConfig.on("eleventy.after", () => {
    const out = path.join(__dirname, "dist");
    fs.mkdirSync(out, { recursive: true });
    fs.copyFileSync("./src/styles.css", path.join(out, cssFile));
    fs.copyFileSync("./src/app.js", path.join(out, jsFile));
    for (const stale of ["styles.css", "app.js"]) {
      const p = path.join(out, stale);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.addFilter("price", (n) =>
    Number(n).toLocaleString("tr-TR")
  );
  eleventyConfig.addFilter("urlencode", (value) =>
    encodeURIComponent(String(value ?? ""))
  );

  const toDate = (value) => (value instanceof Date ? value : new Date(value));
  eleventyConfig.addFilter("dateTr", (value) =>
    new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(toDate(value))
  );
  eleventyConfig.addFilter("dateIso", (value) =>
    toDate(value).toISOString().slice(0, 10)
  );
  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html || "")
      .replace(/<[^>]+>/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      output: "dist",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
