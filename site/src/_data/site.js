// Site-wide settings. `lang` is the default; a language folder (e.g. src/cs/) overrides it
// with its own directory data file when translations are added.
// The showcase demos are not finished: their pages build (unlisted, noindex in src/showcase/showcase.json),
// but no link leads there. true puts Showcase back in the navigation and the footer; on the home page
// also set homeShowcase: true in src/index.njk, and drop the noindex.
const showcasePublic = false;

export default {
  name: "dsgn.systems",
  url: "https://dsgn.systems",
  lang: "en",
  themeColor: "#191B1D",
  org: "Novama Studio",
  year: new Date().getFullYear(),
  links: {
    repo: "https://github.com/NovamaStudio/dsgn.systems",
    npm: "https://www.npmjs.com/package/dsgn.systems",
    docs: "/docs/",
    themeCustomizer: "/theme/",
    showcase: "/showcase/",
    changelog: "/docs/changelog/",
    license: "https://github.com/NovamaStudio/dsgn.systems/blob/main/LICENSE",
    // The Figma library (Figma Community file). Empty would hide the links to it.
    figmaFile: "https://www.figma.com/community/file/1707409667973930578",
    figmaPlugin: "https://github.com/NovamaStudio/dsgn.systems/tree/main/figma-plugin",
    skill: "https://github.com/NovamaStudio/dsgn.systems/tree/main/skills/dsgn-systems",
  },
  showcasePublic,
  // Main navigation. Home sections use "/#id" so the links also work from other pages. A page link is
  // current on its own subpages too (Docs, Showcase). The two calls to action sit beside it in the header.
  nav: [
    { label: "Why dsgn", href: "/#why" },
    ...(showcasePublic ? [{ label: "Showcase", href: "/showcase/" }] : []),
    { label: "Figma", href: "/#figma" },
    { label: "Docs", href: "/docs/" },
  ],
};
