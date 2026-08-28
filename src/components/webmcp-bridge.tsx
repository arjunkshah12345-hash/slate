"use client";

import { useEffect } from "react";
import { loadProject, saveProject } from "@/lib/persist";
import type { Project } from "@/lib/types";
import { syncWebmcp } from "@/lib/webmcp";

export const PROJECT_EVENT = "slate:project";

let liveProject: (() => Project) | null = null;

export function setLiveProject(get: (() => Project) | null) {
  liveProject = get;
}

export function publishProject(next: Project) {
  saveProject(next);
  window.dispatchEvent(new CustomEvent<Project>(PROJECT_EVENT, { detail: next }));
}

export function WebmcpBridge() {
  useEffect(() => {
    const abort = new AbortController();
    void syncWebmcp(() => liveProject?.() ?? loadProject(), publishProject, abort);
    return () => abort.abort();
  }, []);

  return null;
}
