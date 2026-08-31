import type { ProjectData, ProjectSettings, ShapeKind } from "../types";

const defaultSettings: ProjectSettings = {
  shape: "sphere",
  quality: "Standard",
  previewMode: "solid",
  minThickness: 0.8,
  maxThickness: 2.8,
  panelWidth: 120,
  panelHeight: 160,
  curveDegrees: 120,
  cylinderDiameter: 110,
  cylinderHeight: 150,
  lampshadeTopDiameter: 120,
  lampshadeBottomDiameter: 180,
  lampshadeHeight: 160,
  sphereDiameter: 140,
  shellThickness: 0.8,
  openingDiameter: 36,
  openingPosition: "bottom",
  orientationDeg: 0,
  splitSphere: false,
  sphereBlendMode: "average",
  buildVolume: { x: 220, y: 220, z: 250 },
  advanced: {
    sampling: 128,
    meshResolution: 128,
    smoothingPasses: 1,
    tolerance: 0.3,
    connectorClearance: 0.35,
    seamBandDegrees: 8,
    maxTriangles: 350000
  },
  base: {
    enabled: true,
    diameter: 90,
    height: 28,
    pegDiameter: 24,
    pegHeight: 12,
    cavityDiameter: 50,
    cavityDepth: 16
  }
};

export const qualitySamplingMap = {
  Draft: 80,
  Standard: 128,
  High: 176,
  Ultra: 224,
  Custom: 128
} as const;

export function createDefaultProject(): ProjectData {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Untitled Lithospeak Project",
    createdAt: now,
    updatedAt: now,
    images: [],
    settings: defaultSettings
  };
}

function preset(shape: ShapeKind, name: string, overrides: Partial<ProjectSettings>): ProjectData {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    images: [],
    settings: { ...defaultSettings, shape, ...overrides }
  };
}

export const projectPresets = [
  preset("flat", "Photo Panel", { panelWidth: 120, panelHeight: 180 }),
  preset("curved", "Curved Photo", { curveDegrees: 140, panelWidth: 160, panelHeight: 160 }),
  preset("cylinder", "Cylinder Lamp", { cylinderDiameter: 120, cylinderHeight: 180 }),
  preset("sphere", "Single Photo Sphere", { sphereDiameter: 130 }),
  preset("sphere", "Four Photo Sphere", { sphereDiameter: 150 }),
  preset("sphere", "Six Photo Sphere", { sphereDiameter: 170 }),
  preset("sphere", "Photo Globe", { sphereDiameter: 180, splitSphere: true, base: { ...defaultSettings.base, enabled: true } }),
  preset("moon", "Moon Lamp", { sphereDiameter: 140, openingDiameter: 32 }),
  preset("ornament", "Photo Ornament", { panelWidth: 90, panelHeight: 90, minThickness: 0.8, maxThickness: 2.6 }),
  preset("flat", "Night Light", { panelWidth: 70, panelHeight: 110 }),
  preset("flat", "Desk Lithophane", { panelWidth: 130, panelHeight: 170 }),
  preset("sphere", "Rotating Globe", { sphereDiameter: 180, splitSphere: true })
];
