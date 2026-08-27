"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const blurPopUp = {
  initial: { opacity: 0, filter: "blur(10px)", y: "20%" },
  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
};

const quiet = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export function BlurPopUpByWord({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block pr-[0.28em] last:pr-0"
          style={{ wordBreak: "normal" }}
          variants={reduce ? quiet : blurPopUp}
          initial="initial"
          animate="animate"
          transition={{ duration: reduce ? 0.25 : 0.8, ease: "easeOut", delay: delay + 0.1 * index }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function BlurPopUp({
  children,
  delay = 0.5,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduce ? quiet : blurPopUp}
      initial="initial"
      animate="animate"
      transition={{ duration: reduce ? 0.25 : 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
