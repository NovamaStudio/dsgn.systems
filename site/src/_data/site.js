// Site-wide settings. `lang` is the default; a language folder (e.g. src/cs/) overrides it
// with its own directory data file when translations are added.
export default {
  name: "dsgn.systems",
  url: "https://dsgn.systems",
  lang: "en",
  themeColor: "#191B1D",
  org: "Novama",
  year: new Date().getFullYear(),
  links: {
    repo: "https://github.com/NovamaStudio/dsgn.systems",
    npm: "https://www.npmjs.com/package/dsgn.systems",
    docs: "/docs/",
    themeCustomizer: "/theme/",
    showcase: "/showcase/",
    changelog: "/docs/changelog/",
    license: "https://github.com/NovamaStudio/dsgn.systems/blob/main/LICENSE",
    figmaPlugin: "https://github.com/NovamaStudio/dsgn.systems/tree/main/figma-plugin",
    skill: "https://github.com/NovamaStudio/dsgn.systems/tree/main/skills/dsgn-systems",
  },
  // Main navigation. Home sections use "/#id" so the links also work from other pages.
  nav: [
    { label: "Why dsgn", href: "/#why" },
    { label: "The scale", href: "/#scale" },
    { label: "Modes", href: "/#modes" },
    { label: "Figma", href: "/#figma" },
    { label: "Get started", href: "/#start" },
    { label: "Showcase", href: "/showcase/" },
  ],
};
