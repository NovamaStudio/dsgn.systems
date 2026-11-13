// dsgn.systems website: Eleventy builds site/src into site/_site. Run it from the repository root
// (`npm run site:build`, after `npm run build`). Static files live in site/public and are copied to the
// site root unchanged; dsgn itself comes straight from this repository (dist/, src/), never from npm.

// Icons dsgn's CSS inserts by itself (checkbox, pagination, chips, alerts, toasts),
// so they are not visible in the page markup but must be in the font subset.
const CSS_ICONS = ["check", "check_circle", "chevron_left", "chevron_right", "close", "error", "info", "play_arrow", "remove", "warning"];

import { RenderPlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/public": "/" });
  // dsgn itself, minified, as every static site links it.
  eleventyConfig.addPassthroughCopy({ "dist/dsgn.min.css": "vendor/dsgn/dsgn.css", "dist/dsgn.min.js": "vendor/dsgn/dsgn.js" });
  // The dsgn theme engine is dependency-free; the customizer and the Showcase run it in the browser.
  for (const file of ["theme.mjs", "color.mjs", "tokens.config.mjs"]) {
    eleventyConfig.addPassthroughCopy({ [`src/${file}`]: `vendor/dsgn/theme/${file}` });
  }
  // The readable tokens CSS (as .txt, so `dsgn lint` never checks dsgn itself): themeCss() reads the
  // density / corner blocks from it (the minified copy drops the quotes it matches).
  eleventyConfig.addPassthroughCopy({ "dist/dsgn.tokens.css": "vendor/dsgn/theme/dsgn.tokens.txt" });

  // Fill the Material Symbols subset with exactly the icons this page uses.
  eleventyConfig.addTransform("icon-subset", function (content) {
    if (!this.page.outputPath?.endsWith(".html") || !content.includes("@ICONS")) return content;
    const used = [...content.matchAll(/class="dsgn-icon"[^>]*>([a-z0-9_]+)</g)].map((m) => m[1]);
    const names = [...new Set([...used, ...CSS_ICONS])].sort();
    return content.replace("@ICONS", names.join(","));
  });

  // Give Markdown headings an id from their text ("Make it yours" → #make-it-yours), so sections
  // can be linked. Duplicates on one page get -2, -3.
  eleventyConfig.amendLibrary("md", (md) => {
    md.core.ruler.push("heading_ids", (state) => {
      const seen = new Map();
      state.tokens.forEach((token, i) => {
        if (token.type !== "heading_open" || token.attrGet("id")) return;
        const base = state.tokens[i + 1].content.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        token.attrSet("id", n > 1 ? `${base}-${n}` : base);
      });
    });
  });

  // Previous and next documentation page, in sidebar order.
  eleventyConfig.addFilter("docsPager", (nav, url) => {
    const flat = nav.flatMap((group) => group.items);
    const i = flat.findIndex((item) => item.href === url);
    return { prev: i > 0 ? flat[i - 1] : null, next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null };
  });

  // A live example: the markup rendered as a preview, the same markup shown as code below it, so the
  // two can never drift apart. Output has no blank or indented lines, so it is safe inside Markdown.
  const escape = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const exampleBlock = (preview, code, label = "Example") => [
    `<figure class="docs-example">`,
    `<div class="docs-example-preview">${preview.split("\n").filter((l) => l.trim()).join("\n")}</div>`,
    `<figcaption class="dsgn-visually-hidden">${escape(label)}</figcaption>`,
    `<div class="docs-example-code"><pre class="code"><code>${escape(code).replace(/\n/g, "&#10;")}</code></pre>`,
    `<button class="dsgn-icon-button docs-example-copy" data-variant="ghost" data-intent="neutral" type="button" data-copy="${escape(code).replace(/\n/g, "&#10;")}" aria-label="Copy code">`,
    `<span class="dsgn-icon" aria-hidden="true">content_copy</span></button></div>`,
    `</figure>`,
  ].join("");

  // {% example "label" %}…html…{% endexample %} in pages and guides.
  eleventyConfig.addPairedShortcode("example", (markup, label) => {
    const lines = markup.replace(/^\n+|\s+$/g, "").split("\n");
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    const code = lines.map((l) => l.slice(indent)).join("\n");
    return exampleBlock(code, code, label);
  });
  // {{ e | example }} for an example from src/docs/examples.mjs ({ title, html, shown }).
  eleventyConfig.addFilter("example", (e) => exampleBlock(e.html || "", e.shown || "", e.title));

  // Guides are rendered into the component pages, not published on their own.
  eleventyConfig.ignores.add("site/src/_guides/**");
  eleventyConfig.addPlugin(RenderPlugin);

  eleventyConfig.setServerOptions({ port: 4174 });
  eleventyConfig.addWatchTarget("src/docs/");
  eleventyConfig.addWatchTarget("src/components/");

  return {
    dir: { input: "site/src", output: "site/_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
