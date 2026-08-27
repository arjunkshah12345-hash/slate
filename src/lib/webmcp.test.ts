import { describe, expect, it } from "vitest";
import { toolsFor } from "./engine";
import { sampleProject } from "./sample";
import { syncWebmcp } from "./webmcp";

describe("webmcp tool surface", () => {
  it("always exposes read tools and never confirm_export before arming", () => {
    const names = toolsFor(sampleProject()).map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining(["get_project", "get_selection", "find_shot", "request_export"]));
    expect(names).not.toContain("confirm_export");
    expect(toolsFor(sampleProject()).find((tool) => tool.name === "get_project")?.annotations.readOnlyHint).toBe(
      true,
    );
  });

  it("registers JS tools and leaves brief plus clap to HTML forms", async () => {
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
    expect(registered).not.toContain("set_brief");
    expect(registered).not.toContain("confirm_export");
  });
});
