# Media Source Map — WordPress · YouTube · Smash

**Generated:** 2026-09-02 · **Data:** [`src/data/media-source-map.json`](../src/data/media-source-map.json) (also copied to `docs/source-archive/`)
**Built by:** `scripts/build-media-source-map.mjs` — re-run it whenever media or `docs/Smash/` changes.

This is the machine-readable answer to *"for this project, which file do we actually use,
and for what?"* — one row per project, per media role.

---

> ### ⚠ Corrected 2026-09-03 (Phase 9) — this map under-reported the material
>
> The first version of this map graded **only `docs/Smash/`**. It listed the eight
> WordPress `.mov` card loops under "preview from: wordpress" and never probed them, then
> concluded that **19 of 20 projects had no hero-capable source**. That number drove every
> media decision from Phase 0.5 to Review D.
>
> Measured with `ffprobe`, those eight files are **1920x1080 at 16.4-17.6 Mbps** — the
> best footage held for those projects, and each one is that project's own film. A ninth,
> `FILM-IN-video-2-sem-nvf-v2.mp4`, is 1080p at 14.0 Mbps for 28 s.
>
> They are still **not masters**: each is roughly five seconds long. So the map now records
> three states instead of two — `full` / `loop+stills` / `none` — and **M1 stands for all
> twenty projects**. What changed is that nine of them can have an honest 1080p hero loop
> and real stills today, and that `helder-museu` and `the-end` can be built from their own
> footage instead of from the ambiguous files behind **M2** and **M3**.
>
> The generator now probes both shelves. Full record: [`PROJECT_ROLLOUT.md`](PROJECT_ROLLOUT.md) §1.

---

## 1. The rule this map enforces

> **A file existing in `docs/Smash/` does not make it a master.**
> **And a file NOT in `docs/Smash/` is not therefore a web export** — which is the mistake
> the first version of this map made. Both shelves are probed.
>
> A source that clears the quality floor but runs five seconds is hero-capable for a **loop
> and for stills**, and for nothing else. That is a third state, and it is recorded.

17 of the 20 `Smash/` files are 1280x720 at 640-2,325 kbps — YouTube-grade web exports.
A hero cut from a 1 Mbps 720p file will not hold up at 1440 px.

The map applies an explicit quality floor for cinematic hero use:

```
minimum height   1080 px
minimum bitrate  8,000 kbps
```

Anything below it is marked **`MASTER_REQUIRED`** rather than quietly used.

Matches are never inferred from filename resemblance. **Every match carries a `basis`
and a `confidence`** (`confirmed` / `high` / `medium` / `ambiguous` / `none`), and the
uncertain ones are escalated in §5 instead of being guessed.

---

## 2. Headline numbers

| | |
|---|---|
| Projects | 20 |
| With a valid YouTube id | **19** (`dont-let-it-fool-you` stores a Studio edit URL — rejected) |
| With any `Smash/` source | 8 |
| With an archived WordPress card loop | 9 |
| **Hero-ready outright** (1080p, long) | **1** — `nvf-vs-filmin-details` |
| **Loop + stills capable** (1080p, ~5 s) | **8** |
| **No local hero source at all** | **11** |
| **`MASTER_REQUIRED`** | **19** |
| Hover preview available | 10 (8 from `Smash/`, 2 from WordPress `.mov`) |
| Hover preview with no source | **10** |

**Nine of twenty projects can carry an honest 1080p hero today** — as a short loop and as
stills. **None of them has a master**, and eleven have no local hero source at all, so the
master-media request (§5, M1) is still the longest lead time in the project.

---

## 3. Per project

Roles: **poster** (still) · **preview** (silent hover loop) · **film** (full work) · **hero** (cinematic fullscreen).
Posters come from the WordPress archive for all 20; films come from YouTube where an id is valid.

| Slug | Title | YouTube | `Smash/` source | Preview from | Hero |
|---|---|---|---|---|---|
| `ana-e-filipe-metro` | Don’t Let It Fool You | e6aK4vEn420 | — | wordpress | **MASTER_REQUIRED** |
| `ana-reels` | The Lie we tell ourselves | o9X1s3ge_IE | The lie we tell ourselves.mp4 | smash | **MASTER_REQUIRED** |
| `ananuno` | Ana&Nuno | DSUXz5VeXiY | — | UNKNOWN | **MASTER_REQUIRED** |
| `carolinapedro` | Carolina&Pedro | BDJAOp6Eh3E | — | UNKNOWN | **MASTER_REQUIRED** |
| `danieladuarte` | Daniela&Duarte | GJpdoynz2QA | — | UNKNOWN | **MASTER_REQUIRED** |
| `dont-let-it-fool-you` | Don’t let it fool you | — | — | UNKNOWN | **MASTER_REQUIRED** |
| `dormencia-48h` | Dormência 48h | 4Xur7raVaqU | — | UNKNOWN | **MASTER_REQUIRED** |
| `epitafio` | Epitáfio | RIvUTLvdwX8 | — | UNKNOWN | **MASTER_REQUIRED** |
| `helder-museu` | Yves Saint Laurent | dFehZUbaGWU | Fading.mp4 | smash | **MASTER_REQUIRED** |
| `helder-praia` | The endless “WAVES” | O7g2AM9lAo0 | The endless _WAVES_.mp4 | smash | **MASTER_REQUIRED** |
| `leonor` | Words of our story | 0C-yySHAzCI | Can´t live in you books anymore.mp4 | smash | **MASTER_REQUIRED** |
| `lost-lines-trailer` | Lost Lines Trailer | JIKvD9Y74oU | — | UNKNOWN | **MASTER_REQUIRED** |
| `madrugada-prince-mark` | Madrugada – Prince Mark | gbXbnpttShw | — | UNKNOWN | **MASTER_REQUIRED** |
| `martacharles` | Marta&Charles | DT3wUv-vPe4 | — | UNKNOWN | **MASTER_REQUIRED** |
| `nazaryi` | Unfinished | sBVD2TxbM-w | Unfinished.mp4 | smash | **MASTER_REQUIRED** |
| `nvf-vs-antiqvvm` | Antiqvvm | seuAOrDs3oo | NVF VS Antiqvvm.mp4 | smash | **MASTER_REQUIRED** |
| `nvf-vs-filmin-details` | Filmin | 8HjA-SOs7Ws | NVF VS Filmin.mp4<br>film in 1 v2.mp4 | smash | smash |
| `paradox-of-affection` | I Feel Lost | HHB93FuKNrg | — | wordpress | **MASTER_REQUIRED** |
| `susanarafael` | Susana&Rafael | h8aaihpcLGU | — | UNKNOWN | **MASTER_REQUIRED** |
| `the-end` | The End | _3cbRqvPKsk | In the end.mp4<br>Sometimes it´s just the start (1).mp4 | smash | **MASTER_REQUIRED** |
---

## 4. `Smash/` files with no project

10 of the 20 files map to no published project. Three are confirmed by exact duration
match; six are unpublished work; one is ambiguous.

| File | Kind | Basis |
|---|---|---|
| `NVF Showreel.mp4` | showreel | **Confirmed** — 189.10 s exactly matches the WordPress orphan `vcompress_210.mov` (3:09) |
| `NVF showreel 2026.mp4` | showreel | **Confirmed** newer showreel, never published. Which is current is decision **R9** |
| `We are NVF.mp4` | brand | **Confirmed** — 20.09 s matches the WordPress orphan `videoplayback.mp4`. The live homepage hero is a 16 s cut of this |
| `Don´t let it fool you.mp4` | **ambiguous** | Title matches **both** halves of the duplicate pair `ana-e-filipe-metro` / `dont-let-it-fool-you` (decision **D6**) |
| `Celebrate Pride with Dr Bernard (1).mp4` | unpublished | No matching project |
| `DigiUp anúncio.mp4` | unpublished | Advert for digiUP, the agency credited in the footer |
| `Helder Vs Karl Largerfeld.mp4` | unpublished | The published fashion project is *Yves Saint Laurent* — a **different designer** |
| `Prato 2 v1.mov` | unpublished | Gastronomy. **1080p ~18 Mbps PCM — a genuine master** |
| `Prato sobremesa v1.mov` | unpublished | Gastronomy, same series. **1080p ~18 Mbps PCM master** |
| `Video Long Version O Gato que Bebe.mp4` | unpublished | "Long Version" implies a shorter cut exists |

This resolves both WordPress "orphans" flagged in the audit (§9.25) — neither was orphaned;
both are the showreel and the brand film.

---

## 5. Open questions for the owners

| # | Question | Blocks |
|---|---|---|
| **M1** | **Supply true masters** (ProRes/DNxHR, or ≥1080p high-bitrate, 4K where it exists) for every project intended to have a cinematic hero | 19 of 20 heroes. **Longest lead time in the project** |
| **M2** | Which of `In the end.mp4` (29 s) / `Sometimes it´s just the start (1).mp4` (144 s) is *The End*? Teaser and full film? | `the-end` |
| **M3** | Confirm `Fading.mp4` belongs to *Yves Saint Laurent* (`helder-museu`) — both fashion projects share the "…Fading" tagline | `helder-museu` |
| **M4** | Clarify `Helder Vs Karl Largerfeld` against the published *Yves Saint Laurent* — mislabel, or a separate unpublished piece? | Portfolio scope |
| **M5** | Should the six unpublished pieces and the 2026 showreel join the portfolio? | Portfolio scope |
| **M6** | Are masters available for the 10 projects with **no local file** — especially the five weddings? | Those 10 projects |
| **M7** | Which showreel is current — 3:09 or the 2026 55 s cut? | Homepage hero |
| **M8** | **`madrugada-prince-mark` publishes a black title card as its image**, and we hold no source for it at all. Is there a frame, a still or a master? | Its project page opens on type, not on the film |
| **M9** | **`dormencia-48h` publishes a designed portrait poster and no footage.** Is there source video, or is the poster the intended image? | Its hero is the poster, presented as one |
| **M-A** | Which project owns `Don´t let it fool you.mp4`? Tied to decision **D6** | 1-2 project pages |

---

## 6. How this is consumed

`src/data/media-source-map.json` is the input to the future media pipeline
(`scripts/media-sync.mjs`, Phase 3). Each project's content entry records its chosen
`sourceOfTruth`, so the decision stays auditable rather than implicit.

Until masters arrive, projects marked `MASTER_REQUIRED` fall back to
**`heroStill` + the YouTube façade** — a defined, good-looking state, not a placeholder
(`ARCHITECTURE.md` §6.7).

**Nothing has been transcoded, renamed, uploaded or modified.** `docs/Smash/` is untouched.
