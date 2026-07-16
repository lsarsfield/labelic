# Labelic — vintage-label research & roadmap

Research-informed proposal for what to add to Labelic, from a study of vintage denim/workwear/heritage woven labels. Structured so each recommendation is tied to the evidence for it.

## Sourcing note

Multi-source, cross-checked: **Levi's, Lee, Wrangler, Carhartt, Dickies, OshKosh, Ben Davis, Pointer, Stronghold, Round House, Big Smith, Big Mac (JC Penney), Hercules (Sears), and the ILGWU/ACWA union-bug + RN/WPL dating systems.** Confirmed via a follow-up lean pass (§9): **Stevenson Overall, RRL/Double RL, Brut (Paris), Burberry, Pendleton, US MIL-SPEC contract labels.** Lightly-sourced only (single blog/listing): **Barbour, Champion.** The one heavy deep-research run tripped the account spend limit on its verify phase, so the priority-brand *claims* are cited-from-source but weren't adversarially re-checked — treat exact figures (a specific year, a pixel-level color) as "reliable but confirm before locking into shipped art."

---

## 1. The biggest idea — an **Era system** (research → behavior, not just assets)

Every dating guide converges on the same thing: a vintage label is *datable* because its palette, copy, fonts, motifs, **and constraints** are locked to a decade. That's a feature. Add an **Era** control (a doc-level field) that seeds correct defaults **and flags anachronisms**:

Hard date rules the research established (these become "period check" warnings):
- **Care/wash instructions → only 1971+** (US FTC Care Labeling Rule). A care line on a "1940s" label is wrong.
- **® symbol → only 1947+** (Lanham Act). **RN number → only 1959+** (WPL number is the 1941–1959 predecessor); **5-digit RN ≈ 1960s–70s, 6-digit ≈ 1980s+**.
- **"Sanforized" → only ~1930+** (Cluett pre-shrink trademark).
- **Union bugs by decade**: ACWA *diamond + sewing-machine + scissors* = 1934–1949 → *sewing-machine only* 1949+ → *red numerals* earlier / *black numerals* 1960s–70s. ILGWU *scalloped needle-and-thread crest*; "AFL-CIO" wording only 1955+; ® only 1964+; **red-white-blue + "Made in U.S.A." only 1974+** (the single cleanest ILGWU marker).
- **Levi's Big-E → small-e in 1971**; **Burberrys-with-an-s → "Burberry" ~1998**.

Ship ~5 eras (**1910s–20s, 1930s–40s, 1950s–60s, 1970s, 1980s**); each sets palette + fonts + which copy snippets are offered, and raises a soft warning when the label contains something impossible for its era. This is where the research pays off as *product behavior*.

---

## 2. **Layout templates** — the parametric archetype system (the core ask)

A layout template = a function that emits a `LabelDoc` skeleton with slot layers + sensible defaults, exactly like the era presets but **parameterized** and surfaced in a "Layouts" gallery in New. The recurring vintage skeletons, each with its slots and the parameters that vary:

1. **Arched banner** — wordmark arched across the top over a central emblem, straight sub-line below. *(Round House, Pointer, Ben Davis "World's Toughest", most denim brands.)* Params: arch amount, emblem on/off, #sub-lines.
2. **Stacked-utility** — 2–5 centered lines of decreasing weight inside a frame: brand / model / SANFORIZED / size / UNION MADE. *(Lee "Lee Riders / Sanforized / Waist X / Union Made", Big Smith, Big Mac, OshKosh rectangular.)* Params: line count, which spec lines, border style.
3. **Emblem-flanked** — central wordmark with symmetric motifs each side. *(Levi's two-horse, dressmaker laurels, denim wheat.)* Params: flanking motif, gap, mirror.
4. **Corner-slogan + central emblem** — slogan split top-left / top-right, emblem centered, wordmark across the bottom. *(Ben Davis "UNION MADE / PLENTY TOUGH" + ape + BEN DAVIS; Carhartt car-heart with "Master Cloth"/"Union Made" top & bottom.)* Params: TL/TR text, emblem, bottom wordmark.
5. **Crest / rope-oval medallion** — oval, round, or rope-bordered badge; ring text around a central emblem; location + trust-word sub-lines. *(Dickies oval "FORT WORTH / Guaranteed", Pendleton crest, union bugs.)* Params: badge shape (oval/round/rope), ring text, center emblem. **Implies ring/curved text on a closed path — a capability we half-have via arch; see §7.**
6. **Cartouche / ribbon** — wordmark inside a scrolled banner or filled oval. *(Uses the block/cartouche motifs already added.)*
7. **Flag-tag / patriotic** — red-white-blue field, stars, "MADE IN U.S.A." *(1970s ILGWU era, RRL flag tags.)*
8. **Military spec block** — left-aligned monospace/stencil field stack: NOMENCLATURE / SIZE / CONTRACT NO. / STOCK NO. / DATE / CONTRACTOR / fiber / care, on olive or white. *(US MIL-SPEC.)* Params: which fields, auto contract-number.
9. **Size tab** — tiny two-panel: brand over size. *(Waistband tabs.)*
10. **Ribbon/folded tab** (red-Tab form) — one word on a narrow folded projecting tab. *(Levi's red Tab, Stronghold bib tab.)* This is a **format**, not just a layout — see §7.
11. **Multi-label stack** — several stacked woven labels per garment (brand + union + care + size). *(RRL, Stevenson, virtually all workwear.)* A **doc-level** capability — see §7. **Key insight from RRL/Stevenson (§9): the tags are deliberately MISMATCHED** — different grounds, fonts, and shapes, each aping a different vintage source — and that non-matching *is* the authenticity signal. So the stack feature should make it easy to give each label its own palette/font/shape, not inherit one house style.
12. **Boxed-warranty** — centered script wordmark inside a ruled box, a small-caps warranty line above ("WARRANTED TO BE A"), and a mill/TM notice below. *(Pendleton "Warranted to be a Pendleton", gold-on-navy.)* Params: box rule style, script face, warranty + TM lines.
13. **Lot-code line** — a place-name or model + 3-digit lot number treated as a design element. *(Stevenson "VENTURA 737 / BIG SUR 210"; RRL "LOT No.")* A small but very characteristic slot; pairs with any of the above.

---

## 3. Motif library additions

Draw geometric-first (the weave grid is destructive — figurative detail mushes at ~3 cells/mm). Brand-authentic emblems worth adding as generic-ized motifs:

- **Two-horse pull** (Levi's idiom), **train-in-heart rebus** (Carhartt idiom), **blue bell** + **lasso "W"** (Wrangler)
- **Pointer/bird dog on point**, **railroad roundhouse building** (Round House), **hickory/railroad stripe** motif
- **Mascot bust, arms folded** (Ben Davis ape idiom → generic), **branding-iron rope oval** (Lee/Dickies frame)
- **Heraldic knight-on-horse** (Burberry Prorsum idiom), **crest / umbrella** (Pendleton idiom), **running man** (Champion idiom)
- **Eagle variants** (spread eagle, NRA-style eagle-with-bolts), more **banner/ribbon scrolls**, **stars**
- **Union bug variants**: ACWA diamond-+-sewing-machine, ILGWU scalloped needle-and-thread crest (we have a generic `unionbug` — add these two period-correct forms)
- **MIL-SPEC set**: stencil letter/number glyphs, contract/inspector stamp rings

(We already shipped a Label group: block/banner/cartouche/unionbug/spool/needle/buttonhole/shuttle + care symbols.)

---

## 4. Fonts (the bundle is thin on era-critical faces)

Have: Oswald, Bebas (condensed), Allerta Stencil, UnifrakturCook (blackletter), Pinyon (script), Rye (western), Roboto Slab, EB Garamond, Playfair, Cinzel, Jost, Roboto. Add (all OFL):
- **Heavy western slab / French Clarendon** — Rye is too light for real workwear headlines (P1).
- **Heavy compressed grotesque** — a chunkier condensed than Oswald for brand shouts (P1).
- **Typewriter / monospace** — required for MIL-SPEC spec blocks and lot/RN lines (P1).
- Nice-to-have: a second stencil (military), a rope/branding-iron script, a copperplate-gothic small-caps for spec lines.

---

## 5. Named thread-palette presets

One-click historical combos (drop-in on the PaletteEditor). Each is real:
- **Red Tab** — white on red (Levi's) · **Union black tag** — white on black (Lee, Big Smith)
- **Blue Bell** — navy + red on cream (Wrangler) · **Master Cloth** — red + cream (Carhartt)
- **Dickies oval** — rustic red on sunflower-yellow over black · **Vestbak** — green + red on natural (OshKosh)
- **Ben Davis** — cream on red / black on silver · **Pointer/Round House** — red (+liver) on natural
- **Patriotic** — red/white/blue (1970s) · **MIL-SPEC** — black on olive drab / black on white
- **Pendleton** — gold/mustard on navy · **French workwear** (Brut/bleu de travail) — white + red on indigo/moleskin · **RRL sun-faded** — indigo/brick-red/black/gold on ecru or tea-stained ground

New ground colors to add to `THREAD_CANON`: **olive drab, natural/ecru, kraft/tan, indigo, tea-stained/sun-faded off-white** (all over workwear, military, French, and RRL-repro labels; currently missing).

---

## 6. Copy / boilerplate library

An era-filtered "Insert copy" menu on a text line:
- **Workwear claims**: UNION MADE · UNION MADE IN U.S.A. · SANFORIZED · EVERY GARMENT GUARANTEED · MASTER CLOTH · 8 HOUR WORK DAY · 100% COTTON · VAT DYED · SHRINK TO FIT
- **Origin/trust**: MADE IN U.S.A. · MADE IN ENGLAND · LONDON ENGLAND · WORLD'S TOUGHEST QUALITY WORK CLOTHING · PLENTY TOUGH · WARRANTED TO BE A PENDLETON · THE GENUINE ARTICLE · THE HEIGHT OF PERFECTION (Stevenson)
- **French workwear** (Brut idiom): BLEU DE TRAVAIL · GARANTI BON TEINT (colorfast) · TAILLE (size) · maker-name lines — a distinct European-workwear copy set
- **Codes**: LOT / STYLE / RN / WPL formats · SIZE (W×L, chest) · REG. NO.
- **MIL-SPEC**: nomenclature line · CONTRACT NO. `DLA###-##-C-####` (auto-generated, era-correct PIID) · STOCK NO. (NSN/FSN) · DATE · contractor · fiber % · care

---

## 7. New capabilities (format & construction — beyond the flat single label)

- **Printed-cotton vs jacquard-woven construction toggle** (doc-level). Pointer, Round House, Dickies-era labels are *printed on plain cotton* (fine, flat, crisp illustration); Ben Davis, Levi's tabs are *jacquard-woven* (coarse thread floats — our current renderer). This is a genuine second render mode: printed = finer grid, no float chunking, ground = plain cotton. High authenticity payoff (P1).
- **Ribbon / folded tab format** (Levi's red Tab, Stronghold bib tab) — a narrow tab with one word; we have fold machinery, this is a small extension (P2).
- **Multi-label stack** — a garment view with several stacked labels; the RRL/workwear reality (P2).
- **Merrow/overlock edge** — add to the selvedge/hot-cut/ultrasonic edge set for patch-style labels.
- **Ring/curved text on a closed path** — needed for the crest/medallion archetype (§2.5); extends the arch code from an open arc to a full circle.
- **Aging/wear** — already deferred; the research is full of faded/tonal examples, so it stays a strong P2.

---

## 8. Prioritized roadmap

**P0 — cheap, high-impact, mostly content (do first):**
- Named thread-palette presets + olive-drab / natural / tan ground colors (§5)
- Copy/boilerplate insert menu (§6)
- Layout-templates gallery: arched-banner, stacked-utility, emblem-flanked, corner-slogan, crest/oval, military-spec, size-tab (§2)
- Motif additions: geometric brand emblems + ACWA/ILGWU union-bug variants + stencil set (§3)

**P1:**
- Era system with anachronism warnings (§1)
- Fonts: heavy western slab, heavy condensed, typewriter (§4)
- Printed-cotton vs jacquard construction toggle (§7)
- Ring/curved text on a closed path (§7, unlocks crest archetype)

**P2:**
- Ribbon/folded tab format · Multi-label stack · Merrow edge · Aging/wear (§7)

---

## 9. Stevenson Overall / RRL / Brut — confirmed (follow-up lean pass)

- **Stevenson Overall Co.** — originally founded **1920 in Portland, Indiana** (folded ~1930 in the Depression); **revived 2005** by LA vintage dealer **Zip Stevenson** + Japanese designer **Atsu Tagaya**, now made in Japan from Japanese selvedge with pre-war construction. Slogan **"The Height of Perfection."** A romanticized turn-of-the-century US athletic-goods / registered-trademark aesthetic (the "Berkeley, California" origin is deliberate brand romance — garments are Japanese). **Lines are named California coastal towns + a 3-digit lot** (Ventura 737, Big Sur 210, Santa Rosa 767, Carmel 220…) printed on woven lot tabs — a strong, recreatable pattern. Zip specifically **reintroduced proper jacquard-woven labels** (the cheap 1920s originals used printed paper tags that washed away) plus private "doughnut" buttons and leather patches; garments **stack a main woven brand tag + a smaller woven lot/size tab.** Motifs = figurative pre-1930s trademark vignettes (athletic/heraldic line-art — cyclist, runner, heart family). → feeds **lot-code line**, **jacquard-vs-printed** construction, and **multi-label stack**.
- **RRL / Double RL** (Ralph Lauren, founded **1993**, named for the RRL cattle ranch) — the densest vintage-label pastiche in the market, spanning 1850s West → WWII. **Signature move: several deliberately MISMATCHED jacquard tags per garment**, each aping a different genuine source — a main **"Double RL & Co."** wordmark tag, an **eagle/banner emblem** tag, a repro **"UNION MADE"** tag, a small **woven American-flag** tag, a **"LOT No." / dry-goods mercantile** tag, and a separate **woven size tab**. Type: western **slab serifs** (Clarendon/French Clarendon, Tuscan), condensed gothics/faux-stencil, Victorian display, and script; grounds **ecru/cream, tea-stained/"sun-faded"**; thread **indigo, brick red, black, gold**. → the primary evidence for **multi-label stack (mismatched)**, **flag-tag**, **corner-slogan**, and the **RRL sun-faded palette**.
- **Brut** — confirmed as **Brut Clothing / "Brut Archives," Rue Réaumur, Paris**, founded **2012 by Paul Ben Chemhoun** ("brut" = raw). Two arms: an upcycled **REWORK®** line from genuine French vintage, and an own collection **made in a Parisian atelier on vintage equipment** with "custom tags." Rooted in the French **bleu de travail** tradition — **moleskin** (not denim), plus sanforized cotton, canvas, twill, **herringbone (HBT)**; heavy "French boro" patching. The genuine idiom it channels (the useful archetype): small **jacquard labels on indigo/moleskin grounds**, **French wording** ("Bleu de Travail," "Garanti bon teint," **"Taille"** sizing), maker names, and **heraldic/figurative marks** (canonical references: **Le Mont Saint Michel** — angel/heraldic; **Adolphe Lafont**, Lyon est. 1844). → feeds the **French-workwear palette + copy set** and a cleaner minimal-utility layout distinct from the busy American ones.

**Secondary confirmations:** **Burberry** — "Burberrys"/"Burberrys of London" (apostrophe-s) is **pre-~1999**, unified to "Burberry" from 1999; the **Equestrian Knight + "PRORSUM" banner** device dates to **1901**; cream/tan heritage grounds. **Pendleton** — **"Warranted to be a Pendleton"** ornate script inside a ruled box, "WARRANTED TO BE A" small-caps above, "Pendleton Woolen Mills" + TM notice below, classically **gold on navy** (mill since 1863). **US MIL-SPEC** — **stencil-gothic, black on white cotton tape** (olive on later combat items), a fielded spec block: nomenclature → size → contract no./PIID (`DLA100-78-C-0720`) → stock no. (FSN pre-1974 → NSN from Sept 1974) → spec no. → pattern date → contractor → agency → fiber → care; contract-prefix chronology **DA → DSA (1961–77) → DLA (1977–93) → SPO/SPM (1994+)** is the dating spine.
