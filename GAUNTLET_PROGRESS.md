# Gauntlet Progress — Slate

## Goal

A judge-testable WebMCP directing studio: human + agent share one timed storyboard.

## Non-negotiables

- `document.modelContext.registerTool` + AbortController
- Visible agent presence
- Locks, undo, confirm-to-export
- Works without WebMCP
- Editorial film-set UI (`.impeccable.md`)
- No Task subagents; critics are isolated passes on this thread

## Quality bar

| Dimension | Reference | Verdict |
|---|---|---|
| Collaboration | OpenAI Margin | **Parity** — agent identity + last tool on the picture; pins are first-class |
| Timeline | Frame.io / Descript | **Reference wins** — we have playhead, lock, caption, hold slider; no waveforms or frame-accurate handles |
| WebMCP | Chrome + OpenAI site-tools docs | **Parity on contract** (7 unit tests). Live ChatGPT browser not yet proven |
| Visual | Editorial projection booth | **Ours wins vs AI-slop bar.** Distinctive. Not Frame.io-slick |
| Completeness | Challenge execution | **Local product works.** No public HTTPS URL yet |

## Harness

- `pnpm test` — 7/7 passing
- `pnpm build` — green
- `http://localhost:3100` — opened in Comet, first-screen capture in `docs/goals/slate-webmcp/captures/screen.png`

## Critic rounds

### R1 (live screenshot)

- Verdict: reference wins on trust/copy.
- Largest gap: "Lock this laugh" shown on Cold open; title said 30s on a 20s cut; no visible trim.
- Instruction: fix copy, duration honesty, add hold slider.

### R2 (after fix + tests)

- Verdict: collaboration parity; timeline still loses to Frame.io.
- Largest remaining gap: **no deployed HTTPS URL** for ChatGPT in-app browser, so WebMCP registration is unproven in the judging client.

## Workstreams

| Stream | Status | Evidence |
|---|---|---|
| Engine | done | `pnpm test` |
| WebMCP contract | done | toolsFor / applyTool tests |
| Studio UI | done | localhost:3100 + screen.png |
| Agent presence | done | Codex chip + last tool overlay |
| Export confirm | done | clap island + tests |
| Hosted URL | open | not deployed |

## UI reference

Shotbase (shotbase.com / @shotbaseapp): dark library, white inspector, blue play, pill filters, dotted canvas, framed preview, sidebar TOC.

## Largest remaining gap

Deploy to HTTPS and verify site tools in ChatGPT desktop (Sol/Terra).
