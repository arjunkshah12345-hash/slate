import { describe, expect, it } from "vitest";
import { applyTool, reduce, seeFrame, toolsFor } from "./engine";
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
      /pinned/i,
    );
  });

  it("keeps write tools on a pin so another shot can still be targeted", () => {
    let project = sampleProject();
    const laugh = project.shots.find((shot) => shot.plate === "laugh")!;
    project = reduce(project, { type: "select", id: laugh.id });
    const names = toolsFor(project).map((tool) => tool.name);
    expect(names).toContain("unlock_shot");
    expect(names).toContain("trim_shot");
    expect(names).toContain("set_caption");
    expect(names).toContain("confirm_export");
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
    expect(() => reduce(project, { type: "delete_shot", id: laugh.id })).toThrow(/pinned/i);
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
    expect(toolsFor(next.project).map((tool) => tool.name)).toContain("trim_shot");
    expect(next.project.agent.lastResult).toMatch(/refuse/i);
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

  it("captions and trims by name in one call even when the laugh is selected", () => {
    const onLaugh = applyTool(sampleProject(), "select_shot", { query: "laugh" });
    const captioned = applyTool(onLaugh.project, "set_caption", {
      query: "product-in-hand",
      caption: "Hold. Then turn.",
    });
    expect(captioned.project.shots.find((shot) => shot.id === "shot_3")?.caption).toBe("Hold. Then turn.");
    expect(captioned.project.selectedId).toBe("shot_3");
    expect(captioned.project.shots.find((shot) => shot.id === "shot_5")?.locked).toBe(true);

    const shortened = applyTool(captioned.project, "trim_shot", { query: "landfill", seconds: 1.8 });
    expect(shortened.project.shots.find((shot) => shot.id === "shot_2")?.durationMs).toBe(1800);
    expect(shortened.project.shots.find((shot) => shot.id === "shot_5")?.durationMs).toBe(3000);
  });

  it("see_still reports the picture on the playhead without moving", () => {
    const onLaugh = applyTool(sampleProject(), "select_shot", { query: "laugh" });
    const seen = applyTool(onLaugh.project, "see_still");
    expect((seen.result as { onScreen: { title: string; locked: boolean } }).onScreen.title).toBe("The laugh");
    expect((seen.result as { onScreen: { locked: boolean } }).onScreen.locked).toBe(true);
    expect(seen.project.playheadMs).toBe(onLaugh.project.playheadMs);
    expect(seeFrame(onLaugh.project).pinned.join(" ")).toMatch(/laugh/i);
  });

  it("walks the judge path from a cold start", () => {
    const start = sampleProject();
    const read = applyTool(start, "get_project");
    expect((read.result as { pinned: { title: string }[] }).pinned.map((shot) => shot.title)).toContain("The laugh");

    const found = applyTool(start, "find_shot", { query: "laugh" });
    expect(found.project.selectedId).toBe(start.selectedId);

    const captioned = applyTool(start, "set_caption", { query: "hand", caption: "Hold. Then turn." });
    expect(captioned.project.shots.find((shot) => shot.id === "shot_3")?.caption).toBe("Hold. Then turn.");

    const shortened = applyTool(captioned.project, "trim_shot", { query: "The landfill", durationMs: 1800 });
    expect(shortened.project.shots.find((shot) => shot.id === "shot_2")?.durationMs).toBe(1800);
    expect(() => applyTool(shortened.project, "trim_shot", { query: "laugh", durationMs: 800 })).toThrow(/pinned/i);

    const armed = applyTool(shortened.project, "request_export");
    const cut = applyTool(armed.project, "confirm_export");
    expect(cut.project.lastCut?.edl).toMatch(/03-A/);
    expect(cut.project.lastCut?.edl).toMatch(/05-A/);
  });
});
