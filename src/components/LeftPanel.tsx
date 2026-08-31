import type { ReactNode } from "react";
import { FolderIcon, ImageIcon, ShapesIcon } from "./icons";

export type LeftTab = "photos" | "shapes" | "projects";

export default function LeftPanel({
  tab,
  onTabChange,
  photosContent,
  shapesContent,
  projectsContent,
  photoCount,
  projectCount,
  mobileOpen
}: {
  tab: LeftTab;
  onTabChange: (tab: LeftTab) => void;
  photosContent: ReactNode;
  shapesContent: ReactNode;
  projectsContent: ReactNode;
  photoCount: number;
  projectCount: number;
  mobileOpen?: boolean;
}) {
  const tabs: Array<{ key: LeftTab; label: string; icon: ReactNode; count?: number }> = [
    { key: "photos", label: "Photos", icon: <ImageIcon size={15} />, count: photoCount || undefined },
    { key: "shapes", label: "Shapes", icon: <ShapesIcon size={15} /> },
    { key: "projects", label: "Projects", icon: <FolderIcon size={15} />, count: projectCount || undefined }
  ];

  return (
    <aside className={mobileOpen ? "left-panel is-open" : "left-panel"} aria-label="Photos, shapes, and projects">
      <nav className="left-tabs" role="tablist" aria-label="Left panel sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? "left-tab is-active" : "left-tab"}
            onClick={() => onTabChange(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.count ? <span className="left-tab-count">{item.count}</span> : null}
          </button>
        ))}
      </nav>
      <div className="left-panel-body">
        {tab === "photos" && photosContent}
        {tab === "shapes" && shapesContent}
        {tab === "projects" && projectsContent}
      </div>
    </aside>
  );
}
