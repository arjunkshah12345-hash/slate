"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HeroCut } from "./hero-cut";
import { SiteNav } from "./site-nav";

const ease = [0.32, 0.72, 0, 1] as const;

export function Landing() {
  const reduce = useReducedMotion();
  const enter = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease },
      };

  return (
    <div className="min-h-[100dvh]">
      <SiteNav active="home" />

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1fr_1.15fr] md:pt-16">
        <motion.div {...enter}>
          <h1 className="max-w-[11ch] text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[1.08] tracking-[-0.045em] pb-1">
            Cut it with the agent.
          </h1>
          <p className="mt-5 max-w-[36ch] text-[17px] leading-7 text-[var(--mute)]">
            A directing studio where ChatGPT and you share one playhead, one pin, one clap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/studio"
              className="rounded-full bg-[var(--blue)] px-5 py-2.5 text-[14px] font-medium text-white transition duration-300 ease-[var(--ease)] active:scale-[0.98]"
            >
              Open studio
            </Link>
            <Link
              href="/how"
              className="rounded-full bg-[var(--bg-raise)] px-5 py-2.5 text-[14px] font-medium ring-1 ring-[var(--line)]"
            >
              See the tools
            </Link>
          </div>
        </motion.div>
        <motion.div
          className="dots rounded-[28px] p-5 md:p-7"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease }}
        >
          <HeroCut />
        </motion.div>
      </section>

      <section className="border-y border-[var(--line)]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-3 px-5 py-6 text-[13px] text-[var(--mute)]">
          <span className="text-[var(--ink)]">Built for</span>
          <Mark>OpenAI WebMCP</Mark>
          <Mark>ChatGPT desktop</Mark>
          <Mark>Chrome site tools</Mark>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
        <h2 className="max-w-[16ch] text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[1.1] tracking-[-0.04em]">
          Pins are real. The laugh stays until you unpin it.
        </h2>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-7 text-[var(--mute)]">
          Locked shots unregister write tools. Codex can read the cut, play it, and caption open plates. It cannot
          trim a pin. Export waits for a second clap on the page.
        </p>
        <div className="mt-12 grid gap-3 md:grid-cols-5">
          {[
            ["Read", "get_project, get_selection"],
            ["Point", "select_shot, seek, play"],
            ["Write", "caption, trim, split, move"],
            ["Stop", "lock_shot unregisters writes"],
            ["Clap", "request_export, then confirm"],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-[var(--bg-raise)] px-4 py-5 ring-1 ring-[var(--line)]">
              <p className="text-[15px] font-semibold">{title}</p>
              <p className="mt-2 text-[13px] leading-5 text-[var(--mute)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--bg-raise)]">
        <div className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
          <h2 className="text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold tracking-[-0.04em]">
            Same objects. Two hands.
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2">
            <Beat n="01" title="You pin the laugh">
              Hit L, or the pin on the inspector. Write tools for that shot disappear from the live page.
            </Beat>
            <Beat n="02" title="Codex captions the hand">
              Ask it to write on an open shot. The caption lands on the still you are both looking at.
            </Beat>
            <Beat n="03" title="It tries the landfill">
              Trim and reorder work on unlocked shots. Undo is shared. History is the same stack.
            </Beat>
            <Beat n="04" title="Someone has to clap">
              request_export only arms the cut. confirm_export or the on-page clap commits the EDL.
            </Beat>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 md:py-28">
        <h2 className="text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold tracking-[-0.04em]">Say this in ChatGPT</h2>
        <p className="mt-4 max-w-[48ch] text-[16px] leading-7 text-[var(--mute)]">
          Open the studio in ChatGPT desktop on GPT-5.6 Sol or Terra. Then talk to the page.
        </p>
        <div className="mt-10 space-y-3">
          {[
            "Read the cut and tell me which shot is pinned.",
            'Caption the product-in-hand shot: "Hold. Then turn."',
            "Shorten the landfill. Do not touch the laugh.",
            "Play the cut from the start.",
            "Ask to mark the cut.",
          ].map((line, i) => (
            <p
              key={line}
              className="rounded-2xl bg-[var(--bg-raise)] px-5 py-4 text-[15px] leading-6 ring-1 ring-[var(--line)]"
            >
              <span className="tc mr-3 text-[12px] text-[var(--mute)]">{String(i + 1).padStart(2, "0")}</span>
              {line}
            </p>
          ))}
        </div>
        <Link
          href="/studio"
          className="mt-10 inline-flex rounded-full bg-[var(--blue)] px-5 py-2.5 text-[14px] font-medium text-white"
        >
          Open the Northwind cut
        </Link>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-[var(--mute)]">
          <p>Slate. MIT. A cut you can hold.</p>
          <div className="flex gap-4">
            <Link href="/studio">Studio</Link>
            <Link href="/how">How</Link>
            <a href="https://github.com/arjunkshah12345-hash/slate">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-[var(--ink)]">{children}</span>;
}

function Beat({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li>
      <p className="tc text-[12px] text-[var(--mute)]">{n}</p>
      <p className="mt-2 text-[18px] font-semibold tracking-[-0.02em]">{title}</p>
      <p className="mt-2 max-w-[46ch] text-[15px] leading-6 text-[var(--mute)]">{children}</p>
    </li>
  );
}
