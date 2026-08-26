"use client";

import { useEffect, useState } from "react";
import { sampleProject } from "@/lib/sample";
import { shotAtTime } from "@/lib/engine";
import { Plate } from "./plate";

export function HeroCut() {
  const project = sampleProject();
  const duration = project.shots.reduce((sum, shot) => sum + shot.durationMs, 0);
  const [ms, setMs] = useState(1200);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setMs((current) => (current + 90) % duration), 90);
    return () => window.clearInterval(id);
  }, [duration]);

  const now = shotAtTime({ ...project, playheadMs: ms }, ms);

  return (
    <div className="frame w-full max-w-xl">
      <div className="frame-inner relative aspect-video">
        {now ? <Plate shot={now.shot} playing compact /> : null}
      </div>
    </div>
  );
}
