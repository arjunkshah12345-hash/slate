"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { GitHubMark } from "./github-mark";

export function SiteNav({ active }: { active?: "home" | "studio" | "how" }) {
  const reduce = useReducedMotion();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20">
      <div className="relative mx-auto flex max-w-[1100px] items-start justify-center px-4 pt-6">
        <motion.nav
          className="island pointer-events-auto text-[13px] text-[var(--mute)]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/" className="font-medium text-[var(--ink)]">
            Slate
          </Link>
          <Link href="/how" className={active === "how" ? "text-[var(--ink)]" : ""}>
            How
          </Link>
          <Link href="/studio" className={active === "studio" ? "text-[var(--ink)]" : ""}>
            Studio
          </Link>
        </motion.nav>
        <motion.div
          className="pointer-events-auto absolute right-4 top-6"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <GitHubMark />
        </motion.div>
      </div>
    </header>
  );
}
