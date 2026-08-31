import type { ProjectData } from "../types";
import { EmptyState, IconButton } from "./ui";
import { FolderIcon, TrashIcon } from "./icons";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ProjectsPanel({
  savedProjects,
  currentProjectId,
  onOpen,
  onDelete
}: {
  savedProjects: ProjectData[];
  currentProjectId: string;
  onOpen: (project: ProjectData) => void;
  onDelete: (id: string) => void;
}) {
  if (savedProjects.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon size={22} />}
        title="No saved projects"
        description="Use Save in the top bar to keep a local copy of your current project."
      />
    );
  }

  return (
    <ul className="project-list">
      {savedProjects.map((project) => (
        <li key={project.id} className={project.id === currentProjectId ? "project-item is-active" : "project-item"}>
          <button className="project-item-open" onClick={() => onOpen(project)}>
            <span className="project-item-name">{project.name}</span>
            <span className="project-item-meta">
              {project.images.length} photo{project.images.length === 1 ? "" : "s"} · {relativeTime(project.updatedAt)}
            </span>
          </button>
          <IconButton label={`Delete ${project.name}`} icon={<TrashIcon size={14} />} onClick={() => onDelete(project.id)} />
        </li>
      ))}
    </ul>
  );
}
