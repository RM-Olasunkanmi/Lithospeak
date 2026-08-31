export type ShapeKind =
  | "flat"
  | "curved"
  | "cylinder"
  | "sphere"
  | "hemisphere"
  | "lampshade"
  | "heart"
  | "oval"
  | "ornament"
  | "moon";

export type PreviewMode = "solid" | "transmission" | "wireframe" | "backlight";
export type QualityPreset = "Draft" | "Standard" | "High" | "Ultra" | "Custom";
export type SphereBlendMode = "average" | "darkest-wins" | "lightest-wins";

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageAdjustments {
  invert: boolean;
  brightness: number;
  contrast: number;
  gamma: number;
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  smoothing: number;
  autoEnhance: boolean;
  rotate: number;
  flipX: boolean;
  flipY: boolean;
}

export interface ImageLayer {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  crop: CropRect;
  adjustments: ImageAdjustments;
  centerLon: number;
  centerLat: number;
  widthDeg: number;
  heightDeg: number;
  rotationDeg: number;
  opacity: number;
  feather: number;
}

export interface BuildVolume {
  x: number;
  y: number;
  z: number;
}

export interface AdvancedSettings {
  sampling: number;
  meshResolution: number;
  smoothingPasses: number;
  tolerance: number;
  connectorClearance: number;
  seamBandDegrees: number;
  maxTriangles: number;
}

export interface BaseSettings {
  enabled: boolean;
  diameter: number;
  height: number;
  pegDiameter: number;
  pegHeight: number;
  cavityDiameter: number;
  cavityDepth: number;
}

export interface ProjectSettings {
  shape: ShapeKind;
  quality: QualityPreset;
  previewMode: PreviewMode;
  minThickness: number;
  maxThickness: number;
  panelWidth: number;
  panelHeight: number;
  curveDegrees: number;
  cylinderDiameter: number;
  cylinderHeight: number;
  lampshadeTopDiameter: number;
  lampshadeBottomDiameter: number;
  lampshadeHeight: number;
  sphereDiameter: number;
  shellThickness: number;
  openingDiameter: number;
  openingPosition: "top" | "bottom";
  orientationDeg: number;
  splitSphere: boolean;
  sphereBlendMode: SphereBlendMode;
  buildVolume: BuildVolume;
  advanced: AdvancedSettings;
  base: BaseSettings;
}

export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  images: ImageLayer[];
  settings: ProjectSettings;
}

export interface RasterLayer {
  id: string;
  name: string;
  width: number;
  height: number;
  pixels: number[];
  centerLon: number;
  centerLat: number;
  widthDeg: number;
  heightDeg: number;
  rotationDeg: number;
  opacity: number;
  feather: number;
}

export interface MeshData {
  name: string;
  vertices: number[];
  indices: number[];
  thicknessSamples?: number[];
  metadata: Record<string, number | string | boolean>;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

export interface GeneratedResult {
  parts: MeshData[];
  validation: ValidationIssue[];
  notes: string[];
}
