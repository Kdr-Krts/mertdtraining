module.exports = {
  layout: "post.njk",
  tags: ["blog"],
  permalink: (data) => `/blog/${data.page.fileSlug}/`,
  eleventyComputed: {
    seoTitle: (data) => `${data.title} | ${data.site.brand}`,
    ogType: () => "article",
  },
};
