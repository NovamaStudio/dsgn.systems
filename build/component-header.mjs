// Reads the header comment of a component CSS file (src/components/*.css): the usage prose, the
// attribute lines ("data-variant  solid | subtle …") and the markup examples. Shared by build/docs.mjs
// and the website (site/), so both show the same API.
export function parseHeader(src) {
  const m = src.match(/^\/\*([\s\S]*?)\*\//); if (!m) return { prose: [], api: [], code: [] };
  const lines = m[1].split('\n').map((l) => l.replace(/^\s*\* ?/, '')).slice(1);
  const prose = [], api = [], code = []; let para = [], block = [];
  const flushP = () => { if (para.length) prose.push(para.join(' ')); para = []; };
  const flushC = () => { if (block.length) code.push(block.join('\n')); block = []; };
  for (const raw of lines) {
    const l = raw.replace(/\s+$/, '');
    const apiLine = l.match(/^((?:data|aria)-[\w-]+|disabled[^ ]*|role="?\w+"?)\s{2,}(.+)$/);
    const bareApi = !apiLine && l.match(/^((?:disabled|(?:data|aria)-[\w-]+)(?:[ =/"\w-]*)?)$/);
    if (/^\s{8,}\S/.test(l) && api.length && !block.length) { api[api.length - 1][1] += ' ' + l.trim(); continue; }
    if (/^\s*</.test(l) || /^\s{2,}\S/.test(l) && block.length || /^dsgn\.\w+\(/.test(l)) { flushP(); block.push(l); continue; }
    flushC();
    if (apiLine) { flushP(); api.push([apiLine[1], apiLine[2]]); continue; }
    if (bareApi) { flushP(); api.push([bareApi[1].trim(), '']); continue; }
    if (!l.trim()) { flushP(); continue; }
    para.push(l.trim());
  }
  flushP(); flushC();
  return { prose, api, code };
}
