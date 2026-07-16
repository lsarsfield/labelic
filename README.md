# Labelic

A browser tool for designing **vintage woven garment labels** — the fabric brand tags sewn
into clothing. Its premise: a woven label is a bitmap made of threads. The design is
rasterized onto the loom's grid and every cell is woven in exactly one weft thread, so
chunky stair-stepped type and quantized motifs aren't a limitation — they're the look.

Sibling app to [Buttonic](https://buttonic.app) (engraved jean buttons); same chassis,
opposite fabric.

## What it does

- **Two looms.** Shuttle (the vintage kind: coarse grids ~24–40 threads/cm, woven
  selvedge side edges, soft cotton/rayon character, at most 3 weft colors, visible
  thread wobble) and needle (modern: fine grids up to 100 picks/cm, hot-knife or
  ultrasonic cut edges, polyester sheen, up to 8 wefts, machine uniformity).
- **Three grounds.** Taffeta (matte plain-weave checker), satin (shiny warp floats),
  damask (fine dense twill).
- **Cartesian design layers**, each woven in ONE thread from the label's palette:
  text lines (straight or arched baselines, real font outlines via opentype.js),
  motifs (140+ built-ins including a label-canon group: union bug, spool, needle,
  care symbols…), border patterns (keyline, running stitch, zigzag, scallop, greek
  key, chain…), and repeat rows. A layer can also weave in the *ground* thread —
  the knockout that makes classic reversed-out labels.
- **Thread-true woven preview.** Weft floats render as continuous runs with turn-under
  ends, warp dimples, per-loom jitter/fuzz/sheen, selvedge turn-backs or melt-cut
  edges, and a light-angle control. Folds (end, loop, centre, mitre) present as
  actually folded cloth.
- **Exports.** mm-true artwork SVG with the capped thread palette (what a label mill
  weaves from; the project JSON is embedded so exports re-open as documents), woven
  PNG mockups at 1024/2048/4096 px (flat or folded), a weave-draft PNG (the grid,
  one pixel per thread crossing), and portable `.label.json` projects.
- **Five era templates.** 1940s workwear, 1950s dressmaker, 1960s union, 1970s denim,
  modern streetwear — each a golden-snapshot acceptance test.

## Running

```sh
npm install
npm run dev        # vite, port 5173
npm test           # vitest (140 tests)
npm run typecheck
npm run build
```

Local fonts use the Local Font Access API (Chromium). Projects live in a local
IndexedDB workspace with autosave; exported SVGs re-open as editable documents.

## Architecture (one paragraph)

`LabelDoc` (zustand + zundo + immer, gesture-scoped undo) → pure per-layer compilers
(`src/geometry/`) → a tiny Shape IR → three consumers: the SVG stage (flat artwork
proofing), the mm-true SVG exporter, and the weave sampler (`src/weave/`), which
rasterizes each layer at a uniform supersample, box-averages into the non-square
thread grid, claims cells in paint order, and hands the `WeaveGrid` to a run-based
Canvas2D thread painter. Loom character lives in one parameter table
(`src/model/loom.ts`). See `CLAUDE.md` for the full map and invariants.
