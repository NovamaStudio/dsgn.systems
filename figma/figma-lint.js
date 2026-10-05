// dsgn Figma lint — the Figma twin of the CSS lint in build/build.mjs. Read-only.
// Walks every component (and variant) on every page and reports values that are not bound
// to a variable or style: fills, strokes, stroke weights, corner radii, padding, gaps,
// text without a text style, effects with raw colours, and frames or slots that clip content
// without a reason (clipping cuts off shadows and focus rings of nested components). Instances inside a component are
// checked only on their own overrides (their internals belong to their own component).
// Run via the Figma MCP (use_figma) or a scratch plugin; returns { ok, checked, issues[] }.
const PAGES_SKIP = ['Templates'];               // pages made of instances only
const issues = []; let checked = 0;
const add = (comp, node, problem, value) => issues.push({ component: comp, node: node.name, problem, value: value === undefined ? undefined : String(value) });
const bound = (n, k) => n.boundVariables && n.boundVariables[k];
function checkPaints(comp, n, key) {
  const paints = n[key]; if (!Array.isArray(paints)) return;
  paints.forEach((p, i) => {
    if (p.visible === false || p.type !== 'SOLID') return;
    const b = p.boundVariables && p.boundVariables.color;
    if (!b && !(key === 'fills' ? n.fillStyleId : n.strokeStyleId)) add(comp, n, key === 'fills' ? 'fill not bound' : 'stroke not bound', '#' + ['r', 'g', 'b'].map((c) => Math.round(p.color[c] * 255).toString(16).padStart(2, '0')).join(''));
  });
}
const visFill = (c) => Array.isArray(c.fills) && c.fills.some((f) => f.visible !== false && (f.opacity ?? 1) > 0);
// Clip content is allowed only where it is needed: the frame's own shadow uses spread (Figma
// renders spread on frames only with clipping on), or a filled child / image reaches a rounded
// edge (media, avatar image, progress fill, checkbox box), or a child overflows on purpose.
function clipNeeded(n) {
  if ((n.effects || []).some((e) => e.visible !== false && e.type === 'DROP_SHADOW' && e.spread)) return true;
  if (n.type === 'SLOT' || !('children' in n)) return false;
  const b = n.absoluteBoundingBox; if (!b) return true;
  const r = typeof n.cornerRadius === 'number' ? n.cornerRadius : Math.max(n.topLeftRadius || 0, n.topRightRadius || 0, n.bottomLeftRadius || 0, n.bottomRightRadius || 0);
  for (const c of n.children) {
    const cb = c.visible && c.absoluteBoundingBox; if (!cb) continue;
    if (cb.x < b.x - .5 || cb.y < b.y - .5 || cb.x + cb.width > b.x + b.width + .5 || cb.y + cb.height > b.y + b.height + .5) return true;
    const edge = cb.x <= b.x + .5 || cb.y <= b.y + .5 || cb.x + cb.width >= b.x + b.width - .5 || cb.y + cb.height >= b.y + b.height - .5;
    if (r > 0 && edge && visFill(c)) return true;
  }
  return false;
}
function checkNode(comp, n, isInstanceRoot) {
  checkPaints(comp, n, 'fills');
  checkPaints(comp, n, 'strokes');
  if (Array.isArray(n.strokes) && n.strokes.some((s) => s.visible !== false)) {
    for (const k of ['strokeTopWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'strokeRightWeight'])
      if (k in n && n[k] > 0 && !bound(n, k) && !bound(n, 'strokeWeight')) { add(comp, n, 'stroke weight not bound', n[k]); break; }
  }
  if ('topLeftRadius' in n && !isInstanceRoot)
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'])
      if (n[k] > 0 && !bound(n, k)) { add(comp, n, 'corner radius not bound', n[k]); break; }
  if (n.layoutMode && n.layoutMode !== 'NONE' && !isInstanceRoot) {
    for (const k of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'itemSpacing'])
      if (n[k] > 0 && !bound(n, k) && !(k === 'itemSpacing' && n.primaryAxisAlignItems === 'SPACE_BETWEEN')) { add(comp, n, k + ' not bound', n[k]); }
    if (n.layoutMode === 'GRID') for (const k of ['gridRowGap', 'gridColumnGap']) if (n[k] > 0 && !bound(n, k)) add(comp, n, k + ' not bound', n[k]);
  }
  if (!isInstanceRoot && n.clipsContent && !clipNeeded(n)) add(comp, n, 'clip content without a reason (cuts shadows)');
  if (n.type === 'TEXT') {
    if (!n.textStyleId && !bound(n, 'fontSize')) add(comp, n, 'text without style or bound size', n.fontSize);
  }
  if (Array.isArray(n.effects) && !n.effectStyleId)
    n.effects.forEach((e) => { if (e.visible !== false && (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && !(e.boundVariables && e.boundVariables.color)) add(comp, n, 'effect colour not bound'); });
}
function walk(comp, n, depth) {
  checked++;
  const isInstance = n.type === 'INSTANCE' && depth > 0;
  checkNode(comp, n, isInstance);
  if (isInstance) return;                      // internals belong to the instance's own component
  if ('children' in n) for (const c of n.children) walk(comp, c, depth + 1);
}
for (const page of figma.root.children) {
  if (PAGES_SKIP.includes(page.name)) continue;
  await page.loadAsync();
  const comps = page.findAll((n) => n.type === 'COMPONENT');
  for (const c of comps) {
    const name = c.parent && c.parent.type === 'COMPONENT_SET' ? c.parent.name + ' / ' + c.name : c.name;
    walk(page.name + ' › ' + name, c, 0);
  }
}
// group identical problems per component set so the list stays readable
const grouped = {};
for (const i of issues) { const set = i.component.split(' / ')[0]; const key = set + '|' + i.node + '|' + i.problem + '|' + (i.value || ''); grouped[key] = grouped[key] || { set, node: i.node, problem: i.problem, value: i.value, variants: 0 }; grouped[key].variants++; }
return { ok: issues.length === 0, checked, issueCount: issues.length, issues: Object.values(grouped) };
