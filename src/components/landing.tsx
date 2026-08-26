"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { SiteNav } from "./site-nav";

const tiles = [
  { src: "/plates/plate-laugh.png", className: "left-[8%] top-[18%] w-[22%] rotate-[-6deg]" },
  { src: "/plates/plate-hand.png", className: "right-[10%] top-[14%] w-[20%] rotate-[5deg]" },
  { src: "/plates/plate-landfill.png", className: "left-[6%] bottom-[16%] w-[18%] rotate-[4deg]" },
  { src: "/plates/plate-face.png", className: "right-[8%] bottom-[18%] w-[19%] rotate-[-4deg]" },
  { src: "/plates/plate-cut.png", className: "left-[28%] top-[10%] w-[14%] rotate-[2deg]" },
  { src: "/plates/plate-proof.png", className: "right-[28%] bottom-[12%] w-[15%] rotate-[-3deg]" },
];

export function Landing() {
  const reduce = useReducedMotion();

  return (
    <div className="dots relative min-h-[100dvh] overflow-hidden">
      <SiteNav active="home" />

      {tiles.map((tile) => (
        <motion.img
          key={tile.src}
          src={tile.src}
          alt=""
          className={`pointer-events-none absolute hidden rounded-2xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:block ${tile.className}`}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-balance text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[1.05] tracking-[-0.05em]">
          Cut with the agent.
        </h1>
        <p className="mt-5 max-w-[28ch] text-[16px] leading-7 text-[var(--mute)]">
          One board of stills. You pin. Codex writes. Someone has to clap.
        </p>
        <Link
          href="/studio"
          className="mt-8 rounded-full bg-[var(--blue)] px-5 py-2.5 text-[14px] font-medium text-white transition duration-300 ease-[var(--ease)] active:scale-[0.98]"
        >
          Open studio
        </Link>
      </div>
    </div>
  );
}
