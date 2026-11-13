// Facts about dsgn, read from this repository at build time (run `npm run build` first, it writes
// dist/), so the site never quotes stale numbers.
import { gzipSync } from "node:zlib";
import { readRepo as read } from "../../lib/repo.js";

const pkg = JSON.parse(read("package.json"));
const [major, minor] = pkg.version.split(".");

const report = read("dist/contrast-report.md").toString();
const pairs = report.match(/\*\*(\d+) pairs, (\d+) pass, (\d+) fail\.\*\*/);
if (!pairs) throw new Error("dsgn: contrast summary not found in dist/contrast-report.md");

const kB = (file) => Math.round(gzipSync(read(file), { level: 9 }).length / 1000);

const figma = JSON.parse(read("dist/figma-variables.json"));
// Same order as the Figma library panel shows them to designers.
const order = ["Color", "Accent", "Density", "Radius", "Elevation", "Material", "Lines", "Layout", "Typography", "Primitives"];
// Modes read smallest to largest on the page; the package lists the default mode first.
const modeOrder = { Density: ["S", "M", "L"], Radius: ["Sharp", "Default", "Rounded", "Pill"] };
const sortModes = (name, modes) =>
  modeOrder[name] ? [...modes].sort((a, b) => modeOrder[name].indexOf(a) - modeOrder[name].indexOf(b)) : modes;
const collections = figma.collections
  .map((c) => ({ name: c.name, modes: c.modes.length > 1 ? sortModes(c.name, c.modes) : [], variables: c.variables.length }))
  .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

export default {
  version: pkg.version,
  minor: `${major}.${minor}`,
  contrast: { pairs: Number(pairs[1]), pass: Number(pairs[2]), fail: Number(pairs[3]) },
  size: { css: kB("dist/dsgn.min.css"), js: kB("dist/dsgn.min.js") },
  figma: {
    collections,
    variables: collections.reduce((sum, c) => sum + c.variables, 0),
    textStyles: figma.textStyles.length,
  },
};
