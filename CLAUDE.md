# dsgn.systems — working rules

Code-first design system mirrored into the Figma library **DSGN-NEW** (fileKey `NsEDago50AMdafJkdni3K6`).
Code, Figma, documentation and handoff must never drift apart.

## Every change is synced everywhere (non-negotiable)

A change in code **or** in Figma is not done until every item below is true. Do not report a task as
finished, and do not push, before this list passes. If a step cannot be done, say so explicitly.

1. **Code** — component CSS (header comment shows the current markup), `src/js/dsgn.js`, tokens in
   `src/tokens.config.mjs`. Deprecated classes stay styled until the next major and are marked deprecated.
2. **Figma** — the component, its variants, properties (linked in *every* variant), nested instances
   (exposed where the designer needs to switch them), page documentation texts and the component
   description above the `— Code —` marker. Check instances on all pages (Templates included) keep their overrides.
3. **Docs** — `src/docs/examples.mjs` (examples, notes, `figma: [...]` list), the skill
   `skills/dsgn-systems/SKILL.md` (component reference and the Figma → code table), `README.md`,
   `figma/README.md` when the workflow changes.
4. **Handoff map** — `src/docs/figma-map.mjs`: every Figma variant value and boolean mapped to code.
5. **Preview** — `build/preview.mjs` shows every class (the build fails otherwise); republish the
   "dsgn tokens" artifact (https://claude.ai/artifact/WSv2wxrzLBYBcWULwM2FgZ) from `dist/preview.html`.
6. **CHANGELOG.md** — Added / Changed / Fixed in the unreleased version; migration notes for anything removed.
7. **Figma runs** — after `npm run build`, run in Figma (use_figma), in this order, and save each
   result verbatim as `figma/<name>-report.json`:
   `dist/figma-sync.js` (only if tokens changed) → `dist/figma-parity.js` → `dist/figma-handoff.js` → `dist/figma-lint.js`.
   Run the generated files exactly; never a hand-picked subset, never a hand-written report.
8. **Build + tests** — `npm run build` must print `sync: … ✓` (it fails when a report is missing, not ok,
   built from older code, or the three reports ran on different Figma states — so any later edit in
   Figma means running all three again). Then `CHROMIUM=/opt/pw-browsers/chromium npm test`.
9. **Sweep for leftovers** — grep code, docs, built `dist/docs.html`, Figma descriptions and page texts
   for the old names of anything renamed or removed.
10. **Commit and push**, then tell the user what changed in each place (code, Figma, docs, handoff).

## Facts worth knowing

- Lint forbids px other than 0/1/2 and literal colours in component CSS. Private custom properties are
  `--_*`; give a component's own ones a component-specific prefix when they could collide with what a
  parent passes down (see `--_ic-*` in `icon.css` — Alert and Banner pass `--_text` to their icons).
- Figma: a text style overrides a bound font size (icons need per-size text styles); cloning a variant
  turns slots into frames and drops property links; bound fill opacity is ignored in instances (use an
  alpha variable); descriptions are written with `descriptionMarkdown`.
- Tests: `CHROMIUM=/opt/pw-browsers/chromium npm test` (~10 min: build, theme, grid, a11y).
- Commits end with the Co-Authored-By / Claude-Session lines given by the session.
