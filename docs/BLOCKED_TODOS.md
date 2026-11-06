# Blocked / open items

Everything the build cannot answer for itself. **Update at the end of every phase.**
Not a project plan — no dates, no owners, no estimates. Detail lives in the phase docs.

- **BLOCKED** — needs a credential, a file or a translation nobody here can produce.
- **OWNER DECISION** — a choice only the owners can make.
- **DEFERRED** — deliberately postponed to a later phase.

---

## WHERE THINGS STAND

Live at `https://www.nextvisionfilms.com` (`master`, Worker `next-vision-films-production`),
with `https://dev.nextvisionfilms.com` as the developer copy (`dev`, Worker `dev`). Design v2
and the owners' admin are live. Done: audit · architecture · Phase 0/0.5 · Reviews A–E · 9 · 10
· 11 · 12 · 13 · 14 · 15 · steps 12–14 · design v2 · admin A0–A5 · performance audit.
Records: `docs/HANDOVER.md`, `docs/STAGING_DEPLOY.md`, `docs/PROJECT_CONTEXT.md`.

Not started: the media hostname (D20), the newsletter endpoint (D18).

---

## BLOCKED

- [x] **GitHub Actions would not start (2026-10-27 → 2026-10-29).** Billing refused every job on the private repo; resolved by making the repository public, after which `media-ingest` created «Agente Imobiliário sem Casa para Viver». The owners published it on 2026-11-06 (year 2026; their second try said 2024, so they should confirm the year).
- [ ] **Owner photos.** New founder portraits for `/sobre/` and new images for the Services carousels are coming from the owners (2026-10-29).
- [ ] **Design v2 assets.** VHS spine artwork (spines are drawn from titles until then), the
      NOWHERE poster and project, Need to Talk, the About team-photo carousel, and a vector
      export of the logos (C8; PNG masks for now).
- [ ] **Contact "Company/brand" field.** The honeypot is already named `empresa`; renaming it
      and adding the field is a contract change on both sides (`src/config/forms.ts`).

- [ ] **Turnstile site key on the live site.** The widget exists and `TURNSTILE_SECRET_KEY` is on the prod Worker. The site key goes in the GitHub repository VARIABLE `PUBLIC_TURNSTILE_SITE_KEY`, which `prod.yml` reads at build, so it reaches the page with the next release. Until it is set and a build has run, the page serves Cloudflare's test widget ("Somente para teste"), whose tokens the real secret refuses.
- [ ] **Contact email: paused by the user, so the form sends nothing.** Recipient `geral@nextvisionfilms.com` is set and verified as a Cloudflare destination address, and the `cloudflare` adapter is built. Email Sending needs Workers Paid, and the free route is blocked: Email Routing is not onboarded on the apex, which would need the Infomaniak MX records removed. Never do that. To finish, choose one. Workers Paid: onboard `mail.nextvisionfilms.com` under Email Sending, then add the `send_email` binding to `env.prod` in `wrangler.jsonc` (the comment there has it). Or Brevo: account, DNS records, `wrangler secret put BREVO_API_KEY --env prod`, and a sender on the verified domain. Then release.
- [ ] **Cloudflare Web Analytics site token** — `PUBLIC_ANALYTICS_TOKEN`. Unset, no beacon is emitted at all. Created under **Manage site → JS snippet**; the token, not the snippet, is what we need. (Phase 14)
- [ ] **Outstanding masters / weak media** — M1–M9 in `docs/SMASH_MEDIA_INVENTORY.md` §6. Longest lead time in the project; nothing is upscaled to hide it.
- [ ] **English review by an owner or native speaker** — every English string was authored here and has never been read by the company.

## OWNER DECISION

- [ ] **The repository is public.** It was made public to get Actions running, so the archived source data and internal documents are public too. Going private again brings the Actions billing refusal back unless the plan changes.
- [ ] **The homepage has no footer, so no legal links or socials.** Removed on request; `/termos-e-condicoes/`, `/politica-de-privacidade/` and the socials are one rail click away, on every other page. Whether the policy must be linked from the homepage itself is for legal review.
- [ ] **The homepage's rail stripes have no larger equivalent on a desktop.** WCAG 2.5.8 was met by repeating the rail's links in the footer, and the 12 px stripes now stand alone on `/`. A larger link set on the homepage, or wider stripes, would close it.
- [x] **LET'S TALK on the reel stays cream on yellow.** Decided by the user on 2026-11-06, though the pair is below the 4.5:1 floor in `CLAUDE.md` §11. The link's accessible name does not depend on it.
- [ ] **IMDb and trailer addresses.** The fields exist on every project in the admin, and all are empty, so no link shows yet. The owners have to fill them in.
- [ ] **Homepage statement fields in the admin.** "Captamos emoções / Contamos Histórias" no longer shows on `/`, but «Frase de abertura» still appears in the admin, where an edit changes nothing visible. Hide the two fields, or restore the text.
- [ ] **Showreel poster on `/servicos/`.** The film under the carousel opens on a still from «The endless "WAVES"», chosen as a stand-in. No still from the showreel itself is in the media pipeline. Changing it is «Imagem do vídeo» in the admin, next to «Vídeo no YouTube» and «Nome do vídeo».
- [ ] **Services stage replaces the owners' category rows.** Owner round 1 asked for one carousel per category, with no category names now shown. The stage opens on the collage's stills, then runs through `corporativo` and `visual-storytelling`. Which films join it is one list, `services.json` `categories`. The owners asked for "Publicidade & Branding", which no category carries; `moda-identidade` (one project, YSL) is the alternative to `corporativo`.
- [ ] **"Tira a cena dos BTS".** Read as the six-still grid on `/bts/`, now removed (the page is all yellow). If only the cream spine was meant, restore the grid in `BtsPage.astro`.
- [ ] **Design v2 copy (Tatiana's storyboard).** New About lead and paragraphs, and the
      contact-sheet heading (contains "SCREME", "WOHOLE", "ALREDY"). Not published; the
      live copy stays until approved. `docs/DESIGN_V2_ROLLOUT.md` §5.
- [ ] **Founders' roles and contacts in design v2.** The storyboard's "Co-Founder & …" roles
      differ from the live ones; its e-mails and personal phones wait on D2 and both
      founders' consent.
- [ ] **Design v2 mobile layout.** The storyboard is desktop-only; the bottom-rail/top-spine
      adaptation needs Tatiana's sign-off.
- [ ] **Design v2 dark-state text (C2 caveat).** The rail's lights-down darkens text with
      everything else; turning it cream needs a colour transition and a §11 amendment.

- [ ] **D2 — which contact email to PUBLISH.** Three candidates: `nextvisionfilmsagency@gmail.com`, `hello@nextvisionfilms.com`, `geral@nextvisionfilms.com`. No page publishes any of them. The form's recipient is `geral@` now, which does not decide this.
- [ ] **D9 — is the contact consent checkbox required?** The published form says no. `CONSENT_REQUIRED` is the one switch.
- [ ] **D19/D8 — GA4 + Google Ads.** Phase 14 assumes they are DROPPED for cookieless analytics. If the Ads tag is a live paid campaign, keeping it makes a consent banner mandatory and reopens the whole consent layer.
- [ ] **Privacy policy vs. actual behaviour — LEGAL REVIEW.** The policy declares Google Analytics cookies (`_ga`, `_gid`, `_gat`), a `cookie_notice_accepted` cookie and Smartsupp chat. The rebuilt site sets **no cookies at all**. The policy over-declares; it was not amended, because it is binding text (`CLAUDE.md` §2). See `docs/ARCHITECTURE.md` §8.1.
- [ ] **D18 — newsletter destination.** No endpoint is written until there is somewhere to send to.
- [ ] **The opening curtain vs LCP.** The 6.6 s hold on the first page of a session is 1.94 s of element render delay on the homepage's 2.6 s mobile LCP, and the hero video decodes under it. The design is the owners'; the number is in `docs/PERFORMANCE_AUDIT.md` §1.
- [ ] **Prune 25 unreferenced delivery objects (5.6 MB).** Four `pages/home/hero/1280.*` videos the homepage no longer uses, among others. A manifest/recipe prune plus `media:sync --execute --delete` — a bucket deletion the owners should see before it runs.
- [ ] **D3 — portfolio category descriptions.** Four of five do not match their heading. Will not be rewritten here.
- [ ] **English legal translation** — wanted or not? Both legal pages are Portuguese-only and say so in four places.

## DEFERRED

- [ ] **PWA icons track the visual identity** — generated from the EXISTING mark (`source-assets/brand/NVF.png`). If Review A changes the logo, drop the new source in and run `npm run icons:build`; nothing else changes. Not a blocker — the site is installable now.
- [ ] **Personal-account R2 buckets** — two empty buckets left behind by the move to the company account. Manual dashboard cleanup.
- [ ] **Media hostname + DNS** (`media.nextvisionfilms.com`, D20) — both Workers serve the renditions from their own asset store instead, byte-identical to `nvf-media` and needing no public bucket. `PUBLIC_MEDIA_BASE_URL` stays unset until a real hostname exists.
- [ ] **Branch protection.** Not configured: `dev` and `master` report `protected: false`. It was refused while the repository was private on GitHub Free; now that it is public it should be available. Any rule on `master` must let the admin's GitHub App push. Until then only `scripts/hooks/pre-push` guards them, on machines that enable it.
- [ ] **Windows checkouts fail `verify`.** No `.gitattributes`, so `core.autocrlf=true` breaks `test:admin` and `validate:legal`. Adding one must leave the hash-locked `docs/content/` bytes alone. `docs/HANDOVER.md` §4.
- [ ] **Dependency vulnerabilities.** `npm audit --omit=dev` reports 8 (6 high, 2 moderate) on 2026-11-06, including `astro` itself (fixed in 7.4.7). Raising wrangler moves `compatibility_date` with it (rule 21).
- [ ] **Stale comments in code.** `wrangler.jsonc` ("Nothing here has been provisioned"), the workflows ("all eleven validators", "six WOFF2 faces"), the generated `_redirects` note ("R2 is not provisioned") and `astro.config.mjs`. Left alone in the documentation pass of 2026-11-06.
- [ ] **Stale remote branch** `feat/design-v2`, last commit 2026-10-22.
- [ ] **The `reduced` and `minimal` motion tiers are untested in a browser.** `prefers-reduced-motion` cannot be emulated with the tooling used for step 13. Their code path — the loader never arms — is the repeat-visit path and was verified; the tiers themselves were not.
- [ ] **Two console messages left alone, both non-breaking.** Chromium's `preloaded ... but not used within a few seconds` for the two preloaded faces (both end `loaded`; they are applied after the opening hold), and Astro ClientRouter's unhandled `InvalidStateError: Transition was aborted because of invalid state` on each swap. Every swap completed.
- [ ] **Content-Security-Policy** — the required origins are recorded (`ARCHITECTURE.md` §9). There IS a Worker now, so the blocker is gone and only the work remains. `public/_headers` now carries the cache rules and five security headers (performance audit, 2026-10-29) but no CSP: it needs a nonce strategy for the inline motion bootstrap and JSON-LD, and allow-lists for Turnstile and youtube-nocookie. Ship it Report-Only first.
- [x] **Performance audit, after-deploy measurements.** Measured on `dev` on 2026-10-30 and recorded in `docs/PERFORMANCE_AUDIT.md` §2. Released to prod on 2026-11-06; not re-measured there.
- [ ] **`/__concepts/*` and `public/__generated/posters|preview` (2.5 MB) still deploy.** CLAUDE.md keeps the concepts; recorded by the performance audit, unchanged.
- [ ] **Phase 11b reviewed copy/SEO proposals** — permitted as diffs against the archive, never applied silently.
- [x] **DNS cutover and custom domains.** `nextvisionfilms.com`, `www` and `dev` are Workers Custom Domains, found bound on 2026-10-22. Only the media hostname (above) is left.

- [ ] **The dev Worker is publicly reachable and not robots-blocked.** Every canonical points at `https://www.nextvisionfilms.com/…`, which is what keeps `dev.nextvisionfilms.com` and the workers.dev copies from competing with the real site; no dev-only `X-Robots-Tag` was added, because an artefact that behaves differently from the one that ships is not a useful copy of it.
