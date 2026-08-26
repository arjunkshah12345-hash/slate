import Link from "next/link";
import { SiteNav } from "./site-nav";

const tools = [
  ["get_project", "Read the whole cut, locks, playhead, last EDL"],
  ["get_selection", "Read the shot you both have selected"],
  ["select_shot", "Point at a shot. The human sees it"],
  ["play / pause / seek", "Share the playhead"],
  ["set_caption / set_title", "Write on an open shot"],
  ["trim_shot / split_shot / move_shot", "Cut unlocked time"],
  ["add_shot / duplicate_shot / delete_shot", "Grow or thin the board"],
  ["lock_shot / unlock_shot", "Pins unregister write tools"],
  ["set_brief / set_project_title", "Shared notes and name"],
  ["request_export / confirm_export", "Two-step clap"],
  ["undo / reset_cut", "Shared history"],
];

export function How() {
  return (
    <div className="min-h-[100dvh]">
      <SiteNav active="how" />
      <main className="mx-auto max-w-[800px] px-5 py-16">
        <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
          Tools on the live page
        </h1>
        <p className="mt-5 max-w-[52ch] text-[17px] leading-7 text-[var(--mute)]">
          Slate registers WebMCP tools on <code className="text-[var(--ink)]">document.modelContext</code>. They wrap
          the same reducer the buttons use. There is no second backend.
        </p>

        <div className="mt-12 overflow-hidden rounded-2xl ring-1 ring-[var(--line)]">
          {tools.map(([name, desc]) => (
            <div
              key={name}
              className="grid gap-1 border-b border-[var(--line)] px-5 py-4 last:border-b-0 md:grid-cols-[240px_1fr]"
            >
              <p className="tc text-[13px] text-[var(--ink)]">{name}</p>
              <p className="text-[14px] text-[var(--mute)]">{desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-[24px] font-semibold tracking-[-0.03em]">Judge path</h2>
        <ol className="mt-6 space-y-4 text-[15px] leading-6 text-[var(--mute)]">
          <li>
            <span className="text-[var(--ink)]">1. </span>
            Open{" "}
            <Link href="/studio" className="text-[var(--ink)] underline-offset-2 hover:underline">
              the studio
            </Link>{" "}
            in ChatGPT desktop (GPT-5.6 Sol or Terra) or Chrome with WebMCP testing on.
          </li>
          <li>
            <span className="text-[var(--ink)]">2. </span>
            Confirm Site tools lists Slate. The human UI works even if they do not.
          </li>
          <li>
            <span className="text-[var(--ink)]">3. </span>
            Ask: read the cut, keep the laugh, caption the hand, then mark.
          </li>
          <li>
            <span className="text-[var(--ink)]">4. </span>
            Clap on the page. Download the EDL.
          </li>
        </ol>

        <Link
          href="/studio"
          className="mt-10 inline-flex rounded-full bg-[var(--blue)] px-5 py-2.5 text-[14px] font-medium text-white"
        >
          Open studio
        </Link>
      </main>
    </div>
  );
}
