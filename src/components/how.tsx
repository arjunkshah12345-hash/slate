import Link from "next/link";
import { SiteNav } from "./site-nav";

const tools = [
  ["Read", "get_project, get_selection"],
  ["Point", "select_shot, seek, play, pause"],
  ["Write", "caption, title, trim, split, move, add, copy, delete"],
  ["Stop", "lock_shot unregisters writes"],
  ["Clap", "request_export then confirm_export"],
];

export function How() {
  return (
    <div className="dots min-h-[100dvh]">
      <SiteNav active="how" />
      <main className="mx-auto max-w-[640px] px-5 pb-20 pt-28">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
          Tools on the still
        </h1>
        <p className="mt-5 max-w-[42ch] text-[16px] leading-7 text-[var(--mute)]">
          WebMCP tools wrap the same reducer the pins use. Locked shots drop write tools. Export waits for a clap.
        </p>
        <div className="mt-12 space-y-6">
          {tools.map(([title, body]) => (
            <div key={title}>
              <p className="text-[15px] font-medium">{title}</p>
              <p className="mt-1 tc text-[13px] text-[var(--mute)]">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-[15px] leading-7 text-[var(--mute)]">
          Open the studio in ChatGPT desktop on GPT-5.6 Sol or Terra. Ask it to keep the laugh and caption the hand.
        </p>
        <Link href="/studio" className="mt-8 inline-flex text-[15px] text-[var(--ink)] underline-offset-4 hover:underline">
          Open studio
        </Link>
      </main>
    </div>
  );
}
