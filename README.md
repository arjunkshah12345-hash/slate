# Slate

A directing studio for people and agents. WebMCP tools land on the same still you can pin, play, and clap.

**Live:** [https://slate-webmcp.vercel.app](https://slate-webmcp.vercel.app)  
**Studio:** [https://slate-webmcp.vercel.app/studio](https://slate-webmcp.vercel.app/studio)  
**How:** [https://slate-webmcp.vercel.app/how](https://slate-webmcp.vercel.app/how)  
**Repo:** [github.com/arjunkshah12345-hash/slate](https://github.com/arjunkshah12345-hash/slate)

Built for the [WebMCP Challenge](https://webmcp.devpost.com/).

## Why this is a WebMCP product

Agents are bad at timeline UIs. Screenshots miss in-points, locks, and captions. Slate exposes the cut as tools on the live page:

- The human and the agent share one playhead, one selection, one set of pins.
- Locked shots unregister write tools. The laugh cannot be trimmed until someone unlocks it.
- Export is a clap. `request_export` only arms the cut. `confirm_export` is an HTML form with no autosubmit, so a human still has to mean it.
- The brief is a declarative HTML form (`toolname="set_brief"`). Timeline tools register with `document.modelContext.registerTool`.
- Tools wrap the same reducer the UI uses. There is no second backend.

## Run

```bash
pnpm install
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, `/studio` for the cut, and `/how` for the judge path.

To test site tools: latest ChatGPT desktop (GPT-5.6 Sol or Terra) in the in-app browser, or Chrome with `chrome://flags/#enable-webmcp-testing`.

## Demo prompts

Open Slate in ChatGPT’s browser, then:

1. `Read the cut and tell me which shot is pinned.`
2. `Find the laugh. Do not select it.`
3. `Caption the product-in-hand shot: "Hold. Then turn."` — one tool call, even if you are on the laugh.
4. `Shorten the landfill. Do not touch the laugh.`
5. `Ask to mark the cut.` — then clap on the page, or confirm.

Rehearse without ChatGPT using Desk on the notes sheet.

## Stack

Next.js, React, Geist, WebMCP (`document.modelContext.registerTool` + HTML `toolname` forms), Vitest.

## License

MIT
