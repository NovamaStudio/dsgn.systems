// dsgn lint — one set of rules for the design system's own components and for project CSS.
//
//   lintCss(source, file, { defined, hooks, mode })
//     defined  Set of every --dsgn-* token the tokens file defines
//     hooks    Set of documented override hooks that may be used without being defined
//     mode     'system'  components of the design system itself
//              'project' CSS written in a project that uses dsgn
// Returns [{ file, line, rule, message }].
//
// Rules
//   unit        --dsgn-unit is never used directly (grid snapping would be bypassed)
//   token       every var(--dsgn-*) must exist
//   px          no hard-coded px except 0, 1 and 2 (hairlines, forced-colors outlines)
//   color       no literal colours (hex, rgb, hsl, oklch, named) — use a colour token;
//               system colours (Canvas, CanvasText, Highlight …) are fine inside forced-colors
//   private     project mode only: dsgn's internal --_* properties are not an API
//   override    project mode only: redefining a --dsgn-* colour token bypasses the contrast check (warning)

const NAMED = /(?<![\w-])(white|black|red|green|blue|gray|grey|silver|orange|yellow|purple|pink|navy|teal)(?![\w-])/;
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)\(/;

export function lintCss(source, file, { defined, hooks = new Set(), mode = 'system' } = {}) {
  const issues = [];
  // blank out comments but keep line numbers
  const code = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const lines = code.split('\n');
  let forcedDepth = -1, depth = 0;
  lines.forEach((text, i) => {
    const line = i + 1;
    const add = (rule, message, level = 'error') => issues.push({ file, line, rule, level, message });
    if (/@media[^{]*forced-colors\s*:\s*active/.test(text)) forcedDepth = depth;
    if (text.includes('--dsgn-unit') && !/^\s*--dsgn-unit\s*:/.test(text)) add('unit', 'uses --dsgn-unit directly; use a dimension token so grid snapping applies');
    for (const [, name] of text.matchAll(/var\((--dsgn-[\w-]+)/g))
      if (defined && !defined.has(name) && !hooks.has(name)) add('token', `unknown token ${name}`);
    for (const [, n] of text.matchAll(/(?<![\w.#-])(\d+(?:\.\d+)?)px/g))
      if (!['0', '1', '2'].includes(n)) add('px', `hard-coded ${n}px; use a space, density or radius token`);
    const inForced = forcedDepth >= 0;
    if (!inForced && !/^\s*--/.test(text) && (LITERAL.test(text) || (/:\s*[^;]*$|:\s*[^;]*;/.test(text) && NAMED.test(text.split(':').slice(1).join(':')))))
      add('color', 'literal colour; use a colour token (var(--dsgn-…))');
    if (mode === 'project') {
      if (/var\(--_/.test(text)) add('private', "uses dsgn's internal --_* properties; they can change without notice");
      for (const m of text.matchAll(/(?<![\w(-])(--dsgn-[\w-]+)\s*:/g))
        if (/(surface|text|border|focus|solid|subtle|accent|neutral|danger|success|warning|scrim)/.test(m[1]))
          add('override', `redefines ${m[1]}; this bypasses the contrast check — prefer a project theme`, 'warning');
    }
    depth += (text.match(/{/g) || []).length - (text.match(/}/g) || []).length;
    if (forcedDepth >= 0 && depth <= forcedDepth) forcedDepth = -1;
  });
  return issues;
}

export const tokensDefinedIn = (tokensCss) => new Set([...tokensCss.matchAll(/(--dsgn-[\w-]+)\s*:/g)].map((m) => m[1]));
export const HOOKS = new Set(['--dsgn-icon-size', '--dsgn-header-height']);
