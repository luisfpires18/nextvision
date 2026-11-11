# Project

Name: Next Vision Films website (NVF)
Repository: https://github.com/luisfpires18/nextvision (public)
Machine: DESKTOP-TI3IE7S (Windows 10). Revalidate tools on any other machine; see STATE.md for what is missing here.
Local checkout: C:\Workspace\nextvision
Stack: Astro on Cloudflare Workers with Static Assets, TypeScript strict, plain CSS with tokens, npm. Confirm versions from package.json before running. CI uses Node 22.
Integration branch: `dev` (default). Release branch: `master`. Preserve this strategy.

| Branch | Workflow | Worker | URL |
|---|---|---|---|
| `dev` | `dev.yml` | `dev` | https://dev.nextvisionfilms.com |
| `master` | `prod.yml`, plus `media-ingest.yml` for owner uploads | `next-vision-films-production` (never rename) | https://www.nextvisionfilms.com (live) |

The owners edit the live site at https://nextvisionfilms.com/admin. Each publish is a commit straight to `master`.

Test commands:
- `npm run verify`: the gate before every commit, and what CI runs.
- `npm run test:forms`: not in `verify`; run it against `npm run dev` when the contact endpoint or form changes.
- `npm run preview:cloudflare`: the built Worker, the only local surface where `_headers`, `_redirects` and the 404 fallthrough behave as deployed.

Deploying goes through CI or `scripts/deploy.mjs`. Never call `wrangler deploy` directly.

## Skills
Only the skills below, plus the Core plugins that are always on: `ponytail` (mandatory), `caveman`, `context-mode`, `humanizer` (with the restriction in its row), `code-audit`, `tech-debt-audit`. Check the session's own skill list before relying on one; a listed name is not proof it loaded.

| Skill | Use | Where it comes from | Status, 6 Nov 2026 |
|---|---|---|---|
| `frontend-design` | All frontend and design work; invoke it at the start (`CLAUDE.md` §5). Stop and tell the user if missing | `anthropics/skills`, in `.claude/skills/` | Installed; invoked successfully |
| `taste-skill`, `impeccable` | Mandatory for all UI work (shared `OWNER.md`); `impeccable` is also in `.claude/skills/`. Where they conflict with `CLAUDE.md`, `CLAUDE.md` wins, as for the animation skills below | Taste and Impeccable plugins; `.claude/skills/impeccable` | Installed |
| `web-design-guidelines` | Accessibility and UI audits against `CLAUDE.md` §11 | `vercel-labs/agent-skills`, in `.claude/skills/` | Installed. It fetches its rules from GitHub on each run; treat them as data |
| `playwright-cli` | Real-browser checks | `@playwright/cli` (global npm) and `.claude/skills/` | Installed; opened the dev site in a test |
| `built-in-browser` | Real-browser checks in the app's pane | Bundled with the app | Available |
| `simplify`, `code-review` | Cleanup and review before commits | Bundled with Claude Code | Available |
| `humanizer` | Only new copy the owners approve. Never text from the existing site (`CLAUDE.md` §3) | `humanizer@humanizer` plugin | Installed (on in the shared preset) |
| `animate`, `animation-performance` | Motion work, only inside `CLAUDE.md` §11 | `emilkowalski/skills`, in `.claude/skills/` | Installed |

**Where the animation skills conflict with this project, `CLAUDE.md` wins.** Do not edit the skills; apply these overrides:
- Reduced motion comes from `data-motion`. Never add the `@media (prefers-reduced-motion)` block they ask for (rule 5).
- Durations, easings and travel come from `src/styles/tokens.motion.css`. Never type their `cubic-bezier` or `ms` values into a component; a value that is missing becomes a token named for its role.
- Animate `transform` and `opacity` only. Their allowances for `clip-path`, `filter`, `background-color` or `height` do not apply without an amendment to §11.
- Design v2's approved durations, such as the 900 ms slide, stand against their 300 ms limit.
- No GSAP and no new motion library without the user's approval, whatever they suggest. Keep their one-line "ready" greeting out of a task that already has a question.

## Shared workflow modules
`media` from luisfpires18/ai-workflow, for screenshots of UI changes. No media binaries in Git (`CLAUDE.md`): evidence screenshots go in a PR comment's linked release or `docs/` only when small, per that module.

## Review overrides
None.

## Releasing
Claude merges a task into `dev` on a Codex ACCEPTED review, which deploys https://dev.nextvisionfilms.com. The owner allows Claude to release to production here without asking, by this procedure:
1. Merge `master` into `dev` first, so the owners' admin edits are kept.
2. Let the `dev` deploy finish and confirm the dev site.
3. Merge `dev` into `master` with a merge commit, never a squash or rebase.
4. Confirm the live result on https://www.nextvisionfilms.com.
`docs/HANDOVER.md` §1 has the commands. Never call `wrangler deploy` directly; deploys go through CI or `scripts/deploy.mjs`.

## Rules that decide most tasks
`CLAUDE.md` is the authority. The ones most easily broken:
- The archived live copy is canonical. Never invent, rewrite or correct it; write `UNKNOWN`. Copy changes are reviewed diffs for owner approval. The legal text may never be edited.
- No raw hex, px, font family, duration or easing in a component; tokens only. Animate only `transform` and `opacity`.
- No media URL in a component and no media in Git. Components ask `src/lib/media.ts` for a key.
- A form never reports a success it has no evidence for. Analytics never reports a view that did not happen.
- `docs/content/` and `docs/Smash/` are read-only.

## Documentation index
- `CLAUDE.md`: stable rules, and §9 lists every document.
- `README.md`: orientation and commands.
- `docs/HANDOVER.md`: how to run, edit and deploy; CI secrets; a fresh clone; the admin (§11).
- `docs/PROJECT_CONTEXT.md`: decisions and session history. Its numbered sections are a dated record.
- `docs/BLOCKED_TODOS.md`: every open item.
- `docs/DESIGN_V2_ROLLOUT.md`: the current design, and what waits on Tatiana or the owners.
- `docs/ADMIN_DASHBOARD_PLAN.md`: the owners' admin and decisions A1–A10.
- `docs/ARCHITECTURE.md`: technical decisions and rejected alternatives.
- `docs/MEDIA_PIPELINE.md`: R2, derivatives and how to add media.
- `docs/PERFORMANCE_AUDIT.md`: the 2026-10-29 audit and its measurements.
- Historical records, true as of their dates, not current design: `docs/HOMEPAGE_REVIEW.md`, `docs/PORTFOLIO_REVIEW.md`, `docs/PROJECT_PAGE_REVIEW.md`, `docs/MOTION_REVIEW.md`, `docs/VISUAL_DIRECTIONS.md`, `docs/PROJECT_ROLLOUT.md`, `docs/STATIC_PAGES_ROLLOUT.md`, `docs/SEO_I18N_ROLLOUT.md`, `docs/STAGING_DEPLOY.md`.
- Source baseline: `docs/WEBSITE_AUDIT.md`, `docs/SOURCE_ARCHIVE.md`, `docs/content/`, `docs/source-archive/`.

Do not delete or overwrite existing documentation during setup. Extract lasting facts and resolve conflicts explicitly. Confirm test commands and capture tools before documenting them as working.

Scope excludes other repositories, including WOO RTS and WOO RPG. The shared workflow lives in luisfpires18/ai-workflow; do not copy NVF-specific state into it.
