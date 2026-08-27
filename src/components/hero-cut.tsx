"use client";

import { useEffect, useMemo, useState } from "react";
import { sampleProject } from "@/lib/sample";
import { shotAtTime } from "@/lib/engine";
import { Plate } from "./plate";

export function HeroCut() {
  const project = useMemo(() => sampleProject(), []);
  const duration = useMemo(() => project.shots.reduce((sum, shot) => sum + shot.durationMs, 0), [project]);
  const [ms, setMs] = useState(11800);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setMs((current) => (current + 90) % duration), 90);
    return () => window.clearInterval(id);
  }, [duration]);

  const now = shotAtTime({ ...project, playheadMs: ms }, ms);
  const pct = duration ? (ms / duration) * 100 : 0;
  const shot = now?.shot;

  return (
    <div>
      <div className="still still-lift aspect-video">
        {shot ? <Plate key={shot.id} shot={shot} playing compact priority={shot.plate === "laugh"} /> : null}
      </div>
      <div className="relative mt-3 flex h-11 gap-1">
        {project.shots.map((item) => (
          <div
            key={item.id}
            className="relative min-w-0 overflow-hidden rounded-md"
            style={{ width: `${(item.durationMs / duration) * 100}%` }}
          >
            <Plate shot={item} playing={false} compact thumb />
          </div>
        ))}
        <div className="playhead" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
