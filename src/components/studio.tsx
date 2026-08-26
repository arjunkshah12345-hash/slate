"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyTool, reduce, selectedShot, shotAtTime, toolsFor } from "@/lib/engine";
import { formatClock, formatTimecode, totalDuration } from "@/lib/format";
import { clearProject, loadProject, saveProject } from "@/lib/persist";
import { sampleProject } from "@/lib/sample";
import { getModelContext, syncWebmcp } from "@/lib/webmcp";
import type { Project, Shot } from "@/lib/types";
import { Plate } from "./plate";

type Filter = "all" | "pinned" | "open";

export function Studio() {
  const [project, setProject] = useState<Project>(sampleProject);
  const projectRef = useRef(project);
  projectRef.current = project;
  const [hydrated, setHydrated] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [toolNames, setToolNames] = useState<string[]>([]);
  const [desk, setDesk] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const [help, setHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProject(loadProject());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProject(project);
  }, [hydrated, project]);

  const duration = totalDuration(project.shots);
  const now = shotAtTime(project, project.playheadMs);
  const selected = selectedShot(project);
  const available = useMemo(() => toolsFor(project).map((tool) => tool.name), [project]);
  const visible = project.shots.filter((shot) => {
    if (filter === "pinned" && !shot.locked) return false;
    if (filter === "open" && shot.locked) return false;
    if (!query.trim()) return true;
    return `${shot.title} ${shot.slate} ${shot.caption}`.toLowerCase().includes(query.trim().toLowerCase());
  });

  const dispatch = useCallback((next: Project) => setProject(next), []);
  const act = useCallback((action: Parameters<typeof reduce>[1]) => {
    setProject((current) => reduce(current, action));
  }, []);

  const runTools = useCallback((steps: Array<[string, Record<string, unknown>?]>) => {
    setProject((current) => {
      let next = current;
      for (const [name, input] of steps) {
        try {
          next = applyTool(next, name, input ?? {}).project;
        } catch (error) {
          next = reduce(next, {
            type: "agent",
            tool: name,
            result: error instanceof Error ? error.message : "Failed",
            targetShotId: next.selectedId,
          });
          break;
        }
      }
      return next;
    });
  }, []);

  const runTool = useCallback(
    (name: string, input: Record<string, unknown> = {}) => runTools([[name, input]]),
    [runTools],
  );

  const selectShot = useCallback(
    (shot: Shot) => {
      const start = project.shots
        .slice(0, project.shots.findIndex((item) => item.id === shot.id))
        .reduce((sum, item) => sum + item.durationMs, 0);
      act({ type: "select", id: shot.id });
      act({ type: "seek", ms: start + 10 });
      setOpen(true);
    },
    [act, project.shots],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setProject((current) => (current.playing ? reduce(current, { type: "tick", ms: 80 }) : current));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.code === "Space") {
        event.preventDefault();
        act({ type: projectRef.current.playing ? "pause" : "play" });
      }
      if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        act({ type: event.shiftKey ? "redo" : "undo" });
      }
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        setHelp((value) => !value);
      }
      if (event.key === "Escape") {
        setHelp(false);
        setOpen(false);
      }
      if (event.key === "l" && projectRef.current.selectedId) {
        const shot = selectedShot(projectRef.current);
        if (shot) act({ type: shot.locked ? "unlock_shot" : "lock_shot", id: shot.id });
      }
      if (event.key === "n" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        act({ type: "add_shot", title: "Insert" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act]);

  useEffect(() => {
    const abort = new AbortController();
    let alive = true;
    syncWebmcp(() => projectRef.current, dispatch, abort)
      .then((info) => {
        if (!alive) return;
        setSupported(info.supported);
        setToolNames(info.tools);
      })
      .catch(() => {
        if (alive) setSupported(false);
      });
    return () => {
      alive = false;
      abort.abort();
    };
  }, [available.join("|"), dispatch]);

  useEffect(() => {
    setSupported(Boolean(getModelContext()));
  }, []);

  const playheadPct = duration ? (project.playheadMs / duration) * 100 : 0;

  return (
    <div className="dots min-h-[100dvh]">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-[15px] font-medium tracking-[-0.02em]">
          {project.title}
        </Link>
        <label className="relative mx-auto w-full max-w-md">
          <span className="sr-only">Search</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full bg-black/30 px-4 py-2 text-[13px] outline-none ring-1 ring-white/10 placeholder:text-[var(--mute)]"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--mute)]">
            ⌘K
          </kbd>
        </label>
        <div className="flex rounded-full bg-black/25 p-1 ring-1 ring-white/8">
          {(["all", "pinned", "open"] as Filter[]).map((key) => (
            <button key={key} type="button" className="pill" data-on={filter === key} onClick={() => setFilter(key)}>
              {key === "all" ? "All" : key === "pinned" ? "Pinned" : "Open"}
            </button>
          ))}
        </div>
        <p className="tc text-[12px] text-[var(--mute)]">
          {formatTimecode(project.playheadMs)} / {formatClock(duration)}
        </p>
        <span className="text-[12px] text-[var(--mute)]">
          {supported ? "Codex live" : "Codex offline"}
          {project.agent.lastTool ? ` · ${project.agent.lastTool}` : ""}
        </span>
        <button
          type="button"
          onClick={() => act({ type: project.playing ? "pause" : "play" })}
          className="rounded-full bg-[var(--blue)] px-4 py-2 text-[13px] font-medium text-white"
        >
          {project.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => act({ type: "request_export" })}
          className="rounded-full bg-black/30 px-4 py-2 text-[13px] ring-1 ring-white/10"
        >
          Mark
        </button>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-3 px-4 pb-8 lg:grid-cols-[168px_minmax(0,1fr)]">
        <aside className="pt-2 text-[13px]">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--mute)]">Library</p>
          <button type="button" className="block w-full rounded-lg px-2 py-1.5 text-left" onClick={() => setFilter("all")}>
            All shots
          </button>
          <button type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[var(--mute)]" onClick={() => setFilter("pinned")}>
            Pinned
          </button>
          <button type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[var(--mute)]" onClick={() => setFilter("open")}>
            Open
          </button>
          <button
            type="button"
            className="mt-4 block w-full rounded-lg px-2 py-1.5 text-left text-[var(--mute)]"
            onClick={() => act({ type: "add_shot", title: "Insert" })}
          >
            New shot
          </button>
        </aside>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((shot) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => selectShot(shot)}
              className="group text-left"
            >
              <div className={`overflow-hidden rounded-[18px] ${selected?.id === shot.id ? "ring-2 ring-[var(--blue)]" : ""}`}>
                <div className="relative aspect-[16/10]">
                  <Plate shot={shot} playing={false} compact />
                  {shot.locked ? (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[#1f7a4a]">
                      Pin
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 truncate text-[13px] font-medium">{shot.title}</p>
              <p className="tc text-[11px] text-[var(--mute)]">
                {shot.slate} · {formatClock(shot.durationMs)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {open && selected ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4 md:p-8" onClick={() => setOpen(false)}>
          <div
            className="grid max-h-[92dvh] w-full max-w-5xl overflow-auto rounded-[28px] bg-[var(--card)] text-[var(--card-ink)] shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:grid-cols-[1.3fr_0.9fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-4 md:p-5">
              <div className="overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  {now ? <Plate shot={now.shot} playing={project.playing} compact /> : <Plate shot={selected} playing={false} compact />}
                  {project.agent.lastTool ? (
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[12px] shadow-sm">
                      Codex · {project.agent.lastTool}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex h-12 gap-1">
                {project.shots.map((shot) => (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => selectShot(shot)}
                    className={`relative min-w-0 flex-1 overflow-hidden rounded-md ${selected.id === shot.id ? "ring-2 ring-[var(--blue)]" : ""}`}
                  >
                    <Plate shot={shot} playing={false} compact />
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between gap-3 px-1">
                <div>
                  {selected.locked ? (
                    <p className="text-[18px] font-semibold tracking-[-0.02em]">{selected.title}</p>
                  ) : (
                    <input
                      value={selected.title}
                      onChange={(event) => act({ type: "set_title", id: selected.id, title: event.target.value })}
                      className="w-full bg-transparent text-[18px] font-semibold tracking-[-0.02em] outline-none"
                    />
                  )}
                  <p className="mt-1 text-[13px] text-[var(--card-mute)]">
                    {selected.caption || "No caption yet."}
                  </p>
                </div>
                <p className="tc text-[11px] text-[var(--card-mute)]">{selected.slate}</p>
              </div>
            </div>

            <div className="border-t border-black/6 p-5 md:border-l md:border-t-0">
              <p className="flex items-center gap-2 text-[12px] font-medium text-[var(--blue)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
                Summary
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[var(--card-mute)]">
                Shared cut. Codex can write on open shots. Pins stay until you unpin them.
              </p>
              <p className="mt-5 text-[12px] font-medium">Notes</p>
              <textarea
                value={project.brief}
                onChange={(event) => act({ type: "set_brief", brief: event.target.value })}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl bg-[#f1f2f5] p-3 text-[13px] leading-5 outline-none"
              />
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Tag>Launch</Tag>
                <Tag>WebMCP</Tag>
                {selected.locked ? <Tag tone="pin">Pinned</Tag> : <Tag>Open</Tag>}
              </div>

              {!selected.locked ? (
                <input
                  value={selected.caption}
                  onChange={(event) => act({ type: "set_caption", id: selected.id, caption: event.target.value })}
                  placeholder="Caption"
                  className="mt-4 w-full rounded-xl bg-[#f1f2f5] px-3 py-2 text-[13px] outline-none"
                />
              ) : (
                <p className="mt-4 text-[13px] text-[var(--card-mute)]">Pinned. Codex can read this, not cut it.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Ghost onClick={() => act({ type: selected.locked ? "unlock_shot" : "lock_shot", id: selected.id })}>
                  {selected.locked ? "Unpin" : "Pin"}
                </Ghost>
                <Ghost onClick={() => act({ type: "duplicate_shot", id: selected.id })}>Copy</Ghost>
                {!selected.locked ? <Ghost onClick={() => act({ type: "split_shot", id: selected.id })}>Split</Ghost> : null}
                {!selected.locked && project.shots.length > 1 ? (
                  <Ghost onClick={() => act({ type: "delete_shot", id: selected.id })}>Delete</Ghost>
                ) : null}
                <Ghost onClick={() => act({ type: "undo" })}>Undo</Ghost>
              </div>

              {!selected.locked ? (
                <div className="mt-4">
                  <HoldPill
                    value={selected.durationMs}
                    min={600}
                    max={8000}
                    onChange={(durationMs) => act({ type: "trim_shot", id: selected.id, durationMs })}
                  />
                </div>
              ) : null}

              <div className="mt-6 border-t border-black/6 pt-4">
                <p className="text-[12px] text-[var(--card-mute)]">
                  {supported ? "WebMCP live" : "Rehearse"} · {toolNames.length || available.length} tools
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Ghost
                    onClick={() =>
                      runTools([
                        ["select_shot", { id: "shot_3" }],
                        ["set_caption", { caption: "Hold. Then turn." }],
                      ])
                    }
                  >
                    Caption hand
                  </Ghost>
                  <Ghost
                    onClick={() =>
                      runTools([
                        ["select_shot", { id: "shot_2" }],
                        ["trim_shot", { durationMs: 1800 }],
                      ])
                    }
                  >
                    Shorten landfill
                  </Ghost>
                  <Ghost
                    onClick={() =>
                      runTools([
                        ["select_shot", { id: "shot_5" }],
                        ["trim_shot", { durationMs: 800 }],
                      ])
                    }
                  >
                    Try laugh
                  </Ghost>
                </div>
                <form
                  className="mt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const [name, ...rest] = desk.trim().split(/\s+/);
                    if (!name) return;
                    const raw = rest.join(" ");
                    let input: Record<string, unknown> = {};
                    if (raw) {
                      try {
                        input = JSON.parse(raw);
                      } catch {
                        input = { caption: raw, title: raw, brief: raw };
                      }
                    }
                    runTool(name, input);
                    setDesk("");
                  }}
                >
                  <input
                    value={desk}
                    onChange={(event) => setDesk(event.target.value)}
                    placeholder='set_caption {"caption":"Keep the laugh."}'
                    className="w-full rounded-full bg-[#f1f2f5] px-3 py-2 text-[12px] outline-none"
                  />
                </form>
                {project.agent.lastResult ? (
                  <p className="mt-2 line-clamp-3 text-[12px] text-[var(--card-mute)]">{project.agent.lastResult}</p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <Ghost
                    onClick={() => {
                      clearProject();
                      act({ type: "reset" });
                    }}
                  >
                    Reset
                  </Ghost>
                  {project.lastCut ? <Ghost onClick={() => downloadEdl(project.lastCut!)}>EDL</Ghost> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {open ? null : <div className="sticky bottom-0 z-10 px-4 pb-4">
        <div
          className="relative mx-auto max-w-[1400px] overflow-hidden rounded-2xl bg-black/40 p-2 ring-1 ring-white/10 backdrop-blur-md"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left - 8) / Math.max(1, rect.width - 16);
            act({ type: "seek", ms: x * duration });
          }}
        >
          <div className="flex h-16 gap-1">
            {project.shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                style={{ width: `${(shot.durationMs / duration) * 100}%` }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectShot(shot);
                }}
                className={`relative min-w-10 overflow-hidden rounded-lg ${selected?.id === shot.id ? "ring-2 ring-[var(--blue)]" : ""}`}
              >
                <Plate shot={shot} playing={false} compact />
              </button>
            ))}
          </div>
          <div
            className="pointer-events-none absolute top-1 bottom-1 w-px bg-[var(--blue)]"
            style={{ left: `calc(8px + (100% - 16px) * ${playheadPct / 100})` }}
          />
        </div>
      </div>}

      {project.exportArmed ? (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center justify-between rounded-2xl bg-white px-5 py-4 text-[var(--card-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div>
              <p className="text-[12px] text-[var(--card-mute)]">Ready to mark</p>
              <p className="text-[16px] font-semibold">Commit this cut?</p>
            </div>
            <div className="flex gap-2">
              <Ghost onClick={() => act({ type: "cancel_export" })}>Hold</Ghost>
              <button
                type="button"
                onClick={() => act({ type: "confirm_export" })}
                className="rounded-full bg-[var(--blue)] px-4 py-2 text-[13px] font-medium text-white"
              >
                Clap
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {help ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-[var(--card-ink)]" onClick={(event) => event.stopPropagation()}>
            <p className="font-semibold">Shortcuts</p>
            <p className="mt-3 text-[13px] text-[var(--card-mute)]">Space play · L pin · N new · Esc close · ⌘Z undo</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "pin" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        tone === "pin" ? "bg-[#e8f6ee] text-[#1f7a4a]" : "bg-[#e8eeff] text-[#2f6dff]"
      }`}
    >
      {children}
    </span>
  );
}

function Ghost({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full bg-[#f1f2f5] px-3 py-1.5 text-[12px] font-medium">
      {children}
    </button>
  );
}

function HoldPill({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;
  const setFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onChange(Math.round((min + x * (max - min)) / 100) * 100);
  };
  return (
    <div
      ref={track}
      className="hold-pill"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setFromEvent(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromEvent(event);
      }}
    >
      <div className="hold-fill" style={{ width: `${Math.max(18, pct)}%` }}>
        Hold
      </div>
      <span className="hold-val tc">{formatClock(value)}</span>
    </div>
  );
}

function downloadEdl(cut: { title: string; edl: string }) {
  const blob = new Blob([cut.edl], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cut.title.replace(/\s+/g, "-").toLowerCase()}.edl.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
