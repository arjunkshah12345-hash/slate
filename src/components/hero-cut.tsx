"use client";

import { useEffect, useState } from "react";
import { sampleProject } from "@/lib/sample";
import { shotAtTime } from "@/lib/engine";
import { formatClock } from "@/lib/format";
import { Plate } from "./plate";

export function HeroCut() {
  const project = sampleProject();
  const duration = project.shots.reduce((sum, shot) => sum + shot.durationMs, 0);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setMs((current) => (current + 80) % duration);
    }, 80);
    return () => window.clearInterval(id);
  }, [duration]);

  const now = shotAtTime({ ...project, playheadMs: ms }, ms);

  return (
    <div className="w-full">
      <div className="frame">
        <div className="frame-inner relative aspect-video">
          {now ? <Plate shot={now.shot} playing compact /> : null}
          <div className="absolute right-4 top-4 rounded-full bg-black/45 px-2 py-1 tc text-[11px] text-white">
            {now?.shot.slate}
          </div>
        </div>
      </div>
      {now ? (
        <div className="mt-4 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.02em]">{now.shot.title}</p>
            <p className="mt-1 text-[13px] text-[var(--mute)]">
              {now.shot.caption || "The agent writes captions on the same still."}
            </p>
          </div>
          <p className="tc shrink-0 text-[12px] text-[var(--mute)]">
            {now.shot.slate} · {formatClock(now.shot.durationMs)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
