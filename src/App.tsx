import { useEffect, useMemo, useRef, useState } from "react";
import { createDefaultAdjustments, rasterizeLayer } from "./lib/imageProcessing";
import { createDefaultProject, projectPresets, qualitySamplingMap } from "./lib/presets";
import { deleteProject, loadSavedProjects, saveProject } from "./lib/storage";
import { downloadText, exportZip, meshToObj, meshToStl } from "./lib/exporters";
import type { GeneratedResult, ImageLayer, ProjectData, ShapeKind } from "./types";
import type { WorkerResponse } from "./workers/generationWorker";
import type { SphereMarker } from "./components/ThreeViewport";
import TopBar from "./components/TopBar";
import LeftPanel, { type LeftTab } from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import PhotoPanel from "./components/PhotoPanel";
import ShapePanel from "./components/ShapePanel";
import ProjectsPanel from "./components/ProjectsPanel";
import Viewport from "./components/Viewport";
import { ToastStack, type ToastMessage } from "./components/ui";

const generatorWorker = new Worker(new URL("./workers/generationWorker.ts", import.meta.url), { type: "module" });

const HISTORY_LIMIT = 40;
const DRAFT_SETTLE_MS = 260;
const MARKER_COLORS = ["#ff8a3d", "#4dd0e1", "#c792ea", "#8bd450", "#f2c94c", "#ff6b81", "#5aa9ff", "#e07a5f"];

function withTimestamp(project: ProjectData): ProjectData {
  return { ...project, updatedAt: new Date().toISOString() };
}

function autoArrangeLayers(count: number, images: ImageLayer[]): ImageLayer[] {
  if (count === 0) return [];
  return images.map((image, index) => {
    const widthDeg = count <= 2 ? 120 : count <= 4 ? 88 : 70;
    const centerLon = (index * 360) / count;
    const centerLat = count > 6 && index % 2 === 1 ? 22 : 0;
    return { ...image, centerLon, centerLat, widthDeg, heightDeg: widthDeg * 0.78 };
  });
}

function placeNewImages(existing: ImageLayer[], incoming: ImageLayer[]): ImageLayer[] {
  if (incoming.length === 0) return existing;
  if (existing.length === 0) return autoArrangeLayers(incoming.length, incoming);
  const total = existing.length + incoming.length;
  const arrangedAll = autoArrangeLayers(total, [...existing, ...incoming]);
  return [...existing, ...arrangedAll.slice(existing.length)];
}

function wrapDegrees(value: number): number {
  let result = value % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function inferImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Unable to decode image."));
    img.src = dataUrl;
  });
}

function makeImageLayer(name: string, dataUrl: string, size: { width: number; height: number }): ImageLayer {
  return {
    id: crypto.randomUUID(),
    name,
    dataUrl,
    width: size.width,
    height: size.height,
    crop: { x: 0, y: 0, w: 1, h: 1 },
    adjustments: createDefaultAdjustments(),
    centerLon: 0,
    centerLat: 0,
    widthDeg: 92,
    heightDeg: 72,
    rotationDeg: 0,
    opacity: 1,
    feather: 12
  };
}

export default function App() {
  const [project, setProject] = useState<ProjectData>(() => createDefaultProject());
  const [result, setResult] = useState<GeneratedResult>({ parts: [], validation: [], notes: [] });
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [activePart, setActivePart] = useState<string>();
  const [selectedImageId, setSelectedImageId] = useState<string>();
  const [leftTab, setLeftTab] = useState<LeftTab>("shapes");
  const [activePresetName, setActivePresetName] = useState<string>();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const projectRef = useRef(project);
  const burstBaselineRef = useRef<ProjectData | null>(null);
  const requestIdRef = useRef(0);
  const appliedResultIdRef = useRef(0);
  const [historyPast, setHistoryPast] = useState<ProjectData[]>([]);
  const [historyFuture, setHistoryFuture] = useState<ProjectData[]>([]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    loadSavedProjects().then(setSavedProjects);
  }, []);

  const pushToast = (tone: ToastMessage["tone"], text: string) => {
    setToasts((current) => [...current, { id: crypto.randomUUID(), tone, text }]);
  };
  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const commitHistory = () => {
    const baseline = burstBaselineRef.current;
    burstBaselineRef.current = null;
    if (!baseline) return;
    setHistoryPast((past) => [...past, baseline].slice(-HISTORY_LIMIT));
    setHistoryFuture([]);
  };

  const updateProject = (updater: (current: ProjectData) => ProjectData) => {
    setProject((current) => {
      if (!burstBaselineRef.current) burstBaselineRef.current = current;
      return withTimestamp(updater(current));
    });
  };

  const commitAction = (updater: (current: ProjectData) => ProjectData) => {
    updateProject(updater);
    commitHistory();
  };

  const updateSettings = (updater: (settings: ProjectData["settings"]) => ProjectData["settings"]) => {
    updateProject((current) => ({ ...current, settings: updater(current.settings) }));
  };

  const undo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [projectRef.current, ...future].slice(0, HISTORY_LIMIT));
    burstBaselineRef.current = null;
    setProject(previous);
  };

  const redo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, projectRef.current].slice(-HISTORY_LIMIT));
    burstBaselineRef.current = null;
    setProject(next);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = document.activeElement;
      const isTextInput = target instanceof HTMLInputElement && (target.type === "text" || target.type === "number");
      const isMeta = event.ctrlKey || event.metaKey;
      if (!isMeta) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        if (isTextInput) return;
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        if (isTextInput) return;
        event.preventDefault();
        redo();
      } else if (key === "s") {
        event.preventDefault();
        saveCurrentProject();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPast, historyFuture]);

  const selectedImage = useMemo(
    () => project.images.find((image) => image.id === selectedImageId) ?? project.images[0],
    [project.images, selectedImageId]
  );

  useEffect(() => {
    if (!selectedImageId && project.images.length > 0) setSelectedImageId(project.images[0].id);
    if (selectedImageId && !project.images.some((image) => image.id === selectedImageId)) {
      setSelectedImageId(project.images[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.images]);

  const updateSelectedImage = (updater: (image: ImageLayer) => ImageLayer) => {
    if (!selectedImage) return;
    updateProject((current) => ({
      ...current,
      images: current.images.map((image) => (image.id === selectedImage.id ? updater(image) : image))
    }));
  };

  // --- Generation pipeline: draft (low-res) pass for instant feedback, then a debounced full-res pass. ---
  useEffect(() => {
    let cancelled = false;
    const settings = project.settings;
    const fullSampling = settings.quality === "Custom" ? settings.advanced.sampling : qualitySamplingMap[settings.quality];
    const draftSampling = Math.min(fullSampling, 56);
    const useDraftPass = fullSampling > 72 && project.images.length > 0;

    setLoading(true);
    setProgressLabel("Processing photos…");

    const dispatch = async (sampling: number) => {
      const id = ++requestIdRef.current;
      try {
        const layers = await Promise.all(project.images.map((layer) => rasterizeLayer(layer, sampling, sampling)));
        if (cancelled) return;
        const passSettings = { ...settings, advanced: { ...settings.advanced, sampling, meshResolution: sampling } };
        generatorWorker.postMessage({ requestId: id, settings: passSettings, layers });
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setLoading(false);
        pushToast("error", error instanceof Error ? error.message : "Failed to process photos.");
      }
    };

    let settleTimer: number | undefined;
    if (useDraftPass) {
      dispatch(draftSampling);
      settleTimer = window.setTimeout(() => dispatch(fullSampling), DRAFT_SETTLE_MS);
    } else {
      dispatch(fullSampling);
    }

    return () => {
      cancelled = true;
      if (settleTimer) window.clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === "progress") {
        if (data.requestId === requestIdRef.current) setProgressLabel(data.stage);
        return;
      }
      if (data.requestId < appliedResultIdRef.current) return;
      appliedResultIdRef.current = data.requestId;
      setResult(data.result);
      setActivePart((prev) => data.result.parts.find((part) => part.name === prev)?.name ?? data.result.parts[0]?.name);
      if (data.requestId === requestIdRef.current) setLoading(false);
    };
    generatorWorker.addEventListener("message", onMessage);
    return () => generatorWorker.removeEventListener("message", onMessage);
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextImages: ImageLayer[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image file.`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        const size = await inferImageSize(dataUrl);
        nextImages.push(makeImageLayer(file.name, dataUrl, size));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Failed to load ${file.name}.`);
      }
    }
    if (errors.length > 0) pushToast("error", errors.length === 1 ? errors[0] : `${errors.length} photos failed to load.`);
    if (nextImages.length === 0) return;

    commitAction((current) => ({ ...current, images: placeNewImages(current.images, nextImages) }));
    setSelectedImageId(nextImages[0].id);
    setLeftTab("photos");
    pushToast("success", nextImages.length === 1 ? "Photo added." : `${nextImages.length} photos added.`);
  };

  const loadSampleImages = async () => {
    try {
      const sampleUrls = ["/samples/portrait-demo.svg", "/samples/landscape-demo.svg"];
      const nextImages: ImageLayer[] = [];
      for (const url of sampleUrls) {
        const response = await fetch(url);
        const svg = await response.text();
        const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        const size = await inferImageSize(dataUrl);
        nextImages.push(makeImageLayer(url.split("/").pop() ?? "sample.svg", dataUrl, size));
      }
      commitAction((current) => ({ ...current, images: placeNewImages(current.images, nextImages) }));
      setSelectedImageId(nextImages[0]?.id);
      setLeftTab("photos");
    } catch {
      pushToast("error", "Could not load demo photos.");
    }
  };

  const removeImage = (id: string) => {
    commitAction((current) => ({ ...current, images: current.images.filter((image) => image.id !== id) }));
  };

  const replaceImage = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const size = await inferImageSize(dataUrl);
      commitAction((current) => ({
        ...current,
        images: current.images.map((image) =>
          image.id === id ? { ...image, name: file.name, dataUrl, width: size.width, height: size.height, crop: { x: 0, y: 0, w: 1, h: 1 } } : image
        )
      }));
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Failed to replace photo.");
    }
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    commitAction((current) => {
      const images = [...current.images];
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return { ...current, images };
    });
  };

  const rotateImageQuick = (id: string, delta: number) => {
    commitAction((current) => ({
      ...current,
      images: current.images.map((image) =>
        image.id === id ? { ...image, adjustments: { ...image.adjustments, rotate: wrapDegrees(image.adjustments.rotate + delta) } } : image
      )
    }));
  };

  const selectPreset = (presetName: string) => {
    const preset = projectPresets.find((item) => item.name === presetName);
    if (!preset) return;
    commitAction((current) => ({ ...current, name: preset.name, settings: preset.settings }));
    setActivePresetName(preset.name);
    if (project.images.length === 0) setLeftTab("photos");
  };

  const selectShape = (shape: ShapeKind) => {
    commitAction((current) => ({ ...current, settings: { ...current.settings, shape } }));
    setActivePresetName(undefined);
  };

  const autoLayoutCount = (count: number) => {
    commitAction((current) => ({
      ...current,
      images: autoArrangeLayers(Math.min(count, current.images.length), current.images)
    }));
  };

  const onSpherePick = (lon: number, lat: number) => {
    if (project.settings.shape !== "sphere" || !selectedImage) return;
    commitAction((current) => ({
      ...current,
      images: current.images.map((image) =>
        image.id === selectedImage.id ? { ...image, centerLon: lon, centerLat: Math.max(-70, Math.min(70, lat)) } : image
      )
    }));
  };

  const saveCurrentProject = async () => {
    try {
      await saveProject(projectRef.current);
      setSavedProjects(await loadSavedProjects());
      pushToast("success", "Project saved.");
    } catch {
      pushToast("error", "Could not save project.");
    }
  };

  const openSavedProject = (saved: ProjectData) => {
    setProject(saved);
    setHistoryPast([]);
    setHistoryFuture([]);
    burstBaselineRef.current = null;
    setActivePresetName(undefined);
    setSelectedImageId(saved.images[0]?.id);
  };

  const deleteSavedProject = async (id: string) => {
    await deleteProject(id);
    setSavedProjects(await loadSavedProjects());
    pushToast("info", "Project deleted.");
  };

  const exportPart = (format: "stl" | "obj", name: string) => {
    const mesh = result.parts.find((part) => part.name === name);
    if (!mesh) return;
    try {
      if (format === "stl") downloadText(`${mesh.name}.stl`, meshToStl(mesh));
      if (format === "obj") downloadText(`${mesh.name}.obj`, meshToObj(mesh));
      pushToast("success", `Exported ${mesh.name}.${format}`);
    } catch {
      pushToast("error", `Failed to export ${mesh.name}.`);
    }
  };

  const exportAll = () => {
    if (result.parts.length === 0) return;
    try {
      exportZip(result);
      pushToast("success", "Export ready.");
    } catch {
      pushToast("error", "Export failed.");
    }
  };

  const markers: SphereMarker[] | undefined =
    project.settings.shape === "sphere"
      ? project.images.map((image, index) => ({
          id: image.id,
          lon: image.centerLon,
          lat: image.centerLat,
          active: image.id === selectedImage?.id,
          color: MARKER_COLORS[index % MARKER_COLORS.length]
        }))
      : undefined;

  const hasErrors = result.validation.some((issue) => issue.severity === "error");

  return (
    <div className="app-shell">
      <TopBar
        projectName={project.name}
        onRenameProject={(name) => commitAction((current) => ({ ...current, name }))}
        status={loading ? "generating" : "ready"}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={undo}
        onRedo={redo}
        onSave={saveCurrentProject}
        onExport={exportAll}
        hasExportableParts={result.parts.length > 0}
        onToggleLeftPanel={() => setMobileLeftOpen((v) => !v)}
        onToggleRightPanel={() => setMobileRightOpen((v) => !v)}
      />

      <div className="app-body">
        {(mobileLeftOpen || mobileRightOpen) && (
          <div
            className="drawer-scrim"
            onClick={() => {
              setMobileLeftOpen(false);
              setMobileRightOpen(false);
            }}
          />
        )}

        <LeftPanel
          tab={leftTab}
          onTabChange={setLeftTab}
          photoCount={project.images.length}
          projectCount={savedProjects.length}
          mobileOpen={mobileLeftOpen}
          photosContent={
            <PhotoPanel
              images={project.images}
              selectedId={selectedImage?.id}
              onFilesAdded={handleFiles}
              onSelect={setSelectedImageId}
              onRemove={removeImage}
              onReplace={replaceImage}
              onReorder={reorderImages}
              onRotateQuick={rotateImageQuick}
            />
          }
          shapesContent={
            <ShapePanel activeShape={project.settings.shape} activePresetName={activePresetName} onSelectPreset={selectPreset} onSelectShape={selectShape} />
          }
          projectsContent={
            <ProjectsPanel savedProjects={savedProjects} currentProjectId={project.id} onOpen={openSavedProject} onDelete={deleteSavedProject} />
          }
        />

        <main className="workspace">
          <Viewport
            result={result}
            mode={project.settings.previewMode}
            onModeChange={(mode) => commitAction((current) => ({ ...current, settings: { ...current.settings, previewMode: mode } }))}
            activePart={activePart}
            onPartSelect={setActivePart}
            onSpherePick={onSpherePick}
            markers={markers}
            onMarkerSelect={setSelectedImageId}
            loading={loading}
            progressLabel={progressLabel}
            hasImages={project.images.length > 0}
            onUploadClick={() => uploadInputRef.current?.click()}
            onLoadDemo={loadSampleImages}
            buildPlateSize={Math.max(project.settings.buildVolume.x, project.settings.buildVolume.y)}
          />
        </main>

        <RightPanel
          project={project}
          updateSettings={updateSettings}
          selectedImage={selectedImage}
          updateSelectedImage={updateSelectedImage}
          result={result}
          onExportPart={exportPart}
          onExportZip={exportAll}
          onAutoLayout={autoLayoutCount}
          onSettle={commitHistory}
          mobileOpen={mobileRightOpen}
        />
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        hidden
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {hasErrors && <div className="global-alert">Validation found blocking issues — check the Print section before exporting.</div>}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
