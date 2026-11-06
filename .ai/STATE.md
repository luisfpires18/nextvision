# Current state

Last refreshed: 6 November 2026. Git and GitHub can have moved since; refresh them before any mutation.

Workflow status: adapted from `luisfpires18/woo-rts` on 6 November 2026 and loaded from `CLAUDE.md`, as the user directed.
Roadmap: none. No Roadmap Issue or milestones exist, and the repository had 0 open Issues and PRs.
Current task: bug fixing, directed in conversation with no Issue. More fixes are coming.
Next task: none queued.

## Branches
`master` was merged into `dev`, and `dev` into `master`, on 6 November 2026. The owners publish to `master` directly, so merge `master` into `dev` before each release.

## Contact form
It sends nothing. Email is paused by the user (`docs/BLOCKED_TODOS.md`), so every submission is refused.

## Setup blockers on DESKTOP-TI3IE7S
- `npm run verify` still cannot pass here, for the reasons below. The Visual C++ Redistributable is now installed, so `astro build` and `workerd` run.
- `core.autocrlf=true` with no `.gitattributes`: `test:admin` and `validate:legal` fail on CRLF. Both pass on an LF export.
- Python is missing, so `npm run fonts:build` cannot run.
- No `.env` and no `media/dist/`: an R2 read key is needed for `npm run media:pull`. Without it there are no local images and `validate:media` fails.
- Node 26 here, Node 22 in CI.
- `gh` is not installed, so Issues, PRs and comments cannot be published from here.
- `core.hooksPath` is unset, so the pre-push protection is off.
- `humanizer` also waits on the user enabling it from the directory. See PROJECT.md.

## Not set up
- `.ai/` was adapted from three files only. Not carried over from woo-rts: `DECISIONS.md`, `MEDIA.md`, `STORAGE.md`, `SESSION_START.md`, the evidence tools and the Issue/PR templates.
- No capture, upload or evidence route has been tested for this repository, and a remote reviewer cannot yet retrieve evidence for a feature branch. Feature branches have no preview deployment.

Everything else still open is in `docs/BLOCKED_TODOS.md`.
