# Ship Slate for the WebMCP Challenge

## Objective

Ship a working, hosted-ready **Slate** directing studio: a storyboard timeline that becomes meaningfully better when a person and a ChatGPT agent use it together via WebMCP. The live app must be judge-testable in ChatGPT's in-app browser or Chrome with WebMCP enabled.

## Original Request

`/goal` build the product. Use `/gauntlet-loop` so the product is amazing.

## Intake Summary

- Input shape: `existing_plan`
- Audience: WebMCP Challenge judges + founders/creators pairing with ChatGPT
- Authority: `approved` (user accepted Slate and ordered the build)
- Proof type: `demo` + `test` + `artifact`
- Completion proof: running studio with sample cut, WebMCP tools that mutate the same objects the human can drag/lock/play, confirm-to-export, tests green, UI verified in a real browser/viewport
- Likely misfire: a pretty landing page, a Figma/3D/doc clone, or `registerTool` bolted onto a todo app
- Blind spots considered: ChatGPT in-app browser limits, no real video codec farm in 9 days, gauntlet critics emulated on this thread (no Task subagents)
- Existing plan facts:
  - Product is Slate (timed storyboard, not a full NLE)
  - `document.modelContext.registerTool` (not deprecated `navigator`)
  - Feature-detect; human UI works without WebMCP
  - GitHub account `arjunkshah12345-hash` if a repo is created
  - Do not clone official showcase (3D, Margin, crossword, Wandernote, Duckboard)
  - UI reference is Shotbase (dark workspace, white inspector, blue actions)

## Goal Kind

`existing_plan`

## Current Tranche

Gauntlet Loop: harness → engine → studio UI → inspect running artifact → critic → close largest gap → repeat until the bar is met or improvement stalls.

## Non-Negotiable Constraints

- No Task/Cursor subagents (machine-wide + goal skill). Hats on this thread; critics are fresh isolated passes.
- WebMCP via `document.modelContext.registerTool` with AbortController lifecycle
- Selection-aware / lock-aware tool registry
- Confirm before export
- Open-source license when the repo is published
- No secrets in the repo
- Distinctive editorial film-set UI (see `.impeccable.md`) — no Inter, no neon AI palette
- Preserve correctness while raising visual quality

## Stop Rule

Stop only when a final audit proves the full original outcome is complete.
Do not stop after planning or a single verified slice if more safe work remains.
Blocked slices get a receipt; continue other safe local work.

## Canonical Board

`docs/goals/slate-webmcp/state.yaml` wins over this charter for task status and completion truth.

## Quality Bar (Gauntlet)

- Collaboration: OpenAI Margin (agent has an identity; actions are visible)
- Timeline craft: Frame.io / Descript density — playhead, clip blocks, lock, caption, playback
- WebMCP: Chrome + OpenAI site-tools docs (dynamic tools, readOnlyHint, confirmation, abort)
- Visual: editorial projection booth, not a SaaS template
- Independent critic inspects the running page, not the builder's story

## Run Command

```text
/goal Follow docs/goals/slate-webmcp/goal.md.
```

## PM Loop

1. Read charter + `state.yaml`
2. Re-check intake and misfire
3. One active task only
4. Wear Scout / Judge / Worker / PM hat
5. Write receipt; update board
6. Activate safe Worker and continue
7. Finish only with `full_outcome_complete: true`
