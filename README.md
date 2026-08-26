# Slate

A directing studio for people and agents. WebMCP tools land on the same timeline you can pin, play, and clap.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/). Visual language after [Shotbase](https://shotbase.com): dark library, white inspector, blue actions.

## Why this is a WebMCP product

Agents are bad at timeline UIs. Screenshots and DOM clicking miss in-points, locks, and captions. Slate exposes the cut as tools on the live page:

- The human and the agent share one playhead, one selection, one set of pins.
- Locked shots unregister write tools. The laugh cannot be trimmed until someone unlocks it.
- Export is a clap: `request_export` only arms the cut. `confirm_export` or the on-page clap commits it.
- The brief is also a declarative HTML form (`toolname="set_brief"`).
- Tools wrap the same reducer the UI uses. There is no second backend.

## Run

```bash
pnpm install
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To test site tools: latest ChatGPT desktop (GPT-5.6 Sol or Terra) in the in-app browser, or Chrome with `chrome://flags/#enable-webmcp-testing`.

## Demo prompts

Open Slate in ChatGPT’s browser, then:

1. `Read the cut and tell me which shot is pinned.`
2. `Caption the product-in-hand shot: "Hold. Then turn."`
3. `Shorten the landfill. Do not touch the laugh.`
4. `Play the cut from the start.`
5. `Ask to mark the cut.` — then clap on the page, or confirm.

Rehearse without ChatGPT using the Agent desk on the inspector card.

## Stack

Next.js, React, WebMCP (`document.modelContext.registerTool`), Vitest.

## License

MIT
