import Link from "next/link";
import { SiteNav } from "./site-nav";

const prompts = [
  "Look at the still. What is on screen?",
  "Find the laugh. Do not select it.",
  'Caption the product-in-hand shot: "Hold. Then turn."',
  "Shorten the landfill. Do not touch the laugh.",
  "Ask to mark the cut.",
];

const tools = [
  ["see_still", "Look at the shared picture."],
  ["get_project", "Read the whole cut."],
  ["find_shot", "Look up a still. Do not move."],
  ["select_shot", "Land on the same still."],
  ["set_caption", "One call. Pass query. Fails on a pin."],
  ["trim_shot", "Seconds or ms. Fails on a pin."],
  ["lock_shot", "Pin it. Writes then refuse."],
  ["set_brief", "Shared notes. JavaScript tool."],
  ["request_export", "Arm the clap."],
  ["confirm_export", "Commit after arm. Human can clap too."],
];

export function How() {
  return (
    <div className="min-h-[100dvh]">
      <SiteNav active="how" />
      <main className="mx-auto max-w-[560px] px-6 pb-28 pt-40">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-medium leading-[1.1] tracking-[-0.04em]">
          The page is the tool.
        </h1>
        <p className="mt-5 text-[16px] leading-7 text-[var(--mute)]">
          Open this studio in ChatGPT desktop on GPT-5.6 Sol or Terra. Site tools land on the still you can pin.
          Luna has WebMCP off.
        </p>

        <h2 className="mt-14 text-[15px] font-medium">Judge path</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-7 text-[var(--mute)]">
          <li>Open https://slate-webmcp.vercel.app/studio in the in-app browser.</li>
          <li>Ask what is on screen. Then which shot is pinned. It should be the laugh, 05-A.</li>
          <li>Caption the hand. One tool call. The picture should change on the page.</li>
          <li>Try to trim the laugh. The tool should refuse. The landfill should still trim.</li>
          <li>Mark the cut. Clap on the page. Export waits for a human.</li>
        </ol>

        <h2 className="mt-14 text-[15px] font-medium">Say this</h2>
        <ol className="mt-4 space-y-3">
          {prompts.map((line, index) => (
            <li key={line} className="text-[15px] leading-7 text-[var(--mute)]">
              <span className="tc text-[12px] text-[var(--ink)]">{String(index + 1).padStart(2, "0")}</span>
              <span className="ml-3">{line}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-[15px] font-medium">Tools</h2>
        <div className="mt-4 divide-y divide-white/8">
          {tools.map(([name, copy]) => (
            <div key={name} className="flex items-baseline justify-between gap-6 py-3">
              <p className="tc text-[13px]">{name}</p>
              <p className="text-right text-[13px] text-[var(--mute)]">{copy}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[15px] leading-7 text-[var(--mute)]">
          Every tool registers in JavaScript on the live page. ChatGPT does not read HTML forms. Same reducer. No second backend.
        </p>

        <Link
          href="/studio"
          className="mt-10 inline-flex rounded-full bg-[var(--white)] px-5 py-2.5 text-[14px] font-medium text-black"
        >
          Open studio
        </Link>
      </main>
    </div>
  );
}
