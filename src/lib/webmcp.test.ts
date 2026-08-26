import { describe, expect, it } from "vitest";
import { toolsFor } from "./engine";
import { sampleProject } from "./sample";

describe("webmcp tool surface", () => {
  it("always exposes read tools and never confirm_export before arming", () => {
    const names = toolsFor(sampleProject()).map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining(["get_project", "get_selection", "request_export"]));
    expect(names).not.toContain("confirm_export");
    expect(toolsFor(sampleProject()).find((tool) => tool.name === "get_project")?.annotations.readOnlyHint).toBe(
      true,
    );
  });
});
