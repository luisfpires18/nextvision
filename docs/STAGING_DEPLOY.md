# Staging deployment — step 12

**Cloudflare Workers + Workers Static Assets, on the company account. No custom domain, no
DNS, no production secret.** This file records what was deployed, what it is configured
with, what it deliberately is NOT configured with, and how to do it again.

Authority for the decisions behind it: `docs/ARCHITECTURE.md` §3 (hosting), §7 (forms),
§8 (analytics), §12 (environments and secrets).

---

## 1. What exists now

| | |
|---|---|
| **Account** | `c87adf05b555c1ff52167b53030b8e39` — the COMPANY account, the same one holding both R2 buckets |
| **Worker** | `next-vision-films` — one Worker, the name `wrangler.jsonc` has always declared |
| **Staging URL** | `https://next-vision-films.next-vision-films.workers.dev` |
| **Custom domain** | none, deliberately |
| **Bindings** | `env.ASSETS` only |
| **Worker script** | 622.65 KiB across 14 modules · 157 KiB gzipped · 31 ms startup |
| **Static assets** | 718 files, 22 MB, uploaded once and content-addressed thereafter |

The workers.dev subdomain did not exist before this step; the first `wrangler deploy`
registered `next-vision-films.workers.dev` for the account, which is why the hostname
repeats. It is not a mistake and it is not worth renaming — the name has no audience.

**Preview URLs are ON**, by wrangler's default for a Worker with a workers.dev route: every
deployed *version* also gets its own URL. Left on, because a per-version URL is exactly
what a review of a staging build wants. `preview_urls: false` in `wrangler.jsonc` turns it
off the day that changes.

---

## 2. The commands

```
npm run deploy              verify → build → wrangler deploy      (the only deploy path)
npm run preview:cloudflare  build → wrangler dev                  (workerd, locally)
npm run deploy:dry          build → wrangler deploy --dry-run     (no upload)
```

`npm run deploy` is `npm run verify && wrangler deploy`, and `verify` already contains the
build, so nothing is built twice and nothing is deployed that has not passed all eleven
validators. **The chain is `&&`, so a failing validator stops the deploy.** It does not
tee, filter or swallow output — a failure is visible, and the exit code is the real one.

`wrangler` is invoked with NO `--config` flag on purpose. The build writes
`.wrangler/deploy/config.json`, which points at the resolved `dist/server/wrangler.json`,
and wrangler follows it — "Using redirected Wrangler configuration". Naming a config by
hand would let a stale one be deployed.

**`preview:cloudflare` runs the BUILT Worker under workerd**, not `astro dev`. It is the
only local surface where the asset handler, `_headers`, `_redirects`, trailing-slash
resolution and the 404 fallthrough behave as they do in production. It is not a substitute
for `astro dev`, which is still the fast loop.

---

## 3. Environment matrix — staging

Everything is read in one of two places: **build time** (Vite inlines `PUBLIC_*` into the
HTML) or **request time** (the Worker's environment, via `cloudflare:workers`). Nothing is
in `wrangler.jsonc`, and nothing is in git.

### Required for this deployment

**None.** That is the finding, not an omission. The staging deploy needed no secret, no
token and no owner input, because every unset value has a defined, safe meaning.

### Optional — unset here, and the site is correct without them

| Variable | When | Unset means | Why unset |
|---|---|---|---|
| `PUBLIC_MEDIA_BASE_URL` | build | serve the local mirror from `/__media/` — copied into the build | D20: no delivery hostname exists. Setting a fake one would ship 371 dead image URLs |
| `PUBLIC_TURNSTILE_SITE_KEY` | build | Cloudflare's documented always-passes TEST site key `1x00000000000000000000AA` | no production widget exists yet, and a test widget is honest about being one |
| `PUBLIC_ANALYTICS_TOKEN` | build | **no beacon is emitted at all** — not a disabled one, not an empty tag | BLOCKED: no Web Analytics site token yet |
| `PUBLIC_ANALYTICS_IN_DEV` | build | analytics stay off in `astro dev` | development only; never set in a build |

### Deferred — a Worker secret, and NOT set on staging

| Secret | Unset means | Blocked on |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | every submission is refused `503 not-configured` | production Turnstile keys |
| `RESEND_API_KEY` / `BREVO_API_KEY` | no delivery adapter is ready | D17 — provider not chosen |
| `CONTACT_RECIPIENT`, `CONTACT_SENDER`, `CONTACT_PROVIDER` | no recipient | D17 / D2 — three candidate addresses, none confirmed |

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` were not needed either: wrangler is
authenticated with an OAuth token from `wrangler login`, held outside the repository. They
become relevant only when a CI job deploys.

---

## 4. What staging does with the contact form

**It refuses, and it says so.** Measured against the built Worker running under workerd
(`npm run preview:cloudflare`) — the same artefact that was uploaded, byte for byte:

```
POST /api/contact/          →  503  {"ok":false,"outcome":"not-configured"}
POST with no Origin header  →  403  Cross-site POST form submissions are forbidden
GET  /api/contact/          →  405
```

`IS_DEV` is `import.meta.env.DEV`, which is **false in every build**, so the development
sink that logs `NOT DELIVERED` cannot run on staging. There is no configuration under
which this deployment reports a message as sent. That is CLAUDE.md rule 14 holding in the
one place it matters — a live URL a person could actually type into.

The Turnstile widget renders with Cloudflare's **test** site key, so the challenge passes
in the browser and the submission still fails at delivery. A reader who fills the form in
gets an error, never a thank-you page. `/obrigado/` remains the answer to a successful
POST and nothing links to it.

---

## 5. Cloudflare configuration, as validated

| Setting | Value | Note |
|---|---|---|
| `compatibility_date` | `2026-08-31` | **changed in this step** — see below |
| `compatibility_flags` | `nodejs_compat` | kept |
| `main` | supplied by the adapter | never hand-set |
| assets binding | `ASSETS`, directory `../client` | supplied by the adapter |
| `observability` | enabled | the only visibility staging has |
| `kv_namespaces` | **empty** | `session: false` in `astro.config.mjs` keeps the phantom `SESSION` binding out |
| `r2_buckets` | **empty** | the site reads media over plain HTTPS; the private `nvf-source-archive` is not bound, not referenced and not exposed |
| `images` | absent | `imageService: 'compile'` means no Images binding is requested |

**`compatibility_date` was 2026-09-01 and is now 2026-08-31.** wrangler 4.128.0 bundles
workerd 1.20260831.1, whose newest supported date is 2026-08-31. A date one day ahead of
the local runtime means `wrangler dev` and `npm run preview:cloudflare` run under
different semantics than the deployed Worker — a local preview that can only agree with
production by luck. Raise it together with wrangler, never on its own.

**`nodejs_compat` was kept, and the reason is not "it was already there".** The current
bundle imports no `node:` specifier at all, so nothing would fail today; the flag also
governs the `process` / `Buffer` shims the Astro runtime reaches for, and dropping it to
save nothing measurable is how a deploy breaks on a route nobody has written yet.

---

## 6. The defect this step found

**`_redirects` may not carry a trailing comment on a rule line.** The generated file had
carried one since Phase 11:

```
/blog    /portfolio/    301   # ASSUMED — decision D5
```

Cloudflare Pages tolerated it. **Workers Static Assets does not**, and the check runs
server-side at deploy time:

```
Invalid _redirects configuration:
Line 7: Expected exactly 2 or 3 whitespace-separated tokens. Got 8. [code: 100324]
```

The first deploy uploaded all 519 changed assets and then failed on this line.

What makes it worth recording is that **no local surface catches it**. Miniflare's own
parser accepted the same file and reported `✨ Parsed 6 valid redirect rules`, so
`wrangler dev` is green on a file the API rejects. `scripts/build-redirects.mjs` now emits
the note as its own line above the rule, and says why in a comment at the emission site.

---

## 7. What was deliberately NOT done

- **No custom domain, no DNS, no zone change.** A workers.dev URL is the whole of step 12.
- **No media hostname.** `PUBLIC_MEDIA_BASE_URL` stays unset, so staging serves the 384
  renditions from its own asset store — byte-identical to `nvf-media`, and reachable
  without making any bucket public. Neither R2 bucket's privacy was touched.
- **No production Turnstile widget or secret**, no email provider, no recipient.
- **No analytics token.** Staging measures nothing, and the deployed HTML contains no
  beacon to measure with.
- **No `X-Robots-Tag` and no staging-only `robots.txt`.** Every page's canonical points at
  `https://www.nextvisionfilms.com/…`, which is what keeps a workers.dev copy from
  competing with the real site. A staging-only header would have to be built into the
  artefact, and an artefact that behaves differently from the one that ships is not a
  staging artefact.
- **No CSP header.** Still §9's deferred item; a permissive CSP written early looks like
  protection without being any.
- **No GitHub remote, no CI.** `npm run deploy` is run by a person, from a checkout.

---

## 8. Step 13 — live QA, and the four defects it found

The certificate for the brand-new account subdomain took **about an hour** to issue. Until
it did, every request failed with `ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE` from two
independent TLS stacks while `https://workers.dev` itself answered normally, and the
deployment was live at 100% throughout. Expect that wait on the next fresh subdomain; it
is not a fault in the build.

Everything below was measured **against the live URL**, on version `dc08d349`.

### 8.1 HTTP

| Check | Result |
|---|---|
| 35 routes and assets: six PT static pages, both legal pages, `/obrigado/`, `/offline/`, four project pages, two legacy archives, every EN counterpart, all four icons, the manifest, `sw.js`, `robots.txt`, both sitemaps, a font | 200 |
| `/nope/` · `/en/nope/` | 404 with the **Portuguese** and the **English** 404 document |
| `/sobre` · `/blog` · `/sitemap_index.xml` | 307 → slashed · 301 → `/portfolio/` · 301 → `/sitemap-index.xml` |
| `GET /api/contact/` · POST with no `Origin` · POST with valid `Origin` | 405 · 403 · **503 `{"ok":false,"outcome":"not-configured"}`** |
| archives render their own subsets | `ficcao` 5 projects, `corporativo` 1 |
| `/_astro/*` · documents | `max-age=31536000, immutable` · `max-age=0, must-revalidate` |
| canonical + hreflang | `https://www.nextvisionfilms.com/…` — the production domain, not the staging host |
| trackers | 0 |
| secret scan across the served HTML and every loaded bundle | 0 hits; the contact page ships Cloudflare's **test** site key `1x00000000000000000000AA` |

**No 500 from any request.**

### 8.2 Browser

Clean session, first document: renders (`<html>` not hidden, body 5650px), overlay hidden
with `pointer-events: none`. Second load: renders. ClientRouter navigation, **Back** and
**Forward** all swap URL, title and content with no full document load, and hit-testing
resolves to the real anchor at every step. Portfolio cards, all five category filters and
the mobile menu are all reachable; filtering yields 20 / 5 / 5 / 1 / 20, matching the
counts printed on the filters and the server-rendered archives. Direct project URL at the
375×812 mobile preset: renders, one `<h1>`, `scrollWidth` 375 with no horizontal overflow,
menu opens and every nav link is reachable. Service worker registered and active at the
root scope, manifest parses with three icons, no broken image, hero video `readyState` 4,
**0 cookies and 0 localStorage keys**.

`prefers-reduced-motion` could not be emulated with the available tooling, so the
`reduced` / `minimal` tiers were **not** exercised directly. What was exercised is the
same code path they take: those tiers never arm the loader, which is the repeat-visit path,
and it renders correctly.

### 8.3 The four defects

1. **The first visit of a session rendered blank.** `<html data-loader="on">` is the state
   flag and the overlay div carried an attribute of the *same name*, so
   `querySelector('[data-loader]')` returned the **root** — first in document order — and
   `loader.hidden = true` put `hidden` on `<html>`. The UA stylesheet turns that into
   `display: none` on the whole document, which is why no author rule could explain it.
   The overlay is now `data-loader-overlay`; three call sites and two layouts changed.
2. **Hit-testing resolved to `HTML` above the header.** Two causes, both now understood: a
   `display: none` document has nothing to hit (defect 1), and after that was fixed the
   symptom survived only while the pane was **hidden**, which makes Chromium skip the view
   transition and leave the root captured. Proved by disabling `startViewTransition`: the
   fallback swap hit-tests correctly. With the pane fronted, hit-testing is correct before
   and after every swap. Nothing in the site was changed for this.
3. **The category filter hid nothing.** `[hidden] { display: none }` is a *user-agent*
   rule and `.item { display: grid }` is an author one, so `card.hidden = true` lost.
   Every category showed all twenty projects while marking the link current and rewriting
   the URL. `.item[hidden] { display: none }` now sits directly beneath the rule that
   caused it.
4. **A preloaded font was never used.** `barlow-500.woff2` was preloaded on every page
   while `body` resolves to weight **400** — `document.fonts` reported Barlow 500 as
   `unloaded` on a fully painted page. The preload fetched bytes no glyph used *and* left
   the real body face to be discovered from the stylesheet, the exact late load a preload
   exists to prevent. Now `barlow-400.woff2`.

Chromium still logs `preloaded ... but not used within a few seconds` for both faces: they
are fetched at ~210 ms and applied after the opening hold, and both end `loaded`. Astro's
ClientRouter also emits an unhandled `InvalidStateError: Transition was aborted because of
invalid state` on each swap. Neither breaks anything measured here; both are noted rather
than chased.

### 8.4 The regression checks

Three assertions in `npm run validate:routes`, all against the **built** output, and all
three tested by breaking them:

- every page ships exactly one `data-loader-overlay`, and none hardcodes the root flag
- no script the pages actually load queries the ambiguous `[data-loader]` — this is the
  one that holds the line, because renaming fixes today and forbidding the selector stops
  it coming back
- the built CSS gives `[hidden]` an author-level `display: none` for `.item`, so a
  category actually filters

The bundle check is scoped to scripts the pages **reference**, not to a directory listing:
`dist/client/_astro/` can hold orphans from an earlier build, because Astro cannot clean
the directory while `wrangler dev` holds it open. That was found the same day — the first
version of this check failed on a stale pre-fix bundle.

---

## 9. Redeploying, and rolling back

Redeploy: `npm run deploy`. Assets are content-addressed, so an unchanged build uploads
nothing — the second deploy in this session reported `No updated asset files to upload`.

Roll back: `wrangler rollback` (or `wrangler deployments list` then
`wrangler rollback <version-id>`). The version deployed here is
`ececb899-4704-418c-ad89-07bc417a170d`.

If `wrangler dev` or a build ever dies with
`SENTRY_DO SQLite failed; ... SQLITE_IOERR`, an orphaned `workerd` is holding
`.wrangler/state`. Kill `workerd`, delete `.wrangler/state` and `.wrangler/tmp`, and
rebuild — both directories are local emulator state, gitignored, and safe to remove.
