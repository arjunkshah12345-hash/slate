import { describe, expect, it } from "vitest";
import { toolsFor } from "./engine";
import { sampleProject } from "./sample";
import { syncWebmcp } from "./webmcp";

describe("webmcp tool surface", () => {
  it("always exposes read tools and the clap tools ChatGPT can actually call", () => {
    const names = toolsFor(sampleProject()).map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining(["get_project", "get_selection", "find_shot", "request_export", "confirm_export", "set_brief"]),
    );
    expect(toolsFor(sampleProject()).find((tool) => tool.name === "get_project")?.annotations.readOnlyHint).toBe(
      true,
    );
  });

  it("registers JS tools including brief and clap because ChatGPT ignores HTML forms", async () => {
    const registered: string[] = [];
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        modelContext: {
          registerTool: async (tool: { name: string }) => {
            registered.push(tool.name);
          },
        },
      },
    });
    const info = await syncWebmcp(
      () => sampleProject(),
      () => undefined,
      new AbortController(),
    );
    expect(info.supported).toBe(true);
    expect(info.tools).toEqual(expect.arrayContaining(["set_brief", "get_project"]));
    expect(registered).toContain("get_project");
    expect(registered).toContain("set_brief");
    expect(registered).toContain("confirm_export");
    expect(registered).toContain("set_caption");
    expect(registered).toContain("trim_shot");
  });

  it("returns an error object instead of throwing when a pin refuses a write", async () => {
    let execute: ((input: Record<string, unknown>) => Promise<unknown>) | undefined;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        modelContext: {
          registerTool: async (tool: { name: string; execute: (input: Record<string, unknown>) => Promise<unknown> }) => {
            if (tool.name === "trim_shot") execute = tool.execute;
          },
        },
      },
    });
    await syncWebmcp(() => sampleProject(), () => undefined, new AbortController());
    const result = await execute?.({ query: "laugh", durationMs: 800 });
    expect(result).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/pinned/i) }));
  });

  it("still registers write tools when the laugh is selected", async () => {
    const registered: string[] = [];
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        modelContext: {
          registerTool: async (tool: { name: string }) => {
            registered.push(tool.name);
          },
        },
      },
    });
    const onLaugh = { ...sampleProject(), selectedId: "shot_5" };
    await syncWebmcp(() => onLaugh, () => undefined, new AbortController());
    expect(registered).toContain("set_caption");
    expect(registered).toContain("trim_shot");
    expect(registered).toContain("unlock_shot");
  });
});
