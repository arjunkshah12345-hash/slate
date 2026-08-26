"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyTool, reduce, selectedShot, shotAtTime, toolsFor } from "@/lib/engine";
import { formatClock, formatTimecode, totalDuration } from "@/lib/format";
import { clearProject, loadProject, saveProject } from "@/lib/persist";
import { sampleProject } from "@/lib/sample";
import { getModelContext, syncWebmcp } from "@/lib/webmcp";
import type { Project, Shot } from "@/lib/types";
import { Plate } from "./plate";
import Link from "next/link";

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
  const [newTitle, setNewTitle] = useState("");
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
    const hay = `${shot.title} ${shot.slate} ${shot.caption}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });
  const pinned = visible.filter((shot) => shot.locked);
  const open = visible.filter((shot) => !shot.locked);

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
        setHelp((open) => !open);
      }
      if (event.key === "Escape") setHelp(false);
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
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/92 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111318] ring-1 ring-white/10">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="2.5" width="12" height="9" rx="1.6" stroke="#2f6dff" strokeWidth="1.2" />
              <path d="M5.4 4.8v4.4L9.6 7 5.4 4.8z" fill="#2f6dff" />
            </svg>
          </Link>
          <div>
            <input
              value={project.title}
              onChange={(event) => act({ type: "set_project_title", title: event.target.value })}
              className="w-[12ch] bg-transparent text-[15px] font-semibold tracking-[-0.02em] outline-none"
              aria-label="Project title"
            />
            <p className="text-[11px] text-[var(--mute)]">
              <Link href="/" className="hover:text-[var(--ink)]">
                Slate
              </Link>{" "}
              · {project.shots.length} shots
            </p>
          </div>
        </div>

        <label className="relative min-w-[200px] flex-1 max-w-xs">
          <span className="sr-only">Search shots</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shots"
            className="w-full rounded-full bg-[var(--bg-raise)] px-3 py-2 pr-12 text-[13px] outline-none ring-1 ring-[var(--line)] placeholder:text-[var(--mute)]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] text-[var(--mute)]">
            ⌘K
          </kbd>
        </label>

        <div className="flex items-center gap-1 rounded-full bg-[var(--bg-raise)] p-1">
          {(["all", "pinned", "open"] as Filter[]).map((key) => (
            <button key={key} type="button" className="pill" data-on={filter === key} onClick={() => setFilter(key)}>
              {key === "all" ? "All" : key === "pinned" ? "Pinned" : "Open"}
            </button>
          ))}
        </div>

        <p className="tc ml-auto text-[12px] text-[var(--mute)]">
          {formatTimecode(project.playheadMs)}
          <span className="mx-1.5 opacity-40">/</span>
          {formatClock(duration)}
        </p>
        <AgentChip project={project} supported={supported} />
        <button
          type="button"
          onClick={() => act({ type: project.playing ? "pause" : "play" })}
          className="rounded-full bg-[var(--blue)] px-4 py-2 text-[13px] font-medium text-white transition duration-300 ease-[var(--ease)] active:scale-[0.98]"
        >
          {project.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => act({ type: "request_export" })}
          className="rounded-full bg-[var(--bg-raise)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] ring-1 ring-[var(--line)]"
        >
          Mark
        </button>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="rounded-full bg-[var(--bg-raise)] px-3 py-2 text-[13px] text-[var(--mute)] ring-1 ring-[var(--line)]"
          aria-label="Shortcuts"
        >
          ?
        </button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[248px_minmax(0,1fr)_340px]">
        <aside className="border-b border-[var(--line)] bg-[var(--bg)] lg:border-b-0 lg:border-r">
          <div className="px-4 pb-2 pt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--mute)]">
            Library
          </div>
          {filter === "all" ? (
            <>
              <ShotGroup title="Pinned" shots={pinned} selectedId={selected?.id} onSelect={selectShot} />
              <ShotGroup title="Open" shots={open} selectedId={selected?.id} onSelect={selectShot} />
            </>
          ) : (
            <ShotGroup title={filter === "pinned" ? "Pinned" : "Open"} shots={visible} selectedId={selected?.id} onSelect={selectShot} />
          )}
          <form
            className="mx-3 mb-4 flex gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              const title = newTitle.trim() || "Insert";
              act({ type: "add_shot", title });
              setNewTitle("");
            }}
          >
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Add a shot"
              className="min-w-0 flex-1 rounded-full bg-[var(--bg-raise)] px-3 py-1.5 text-[12px] outline-none ring-1 ring-[var(--line)]"
            />
            <button type="submit" className="rounded-full bg-[var(--bg-hover)] px-3 py-1.5 text-[12px]">
              Add
            </button>
          </form>
        </aside>

        <main className="dots flex min-w-0 flex-col">
          <div className="flex flex-1 items-center justify-center p-5 md:p-8">
            <div className="w-full max-w-4xl">
              <div className="frame">
                <div className="frame-inner relative aspect-video">
                  {now ? <Plate shot={now.shot} playing={project.playing} compact /> : null}
                  {project.agent.lastTool ? (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] text-[var(--card-ink)] shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
                      {project.agent.name} · {project.agent.lastTool}
                    </div>
                  ) : null}
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
                      {now.shot.caption || "No caption yet. Codex can write one on an open shot."}
                    </p>
                  </div>
                  <p className="tc shrink-0 text-[12px] text-[var(--mute)]">
                    {now.shot.slate} · {formatClock(now.shot.durationMs)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-4 pb-4">
            <div
              className="relative overflow-hidden rounded-2xl bg-black/35 p-2 ring-1 ring-white/10"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = (event.clientX - rect.left - 8) / Math.max(1, rect.width - 16);
                act({ type: "seek", ms: x * duration });
              }}
            >
              <div className="flex h-20 gap-1">
                {project.shots.map((shot) => {
                  const active = selected?.id === shot.id;
                  return (
                    <button
                      key={shot.id}
                      type="button"
                      draggable={!shot.locked}
                      style={{ width: `${(shot.durationMs / duration) * 100}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectShot(shot);
                      }}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", shot.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const id = event.dataTransfer.getData("text/plain");
                        const index = project.shots.findIndex((item) => item.id === shot.id);
                        if (!id) return;
                        try {
                          setProject((current) =>
                            applyTool(reduce(current, { type: "select", id }), "move_shot", { index }).project,
                          );
                        } catch {
                          /* locked */
                        }
                      }}
                      className={`relative min-w-14 overflow-hidden rounded-lg ${
                        active ? "ring-2 ring-[var(--blue)]" : ""
                      }`}
                    >
                      <Plate shot={shot} playing={false} compact />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 tc text-[10px] text-white">
                        {shot.slate}
                      </span>
                      {shot.locked ? (
                        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--pin)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div
                className="pointer-events-none absolute top-1 bottom-1 w-0.5 bg-[var(--blue)]"
                style={{ left: `calc(8px + (100% - 16px) * ${playheadPct / 100})` }}
              />
            </div>
          </div>
        </main>

        <aside className="border-t border-[var(--line)] bg-[var(--bg)] p-3 lg:border-l lg:border-t-0">
          <div className="rounded-[22px] bg-[var(--card)] p-5 text-[var(--card-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <p className="flex items-center gap-2 text-[12px] font-medium text-[var(--blue)]">
              <Spark />
              Summary
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--card-mute)]">
              Shared cut. Codex can trim and caption open shots. Pinned shots stay put until you unpin them.
            </p>

            <p className="mt-5 text-[12px] font-medium">Notes</p>
            <form
              className="mt-2"
              toolname="set_brief"
              tooldescription="Update the directing brief the human and agent share"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                runTool("set_brief", { brief: String(data.get("brief") ?? "") });
              }}
            >
              <textarea
                name="brief"
                toolparamtitle="Brief"
                value={project.brief}
                onChange={(event) => act({ type: "set_brief", brief: event.target.value })}
                rows={4}
                className="w-full resize-none rounded-xl bg-[#f3f5f8] p-3 text-[13px] leading-5 text-[var(--card-ink)] outline-none"
              />
              <button type="submit" className="sr-only">
                Save brief
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag>Launch</Tag>
              <Tag>WebMCP</Tag>
              {selected?.locked ? <Tag tone="pin">Pinned</Tag> : <Tag>Open</Tag>}
              <Tag>{formatClock(duration)}</Tag>
            </div>

            <div className="mt-5 border-t border-black/8 pt-4">
              {selected ? (
                <>
                  {selected.locked ? (
                    <p className="text-[17px] font-semibold tracking-[-0.02em]">{selected.title}</p>
                  ) : (
                    <input
                      value={selected.title}
                      onChange={(event) => act({ type: "set_title", id: selected.id, title: event.target.value })}
                      className="w-full bg-transparent text-[17px] font-semibold tracking-[-0.02em] outline-none"
                      aria-label="Shot title"
                    />
                  )}
                  <p className="mt-1 tc text-[11px] text-[var(--card-mute)]">
                    {selected.slate} · {formatClock(selected.durationMs)}
                  </p>
                  {!selected.locked ? (
                    <form
                      className="mt-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        runTool("set_caption", { caption: String(data.get("caption") ?? "") });
                      }}
                    >
                      <input
                        name="caption"
                        value={selected.caption}
                        onChange={(event) =>
                          act({ type: "set_caption", id: selected.id, caption: event.target.value })
                        }
                        placeholder="Caption this shot"
                        className="w-full rounded-xl bg-[#f3f5f8] px-3 py-2 text-[13px] outline-none"
                      />
                    </form>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LightBtn
                      onClick={() =>
                        act({ type: selected.locked ? "unlock_shot" : "lock_shot", id: selected.id })
                      }
                    >
                      {selected.locked ? "Unpin" : `Pin ${selected.title}`}
                    </LightBtn>
                    <LightBtn onClick={() => act({ type: "duplicate_shot", id: selected.id })}>Copy</LightBtn>
                    {!selected.locked ? (
                      <LightBtn onClick={() => act({ type: "split_shot", id: selected.id })}>Split</LightBtn>
                    ) : null}
                    {!selected.locked && project.shots.length > 1 ? (
                      <LightBtn onClick={() => act({ type: "delete_shot", id: selected.id })}>Delete</LightBtn>
                    ) : null}
                    <LightBtn onClick={() => act({ type: "undo" })}>Undo</LightBtn>
                    <LightBtn onClick={() => act({ type: "redo" })}>Redo</LightBtn>
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
                  ) : (
                    <p className="mt-3 text-[13px] text-[var(--card-mute)]">
                      Pinned. Codex can read this shot, not cut it.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-[var(--card-mute)]">Select a shot. The agent sees the same one.</p>
              )}
            </div>

            <div className="mt-5 border-t border-black/8 pt-4">
              <p className="text-[12px] font-medium">Agent desk</p>
              <p className="mt-1 text-[12px] text-[var(--card-mute)]">
                {supported ? "WebMCP live" : "Rehearse here"} · {toolNames.length || available.length} tools
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <LightBtn
                  onClick={() =>
                    runTools([
                      ["select_shot", { id: "shot_3" }],
                      ["set_caption", { caption: "Hold. Then turn." }],
                    ])
                  }
                >
                  Caption hand
                </LightBtn>
                <LightBtn
                  onClick={() =>
                    runTools([
                      ["select_shot", { id: "shot_2" }],
                      ["trim_shot", { durationMs: 1800 }],
                    ])
                  }
                >
                  Shorten landfill
                </LightBtn>
                <LightBtn
                  onClick={() =>
                    runTools([
                      ["select_shot", { id: "shot_5" }],
                      ["trim_shot", { durationMs: 800 }],
                    ])
                  }
                >
                  Try laugh
                </LightBtn>
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
                  className="w-full rounded-full bg-[#f3f5f8] px-3 py-2 text-[12px] outline-none"
                />
              </form>
              {project.agent.lastResult ? (
                <p className="mt-2 line-clamp-3 text-[12px] text-[var(--card-mute)]">{project.agent.lastResult}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <LightBtn
                  onClick={() => {
                    clearProject();
                    act({ type: "reset" });
                  }}
                >
                  Reset cut
                </LightBtn>
                {project.lastCut ? (
                  <LightBtn onClick={() => downloadEdl(project.lastCut!)}>Download EDL</LightBtn>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {project.exportArmed ? (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center justify-between rounded-2xl bg-white px-5 py-4 text-[var(--card-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div>
              <p className="text-[12px] text-[var(--card-mute)]">Ready to mark</p>
              <p className="text-[16px] font-semibold">Commit this cut?</p>
            </div>
            <div className="flex gap-2">
              <LightBtn onClick={() => act({ type: "cancel_export" })}>Hold</LightBtn>
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

      {project.lastCut ? (
        <pre className="mx-4 mb-3 overflow-auto rounded-2xl bg-[var(--bg-raise)] p-4 tc text-[11px] leading-5 text-[var(--mute)] ring-1 ring-[var(--line)]">
          {project.lastCut.edl}
        </pre>
      ) : null}

      {help ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setHelp(false)}>
          <div
            className="w-full max-w-sm rounded-[22px] bg-white p-6 text-[var(--card-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[17px] font-semibold">Shortcuts</p>
            <ul className="mt-4 space-y-2 text-[13px] text-[var(--card-mute)]">
              <li>Space play or pause</li>
              <li>L pin or unpin</li>
              <li>N add a shot</li>
              <li>⌘K search</li>
              <li>⌘Z undo · ⇧⌘Z redo</li>
              <li>? this sheet</li>
            </ul>
            <button
              type="button"
              onClick={() => setHelp(false)}
              className="mt-5 rounded-full bg-[#f3f5f8] px-3 py-1.5 text-[12px] font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-3 text-[12px] text-[var(--mute)]">
        <p>
          {project.lastCut
            ? `Last marked cut · ${formatClock(project.lastCut.durationMs)}`
            : "Open this page in ChatGPT desktop (GPT-5.6 Sol or Terra)."}
        </p>
        <p>
          <Link href="/how" className="hover:text-[var(--ink)]">
            How
          </Link>
          {" · "}
          Space · L · ?
        </p>
      </footer>
    </div>
  );
}

function ShotGroup({
  title,
  shots,
  selectedId,
  onSelect,
}: {
  title: string;
  shots: Shot[];
  selectedId?: string;
  onSelect: (shot: Shot) => void;
}) {
  if (!shots.length) return null;
  return (
    <div className="px-2 pb-3">
      <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--mute)]">{title}</p>
      <nav className="flex flex-col gap-0.5">
        {shots.map((shot) => {
          const active = selectedId === shot.id;
          return (
            <button
              key={shot.id}
              type="button"
              onClick={() => onSelect(shot)}
              className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-left ${
                active ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-raise)]"
              }`}
            >
              <span className="relative h-9 w-12 overflow-hidden rounded-md">
                <Plate shot={shot} playing={false} compact />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{shot.title}</span>
                <span className="tc block text-[10px] text-[var(--mute)]">
                  {shot.slate} · {formatClock(shot.durationMs)}
                </span>
              </span>
              {shot.locked ? (
                <span className="rounded-full bg-[var(--pin)]/20 px-1.5 py-0.5 text-[10px] text-[#7dcea0]">Pin</span>
              ) : null}
            </button>
          );
        })}
      </nav>
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

function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1l1.1 3.2L10.4 5.4 7.1 6.6 6 9.9 4.9 6.6 1.6 5.4 4.9 4.2 6 1z" fill="#2f6dff" />
    </svg>
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

function LightBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-[#f3f5f8] px-3 py-1.5 text-[12px] font-medium text-[var(--card-ink)] transition duration-300 ease-[var(--ease)] hover:bg-[#e7ebf1] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function AgentChip({ project, supported }: { project: Project; supported: boolean | null }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[var(--bg-raise)] px-3 py-1.5 text-[12px] ring-1 ring-[var(--line)]">
      <span className={`h-1.5 w-1.5 rounded-full ${supported ? "bg-[var(--blue)]" : "bg-[var(--mute)]"}`} />
      <span>{project.agent.name}</span>
      <span className="text-[var(--mute)]">{project.agent.lastTool ?? (supported ? "ready" : "offline")}</span>
    </div>
  );
}
