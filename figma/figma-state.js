// dsgn Figma state fingerprint — prepended by the build to every Figma script (parity, handoff, lint).
// Hashes what those scripts check: components (properties incl. slot preferred values, variants and the
// layer tree: type, name, size, min / max size, sizing, layout, visibility, clipping, variable bindings,
// text styles, property links), variables with their values per
// mode, and text styles. Descriptions are left out (the handoff script writes them). The build
// accepts the three reports only when they carry the same fingerprint, i.e. they were all run on the
// same state of the file — any change in Figma after a run makes the reports stale.
async function __figmaState() {
  const parts = [];
  const b = (n) => Object.entries(n.boundVariables || {}).map(([k, v]) => k + '=' + (Array.isArray(v) ? v.map((x) => x.id).join('+') : v.id)).sort().join(',');
  for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
    parts.push('C|' + c.name + '|' + c.modes.map((m) => m.name).join(','));
    for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); parts.push('V|' + c.name + '|' + v.name + '|' + v.resolvedType + '|' + JSON.stringify(v.valuesByMode) + '|' + v.scopes.join(',')); }
  }
  for (const s of await figma.getLocalTextStylesAsync()) parts.push('T|' + s.name + '|' + s.fontName.family + ' ' + s.fontName.style + '|' + s.fontSize + '|' + b(s));
  for (const page of figma.root.children) {
    if (page.name === 'Templates') continue;
    await page.loadAsync();
    for (const c of page.findAll((x) => x.type === 'COMPONENT_SET' || (x.type === 'COMPONENT' && x.parent.type !== 'COMPONENT_SET'))) {
      parts.push('K|' + c.name + '|' + Object.entries(c.componentPropertyDefinitions || {}).map(([k, d]) => k.split('#')[0] + ':' + d.type + (d.variantOptions ? '[' + d.variantOptions.join('/') + ']' : '') + '=' + JSON.stringify(d.defaultValue) + (d.preferredValues ? '>' + d.preferredValues.map((p) => p.key).join('+') : '') + (d.description ? '"' + d.description : '')).sort().join(';'));
      const walk = (n, path) => {
        parts.push('N|' + path + '|' + n.type + '|' + Math.round(n.width) + 'x' + Math.round(n.height) + '|' + (n.visible ? 1 : 0) + '|' + b(n) +
          '|' + [n.layoutMode, n.layoutWrap, n.layoutSizingHorizontal, n.layoutSizingVertical, n.minWidth, n.maxWidth, n.minHeight, n.maxHeight, n.clipsContent, n.opacity, n.primaryAxisAlignItems, n.counterAxisAlignItems].join(',') + '|' + (n.textStyleId || '') + '|' + JSON.stringify(n.componentPropertyReferences || {}) + (n.type === 'TEXT' ? '|' + n.characters : '') +
          (n.type === 'INSTANCE' ? '|' + JSON.stringify(Object.entries(n.componentProperties || {}).map(([k, p]) => [k.split('#')[0], p.value]).sort()) + '|' + n.isExposedInstance : ''));
        if ('children' in n && n.type !== 'INSTANCE') n.children.forEach((ch, i) => walk(ch, path + '/' + i + ':' + ch.name));
      };
      walk(c, c.name);
    }
  }
  parts.sort();
  const s = parts.join('\n'); let h1 = 0x811c9dc5, h2 = 0x1b873593;
  for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0; h2 = Math.imul(h2 ^ ch, 0x5bd1e995) >>> 0; }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + '-' + parts.length;
}
