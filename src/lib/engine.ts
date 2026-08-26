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
      description: "Read the current cut: title, brief, shots, locks, playhead, and last export.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
    },
    {
      name: "get_selection",
      description: "Read the selected shot and whether it is locked.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
    },
    {
      name: "select_shot",
      description: "Select a shot by id so further tools apply to it. The human sees the same selection.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Shot id, e.g. shot_3" } },
        required: ["id"],
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
    throw new Error(`Tool ${name} is not available in the current cut state.`);
  }

  const selected = selectedShot(project);
  let next = project;
  let result: unknown = { ok: true };

  switch (name) {
    case "get_project":
      result = {
        title: project.title,
        brief: project.brief,
        playheadMs: project.playheadMs,
        durationMs: totalDuration(project.shots),
        exportArmed: project.exportArmed,
        lastCut: project.lastCut,
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
        ? { id: selected.id, slate: selected.slate, title: selected.title, locked: selected.locked }
        : { id: null };
      break;
    case "select_shot":
      next = reduce(project, { type: "select", id: String(input.id) });
      result = { selectedId: next.selectedId };
      break;
    case "add_shot":
      next = reduce(project, {
        type: "add_shot",
        title: String(input.title ?? ""),
        caption: input.caption ? String(input.caption) : undefined,
        durationMs: input.durationMs != null ? Number(input.durationMs) : undefined,
      });
      result = { id: next.selectedId };
      break;
    case "duplicate_shot":
      next = reduce(project, { type: "duplicate_shot", id: selected!.id });
      result = { id: next.selectedId };
      break;
    case "delete_shot":
      next = reduce(project, { type: "delete_shot", id: selected!.id });
      result = { selectedId: next.selectedId };
      break;
    case "set_project_title":
      next = reduce(project, { type: "set_project_title", title: String(input.title ?? "") });
      break;
    case "reset_cut":
      next = reduce(project, { type: "reset" });
      break;
    case "play":
      next = reduce(project, { type: "play" });
      break;
    case "pause":
      next = reduce(project, { type: "pause" });
      break;
    case "seek":
      next = reduce(project, { type: "seek", ms: Number(input.ms) });
      break;
    case "set_brief":
      next = reduce(project, { type: "set_brief", brief: String(input.brief ?? "") });
      break;
    case "trim_shot":
      next = reduce(project, { type: "trim_shot", id: selected!.id, durationMs: Number(input.durationMs) });
      break;
    case "split_shot":
      next = reduce(project, { type: "split_shot", id: selected!.id });
      break;
    case "set_caption":
      next = reduce(project, { type: "set_caption", id: selected!.id, caption: String(input.caption ?? "") });
      break;
    case "set_title":
      next = reduce(project, { type: "set_title", id: selected!.id, title: String(input.title ?? "") });
      break;
    case "move_shot":
      next = reduce(project, { type: "move_shot", id: selected!.id, index: Number(input.index) });
      break;
    case "lock_shot":
      next = reduce(project, { type: "lock_shot", id: selected!.id });
      break;
    case "unlock_shot":
      next = reduce(project, { type: "unlock_shot", id: selected!.id });
      break;
    case "request_export":
      next = reduce(project, { type: "request_export" });
      result = { armed: true, note: "Waiting for confirm_export or the human clap." };
      break;
    case "confirm_export":
      next = reduce(project, { type: "confirm_export" });
      result = next.lastCut;
      break;
    case "cancel_export":
      next = reduce(project, { type: "cancel_export" });
      break;
    case "undo":
      next = reduce(project, { type: "undo" });
      break;
    default:
      throw new Error(`Unknown tool ${name}`);
  }

  const target =
    name === "add_shot" || name === "select_shot"
      ? next.selectedId
      : selected?.id ?? next.selectedId;

  next = reduce(next, {
    type: "agent",
    tool: name,
    result: typeof result === "string" ? result : JSON.stringify(result),
    targetShotId: target,
  });

  return { project: next, result };
}
