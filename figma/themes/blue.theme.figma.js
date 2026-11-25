// dsgn theme → Figma: adds or updates mode "Blue" in Primitives.
const P = {"mode":"Blue","primitives":{"color/neutral/99":"#fbfcfc","color/neutral/97":"#f4f5f7","color/neutral/94":"#eaebee","color/neutral/90":"#dcdee1","color/neutral/85":"#cbced2","color/neutral/76":"#adb1b8","color/neutral/70":"#9a9fa6","color/neutral/64":"#878c95","color/neutral/54":"#6a6f77","color/neutral/46":"#545860","color/neutral/38":"#3f4349","color/neutral/30":"#2b2e33","color/neutral/26":"#222428","color/neutral/22":"#191b1d","color/neutral/18":"#101213","color/neutral/14":"#08090a","color/accent/99":"#fafcff","color/accent/97":"#f0f6ff","color/accent/94":"#e0ecff","color/accent/90":"#ccdfff","color/accent/85":"#b2cfff","color/accent/76":"#83b2ff","color/accent/70":"#679df8","color/accent/64":"#4d89ee","color/accent/54":"#2c6acf","color/accent/46":"#1952af","color/accent/38":"#093c8c","color/accent/30":"#052965","color/accent/26":"#06214e","color/accent/22":"#061939","color/accent/18":"#041128","color/accent/14":"#02081a","color/danger/99":"#fffafb","color/danger/97":"#fff1f3","color/danger/94":"#ffe3e6","color/danger/90":"#ffd0d6","color/danger/85":"#ffb7c1","color/danger/76":"#fd879c","color/danger/70":"#f46986","color/danger/64":"#e74c71","color/danger/54":"#c61e54","color/danger/46":"#a40040","color/danger/38":"#7e002f","color/danger/30":"#5a0020","color/danger/26":"#490018","color/danger/22":"#370412","color/danger/18":"#26040b","color/danger/14":"#180105","color/success/99":"#f6fef7","color/success/97":"#eafaec","color/success/94":"#d8f4dd","color/success/90":"#c4e9ca","color/success/85":"#a9ddb2","color/success/76":"#79c68a","color/success/70":"#56b66f","color/success/64":"#32a557","color/success/54":"#00853c","color/success/46":"#006b2e","color/success/38":"#005121","color/success/30":"#003915","color/success/26":"#002d0f","color/success/22":"#00220a","color/success/18":"#011706","color/success/14":"#000d03","color/warning/99":"#fffbf7","color/warning/97":"#fff3e6","color/warning/94":"#fee7ce","color/warning/90":"#f7d8b5","color/warning/85":"#f0c595","color/warning/76":"#e0a45a","color/warning/70":"#d48d2a","color/warning/64":"#c17a00","color/warning/54":"#996000","color/warning/46":"#7b4c00","color/warning/38":"#5e3900","color/warning/30":"#422700","color/warning/26":"#351e00","color/warning/22":"#281600","color/warning/18":"#1c0e00","color/warning/14":"#110700","color/glass/light":"#fbfcfcc7","color/glass/dark":"#191b1dc7"},"typography":{},"roles":{"accent/fill-light":"color/accent/54","accent/fill-hover-light":"color/accent/46","accent/fill-pressed-light":"color/accent/38","accent/fill-text-light":"color/neutral/99","control/fill-light":"color/accent/54","control/fill-hover-light":"color/accent/46","control/fill-pressed-light":"color/accent/38","control/tint-light":"color/accent/94","control/tint-hover-light":"color/accent/90","control/tint-pressed-light":"color/accent/85","control/text-light":"color/accent/38","control/focus-light":"color/accent/54","accent/fill-dark":"color/accent/64","accent/fill-hover-dark":"color/accent/70","accent/fill-pressed-dark":"color/accent/76","accent/fill-text-dark":"color/neutral/14","control/fill-dark":"color/accent/64","control/fill-hover-dark":"color/accent/70","control/fill-pressed-dark":"color/accent/76","control/tint-dark":"color/accent/26","control/tint-hover-dark":"color/accent/30","control/tint-pressed-dark":"color/accent/38","control/text-dark":"color/accent/85","control/focus-dark":"color/accent/70"}};

async function dsgnApplyTheme(P) {
  const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255, a: h.length > 7 ? parseInt(h.slice(7, 9), 16) / 255 : 1 });
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const done = [];
  for (const [colName, values, conv] of [['Primitives', P.primitives, hex], ['Typography', P.typography, (x) => x]]) {
    if (!Object.keys(values).length) continue;
    const col = cols.find((c) => c.name === colName);
    if (!col) throw new Error('This file has no "' + colName + '" variables. Run it in the dsgn library file.');
    if (colName === 'Typography') {   // a font family can only be set when the font is available in Figma
      try { await figma.loadFontAsync({ family: values['family/sans'], style: 'Regular' }); }
      catch (e) { done.push('Font "' + values['family/sans'] + '" is not available in Figma, so the font was not changed.'); continue; }
    }
    const mode = col.modes.find((m) => m.name === P.mode);
    const modeId = mode ? mode.modeId : col.addMode(P.mode);   // Figma limits modes per collection by plan (Professional 10)
    let n = 0;
    for (const [name, val] of Object.entries(values)) {
      const v = vars.find((x) => x.variableCollectionId === col.id && x.name === name);
      if (!v) throw new Error('Variable not found: ' + colName + ' / ' + name);
      v.setValueForMode(modeId, conv(val)); n++;
    }
    done.push(colName + ': ' + (mode ? 'updated' : 'added') + ' mode "' + P.mode + '" (' + n + ' values)');
  }
  if (P.roles) done.push(await dsgnSetRoles(P.roles, cols, vars));
  return done;
}
// Role slots live in the Accent collection as aliases to Primitives palette steps. Its Default mode is the
// file's choice (one per file); a theme with accentFill or monochrome re-points it, removing a theme restores it.
async function dsgnSetRoles(roles, cols, vars) {
  cols = cols || await figma.variables.getLocalVariableCollectionsAsync();
  vars = vars || await figma.variables.getLocalVariablesAsync();
  const acc = cols.find((c) => c.name === 'Accent'), prim = cols.find((c) => c.name === 'Primitives');
  if (!acc || !prim) return 'Accent: no Accent collection, role slots not changed';
  const def = acc.modes[0].modeId;
  let n = 0, changed = 0;
  for (const [name, target] of Object.entries(roles)) {
    const v = vars.find((x) => x.variableCollectionId === acc.id && x.name === name);
    const p = vars.find((x) => x.variableCollectionId === prim.id && x.name === target);
    if (!v || !p) continue;
    const cur = v.valuesByMode[def];
    if (!(cur && cur.type === 'VARIABLE_ALIAS' && cur.id === p.id)) changed++;
    v.setValueForMode(def, figma.variables.createVariableAlias(p)); n++;
  }
  return 'Accent: Default mode role slots ' + (changed ? 're-pointed (' + changed + ' of ' + n + ')' : 'unchanged (' + n + ')');
}
const DSGN_DEFAULT_ROLES = {"accent/fill-light":"color/accent/54","accent/fill-hover-light":"color/accent/46","accent/fill-pressed-light":"color/accent/38","accent/fill-text-light":"color/neutral/99","control/fill-light":"color/accent/54","control/fill-hover-light":"color/accent/46","control/fill-pressed-light":"color/accent/38","control/tint-light":"color/accent/94","control/tint-hover-light":"color/accent/90","control/tint-pressed-light":"color/accent/85","control/text-light":"color/accent/38","control/focus-light":"color/accent/54","accent/fill-dark":"color/accent/64","accent/fill-hover-dark":"color/accent/70","accent/fill-pressed-dark":"color/accent/76","accent/fill-text-dark":"color/neutral/14","control/fill-dark":"color/accent/64","control/fill-hover-dark":"color/accent/70","control/fill-pressed-dark":"color/accent/76","control/tint-dark":"color/accent/26","control/tint-hover-dark":"color/accent/30","control/tint-pressed-dark":"color/accent/38","control/text-dark":"color/accent/85","control/focus-dark":"color/accent/70"};
async function dsgnRemoveTheme(name) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const done = [];
  for (const colName of ['Primitives', 'Typography']) {
    const col = cols.find((c) => c.name === colName); if (!col) continue;
    const i = col.modes.findIndex((m) => m.name === name);
    if (i > 0) { col.removeMode(col.modes[i].modeId); done.push(colName + ': removed mode "' + name + '"'); }   // never the first (package) mode
  }
  if (done.length) done.push(await dsgnSetRoles(DSGN_DEFAULT_ROLES));
  return done;
}
return await dsgnApplyTheme(P);
