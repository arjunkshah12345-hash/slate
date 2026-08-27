import { describe, expect, it } from "vitest";
import { applyTool, reduce, toolsFor } from "./engine";
import { sampleProject } from "./sample";
import { totalDuration } from "./format";

describe("timeline engine", () => {
  it("plays, seeks, and stops at the end", () => {
    let project = sampleProject();
    project = reduce(project, { type: "play" });
    expect(project.playing).toBe(true);
    project = reduce(project, { type: "tick", ms: totalDuration(project.shots) + 200 });
    expect(project.playing).toBe(false);
    expect(project.playheadMs).toBeLessThan(totalDuration(project.shots));
  });

  it("refuses to trim a locked shot", () => {
    const project = sampleProject();
    const laugh = project.shots.find((shot) => shot.plate === "laugh")!;
    expect(laugh.locked).toBe(true);
    expect(() => reduce(project, { type: "trim_shot", id: laugh.id, durationMs: 1000 })).toThrow(
      /locked/i,
    );
  });

  it("hides write tools on a locked selection and exposes unlock", () => {
    let project = sampleProject();
    const laugh = project.shots.find((shot) => shot.plate === "laugh")!;
    project = reduce(project, { type: "select", id: laugh.id });
    const names = toolsFor(project).map((tool) => tool.name);
    expect(names).toContain("unlock_shot");
    expect(names).not.toContain("trim_shot");
    expect(names).not.toContain("set_caption");
    expect(names).not.toContain("confirm_export");
    expect(names).toContain("request_export");
  });

  it("does not export until the clap", () => {
    let project = sampleProject();
    expect(() => applyTool(project, "confirm_export")).toThrow(/not armed/i);
    const armed = applyTool(project, "request_export");
    expect(armed.project.exportArmed).toBe(true);
    expect(toolsFor(armed.project).map((tool) => tool.name)).toContain("confirm_export");
    const cut = applyTool(armed.project, "confirm_export");
    expect(cut.project.lastCut?.edl).toMatch(/05-A/);
    expect(cut.project.exportArmed).toBe(false);
  });

  it("splits an unlocked shot and records undo", () => {
    let project = sampleProject();
    project = reduce(project, { type: "select", id: "shot_2" });
    project = reduce(project, { type: "seek", ms: 2800 });
    const before = project.shots.length;
    project = reduce(project, { type: "split_shot", id: "shot_2" });
    expect(project.shots.length).toBe(before + 1);
    project = reduce(project, { type: "undo" });
    expect(project.shots.length).toBe(before);
  });

  it("refuses to delete a locked shot and duplicates as an open copy", () => {
    let project = sampleProject();
    const laugh = project.shots.find((shot) => shot.plate === "laugh")!;
    expect(() => reduce(project, { type: "delete_shot", id: laugh.id })).toThrow(/locked/i);
    project = reduce(project, { type: "duplicate_shot", id: laugh.id });
    const copy = project.shots.find((shot) => shot.id === project.selectedId);
    expect(copy?.title).toMatch(/copy/i);
    expect(copy?.locked).toBe(false);
  });

  it("agent caption lands on the same selected shot the human sees", () => {
    let project = sampleProject();
    project = reduce(project, { type: "select", id: "shot_3" });
    const next = applyTool(project, "set_caption", { caption: "Hold the product." });
    expect(next.project.shots.find((shot) => shot.id === "shot_3")?.caption).toBe("Hold the product.");
    expect(next.project.agent.lastTool).toBe("set_caption");
    expect(next.project.agent.targetShotId).toBe("shot_3");
  });

  it("selects a shot by title and moves the playhead onto that still", () => {
    const next = applyTool(sampleProject(), "select_shot", { title: "The laugh" });
    expect(next.project.selectedId).toBe("shot_5");
    expect(next.project.playheadMs).toBeGreaterThan(10000);
    expect(toolsFor(next.project).map((tool) => tool.name)).not.toContain("trim_shot");
    expect(next.project.agent.lastResult).toMatch(/Write tools are gone/i);
  });

  it("finds a shot by loose query without moving the playhead", () => {
    const project = sampleProject();
    const found = applyTool(project, "find_shot", { query: "landfill" });
    expect((found.result as { id: string }).id).toBe("shot_2");
    expect(found.project.selectedId).toBe(project.selectedId);
    expect(found.project.playheadMs).toBe(project.playheadMs);
  });

  it("explains why a write tool is gone on a pinned shot", () => {
    const onLaugh = applyTool(sampleProject(), "select_shot", { query: "laugh" });
    expect(() => applyTool(onLaugh.project, "trim_shot", { durationMs: 800 })).toThrow(/pinned/i);
  });
});
