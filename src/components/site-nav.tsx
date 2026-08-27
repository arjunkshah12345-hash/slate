"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function SiteNav({ active }: { active?: "home" | "studio" | "how" }) {
  const reduce = useReducedMotion();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex justify-center pt-6">
      <motion.nav
        className="island text-[13px] text-[var(--mute)]"
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
    </header>
  );
}
