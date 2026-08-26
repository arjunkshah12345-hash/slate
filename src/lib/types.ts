export type Shot = {
  id: string;
  slate: string;
  title: string;
  caption: string;
  durationMs: number;
  locked: boolean;
  plate: "black" | "landfill" | "hand" | "cut" | "laugh" | "proof" | "face" | "card" | "insert";
};

export type AgentPresence = {
  name: string;
  lastTool: string | null;
  lastResult: string | null;
  lastAt: number | null;
  targetShotId: string | null;
};

export type CutCard = {
  at: number;
  edl: string;
  durationMs: number;
  title: string;
};

export type Project = {
  title: string;
  brief: string;
  shots: Shot[];
  selectedId: string | null;
  playheadMs: number;
  playing: boolean;
  exportArmed: boolean;
  lastCut: CutCard | null;
  agent: AgentPresence;
  history: string[];
  future: string[];
  nextSeq: number;
};

export type Action =
  | { type: "select"; id: string | null }
  | { type: "play" }
  | { type: "pause" }
  | { type: "seek"; ms: number }
  | { type: "tick"; ms: number }
  | { type: "add_shot"; title: string; durationMs?: number; caption?: string }
  | { type: "duplicate_shot"; id: string }
  | { type: "delete_shot"; id: string }
  | { type: "split_shot"; id: string }
  | { type: "trim_shot"; id: string; durationMs: number }
  | { type: "move_shot"; id: string; index: number }
  | { type: "set_caption"; id: string; caption: string }
  | { type: "set_title"; id: string; title: string }
  | { type: "set_project_title"; title: string }
  | { type: "lock_shot"; id: string }
  | { type: "unlock_shot"; id: string }
  | { type: "set_brief"; brief: string }
  | { type: "reset" }
  | { type: "request_export" }
  | { type: "confirm_export" }
  | { type: "cancel_export" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "agent"; tool: string; result: string; targetShotId?: string | null; name?: string };

export type ToolSpec = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint?: boolean };
};
