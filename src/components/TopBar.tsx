import { useEffect, useRef, useState } from "react";
import { ExportIcon, ImageIcon, RedoIcon, SaveIcon, ShapesIcon, UndoIcon } from "./icons";
import { IconButton } from "./ui";

export default function TopBar({
  projectName,
  onRenameProject,
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExport,
  hasExportableParts,
  onToggleLeftPanel,
  onToggleRightPanel
}: {
  projectName: string;
  onRenameProject: (name: string) => void;
  status: "ready" | "generating";
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  hasExportableParts: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(projectName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(projectName);
  }, [projectName, editing]);

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <button className="mobile-only icon-button" onClick={onToggleLeftPanel} aria-label="Toggle photos and shapes panel">
          <ImageIcon size={16} />
        </button>
        <span className="brand-mark" aria-hidden="true">
          LS
        </span>
        <span className="brand-word">Lithospeak</span>
      </div>

      <div className="top-bar-project">
        {editing ? (
          <input
            ref={inputRef}
            className="project-name-input"
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft.trim()) onRenameProject(draft.trim());
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") inputRef.current?.blur();
              if (event.key === "Escape") {
                setDraft(projectName);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button className="project-name-button" onClick={() => setEditing(true)} aria-label="Rename project">
            {projectName}
          </button>
        )}
        <span className={status === "generating" ? "status-pill is-busy" : "status-pill is-ready"}>
          {status === "generating" ? "Generating…" : "Ready"}
        </span>
      </div>

      <div className="top-bar-actions">
        <IconButton label="Undo" icon={<UndoIcon size={16} />} onClick={onUndo} disabled={!canUndo} />
        <IconButton label="Redo" icon={<RedoIcon size={16} />} onClick={onRedo} disabled={!canRedo} />
        <button className="ghost-button" onClick={onSave}>
          <SaveIcon size={15} />
          Save
        </button>
        <button className="primary-button" onClick={onExport} disabled={!hasExportableParts}>
          <ExportIcon size={15} />
          Export
        </button>
        <button className="mobile-only icon-button" onClick={onToggleRightPanel} aria-label="Toggle properties panel">
          <ShapesIcon size={16} />
        </button>
      </div>
    </header>
  );
}
