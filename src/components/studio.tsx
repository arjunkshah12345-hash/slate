"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyTool, reduce, selectedShot, shotAtTime, toolsFor } from "@/lib/engine";
import { formatClock, formatTimecode, totalDuration } from "@/lib/format";
import { clearProject, loadProject, saveProject } from "@/lib/persist";
import { sampleProject } from "@/lib/sample";
import { getModelContext, syncWebmcp } from "@/lib/webmcp";
import type { Project, Shot } from "@/lib/types";
import { GitHubMark } from "./github-mark";
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
  const [sheet, setSheet] = useState(true);
  const [deskOpen, setDeskOpen] = useState(true);
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
      setSheet(true);
    },
    [act, project.shots],
  );

  const followPlayhead = useCallback((current: Project) => {
    const at = shotAtTime(current, current.playheadMs);
    if (at && at.shot.id !== current.selectedId) {
      return reduce(current, { type: "select", id: at.shot.id });
    }
    return current;
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProject((current) => {
        if (!current.playing) return current;
        return followPlayhead(reduce(current, { type: "tick", ms: 80 }));
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [followPlayhead]);

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
        setSheet(false);
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
  const stage = now?.shot ?? selected;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-6">
        <GitHubMark className="absolute right-4 top-6 z-30 hidden md:flex" />
        <div className="flex justify-center">
          <nav className="island max-w-full pr-2 text-[13px] text-[var(--mute)]">
          <Link href="/" className="font-medium text-[var(--ink)]">
            Slate
          </Link>
          <input
            value={project.title}
            onChange={(event) => act({ type: "set_project_title", title: event.target.value })}
            className="hidden w-28 bg-transparent text-[var(--ink)] outline-none sm:block"
          />
          <label className="relative hidden md:block">
            <span className="sr-only">Search</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent outline-none placeholder:text-[var(--mute)]"
            />
          </label>
          <span className="tc hidden sm:inline">{formatTimecode(project.playheadMs)}</span>
          <span className="hidden lg:inline">
            {project.agent.lastTool ? `Codex · ${project.agent.lastTool}` : supported ? "Live" : "Offline"}
          </span>
          <button
            type="button"
            onClick={() => act({ type: project.playing ? "pause" : "play" })}
            className="rounded-full bg-[var(--white)] px-3.5 py-1.5 font-medium text-black"
          >
            {project.playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={() => act({ type: "request_export" })} className="pr-2">
            Mark
          </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-stretch gap-6 px-4 pb-4 pt-24 md:px-8 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="still relative aspect-video">
            {stage ? <Plate shot={stage} playing={project.playing} /> : null}
            {project.agent.lastTool ? (
              <div className="absolute left-4 top-4 max-w-[28ch] text-[12px] leading-4 text-white/80">
                <p>Codex · {project.agent.lastTool}</p>
                {project.agent.lastResult ? <p className="mt-1 text-white/60">{project.agent.lastResult}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        {sheet && selected ? (
          <aside className="sheet w-full shrink-0 p-7 lg:w-[300px]">
            {selected.locked ? (
              <p className="text-[20px] font-medium tracking-[-0.03em]">{selected.title}</p>
            ) : (
              <input
                value={selected.title}
                onChange={(event) => act({ type: "set_title", id: selected.id, title: event.target.value })}
                className="w-full bg-transparent text-[20px] font-medium tracking-[-0.03em] outline-none"
              />
            )}
            <p className="mt-1 tc text-[11px] text-[var(--card-mute)]">{selected.slate}</p>

            {selected.locked ? (
              <p className="mt-5 text-[14px] leading-6 text-[var(--card-mute)]">
                {selected.caption || "Pinned. Codex can read this, not cut it."}
              </p>
            ) : (
              <input
                value={selected.caption}
                onChange={(event) => act({ type: "set_caption", id: selected.id, caption: event.target.value })}
                placeholder="Caption"
                className="mt-5 w-full bg-transparent text-[14px] leading-6 outline-none placeholder:text-[var(--card-mute)]"
              />
            )}

            <form
              className="mt-8"
              toolname="set_brief"
              tooldescription="Update the directing brief the human and agent share."
              toolautosubmit=""
              onSubmit={(event) => {
                event.preventDefault();
                const brief = String(new FormData(event.currentTarget).get("brief") ?? "");
                act({ type: "set_brief", brief });
                const native = event.nativeEvent as SubmitEvent & {
                  respondWith?: (value: Promise<unknown>) => void;
                };
                native.respondWith?.(Promise.resolve({ ok: true, brief }));
              }}
            >
              <p className="text-[11px] text-[var(--card-mute)]">Notes</p>
              <textarea
                name="brief"
                value={project.brief}
                onChange={(event) => act({ type: "set_brief", brief: event.target.value })}
                rows={3}
                toolparamdescription="Shared notes for the cut. Keep the laugh."
                className="mt-2 w-full resize-none bg-transparent text-[13px] leading-6 text-[var(--card-mute)] outline-none"
              />
            </form>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[var(--card-mute)]">
              <button
                type="button"
                className="quiet"
                onClick={() => act({ type: selected.locked ? "unlock_shot" : "lock_shot", id: selected.id })}
              >
                {selected.locked ? "Unpin" : "Pin"}
              </button>
              <button type="button" className="quiet" onClick={() => act({ type: "duplicate_shot", id: selected.id })}>
                Copy
              </button>
              {!selected.locked ? (
                <button type="button" className="quiet" onClick={() => act({ type: "split_shot", id: selected.id })}>
                  Split
                </button>
              ) : null}
              {!selected.locked && project.shots.length > 1 ? (
                <button type="button" className="quiet" onClick={() => act({ type: "delete_shot", id: selected.id })}>
                  Delete
                </button>
              ) : null}
              <button type="button" className="quiet" onClick={() => act({ type: "undo" })}>
                Undo
              </button>
            </div>

            {!selected.locked ? (
              <div className="mt-6">
                <HoldPill
                  value={selected.durationMs}
                  min={600}
                  max={8000}
                  onChange={(durationMs) => act({ type: "trim_shot", id: selected.id, durationMs })}
                />
              </div>
            ) : null}

            <div className="mt-8 border-t border-black/6 pt-5">
              <button type="button" className="quiet text-[12px]" onClick={() => setDeskOpen((value) => !value)}>
                {supported ? "WebMCP" : "Desk"} · {toolNames.length || available.length}
              </button>
              {deskOpen ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                    <button
                      type="button"
                      className="quiet"
                      onClick={() =>
                        runTools([["set_caption", { query: "hand", caption: "Hold. Then turn." }]])
                      }
                    >
                      Caption hand
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      onClick={() =>
                        runTools([["trim_shot", { query: "landfill", seconds: 1.8 }]])
                      }
                    >
                      Shorten landfill
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      onClick={() =>
                        runTools([["trim_shot", { query: "laugh", durationMs: 800 }]])
                      }
                    >
                      Try laugh
                    </button>
                  </div>
                  <form
                    className="mt-4"
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
                      className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--card-mute)]"
                    />
                  </form>
                  {project.agent.lastResult ? (
                    <p className="mt-2 line-clamp-3 text-[12px] text-[var(--card-mute)]">{project.agent.lastResult}</p>
                  ) : null}
                </>
              ) : null}
              <div className="mt-4 flex gap-4 text-[13px]">
                <button
                  type="button"
                  className="quiet"
                  onClick={() => {
                    clearProject();
                    act({ type: "reset" });
                  }}
                >
                  Reset
                </button>
                {project.lastCut ? (
                  <button type="button" className="quiet" onClick={() => downloadEdl(project.lastCut!)}>
                    EDL
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      <div className="px-4 pb-6 md:px-8">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between pb-2 text-[12px] text-[var(--mute)]">
          <div className="flex gap-3">
            {(["all", "pinned", "open"] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "text-[var(--ink)]" : ""}
                onClick={() => setFilter(key)}
              >
                {key === "all" ? "All" : key === "pinned" ? "Pinned" : "Open"}
              </button>
            ))}
            <button type="button" onClick={() => act({ type: "add_shot", title: "Insert" })}>
              New
            </button>
          </div>
          <p className="tc">
            {formatClock(project.playheadMs)} / {formatClock(duration)}
          </p>
        </div>
        <div
          className="relative mx-auto max-w-[1100px]"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / Math.max(1, rect.width);
            setProject((current) => followPlayhead(reduce(current, { type: "seek", ms: x * duration })));
          }}
        >
          <div className="flex h-[72px] gap-1.5">
            {project.shots.map((shot) => {
              const hidden = !visible.some((item) => item.id === shot.id);
              return (
                <button
                  key={shot.id}
                  type="button"
                  style={{ width: `${(shot.durationMs / duration) * 100}%` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectShot(shot);
                  }}
                  className={`relative min-w-10 overflow-hidden rounded-xl ${
                    selected?.id === shot.id ? "ring-2 ring-[var(--blue)]" : ""
                  } ${hidden ? "opacity-25" : ""}`}
                >
                  <Plate shot={shot} playing={false} compact thumb />
                </button>
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--blue)]"
            style={{ left: `${playheadPct}%` }}
          />
        </div>
      </div>

      {project.exportArmed ? (
        <div className="fixed inset-x-0 bottom-28 z-30 flex justify-center px-4">
          <form
            className="island island-light gap-5 px-2"
            toolname="confirm_export"
            tooldescription="Commit the armed cut. A human can also clap on the page. Does not auto-submit."
            onSubmit={(event) => {
              event.preventDefault();
              act({ type: "confirm_export" });
              const native = event.nativeEvent as SubmitEvent & {
                respondWith?: (value: Promise<unknown>) => void;
              };
              native.respondWith?.(Promise.resolve({ ok: true, clapped: true }));
            }}
          >
            <p className="pl-2 text-[13px]">Commit this cut?</p>
            <button type="button" className="text-[13px] text-[var(--card-mute)]" onClick={() => act({ type: "cancel_export" })}>
              Hold
            </button>
            <button type="submit" className="rounded-full bg-black px-3.5 py-1.5 text-[13px] font-medium text-white">
              Clap
            </button>
          </form>
        </div>
      ) : null}

      {help ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setHelp(false)}>
          <div className="sheet w-full max-w-sm p-6" onClick={(event) => event.stopPropagation()}>
            <p className="font-medium">Shortcuts</p>
            <p className="mt-3 text-[13px] text-[var(--card-mute)]">Space play · L pin · N new · Esc close · ⌘Z undo</p>
          </div>
        </div>
      ) : null}
    </div>
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
