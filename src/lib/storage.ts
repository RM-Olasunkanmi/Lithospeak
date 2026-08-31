import { get, set } from "idb-keyval";
import type { ProjectData } from "../types";

const STORAGE_KEY = "lithospeak-projects";

export async function loadSavedProjects(): Promise<ProjectData[]> {
  return (await get<ProjectData[]>(STORAGE_KEY)) ?? [];
}

export async function saveProject(project: ProjectData): Promise<void> {
  const all = await loadSavedProjects();
  const next = [project, ...all.filter((item) => item.id !== project.id)].slice(0, 12);
  await set(STORAGE_KEY, next);
}

export async function deleteProject(projectId: string): Promise<void> {
  const all = await loadSavedProjects();
  await set(
    STORAGE_KEY,
    all.filter((item) => item.id !== projectId)
  );
}
