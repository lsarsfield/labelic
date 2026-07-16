# Labelic — project context for Claude

Designer for vintage woven garment labels. A woven label is a bitmap made of threads:
the design rasterizes onto the loom's grid (warp ends across, weft picks down) and each
cell is woven in exactly one weft thread from the doc palette. Chunky stair-stepped
type IS the aesthetic. Sibling of Buttonic (same chassis: state/undo, workspace, fonts,
Shape IR, export spine); cartesian where Buttonic is radial, cloth where it is metal.

- **Repo:** local only so far (`~/Claude/Projects/Labelic`); GitHub repo + Pages deploy
  pending Liam's approval. Buttonic precedent: `lsarsfield/<name>`, CI gates deploy on
  typecheck + tests, base `./`.
- **Stack:** React 19 + TS strict + Vite 6 + vitest 3 (Node 18.20.8 locally — do NOT
  bump vite to 7). Runtime deps deliberately minimal (zustand+zundo+immer, opentype.js,
  svg-pathdata). polygon-clipping was dropped in the carve — weave overlap is per-cell
  claim priority, artwork overlap is paint order. Justify any addition.

## Commands

`npm run dev` (preview via .claude/launch.json "dev", port 5173) · `npm test` ·
`npm run typecheck` · `npm run build`. Dev builds expose `window.__labelic`
(useLabel/useViewport stores, undo/redo, exportArtworkSvg/exportWovenPng/exportDraftPng,
extractEmbeddedProject, parseDoc, loadProjectFile, workspace, presets, templates, and
`debug: { sampleDoc, gridChecksum, weaveTimings }`) for scripted browser verification.

## Architecture map

- `src/model/` — doc schema (`types.ts`, DOC_VERSION **1**): `LabelDoc { widthMM,
  heightMM, fold, weave: WeaveSpec, layers[] }`; four layer types (`textLine`, `motif`,
  `border`, `repeatRow`), every layer carries `weftIndex` — index into `weave.wefts`,
  or `GROUND_WEFT_INDEX (-1)` = woven in the warp = knockout (reversed-out labels).
  `loom.ts` is the single source of truth: `LOOM_TABLE[loom][ground]` (densities,
  maxWefts, jitter/fuzz/sheen, default edge) + `THREAD_CANON`. `migrate.ts` (empty
  table — copy Buttonic's defaults-spread-FIRST convention when v2 lands),
  hand-rolled `validate.ts` (REQUIRED tables; `weftIndex` is CLAMPED not rejected so
  palette edits never brick a file), `presets.ts` (blank + 5 era templates; literals
  carry EVERY field, fixed layer ids, golden-snapshotted).
- `src/geometry/` — the pure cartesian kernel (NO DOM/React/IO; node-tested):
  - `shapes.ts` Shape IR — byte-identical to Buttonic's (`circle|line|path|instanced`);
    `circle` is simply unused here. Exact-first: glyphs/motifs stay true beziers under
    affine; polylines only for warped (bent-arch) output.
  - `compile.ts` WeakMap-memoized per-layer dispatch; `CompileCtx` carries label dims
    AND grid densities (legibility warnings recompute when density changes).
  - `textLine.ts` — straight or arched baselines. Arch: circle radius
    `R = W²/(8|s|) + |s|/2` (chord W = laid-out width, sagitta s = `archMM`), ARC
    LENGTH preserved along the baseline. `'arc'` mode = upright glyphs rotated tangent
    (exact beziers, the classic look); `'warp'` mode = outlines genuinely bent via
    `archWarp` + the generic flatten-then-warp machinery in `warp.ts` (never warp
    bezier control points — the map is not affine). Legibility warning when a
    ~0.09 em stem spans < 1.6 threads: phrased softly, chunky is the point.
  - `border.ts` — rules are rect paths; patterned sides emit ONE instanced shape per
    side (`n = round(len/unit)`, pitch = len/n → symmetric margins by construction;
    unit motifs live in `BORDER_UNITS`, one pitch wide, +y pointing INTO the label on
    the clockwise walk). `repeatRow.ts` — one instanced shape, count 1 = centred.
  - `folds.ts` — fold lines + `visiblePanelMM` (endFold trims 3 mm allowances,
    loopFold shows the top half, centreFold the right half, mitre full face).
  - Carried verbatim from Buttonic: `glyphs.ts`, `mat2d.ts`, `flatten.ts`,
    `pathData.ts`, `format.ts` (`fmt` everything), `svgAsset.ts`, `expand.ts`,
    `motifs/builtins.ts` (~142 motifs incl. the new `Label` group — geometric-first;
    an 8 mm motif at 2.8 picks/mm is 22 cells tall, figurative reads as mush).
- `src/weave/` — the weave simulation:
  - `grid.ts` (pure, node-tested) — `WeaveGrid { cols, rows, cellWMM, cellHMM,
    data: Uint8Array }` (0 = ground, k = weft k−1); `boxAverageAlpha` (uniform-scale
    raster → exact per-cell coverage in one O(raster) pass); `claimFromCoverage`
    (≥ 0.5, later layers overwrite, 0-claims knock out); `hash2` deterministic jitter
    (NEVER Math.random — threads must not shimmer across renders); `gridChecksum`
    (FNV-1a, the scripted-verification fingerprint).
  - `sample.ts` — rasterize each layer ALONE at a UNIFORM supersample scale
    (`min(20, 2·max density)` px/mm; a non-uniform cell-resolution transform would
    distort canvas stroke widths — the pen transforms with the CTM), read alpha,
    box-average, claim. Per-layer coverage cache on layer identity (immer keeps
    untouched layers stable), key mirrors the compile memo.
  - `paint.ts` — weft floats render as RUNS: a horizontal stretch of same-thread
    cells is one continuous capsule (round ends only at turn-unders), warp dimples
    across it, per-run wobble from `hash2`, lit-edge gradient from the light azimuth,
    sheen stripe + fuzz halo per `LOOM_TABLE` profile. Ground = 2×2-cell
    `createPattern` tile (`threadSprites.ts`: taffeta checker / satin floats /
    damask twill). Selvedge turn-backs vs hot/ultrasonic cut sides; shuttle fray
    ticks vs needle cut lines on the ends. `paintFoldedWeave` renders the flat weave
    offscreen and composites the visible panel with drop shadow + fold-roll
    gradients + mitre crease triangles.
  - Measured budget: 50×22 shuttle ≈ 7.4k cells ≈ 13 ms sample + 3 ms paint;
    72×40 needle damask ≈ 161k cells ≈ 82 + 7 ms. No worker needed; if a device
    ever disproves this, Buttonic's keepoutAsync stale-while-recomputing pattern is
    the escape hatch.
- `src/render/` — `SvgStage` (mm-true svg; `#doc` = export subtree; in woven mode the
  backdrop unmounts and `#doc` fades to opacity 0 but STAYS MOUNTED — hit rects keep
  selection working over the canvas and the font/asset load kicks keep running),
  `WeaveStage` (canvas UNDER the svg, rAF-coalesced on-change, no frame loop),
  `DocRenderer` (per-layer memo on layer ref + hex + ctx fields; `layerBoundsMM` is
  the cartesian hit/selection geometry), overlays (`Guides` — outline, safe area,
  fold lines, auto-hidden in the folded presentation; `Handles` — position grips +
  border inset grip, every drag one undo step via beginGesture/endGesture).
- `src/io/` — fonts/localFonts/ttc/svgImport/svgAssets/workspace/idb carried from
  Buttonic (DB `labelic`, pointer `labelic:current`, no legacy migration);
  `exportSvg.ts` = mm-true ARTWORK export: per-layer `<g data-thread="Gold #C9A24B">`
  filled in the layer's weft hex (the capped palette IS the mill deliverable),
  optional ground rect + fold-guide group, `<metadata id="labelic-project">` embeds
  the project so exports re-open (`extractEmbeddedProject`); warnings for sub-pick
  strokes, off-label geometry, palette over loom cap, cell budget (>350k).
  `exportWovenPng.ts` (the exact on-screen paint path at 1024/2048/4096, flat or
  folded), `exportDraftPng.ts` (the grid, 1 px/cell ×4 nearest-neighbour),
  `project.ts` (`.label.json`), `thumbnail.ts` (real-color artwork thumbs).
- `src/ui/` — DocPanel (size presets, loom/ground/edge/density with reset-to-profile,
  PaletteEditor with the thread canon + custom, add capped at `maxWeftsFor`,
  `removeWeft` remaps every layer's weftIndex in ONE undo step), per-type panels with
  a ThreadRow strip on top (one click = one thread; the ground chip is the knockout),
  LabelSwitcher workspace popover, ExportDialog with live `useMemo` warnings.

## Invariants

1. mm units everywhere; (0,0) = label centre, y-down. Cells are NOT square
   (`endsPerMM` ≠ `picksPerMM`) — never assume square anywhere in weave/.
2. Every emitted number goes through `fmt` (deterministic goldens, small files).
3. **Golden snapshots** (`src/model/__snapshots__/`) are the acceptance contract for
   the five era presets. NEVER `vitest -u`. A golden diff = your change altered
   existing documents' output = wrong. New schema fields default to old behaviour.
   The one warning class presets may carry is the informational legibility warning.
4. Artwork SVG contains plain palette-hex fills/strokes — no filters, masks, CSS.
   Overdraw is fine (mills read flat color art); the weave resolves overlap by claim
   priority instead.
5. Weave determinism: all jitter through `hash2(col, row, seed)`; no Math.random in
   src/weave or src/geometry. Sprite/tile caches quantize their keys so light-slider
   scrubs stay cache-friendly.
6. `weftIndex` semantics: −1 = ground knockout; validator CLAMPS out-of-range values;
   `removeWeft` remaps (> index decrements, === index → 0, −1 untouched).

## Testing & verification culture

140 vitest tests: kernel analytics (arch radius/warp map against closed forms, border
pitch fitting, row spreading, fold panels), grid math (box-average on synthetic
rasters, claim/knockout semantics, hash determinism), golden preset snapshots,
serialize/clamp round-trips, workspace anti-corruption regressions, bundled-font +
motif unit-box smoke tests. The canvas painter is deliberately NOT node-tested (jsdom
has no canvas; a canvas dep would violate minimal-deps) — its gate is the scripted
browser pass: `window.__labelic.debug.gridChecksum` + `weaveTimings` per preset.
After code changes: typecheck + full suite, then ONE browser acceptance pass via the
preview tools + `window.__labelic`, then push (CI re-gates).

## Known limits / backlog

- opentype.js: no WOFF2/CFF2; GPOS kerning partial (Cinzel kerns; EB Garamond's pairs
  unreadable — letter-spacing is the escape hatch). Local fonts Chromium-only;
  exports always bake outlines.
- Pinyon script hairlines fragment at shuttle densities — authentic, but consider a
  heavier script face if Liam wants smoother 1950s presets.
- Border corners butt at insets ('auto' margins); corner ornaments are post-v1.
- Presentation backlog (explicitly deferred from v1): sewn-on-garment backdrop scene,
  stitches, aging/wear slider. Multi-tab workspace = last-write-wins.
- The `½` glyph was dropped from the denim preset pending a font-coverage check
  ('SIZE 16'); restore as 'SIZE 16½' if robotoslab carries U+00BD.

## Working with Liam

Design-literate founder (liet.co / fluorescent.co). Communicates via reference
imagery — recreating the reference IS the acceptance test. Prefers a clear
recommendation over option menus. Session pattern: plan in plan-mode first, lean
execution, one browser acceptance pass, ship. Public repo visibility, commits, and
domain changes were each explicitly user-approved on Buttonic — keep confirming
outward-facing actions of new kinds. Verify panel-UI changes at the REAL inspector
width (~272 px, fixed); stack 4-option segmented controls.
