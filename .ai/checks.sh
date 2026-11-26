#!/usr/bin/env bash
# Pre-push gate for this repository. scripts/gate.py runs the integration
# branch's copy of this file inside the task's worktree, so a branch cannot
# weaken its own checks. Fast, deterministic, non-interactive; no full build.
# Subset of `npm run verify` (CI): data/access/admin/legal validators, icons
# check and `astro check` (typecheck). Skips `astro build` and the validators
# that read dist/ (routes, seo, analytics, pwa, media); CI covers those.
set -euo pipefail
npm ci --no-audit --no-fund
npm run validate:data
npm run test:access
npm run test:admin
npm run validate:legal
npm run icons:check
npm run check
