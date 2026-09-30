// Figma component lint — run inside the dsgn Figma file (Figma MCP use_figma or a scratch plugin).
// Reports every value inside a component that is not bound to a variable or style:
// solid fills/strokes, effects, auto-layout padding/gap, corner radius, text without a style.
// Nested instances are skipped (they are checked in their own component).
const report = {}; let total = 0, nodes = 0;
const isAuto = (n) => 'layoutMode' in n && n.layoutMode !== 'NONE';
for (const p of figma.root.children) {
  await figma.setCurrentPageAsync(p);
  for (const c of p.findAll((n) => n.type === 'COMPONENT')) {
    const key = p.name + ' / ' + (c.parent && c.parent.type === 'COMPONENT_SET' ? c.parent.name : c.name);
    const issues = new Set();
    for (const n of [c, ...c.findAll(() => true)]) {
      nodes++;
      let x = n.parent, nested = false; while (x && x !== c) { if (x.type === 'INSTANCE') nested = true; x = x.parent; }
      if (nested || (n.type === 'INSTANCE' && n !== c)) continue;
      const bv = n.boundVariables || {};
      if ('fills' in n && Array.isArray(n.fills)) n.fills.forEach((f) => { if (f.visible !== false && f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) issues.add('fill: ' + n.name); });
      if ('strokes' in n && Array.isArray(n.strokes)) n.strokes.forEach((f) => { if (f.visible !== false && f.type === 'SOLID' && !(f.boundVariables && f.boundVariables.color)) issues.add('stroke: ' + n.name); });
      if ('effects' in n) n.effects.forEach((e) => { if (e.visible !== false && !(e.boundVariables && e.boundVariables.color) && !n.effectStyleId) issues.add('effect: ' + n.name); });
      if (isAuto(n)) for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'itemSpacing']) if (n[k] > 0 && !bv[k]) issues.add(k + '=' + n[k] + ': ' + n.name);
      if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius > 0 && !bv.topLeftRadius) issues.add('radius=' + n.cornerRadius + ': ' + n.name);
      if (n.type === 'TEXT' && !n.textStyleId && !bv.fontSize) issues.add('text without style: ' + n.name);
    }
    if (issues.size) { report[key] = [...new Set([...(report[key] || []), ...issues])]; total += issues.size; }
  }
}
return JSON.stringify({ ok: total === 0, total, nodes, report });
