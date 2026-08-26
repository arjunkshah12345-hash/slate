import { sampleProject } from "./sample";
import type { Project } from "./types";

const KEY = "slate:v1";

export function loadProject(): Project {
  if (typeof window === "undefined") return sampleProject();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return sampleProject();
    const data = JSON.parse(raw) as Project;
    if (!Array.isArray(data.shots) || data.shots.length === 0) return sampleProject();
    return {
      ...sampleProject(),
      ...data,
      playing: false,
      exportArmed: false,
      history: Array.isArray(data.history) ? data.history : [],
      future: Array.isArray(data.future) ? data.future : [],
    };
  } catch {
    return sampleProject();
  }
}

export function saveProject(project: Project) {
  if (typeof window === "undefined") return;
  const next = { ...project, playing: false };
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearProject() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
