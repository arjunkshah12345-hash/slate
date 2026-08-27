import { applyTool, toolsFor } from "./engine";
import type { Project } from "./types";

type Registered = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, extras?: { signal?: AbortSignal }) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: Registered, options?: { signal?: AbortSignal }) => Promise<unknown>;
};

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const ctx = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (ctx && typeof ctx.registerTool === "function") return ctx;
  return null;
}

export async function syncWebmcp(
  getProject: () => Project,
  dispatch: (next: Project) => void,
  abort: AbortController,
) {
  const project = getProject();
  const ctx = getModelContext();
  if (!ctx) return { supported: false, tools: toolsFor(project).map((tool) => tool.name) };

  const names: string[] = [];
  const htmlTools = new Set(["set_brief", "confirm_export"]);

  for (const spec of toolsFor(project)) {
    names.push(spec.name);
    if (htmlTools.has(spec.name)) continue;
    await ctx.registerTool(
      {
        name: spec.name,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: spec.annotations,
        execute: async (input) => {
          const { project: next, result } = applyTool(getProject(), spec.name, input ?? {});
          dispatch(next);
          return result;
        },
      },
      { signal: abort.signal },
    );
  }

  return { supported: true, tools: names };
}
