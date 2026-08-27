"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { sampleProject } from "@/lib/sample";
import { formatClock, totalDuration } from "@/lib/format";
import type { Shot } from "@/lib/types";
import { BlurPopUp, BlurPopUpByWord } from "./blur-pop-up";
import { HeroCut } from "./hero-cut";
import { Plate } from "./plate";
import { SiteNav } from "./site-nav";

const DitherGradient = dynamic(
  () => import("./dither-kit/gradient").then((mod) => ({ default: mod.DitherGradient })),
  { ssr: false },
);

const ease = [0.16, 1, 0.3, 1] as const;

export function Landing() {
  const reduce = useReducedMotion();
  const cut = sampleProject();

  return (
    <div className="min-h-[100dvh]">
      <SiteNav active="home" />

      <section className="mx-auto flex min-h-[100dvh] w-full max-w-[820px] flex-col items-center justify-center px-6 pb-20 pt-28 text-center">
        <h1 className="text-balance text-[clamp(2.6rem,7vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.055em]">
          <BlurPopUpByWord text="Cut with" className="block" />
          <BlurPopUpByWord text="the agent." className="block" delay={0.2} />
        </h1>
        <BlurPopUp delay={0.55}>
          <p className="mt-5 max-w-[34ch] text-[15px] leading-6 text-[var(--mute)]">
            One still. You pin. Codex writes. Someone has to clap.
          </p>
          <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[var(--mute)]">
            <span className="live-dot" />
            <span className="tc">NORTHWIND · 00:20</span>
          </p>
        </BlurPopUp>
        <BlurPopUp delay={0.7} className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex rounded-full bg-[var(--white)] px-5 py-2.5 text-[14px] font-medium text-black transition duration-500 ease-[var(--ease)] hover:-translate-y-px active:scale-[0.98]"
          >
            Open studio
          </Link>
          <Link
            href="/how"
            className="inline-flex rounded-full px-4 py-2.5 text-[14px] text-[var(--mute)] transition duration-500 ease-[var(--ease)] hover:text-[var(--ink)]"
          >
            How it works
          </Link>
        </BlurPopUp>
        <motion.div
          className="mt-16 w-full"
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.85, ease }}
        >
          <HeroCut />
        </motion.div>
      </section>

      <DriftRail shots={cut.shots} />

      <CutSteps shots={cut.shots} />

      <Lookbook shots={cut.shots} duration={totalDuration(cut.shots)} />

      <LockShot shot={cut.shots.find((item) => item.id === "shot_5") ?? cut.shots[0]} />

      <Tools />

      <Close />

      <footer className="mx-auto flex max-w-[820px] items-center justify-between px-6 py-10 text-[13px] text-[var(--mute)]">
        <span className="flex items-center gap-2">
          Slate
          <span className="tc text-[11px]">MIT</span>
        </span>
        <div className="flex items-center gap-5">
          <Link href="/how" className="transition-colors hover:text-[var(--ink)]">
            How
          </Link>
          <Link href="/studio" className="transition-colors hover:text-[var(--ink)]">
            Studio
          </Link>
          <a
            href="https://github.com/arjunkshah12345-hash/slate"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-[var(--ink)]"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function DriftRail({ shots }: { shots: Shot[] }) {
  const reduce = useReducedMotion();
  const row = [...shots, ...shots];

  return (
    <section className="py-20">
      <Reveal className="mx-auto mb-8 max-w-[820px] px-6 text-center">
        <p className="text-[13px] text-[var(--mute)]">NORTHWIND · 00:20</p>
      </Reveal>
      <div className="rail-mask overflow-hidden">
        <div className={`flex w-max gap-2 px-6 ${reduce ? "" : "rail-track"}`}>
          {row.map((shot, index) => (
            <div key={`${shot.id}-${index}`} className="still still-lift w-[220px] shrink-0 sm:w-[280px]">
              <div className="aspect-video">
                <Plate shot={shot} playing={false} compact thumb />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CutSteps({ shots }: { shots: Shot[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const steps = [
    {
      title: "You pin.",
      copy: "A locked shot stays in the cut. Codex can read it. Write tools fall off.",
      shot: shots.find((item) => item.id === "shot_5") ?? shots[0],
    },
    {
      title: "Codex writes.",
      copy: "Caption. Trim. Split. Only on what is still open. Same still you can see.",
      shot: shots.find((item) => item.id === "shot_3") ?? shots[0],
    },
    {
      title: "Someone claps.",
      copy: "Export arms, then waits. The page will not ship a cut without a human.",
      shot: shots.find((item) => item.id === "shot_8") ?? shots[0],
    },
  ];

  return (
    <section className="cv mx-auto grid max-w-[1100px] gap-10 px-6 py-28 lg:grid-cols-2 lg:items-start lg:gap-20">
      <div>
        {steps.map((step, index) => (
          <Step key={step.title} onEnter={() => setActive(index)}>
            <p className="text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-[-0.045em]">{step.title}</p>
            <p className="mt-4 max-w-[34ch] text-[16px] leading-7 text-[var(--mute)]">{step.copy}</p>
            <div className="still still-lift mt-8 aspect-video lg:hidden">
              <Plate shot={step.shot} playing={false} compact thumb />
            </div>
          </Step>
        ))}
      </div>
      <div className="sticky top-28 hidden lg:block">
        <div className="still still-lift relative aspect-video overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[active].title}
              className="absolute inset-0"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.55, ease }}
            >
              <Plate shot={steps[active].shot} playing compact />
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-4 text-[13px] text-[var(--mute)]">
          {steps[active].shot.slate} · {steps[active].shot.title}
        </p>
      </div>
    </section>
  );
}

function Step({ children, onEnter }: { children: ReactNode; onEnter: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });

  useEffect(() => {
    if (inView) onEnter();
  }, [inView, onEnter]);

  return (
    <div ref={ref} className="flex min-h-[72vh] flex-col justify-center py-10">
      {children}
    </div>
  );
}

function Lookbook({ shots, duration }: { shots: Shot[]; duration: number }) {
  return (
    <section className="cv px-6 py-24">
      <Reveal className="mx-auto max-w-[1100px]">
        <p className="text-[13px] text-[var(--mute)]">The cut</p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.045em]">
          Eight stills. Twenty seconds.
        </h2>
      </Reveal>
      <div className="mx-auto mt-12 flex max-w-[1100px] gap-3 overflow-x-auto pb-2">
        {shots.map((shot, index) => (
          <Reveal key={shot.id} delay={index * 0.04} className="w-[200px] shrink-0 sm:w-[240px]">
            <div className="still still-lift aspect-video">
              <Plate shot={shot} playing={false} compact thumb />
            </div>
            <p className="mt-3 text-[14px]">{shot.title}</p>
            <p className="tc text-[12px] text-[var(--mute)]">
              {shot.slate} · {formatClock(shot.durationMs)}
              {shot.locked ? " · Pin" : ""}
            </p>
          </Reveal>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-[1100px] tc text-[12px] text-[var(--mute)]">{formatClock(duration)}</p>
    </section>
  );
}

function LockShot({ shot }: { shot: Shot }) {
  return (
    <section className="cv px-6 py-28">
      <Reveal className="mx-auto max-w-[880px]">
        <div className="still still-lift aspect-video">
          <Plate shot={shot} playing />
        </div>
        <h2 className="mt-10 text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-[-0.045em]">
          Keep the laugh.
        </h2>
        <p className="mt-4 max-w-[40ch] text-[16px] leading-7 text-[var(--mute)]">
          Shot 05-A is pinned in the sample. Try to trim it from ChatGPT. The tool will not be there.
        </p>
      </Reveal>
    </section>
  );
}

function Tools() {
  const rows = [
    ["select_shot", "Share the still you are both on."],
    ["set_caption", "Write only on what is open."],
    ["trim_shot", "Hold a beat to length."],
    ["lock_shot", "Pin it and the write tools drop."],
    ["request_export", "Arm the clap."],
    ["confirm_export", "A human has to mean it."],
  ];

  return (
    <section className="cv px-6 py-24">
      <Reveal className="mx-auto max-w-[640px]">
        <p className="text-[13px] text-[var(--mute)]">WebMCP</p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.045em]">
          The page is the tool.
        </h2>
      </Reveal>
      <div className="mx-auto mt-12 max-w-[640px] divide-y divide-white/8">
        {rows.map(([name, copy], index) => (
          <Reveal key={name} delay={index * 0.05} className="tool-row flex items-baseline justify-between gap-6 py-4">
            <p className="tc text-[13px]">{name}</p>
            <p className="text-right text-[14px] text-[var(--mute)]">{copy}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Close() {
  return (
    <section id="close" className="relative overflow-hidden px-6 py-32 text-center">
      <DitherGradient from="grey" direction="up" cell={5} opacity={0.16} bloom="off" />
      <Reveal className="relative">
        <h2 className="text-[clamp(2.4rem,6vw,4rem)] font-medium tracking-[-0.05em]">Someone has to clap.</h2>
        <p className="mx-auto mt-5 max-w-[32ch] text-[16px] leading-7 text-[var(--mute)]">
          Open it in ChatGPT desktop on GPT-5.6 Sol or Terra. Or just cut it here.
        </p>
        <Link
          href="/studio"
          className="mt-8 inline-flex rounded-full bg-[var(--white)] px-5 py-2.5 text-[14px] font-medium text-black transition duration-500 ease-[var(--ease)] hover:-translate-y-px active:scale-[0.98]"
        >
          Open studio
        </Link>
        <p className="mt-5 tc text-[11px] text-[var(--mute)]">space to play · L to pin · clap to mark</p>
      </Reveal>
    </section>
  );
}
