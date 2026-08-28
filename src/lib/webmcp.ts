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
  const fromDocument = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (fromDocument && typeof fromDocument.registerTool === "function") return fromDocument;
  const fromNavigator = (
    typeof navigator !== "undefined" ? (navigator as Navigator & { modelContext?: ModelContext }).modelContext : null
  );
  if (fromNavigator && typeof fromNavigator.registerTool === "function") return fromNavigator;
  return null;
}

export function waitForModelContext(ms = 20000, signal?: AbortSignal): Promise<ModelContext | null> {
  const ready = getModelContext();
  if (ready) return Promise.resolve(ready);
  if (typeof document === "undefined" || signal?.aborted) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ctx: ModelContext | null) => {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(ctx);
    };
    const onAbort = () => finish(null);
    signal?.addEventListener("abort", onAbort);
    const started = Date.now();
    const timer = setInterval(() => {
      const ctx = getModelContext();
      if (ctx) finish(ctx);
      else if (Date.now() - started >= ms) finish(null);
    }, 150);
  });
}

export async function syncWebmcp(
  getProject: () => Project,
  dispatch: (next: Project) => void,
  abort: AbortController,
) {
  const ctx = await waitForModelContext(20000, abort.signal);
  const project = getProject();
  const catalog = toolsFor(project);
  if (!ctx) return { supported: false, tools: catalog.map((tool) => tool.name) };

  const names: string[] = [];

  for (const spec of catalog) {
    if (abort.signal.aborted) break;
    names.push(spec.name);
    try {
      await ctx.registerTool(
        {
          name: spec.name,
          description: spec.description,
          inputSchema: spec.inputSchema,
          annotations: spec.annotations,
          execute: async (input) => {
            try {
              const { project: next, result } = applyTool(getProject(), spec.name, input ?? {});
              dispatch(next);
              return result;
            } catch (error) {
              const message = error instanceof Error ? error.message : "Tool failed.";
              return { ok: false, error: message, note: message };
            }
          },
        },
        { signal: abort.signal },
      );
    } catch {
      // Duplicate HTML/JS names or a rejected schema must not kill the rest.
    }
  }

  return { supported: true, tools: names };
}
