import { Suspense, lazy, useMemo, useState } from "react";
import type { GeneratedResult, PreviewMode } from "../types";
import type { SphereMarker, ViewCommand } from "./ThreeViewport";
import { IconButton, Segmented, EmptyState } from "./ui";
import {
  BackIcon,
  FitIcon,
  FrontViewIcon,
  GridIcon,
  LitIcon,
  OrbitIcon,
  SideViewIcon,
  SolidIcon,
  TopViewIcon,
  UploadIcon,
  WireframeIcon
} from "./icons";

const ThreeViewport = lazy(() => import("./ThreeViewport"));

const modeOptions: Array<{ value: PreviewMode; label: string; icon: JSX.Element }> = [
  { value: "solid", label: "Normal", icon: <SolidIcon size={14} /> },
  { value: "transmission", label: "Lithophane", icon: <LitIcon size={14} /> },
  { value: "backlight", label: "Backlit", icon: <BackIcon size={14} /> },
  { value: "wireframe", label: "Wireframe", icon: <WireframeIcon size={14} /> }
];

function bounds(vertices: number[]) {
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
}

export default function Viewport({
  result,
  mode,
  onModeChange,
  activePart,
  onPartSelect,
  onSpherePick,
  markers,
  onMarkerSelect,
  loading,
  progressLabel,
  hasImages,
  onUploadClick,
  onLoadDemo,
  buildPlateSize
}: {
  result: GeneratedResult;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  activePart?: string;
  onPartSelect: (name: string) => void;
  onSpherePick: (lon: number, lat: number) => void;
  markers?: SphereMarker[];
  onMarkerSelect?: (id: string) => void;
  loading: boolean;
  progressLabel: string;
  hasImages: boolean;
  onUploadClick: () => void;
  onLoadDemo: () => void;
  buildPlateSize: number;
}) {
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [viewCommand, setViewCommand] = useState<ViewCommand>();
  const tokenRef = useMemo(() => ({ current: 0 }), []);

  const sendView = (type: ViewCommand["type"]) => {
    tokenRef.current += 1;
    setViewCommand({ type, token: tokenRef.current });
  };

  const activeMesh = result.parts.find((part) => part.name === activePart) ?? result.parts[0];
  const dims = activeMesh ? bounds(activeMesh.vertices) : null;
  const empty = result.parts.length === 0;

  return (
    <div className="viewport">
      <div className="viewport-toolbar">
        <Segmented value={mode} onChange={onModeChange} options={modeOptions} ariaLabel="Preview mode" />
        <div className="viewport-toolbar-spacer" />
        <div className="viewport-toolbar-group">
          <IconButton label="Front view" icon={<FrontViewIcon size={16} />} onClick={() => sendView("front")} />
          <IconButton label="Side view" icon={<SideViewIcon size={16} />} onClick={() => sendView("side")} />
          <IconButton label="Top view" icon={<TopViewIcon size={16} />} onClick={() => sendView("top")} />
          <IconButton label="Fit to view" icon={<FitIcon size={16} />} onClick={() => sendView("fit")} />
          <IconButton label="Reset camera" icon={<OrbitIcon size={16} />} onClick={() => sendView("reset")} />
          <IconButton label="Toggle build plate" icon={<GridIcon size={16} />} active={showGrid} onClick={() => setShowGrid((v) => !v)} />
        </div>
      </div>

      <div className="viewport-stage">
        {!empty && (
          <Suspense fallback={<div className="viewport-loading">Loading 3D editor…</div>}>
            <ThreeViewport
              meshes={result.parts}
              mode={mode}
              activePart={activePart}
              onPartSelect={onPartSelect}
              onSpherePick={onSpherePick}
              markers={markers}
              onMarkerSelect={onMarkerSelect}
              viewCommand={viewCommand}
              showGrid={showGrid}
              buildPlateSize={buildPlateSize}
            />
          </Suspense>
        )}

        {!hasImages && (
          <div className={empty ? "viewport-empty" : "viewport-empty is-overlay"}>
            <EmptyState
              icon={<UploadIcon size={28} />}
              title="Turn your photos into printable 3D lithophanes"
              description="Upload a photo or start from a preset to see a live 3D preview here."
              action={
                <div className="empty-state-actions">
                  <button className="primary-button" onClick={onUploadClick}>
                    Upload Photos
                  </button>
                  <button className="ghost-button" onClick={onLoadDemo}>
                    Try a demo
                  </button>
                </div>
              }
            />
          </div>
        )}

        {loading && (
          <div className="viewport-progress">
            <div className="viewport-progress-spinner" aria-hidden="true" />
            <p>{progressLabel || "Generating…"}</p>
          </div>
        )}

        {!empty && showDimensions && dims && (
          <div className="viewport-dims" onClick={() => setShowDimensions(false)} title="Click to hide">
            <span>{dims.x.toFixed(0)}</span>
            <span className="viewport-dims-sep">×</span>
            <span>{dims.y.toFixed(0)}</span>
            <span className="viewport-dims-sep">×</span>
            <span>{dims.z.toFixed(0)}</span>
            <span className="viewport-dims-unit">mm</span>
          </div>
        )}
        {!empty && !showDimensions && (
          <button className="viewport-dims-restore" onClick={() => setShowDimensions(true)}>
            Show size
          </button>
        )}

        {hasImages && result.parts.some((part) => part.metadata.shape === "sphere" || part.metadata.shape === "split-sphere") && (
          <p className="viewport-hint">Click the sphere to move the selected photo, or click a marker to select it.</p>
        )}
      </div>
    </div>
  );
}
