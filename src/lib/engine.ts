import { totalDuration } from "./format";
import { sampleProject } from "./sample";
import type { Action, Project, Shot, ToolSpec } from "./types";

const WRITE: Action["type"][] = [
  "add_shot",
  "duplicate_shot",
  "delete_shot",
  "split_shot",
  "trim_shot",
  "move_shot",
  "set_caption",
  "set_title",
  "set_project_title",
  "lock_shot",
  "unlock_shot",
  "set_brief",
  "confirm_export",
  "reset",
];

function snapshot(project: Project) {
  return JSON.stringify({
    title: project.title,
    brief: project.brief,
    shots: project.shots,
    selectedId: project.selectedId,
    playheadMs: project.playheadMs,
    exportArmed: false,
    lastCut: project.lastCut,
    nextSeq: project.nextSeq,
  });
}

function restore(project: Project, raw: string): Project {
  const data = JSON.parse(raw) as Pick<
    Project,
    "title" | "brief" | "shots" | "selectedId" | "playheadMs" | "lastCut" | "nextSeq"
  >;
  return {
    ...project,
    ...data,
    playing: false,
    exportArmed: false,
  };
}

export function selectedShot(project: Project) {
  return project.shots.find((shot) => shot.id === project.selectedId) ?? null;
}

export function shotAtTime(project: Project, ms: number) {
  let cursor = 0;
  for (const shot of project.shots) {
    if (ms < cursor + shot.durationMs) {
      return { shot, startMs: cursor, localMs: ms - cursor };
    }
    cursor += shot.durationMs;
  }
  const last = project.shots[project.shots.length - 1];
  return last
    ? { shot: last, startMs: cursor - last.durationMs, localMs: last.durationMs }
    : null;
}

function clampPlayhead(project: Project, ms: number) {
  const max = Math.max(0, totalDuration(project.shots) - 1);
  return Math.min(max, Math.max(0, ms));
}

function findShot(project: Project, id: string) {
  const shot = project.shots.find((item) => item.id === id);
  if (!shot) throw new Error(`No shot ${id}`);
  return shot;
}

export function resolveShot(project: Project, input: Record<string, unknown>) {
  const raw = String(input.id ?? input.slate ?? input.title ?? input.query ?? "").trim();
  if (!raw) throw new Error("Pass a shot id, slate, or title. Example: shot_5, 05-A, or The laugh.");
  const lower = raw.toLowerCase();
  const hit =
    project.shots.find((shot) => shot.id.toLowerCase() === lower) ??
    project.shots.find((shot) => shot.slate.toLowerCase() === lower) ??
    project.shots.find((shot) => shot.title.toLowerCase() === lower) ??
    project.shots.find((shot) => shot.plate === lower) ??
    project.shots.find((shot) => shot.title.toLowerCase().includes(lower) || shot.slate.toLowerCase().includes(lower));
  if (!hit) throw new Error(`No shot matches "${raw}".`);
  return hit;
}

export function shotStartMs(project: Project, id: string) {
  let start = 0;
  for (const shot of project.shots) {
    if (shot.id === id) return start;
    start += shot.durationMs;
  }
  return 0;
}

function cutCard(project: Project) {
  const selected = selectedShot(project);
  return {
    title: project.title,
    playheadMs: project.playheadMs,
    durationMs: totalDuration(project.shots),
    selected: selected
      ? { id: selected.id, slate: selected.slate, title: selected.title, locked: selected.locked }
      : null,
    pinned: project.shots.filter((shot) => shot.locked).map((shot) => ({ id: shot.id, slate: shot.slate, title: shot.title })),
    available: toolsFor(project).map((tool) => tool.name),
  };
}

function stamp(project: Project, extra: Record<string, unknown>, note: string) {
  return { ...cutCard(project), ...extra, note };
}

const WRITE_ON_SELECTION = new Set([
  "trim_shot",
  "split_shot",
  "set_caption",
  "set_title",
  "move_shot",
  "delete_shot",
]);

function assertUnlocked(shot: Shot) {
  if (shot.locked) throw new Error(`${shot.slate} is locked. Unlock it before changing the cut.`);
}

function withHistory(project: Project, action: Action): Project {
  if (!WRITE.includes(action.type)) return project;
  return {
    ...project,
    history: [...project.history, snapshot(project)].slice(-40),
    future: [],
  };
}

function nextId(project: Project) {
  return { id: `shot_${project.nextSeq}`, nextSeq: project.nextSeq + 1 };
}

export function reduce(project: Project, action: Action): Project {
  const base = withHistory(project, action);

  switch (action.type) {
    case "select":
      return { ...base, selectedId: action.id };
    case "play":
      return { ...base, playing: base.shots.length > 0 };
    case "pause":
      return { ...base, playing: false };
    case "seek":
      return { ...base, playheadMs: clampPlayhead(base, action.ms), playing: false };
    case "tick": {
      if (!base.playing) return base;
      const next = base.playheadMs + action.ms;
      const end = totalDuration(base.shots);
      if (next >= end) {
        return { ...base, playheadMs: clampPlayhead(base, end - 1), playing: false };
      }
      return { ...base, playheadMs: next };
    }
    case "add_shot": {
      const { id, nextSeq } = nextId(base);
      const shot: Shot = {
        id,
        slate: `${String(base.shots.length + 1).padStart(2, "0")}-A`,
        title: action.title.trim() || "Insert",
        caption: action.caption?.trim() || "",
        durationMs: Math.max(800, Math.min(12000, action.durationMs ?? 2400)),
        locked: false,
        plate: "insert",
      };
      return {
        ...base,
        shots: [...base.shots, shot],
        selectedId: id,
        nextSeq,
      };
    }
    case "duplicate_shot": {
      const shot = findShot(base, action.id);
      const { id, nextSeq } = nextId(base);
      const copy: Shot = {
        ...shot,
        id,
        slate: `${shot.slate.split("-")[0]}-C`,
        title: `${shot.title} copy`,
        locked: false,
      };
      const index = base.shots.findIndex((item) => item.id === shot.id);
      const shots = [...base.shots];
      shots.splice(index + 1, 0, copy);
      return { ...base, shots, selectedId: id, nextSeq };
    }
    case "delete_shot": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      if (base.shots.length <= 1) throw new Error("The cut needs at least one shot.");
      const shots = base.shots.filter((item) => item.id !== shot.id);
      const selectedId = base.selectedId === shot.id ? shots[Math.max(0, shots.length - 1)].id : base.selectedId;
      return {
        ...base,
        shots,
        selectedId,
        playheadMs: clampPlayhead({ ...base, shots }, base.playheadMs),
      };
    }
    case "set_project_title":
      return { ...base, title: action.title.trim().slice(0, 48) || base.title };
    case "reset":
      return { ...sampleProject(), history: base.history, future: [] };
    case "split_shot": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      const at = shotAtTime(base, base.playheadMs);
      const local = at?.shot.id === shot.id ? at.localMs : Math.floor(shot.durationMs / 2);
      const cut = Math.max(600, Math.min(shot.durationMs - 600, local));
      const { id, nextSeq } = nextId(base);
      const left: Shot = { ...shot, durationMs: cut };
      const right: Shot = {
        ...shot,
        id,
        slate: `${shot.slate.split("-")[0]}-B`,
        title: `${shot.title} (tail)`,
        durationMs: shot.durationMs - cut,
        locked: false,
      };
      const index = base.shots.findIndex((item) => item.id === shot.id);
      const shots = [...base.shots];
      shots.splice(index, 1, left, right);
      return { ...base, shots, selectedId: id, nextSeq };
    }
    case "trim_shot": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      const durationMs = Math.max(600, Math.min(16000, Math.round(action.durationMs)));
      return {
        ...base,
        shots: base.shots.map((item) => (item.id === shot.id ? { ...item, durationMs } : item)),
        playheadMs: clampPlayhead({ ...base, shots: base.shots }, base.playheadMs),
      };
    }
    case "move_shot": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      const from = base.shots.findIndex((item) => item.id === shot.id);
      const to = Math.max(0, Math.min(base.shots.length - 1, action.index));
      if (from === to) return base;
      const shots = [...base.shots];
      const [moved] = shots.splice(from, 1);
      shots.splice(to, 0, moved);
      return { ...base, shots };
    }
    case "set_caption": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      return {
        ...base,
        shots: base.shots.map((item) =>
          item.id === shot.id ? { ...item, caption: action.caption.slice(0, 140) } : item,
        ),
      };
    }
    case "set_title": {
      const shot = findShot(base, action.id);
      assertUnlocked(shot);
      return {
        ...base,
        shots: base.shots.map((item) =>
          item.id === shot.id ? { ...item, title: action.title.slice(0, 48) || item.title } : item,
        ),
      };
    }
    case "lock_shot":
      findShot(base, action.id);
      return {
        ...base,
        shots: base.shots.map((item) => (item.id === action.id ? { ...item, locked: true } : item)),
      };
    case "unlock_shot":
      findShot(base, action.id);
      return {
        ...base,
        shots: base.shots.map((item) => (item.id === action.id ? { ...item, locked: false } : item)),
      };
    case "set_brief":
      return { ...base, brief: action.brief.slice(0, 400) };
    case "request_export":
      return { ...base, exportArmed: true, playing: false };
    case "cancel_export":
      return { ...base, exportArmed: false };
    case "confirm_export": {
      const durationMs = totalDuration(base.shots);
      const edl = base.shots
        .map((shot, i) => {
          const start = base.shots.slice(0, i).reduce((sum, item) => sum + item.durationMs, 0);
          return `${i + 1}. ${shot.slate}  ${formatEdl(start)}  ${formatEdl(start + shot.durationMs)}  ${shot.title}${shot.locked ? "  [LOCK]" : ""}`;
        })
        .join("\n");
      return {
        ...base,
        exportArmed: false,
        lastCut: { at: Date.now(), edl, durationMs, title: base.title },
      };
    }
    case "undo": {
      const prev = base.history[base.history.length - 1];
      if (!prev) return project;
      return {
        ...restore(project, prev),
        history: base.history.slice(0, -1),
        future: [snapshot(project), ...base.future].slice(0, 40),
        agent: project.agent,
      };
    }
    case "redo": {
      const next = project.future[0];
      if (!next) return project;
      return {
        ...restore(project, next),
        history: [...project.history, snapshot(project)].slice(-40),
        future: project.future.slice(1),
        agent: project.agent,
      };
    }
    case "agent":
      return {
        ...base,
        agent: {
          name: action.name ?? base.agent.name,
          lastTool: action.tool,
          lastResult: action.result,
          lastAt: Date.now(),
          targetShotId: action.targetShotId ?? base.selectedId,
        },
      };
    default:
      return base;
  }
}

function formatEdl(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function toolsFor(project: Project): ToolSpec[] {
  const selected = selectedShot(project);
  const tools: ToolSpec[] = [
    {
      name: "get_project",
      description:
        "Read the shared NORTHWIND cut. Returns every shot (id, slate, title, caption, duration, lock), the playhead, pinned shots, and which tools are live right now. 05-A The laugh starts pinned. Call this first.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
    },
    {
      name: "get_selection",
      description: "Read the shot the human is looking at, plus whether write tools are live.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
    },
    {
      name: "find_shot",
      description:
        "Look up a shot by id, slate, title, or a loose query without moving the playhead. Examples: laugh, landfill, 03-A, Product in hand.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Loose text such as laugh or landfill" },
          id: { type: "string" },
          slate: { type: "string" },
          title: { type: "string" },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "select_shot",
      description:
        "Select a shot by id, slate, title, or query and jump the playhead so the human sees that still. Examples: shot_3, 03-A, Product in hand, The laugh, landfill.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Shot id such as shot_3, or a title if that is all you have" },
          slate: { type: "string", description: "Slate such as 03-A" },
          title: { type: "string", description: "Title such as The laugh" },
          query: { type: "string", description: "Loose text such as hand or landfill" },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
    },
    {
      name: "add_shot",
      description: "Append a new unlocked shot to the timeline.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          caption: { type: "string" },
          durationMs: { type: "number", description: "Duration in milliseconds, 800–12000" },
        },
        required: ["title"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
    },
    {
      name: "set_project_title",
      description: "Rename the cut. The human sees the new title immediately.",
      inputSchema: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
    },
    {
      name: "reset_cut",
      description: "Restore the sample Northwind cut. Does not confirm export.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    },
    {
      name: "play",
      description: "Play the cut from the current playhead. The human watches the same picture.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    },
    {
      name: "pause",
      description: "Pause playback.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    },
    {
      name: "seek",
      description: "Move the playhead to a time in milliseconds.",
      inputSchema: {
        type: "object",
        properties: { ms: { type: "number" } },
        required: ["ms"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
    },
    {
      name: "set_brief",
      description: "Update the directing brief the human and agent share.",
      inputSchema: {
        type: "object",
        properties: { brief: { type: "string" } },
        required: ["brief"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
    },
  ];

  if (project.history.length) {
    tools.push({
      name: "undo",
      description: "Undo the last edit to the cut.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    });
  }

  if (selected && !selected.locked) {
    tools.push(
      {
        name: "trim_shot",
        description: `Set duration of the selected shot (${selected.slate} ${selected.title}). Fails if locked.`,
        inputSchema: {
          type: "object",
          properties: { durationMs: { type: "number" } },
          required: ["durationMs"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
      },
      {
        name: "split_shot",
        description: `Split the selected shot at the playhead. Fails if locked.`,
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false },
      },
      {
        name: "set_caption",
        description: `Write a burned-in caption on the selected shot. Fails if locked.`,
        inputSchema: {
          type: "object",
          properties: { caption: { type: "string" } },
          required: ["caption"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
      },
      {
        name: "set_title",
        description: `Rename the selected shot. Fails if locked.`,
        inputSchema: {
          type: "object",
          properties: { title: { type: "string" } },
          required: ["title"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
      },
      {
        name: "move_shot",
        description: `Reorder the selected shot to a zero-based index. Fails if locked.`,
        inputSchema: {
          type: "object",
          properties: { index: { type: "number" } },
          required: ["index"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
      },
      {
        name: "lock_shot",
        description: `Lock the selected shot so neither human drag nor agent tools can change it.`,
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false },
      },
      {
        name: "delete_shot",
        description: `Delete the selected shot. Fails if locked or if it is the last shot.`,
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false },
      },
    );
  }

  if (selected) {
    tools.push({
      name: "duplicate_shot",
      description: `Duplicate the selected shot as a new unlocked copy.`,
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    });
  }

  if (selected?.locked) {
    tools.push({
      name: "unlock_shot",
      description: `Unlock the selected shot (${selected.slate}). The human can also unlock from the pin.`,
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    });
  }

  if (project.exportArmed) {
    tools.push(
      {
        name: "confirm_export",
        description: "Commit the cut. Only available after request_export. The human must also be able to confirm on the clap.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false },
      },
      {
        name: "cancel_export",
        description: "Cancel a pending export clap.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false },
      },
    );
  } else {
    tools.push({
      name: "request_export",
      description: "Arm export. Does not write the cut until confirm_export or the human claps.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false },
    });
  }

  return tools;
}

export function applyTool(
  project: Project,
  name: string,
  input: Record<string, unknown> = {},
): { project: Project; result: unknown } {
  const allowed = new Set(toolsFor(project).map((tool) => tool.name));
  if (!allowed.has(name)) {
    const current = selectedShot(project);
    if (current?.locked && WRITE_ON_SELECTION.has(name)) {
      throw new Error(
        `${current.slate} ${current.title} is pinned. Unlock it before ${name}. Live tools: ${[...allowed].join(", ")}.`,
      );
    }
    if (name === "confirm_export") {
      throw new Error("Export is not armed. Call request_export first, then clap on the page or confirm_export.");
    }
    throw new Error(`Tool ${name} is not available. Live tools: ${[...allowed].join(", ")}.`);
  }

  const selected = selectedShot(project);
  let next = project;
  let result: unknown = { ok: true };

  switch (name) {
    case "get_project":
      result = {
        ...cutCard(project),
        brief: project.brief,
        exportArmed: project.exportArmed,
        lastCut: project.lastCut,
        note: "Pinned shots drop write tools. Confirm export is a clap on the page.",
        shots: project.shots.map((shot) => ({
          id: shot.id,
          slate: shot.slate,
          title: shot.title,
          caption: shot.caption,
          durationMs: shot.durationMs,
          locked: shot.locked,
        })),
      };
      break;
    case "get_selection":
      result = selected
        ? stamp(
            project,
            { id: selected.id, slate: selected.slate, title: selected.title, locked: selected.locked, caption: selected.caption },
            selected.locked ? "Pinned. You can read it. You cannot trim or caption it." : "Open. Write tools apply here.",
          )
        : { id: null, note: "Nothing selected." };
      break;
    case "find_shot": {
      const shot = resolveShot(project, input);
      result = stamp(
        project,
        {
          id: shot.id,
          slate: shot.slate,
          title: shot.title,
          locked: shot.locked,
          caption: shot.caption,
          durationMs: shot.durationMs,
        },
        shot.locked
          ? `${shot.slate} ${shot.title} is pinned. Select it to unlock, or leave it.`
          : `${shot.slate} ${shot.title} is open. Select it, then caption or trim.`,
      );
      break;
    }
    case "select_shot": {
      const shot = resolveShot(project, input);
      next = reduce(project, { type: "select", id: shot.id });
      next = reduce(next, { type: "seek", ms: shotStartMs(next, shot.id) + 10 });
      result = stamp(
        next,
        { selectedId: shot.id, slate: shot.slate, title: shot.title, locked: shot.locked },
        shot.locked ? `On ${shot.title}. Write tools are gone until someone unpins.` : `On ${shot.title}.`,
      );
      break;
    }
    case "add_shot":
      next = reduce(project, {
        type: "add_shot",
        title: String(input.title ?? ""),
        caption: input.caption ? String(input.caption) : undefined,
        durationMs: input.durationMs != null ? Number(input.durationMs) : undefined,
      });
      if (next.selectedId) {
        next = reduce(next, { type: "seek", ms: shotStartMs(next, next.selectedId) + 10 });
      }
      result = stamp(next, { id: next.selectedId }, `Added ${selectedShot(next)?.title ?? "a shot"}.`);
      break;
    case "duplicate_shot":
      next = reduce(project, { type: "duplicate_shot", id: selected!.id });
      if (next.selectedId) {
        next = reduce(next, { type: "seek", ms: shotStartMs(next, next.selectedId) + 10 });
      }
      result = stamp(next, { id: next.selectedId }, `Copied ${selected?.title}. The copy is unlocked.`);
      break;
    case "delete_shot":
      next = reduce(project, { type: "delete_shot", id: selected!.id });
      result = stamp(next, { selectedId: next.selectedId }, `Removed ${selected?.title}.`);
      break;
    case "set_project_title":
      next = reduce(project, { type: "set_project_title", title: String(input.title ?? "") });
      result = stamp(next, {}, `Cut is now ${next.title}.`);
      break;
    case "reset_cut":
      next = reduce(project, { type: "reset" });
      result = stamp(next, {}, "NORTHWIND is back. The laugh is pinned.");
      break;
    case "play":
      next = reduce(project, { type: "play" });
      result = stamp(next, {}, "Playing. The human is watching the same picture.");
      break;
    case "pause":
      next = reduce(project, { type: "pause" });
      result = stamp(next, {}, "Paused.");
      break;
    case "seek":
      next = reduce(project, { type: "seek", ms: Number(input.ms) });
      result = stamp(next, {}, `Playhead at ${next.playheadMs}ms.`);
      break;
    case "set_brief":
      next = reduce(project, { type: "set_brief", brief: String(input.brief ?? "") });
      result = stamp(next, {}, "Brief updated.");
      break;
    case "trim_shot":
      next = reduce(project, { type: "trim_shot", id: selected!.id, durationMs: Number(input.durationMs) });
      result = stamp(next, { durationMs: selectedShot(next)?.durationMs }, `Held ${selected?.title} to ${selectedShot(next)?.durationMs}ms.`);
      break;
    case "split_shot":
      next = reduce(project, { type: "split_shot", id: selected!.id });
      result = stamp(next, { id: next.selectedId }, `Split ${selected?.title}. You are on the tail.`);
      break;
    case "set_caption":
      next = reduce(project, { type: "set_caption", id: selected!.id, caption: String(input.caption ?? "") });
      result = stamp(next, { caption: selectedShot(next)?.caption }, `Caption on ${selected?.title}: ${selectedShot(next)?.caption}`);
      break;
    case "set_title":
      next = reduce(project, { type: "set_title", id: selected!.id, title: String(input.title ?? "") });
      result = stamp(next, { title: selectedShot(next)?.title }, `Renamed to ${selectedShot(next)?.title}.`);
      break;
    case "move_shot":
      next = reduce(project, { type: "move_shot", id: selected!.id, index: Number(input.index) });
      result = stamp(next, {}, `Moved ${selected?.title}.`);
      break;
    case "lock_shot":
      next = reduce(project, { type: "lock_shot", id: selected!.id });
      result = stamp(next, {}, `Pinned ${selected?.title}. Write tools dropped.`);
      break;
    case "unlock_shot":
      next = reduce(project, { type: "unlock_shot", id: selected!.id });
      result = stamp(next, {}, `Unpinned ${selected?.title}. Write tools are back.`);
      break;
    case "request_export":
      next = reduce(project, { type: "request_export" });
      result = stamp(next, { armed: true }, "Waiting for confirm_export or the human clap.");
      break;
    case "confirm_export":
      next = reduce(project, { type: "confirm_export" });
      result = stamp(next, { lastCut: next.lastCut }, `Cut marked. ${next.lastCut?.durationMs}ms.`);
      break;
    case "cancel_export":
      next = reduce(project, { type: "cancel_export" });
      result = stamp(next, {}, "Clap cancelled.");
      break;
    case "undo":
      next = reduce(project, { type: "undo" });
      result = stamp(next, {}, "Undid the last edit.");
      break;
    default:
      throw new Error(`Unknown tool ${name}`);
  }

  const target =
    name === "add_shot" || name === "select_shot"
      ? next.selectedId
      : selected?.id ?? next.selectedId;

  const note =
    typeof result === "object" && result && "note" in result
      ? String((result as { note: unknown }).note)
      : typeof result === "string"
        ? result
        : JSON.stringify(result);

  next = reduce(next, {
    type: "agent",
    tool: name,
    result: note,
    targetShotId: target,
  });

  return { project: next, result };
}
