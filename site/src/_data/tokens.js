// dsgn tokens from this repository (dist/dsgn.tokens.json, W3C DTCG format), reshaped for
// the Foundations pages. Swatches on the pages use the CSS variables, so they show the live theme;
// the tables show what the tokens are made of (palette steps, sizes per mode).
import { readRepo } from "../../lib/repo.js";

const json = JSON.parse(readRepo("dist/dsgn.tokens.json"));

const px = (dim) => dim.$value.value;
const ref = (token) => token.$value.replace(/^\{primitive\.color\.|\}$/g, "").split("."); // ["neutral", "94"]

const palettes = Object.entries(json.primitive.color).map(([name, steps]) => ({
  name,
  steps: Object.entries(steps).map(([step, t]) => ({ step, lightness: t.$value.components[0] })),
}));

const semantic = Object.keys(json.theme.light.color).map((name) => {
  const [lp, ls] = ref(json.theme.light.color[name]);
  const [dp, ds] = ref(json.theme.dark.color[name]);
  return { name, light: `${lp} ${ls}`, dark: `${dp} ${ds}` };
});

// Semantic colours in groups, in the order a reader meets them.
const groupOf = (name) =>
  /^surface/.test(name) ? "Surfaces"
  : /^text/.test(name) ? "Text"
  : /^(border|focus)/.test(name) ? "Borders and focus"
  : /^control/.test(name) ? "Controls"
  : /^neutral/.test(name) ? "Neutral"
  : /^accent/.test(name) ? "Accent"
  : /^(danger|success|warning)/.test(name) ? "Status"
  : "Other";
const semanticGroups = [];
for (const token of semantic) {
  const title = groupOf(token.name);
  let group = semanticGroups.find((g) => g.title === title);
  if (!group) semanticGroups.push((group = { title, tokens: [] }));
  group.tokens.push(token);
}

const space = Object.entries(json.primitive.space).map(([name, t]) => ({ name, px: px(t) }));

const densityModes = Object.keys(json.density);
const density = Object.keys(json.density.m).map((name) => ({
  name,
  values: densityModes.map((mode) => px(json.density[mode][name])),
}));

// Control height = line height + 2 × vertical padding, per density.
const controlHeight = densityModes.map((mode) => {
  const lineHeight = px(json.density[mode]["control-line-height"]);
  const padY = px(json.density[mode]["control-pad-y"]);
  return { mode, lineHeight, padY, height: lineHeight + 2 * padY };
});

const radiusModes = Object.keys(json.radius);
const radius = Object.keys(json.radius.default).map((name) => ({
  name,
  values: radiusModes.map((mode) => px(json.radius[mode][name])),
}));

const type = Object.entries(json.typography).map(([name, t]) => {
  const v = t.$value;
  return {
    name,
    family: v.fontFamily,
    size: v.fontSize.value,
    lineHeight: Math.round(v.fontSize.value * v.lineHeight),
    weight: v.fontWeight,
  };
});

export default { palettes, semanticGroups, semanticCount: semantic.length, space, densityModes, density, controlHeight, radiusModes, radius, type };
