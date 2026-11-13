// Every dsgn component, from the same sources as the rest of the docs: the header comment of
// src/components/<key>.css (usage, attributes), src/docs/examples.mjs (name, group, lead, live
// examples, Figma names). A hand-written guide in site/src/_guides/<key>.md, when there is one,
// replaces the generated examples with a fuller walk-through.
import { existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { repo, readRepo } from "./repo.js";

const { parseHeader } = await import(pathToFileURL(repo("build/component-header.mjs")).href);
const { components, groups, leads } = await import(pathToFileURL(repo("src/docs/examples.mjs")).href);

// Pictures in examples are inline data URIs; in the code shown to readers they become file names.
const readableCode = (html) => html.replace(/data:image\/svg\+xml,[^"]+/g, (m) => (m.length > 1500 ? "photo.jpg" : "portrait.jpg"));

const keys = readdirSync(repo("src/components")).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, ""));
const missing = keys.filter((k) => !components[k] || !leads[k]);
if (missing.length) throw new Error(`site: no entry or lead in src/docs/examples.mjs for ${missing.join(", ")}`);

export const list = keys
  .map((key) => {
    const c = components[key];
    const src = readRepo(`src/components/${key}.css`).toString();
    const header = parseHeader(src);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
    return {
      key,
      name: c.name,
      group: c.group,
      lead: leads[key],
      figma: c.figma,
      examples: c.examples.map((e) => ({ ...e, shown: e.code || readableCode(e.html || "") })),
      prose: header.prose,
      api: header.api,
      classes: [...new Set([...code.matchAll(/\.(dsgn-[\w-]+)/g)].map((m) => m[1]))],
      tokens: [...new Set([...code.matchAll(/var\((--dsgn-[\w-]+)/g)].map((m) => m[1]))].sort(),
      needsJs: /dsgn\.js|dsgn\.toast/.test(header.prose.join(" ") + src.slice(0, 400)),
      guide: existsSync(repo(`site/src/_guides/${key}.md`)) ? `site/src/_guides/${key}.md` : null,
      href: `/docs/components/${key}/`,
    };
  })
  .sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.name.localeCompare(b.name));

export const byGroup = groups.map((title) => ({ title, items: list.filter((c) => c.group === title) })).filter((g) => g.items.length);
