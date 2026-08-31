import { generateProjectMeshes } from "../lib/geometry";
import { validateResult } from "../lib/validation";
import type { GeneratedResult, ProjectSettings, RasterLayer } from "../types";

export interface WorkerRequest {
  requestId: number;
  settings: ProjectSettings;
  layers: RasterLayer[];
}

export type WorkerResponse =
  | { type: "progress"; requestId: number; stage: string }
  | { type: "result"; requestId: number; result: GeneratedResult };

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, settings, layers } = event.data;
  const post = (message: WorkerResponse) => postMessage(message);

  post({
    type: "progress",
    requestId,
    stage: settings.shape === "sphere" || settings.shape === "hemisphere" ? "Generating sphere surface…" : "Building lithophane surface…"
  });

  const generated = generateProjectMeshes(settings, layers);

  if (settings.splitSphere || (settings.shape === "sphere" && settings.base.enabled)) {
    post({ type: "progress", requestId, stage: "Creating connectors and base…" });
  }

  post({ type: "progress", requestId, stage: "Checking geometry…" });
  const validation = validateResult(generated.parts, settings);

  const result: GeneratedResult = {
    parts: generated.parts,
    validation,
    notes: [
      `Shape: ${settings.shape}`,
      `Quality: ${settings.quality}`,
      `Requested thickness range: ${settings.minThickness.toFixed(2)}-${settings.maxThickness.toFixed(2)} mm`,
      settings.splitSphere ? "Split sphere uses a friction-fit equator collar." : "Single-part model export."
    ]
  };

  post({ type: "progress", requestId, stage: "Preparing preview…" });
  post({ type: "result", requestId, result });
};

export {};
