// The former package default (until 0.17.0) as a theme: the Figma library carries it as the second
// Primitives mode "Blue". Regenerate the Figma script after a palette change:
//   node bin/dsgn.mjs theme figma/themes/blue.theme.mjs --out <scratch dir>
// then rename the two dsgn.theme.figma.* files to blue.theme.figma.* and run blue.theme.figma.js in the library file.
export default {
  name: 'Blue',
  colors: {
    accent: { h: 260, c: 0.17 },
    neutral: { h: 260, c: 0.014 },
  },
};
