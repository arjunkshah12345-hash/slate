"use client";

import { useEffect, useState } from "react";
import { sampleProject } from "@/lib/sample";
import { shotAtTime } from "@/lib/engine";
import { Plate } from "./plate";

export function HeroCut() {
  const project = sampleProject();
  const duration = project.shots.reduce((sum, shot) => sum + shot.durationMs, 0);
  const [ms, setMs] = useState(11800);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setMs((current) => (current + 90) % duration), 90);
    return () => window.clearInterval(id);
  }, [duration]);

  const now = shotAtTime({ ...project, playheadMs: ms }, ms);
  const pct = duration ? (ms / duration) * 100 : 0;

  return (
    <div>
      <div className="still aspect-video">
        {now ? <Plate shot={now.shot} playing compact /> : null}
      </div>
      <div className="relative mt-3 flex h-11 gap-1">
        {project.shots.map((shot) => (
          <div
            key={shot.id}
            className="relative min-w-0 overflow-hidden rounded-md"
            style={{ width: `${(shot.durationMs / duration) * 100}%` }}
          >
            <Plate shot={shot} playing={false} compact />
          </div>
        ))}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--blue)]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
