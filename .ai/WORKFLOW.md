# Shared interactive workflow

## Start

Read PROJECT.md and STATE.md, then `CLAUDE.md`, whose rules win over this file on content, media, motion and deployment. Retrieve the relevant Issues/PRs. Consult `docs/PROJECT_CONTEXT.md` and `docs/BLOCKED_TODOS.md` as needed. Summarize the current state and recommend the next step; a queued next task is not permission to start.

Before promising visual planning/review, actually retrieve and inspect one relevant image or page. GitHub metadata, base64 text and the Work mode label are not proof of image-viewing capability. Both live sites are public, so `https://dev.nextvisionfilms.com` and `https://www.nextvisionfilms.com` can be opened directly when a session has a browser. Discover the session's available tools before declaring a route unavailable. Do not ask the user to attach screenshots/videos as the normal fallback. Tool availability is supplied by the app/session, not granted by this document.

Frontend and design work also requires the `frontend-design` skill (`CLAUDE.md` §5) and reading `docs/DESIGN_V2_ROLLOUT.md`.

## Model and effort recommendations
Before substantial work, assess task complexity and the current model/effort when that setting is reliably available. Luna Light is the economical starting point for routine questions, status checks, simple retrieval and small updates. Consider Sol Medium for substantial feature planning, conflicting requirements and independent code review. These are starting recommendations, not a requirement to use a specific model for every task.

If the current model and effort are already suitable, proceed silently: do not ask for confirmation, recommend switching, or require the user to say ready. A suitable stronger setting does not require a downgrade. Do not repeat a recommendation for ordinary follow-ups; reassess only when the task materially changes.

Only when a different setting is materially warranted, explain briefly: "For this task, I recommend Sol Medium because [specific reason]. Please switch and say ready before I proceed." Wait before the substantial work that depends on that switch. Never claim to switch models yourself. If the current setting is unavailable, do not guess or assert a mismatch; routine work should proceed, and substantial work may include a conditional recommendation asking the user to switch only if not already using a suitable setting. Model guidance never authorizes implementation, corrections, merges or deployments.

## Roles and approval
Planning and review are roles, not mandatory mode switches. The user may stay in one capable Work conversation for planning, approved Issue publication and independent review of Claude's implementation. Chat is an optional planning surface. A new conversation retrieves shared records rather than requiring transcript copying.

ChatGPT Chat is the interactive planning surface: requirements, priorities, mockup discussion, and plan approval. It retrieves shared GitHub records through the available connection. Publishing an approved Issue requires a write-capable tool in that session; otherwise perform the publication in Work after retrieving the approved record, and report the limitation.

ChatGPT Work is the independent review surface for this workflow: retrieve Issue/PR changes and evidence, inspect media and the deployed pages, and perform approved GitHub housekeeping. The Work label alone does not guarantee tool access; verify the session's actual capabilities. Do not silently treat sampled frames as continuous video/audio review.

Claude Code implements and tests interactively. ChatGPT owns independent review verdicts and may direct enumerated in-scope corrections without asking the user to approve the review feedback. The user retains final acceptance and approval of plans/scope changes, merges, and deployments. No autonomous Claude runs, extra agents, or automatic correction loops. Optional Codex plugin use is restricted to user-directed read-only review commands.

## What counts as a deployment here

Merging is deploying. A push to `dev` deploys the dev Worker, and a push to `master` deploys the live site, so both are merges and deployments reserved to the user. A push to a feature branch deploys nothing and runs no CI: the workflows trigger only on `dev` and `master`, so `npm run verify` on the feature branch is the only gate before merge.

The owners publish to `master` themselves from the admin. That is theirs to do and needs nothing from this workflow, but it means `master` moves on its own: check it before planning a release.

Never touch DNS, attach a domain, make a bucket public, or create a database or CMS without an explicit instruction (`CLAUDE.md` §10).

## Persistent Issue-start authorization

A clear user instruction to start a named, approved Issue authorizes work within that Issue's scope. That authorization remains valid when work or its report moves between Claude and ChatGPT conversations; the user does not need to repeat it to ChatGPT or reauthorize it after a review. ChatGPT must check the available conversation context and task records and must not ask whether Claude should start an Issue when the user has already directed Claude to start it. A review verdict evaluates the work; it neither revokes nor creates the user's start authorization. For an Implementation Issue, starting the approved task is the user's request to commit and push (`CLAUDE.md` §7), and includes normal in-scope delivery: scoped commits, pushing its feature branch, opening/updating a draft PR, and publishing evidence the Issue requires. Do not ask separately for those steps unless the Issue explicitly withholds them. A plan-only Issue still authorizes only its stated investigation/report until the owner approves the plan and directs implementation. Starting a different Issue or milestone, changing scope, merging, and deploying remain subject to owner direction.

Outside an approved Issue, `CLAUDE.md` §7 applies as written: commit or push only when the user asks.

## Plan
Discuss requirements, exact mockup or storyboard versions, scope, acceptance criteria, tests, and screenshot/video scenarios. Explicit user approval of the finished plan authorizes creating its GitHub Issue; return the Issue link. Do not claim approval based on a draft or assistant recommendation.

A plan that changes published copy must say so: copy changes are reviewed diffs against the archive and need owner approval (`CLAUDE.md` §2). Never invent content; write `UNKNOWN` and raise it.

## Implement
The user directs Claude to start an approved Implementation Issue. Inspect local changes and preserve unrelated work. Use a feature branch targeting `dev`; never target `master` and never change the repository's branch strategy. That start instruction authorizes the scoped work, tests, commits, push to the feature branch, and opening/updating a draft PR needed for delivery; do not ask separately for these routine steps unless the Issue explicitly excludes them. Do not stash, reset, delete, or commit unrelated changes. Merges, deployments, scope/plan changes and starting another task remain owner decisions.

Run `npm run verify` before committing. Use Conventional Commits, one logical change per commit, and update `docs/PROJECT_CONTEXT.md` and `docs/BLOCKED_TODOS.md` in the same work when they change. Never commit secrets or media binaries.

## Evidence and handoff
Publish a PR with the Issue link, summary, actual test commands/results, known limitations, and an evidence index. Each screenshot or video identifies its scenario, tested commit, capture environment, and retrieval link; videos also identify duration and relevant timestamps. Distinguish tested commit from later documentation-only commits. Preserve original video; extracted frames are supplementary. Local paths and artifact listings are not proof that a remote reviewer can inspect media. If retrieval fails, report the blocker; do not ask the user to repeatedly attach captures as the normal workflow.

**This repository is public, so Issues, PRs and their comments are public.** Evidence and reports must not contain secrets, the contact candidates or personal details that are not already published, unapproved copy, or owner media that has not been released. Media never goes into Git. No private evidence route has been set up or tested for this repository; until one exists, report that as a limitation rather than publishing something that should stay private.

Update STATE.md with the PR and review status. Finish with links and blockers, then wait. Ask questions for genuine blockers, not optional next-task suggestions.

### Publish before stopping, including when blocked
An approved investigation or implementation task includes permission to publish its factual progress, results, questions and blocker report to that task's GitHub Issue or PR. Do not ask separately whether to put those findings on the record. This reporting permission alone does not authorize changing the approved specification, widening scope, merging, or deploying. Review feedback and in-scope corrections are governed by the ChatGPT review authority below.

Before ending a session, Claude must publish one of: an investigation result, an implementation/test/evidence report, or a blocker report. Use the active PR when present, otherwise the approved task Issue. A blocker report states the approved scope, findings, affected references, proposed options, work performed/not performed, and the exact user decision needed. Publish the findings even if a scope question remains unanswered; ask that decision in the interactive session as well. Return the comment/PR link. Do not leave the only copy in the Claude transcript or say "I can post this if you want."

If publication fails, report that specific failure and retain the report locally for retry. Do not claim a GitHub handoff occurred. An uncertain write requires checking for the existing comment before retrying to avoid duplicates.

## Independent review and close-out

### ChatGPT review authority and decision

When the user asks ChatGPT to review Claude's pasted report or GitHub work, ChatGPT is the reviewer and must make the review decision. Do not defer the verdict, ask the user to choose a status, or ask permission to send review feedback to Claude. Give a concise evidence-based explanation, then exactly one self-contained copy-paste block with one selected status:

```text
REVIEW STATUS: [ACCEPTED | NEED CHANGES | DECLINED]
SCOPE: [Issue/PR and approved scope reviewed]
FINDINGS: [Specific evidence and what was/was not verified]
REQUIRED CHANGES: [Actionable in-scope corrections, or "None"]
[End the copy-paste block here; do not include a CLAUDE NEXT ACTION field.]
```

Replace the bracketed status with exactly one of `ACCEPTED`, `NEED CHANGES`, or `DECLINED`; never leave the alternatives or placeholders in the final review block. Keep the copy-paste block limited to the verdict and review findings/corrections; omit `CLAUDE NEXT ACTION`. After it, separately recommend the concrete next step based on the live Issue and PR. If the user accepts the result and the next step is delivery/continuation, give an exact Claude prompt, for example: `If you accept, tell Claude: "Commit and push, merge PR #X into dev, close Issue #Y, and start next task #Z."` Fill in the real PR, Issue, and next task; omit actions already completed or inapplicable. This is guidance for the user to authorize, not authorization by ChatGPT.

- **ACCEPTED:** ChatGPT's review finds the submitted work meets the approved scope and review criteria. This is the reviewer verdict only; the user decides final acceptance. Do not include a `CLAUDE NEXT ACTION` line in the copy-paste review block. After the block, recommend the concrete next step as above. Avoid generic stop/wait warnings.
- **NEED CHANGES:** ChatGPT identifies specific corrections needed to meet the already-approved scope. This verdict itself authorizes Claude to make and verify those enumerated, in-scope corrections and report back for another review. Do not ask the user to approve the correction list or separately authorize publishing it to Claude. If a correction would expand/change scope or require a merge or deployment, omit that action from the correction instruction and identify the exact owner decision needed. Commits, pushes, and updating the active draft PR to deliver listed in-scope corrections are included; do not gate them again.
- **DECLINED:** ChatGPT finds the submission unacceptable as presented and states why and what must happen next. Do not disguise a required in-scope correction as a user decision. Ask the user only where the next step truly requires new scope, a new plan, or a separately reserved decision.

The user retains final authority over acceptance of the overall result and any action explicitly reserved to them, including merges, deployments, scope/plan changes, and starting a new task or milestone. ChatGPT owns the review verdict and in-scope review corrections. Never claim tests, media inspection, or GitHub checks were performed unless they actually were.

Do not mark work blocked or instruct Claude to await user direction solely because the user has not repeated an Issue-start instruction in the ChatGPT conversation. Check the task context and GitHub record for the existing start direction and carry it forward. A review verdict does not cancel that authorization. If a real scope or approval boundary is reached, identify only that boundary and direct Claude to continue any independent work that remains authorized.

When the user says "Claude answered", "Claude finished", "Claude done" or equivalent, refresh the active task pointers and retrieve the active Issue, linked PR(s), comments and reviews automatically. Use the task already established in the conversation, then verify against GitHub; STATE.md can lag. Inspect the new factual report against the approved scope before recommending any action. Do not default to asking the user to paste Claude's reply or provide a link already discoverable from the active task.

If there is no published report, say that GitHub has no new report and give a short instruction for Claude to publish it to the known Issue/PR. This is a missing publication, not a reason to request pasted text. If records cannot be accessed, identify the missing access; if multiple active tasks remain genuinely ambiguous after checking, ask only which task. Handle truncated tool output with targeted/paginated reads rather than claiming full review or requesting copied transcripts.

ChatGPT Work retrieves the approved Issue, exact references, PR changes, tests, and evidence. Chat planning sessions use GitHub review records to pick up the outcome without pasted reports; do not assume automatic synchronization of chat transcripts. Explicitly distinguish code inspection, reported tests, personally executed checks, image inspection, and video inspection. ChatGPT publishes its review verdict and any in-scope correction instructions directly to Claude using the copy-paste block above. Do not wait for the user to approve a reviewer verdict or correction list. User direction remains required for changing scope or the plan, starting another task, merging, or deploying.

After the user accepts the final result and the merge is confirmed, close the Issue if still open and update current/next pointers. The user's final acceptance authorizes this housekeeping; merging and deploying still require explicit instructions. A passing ChatGPT review is not the user's final acceptance and does not complete a task.

## Releasing to the live site

A release is a separate owner decision, even after a task is accepted and merged into `dev`. When directed: merge `master` into `dev` first so the owners' edits are kept, let the `dev` deploy finish, then merge `dev` into `master` with a merge commit, never a squash or rebase. Confirm the live result afterwards. `docs/HANDOVER.md` §1 has the commands.

## Record locations
Task plans: GitHub Issues. Reports, evidence, and approved review feedback: PRs. STATE.md: pointers and blockers. Open items: `docs/BLOCKED_TODOS.md`. Lasting decisions and history: `docs/PROJECT_CONTEXT.md`. Detailed specifications: the documents indexed in PROJECT.md. There is no Roadmap Issue or milestone set yet; if the user asks for one, record it in STATE.md. Shared facts belong here or in GitHub records; local assistant memory is a convenience, not the authoritative record.

At close-out, identify cleanup candidates without deleting evidence automatically; retain approved references and obtain approval for the exact deletion batch.
