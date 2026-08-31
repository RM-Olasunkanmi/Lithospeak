import { meshToStl } from "./exporters";
import { generateProjectMeshes } from "./geometry";
import { createDefaultProject } from "./presets";
import { connectedComponents, edgeStats, validateResult } from "./validation";
import type { RasterLayer } from "../types";

function makeLayer(name: string, valueA = 0, valueB = 1): RasterLayer {
  return {
    id: name,
    name,
    width: 16,
    height: 16,
    pixels: Array.from({ length: 256 }, (_, index) => (index % 16) / 15 * (valueB - valueA) + valueA),
    centerLon: 0,
    centerLat: 0,
    widthDeg: 90,
    heightDeg: 70,
    rotationDeg: 0,
    opacity: 1,
    feather: 8
  };
}

function axisSize(vertices: number[], axis: number): number {
  const values: number[] = [];
  for (let i = axis; i < vertices.length; i += 3) values.push(vertices[i]);
  return Math.max(...values) - Math.min(...values);
}

describe("lithophane geometry", () => {
  it("builds a flat lithophane with the requested thickness range", () => {
    const project = createDefaultProject();
    project.settings.shape = "flat";
    const result = generateProjectMeshes(project.settings, [makeLayer("flat")]);
    const mesh = result.parts[0];
    expect(mesh).toBeDefined();
    const min = Math.min(...(mesh.thicknessSamples ?? []));
    const max = Math.max(...(mesh.thicknessSamples ?? []));
    expect(min).toBeGreaterThanOrEqual(project.settings.minThickness - 0.02);
    expect(max).toBeLessThanOrEqual(project.settings.maxThickness + 0.02);
  });

  it("builds a cylinder within the requested dimensions", () => {
    const project = createDefaultProject();
    project.settings.shape = "cylinder";
    const result = generateProjectMeshes(project.settings, [makeLayer("cylinder")]);
    const mesh = result.parts[0];
    expect(axisSize(mesh.vertices, 1)).toBeCloseTo(project.settings.cylinderHeight, 0);
    expect(axisSize(mesh.vertices, 0)).toBeLessThanOrEqual(project.settings.cylinderDiameter + 0.5);
  });

  it("builds a sphere with the correct diameter and a hollow cavity", () => {
    const project = createDefaultProject();
    project.settings.shape = "sphere";
    project.settings.base.enabled = false;
    project.settings.openingDiameter = 0;
    const result = generateProjectMeshes(project.settings, [makeLayer("sphere")]);
    const mesh = result.parts[0];
    expect(axisSize(mesh.vertices, 0)).toBeCloseTo(project.settings.sphereDiameter, 0);
    const issues = validateResult(result.parts, project.settings);
    expect(issues.some((issue) => issue.code === "invalid-cavity")).toBe(false);
    expect(edgeStats(mesh).nonManifold).toBe(0);
    expect(connectedComponents(mesh)).toBe(1);
  });

  it("builds a split sphere with matching top and bottom dimensions", () => {
    const project = createDefaultProject();
    project.settings.shape = "sphere";
    project.settings.splitSphere = true;
    project.settings.base.enabled = false;
    const result = generateProjectMeshes(project.settings, [makeLayer("a"), makeLayer("b"), makeLayer("c"), makeLayer("d")]);
    expect(result.parts).toHaveLength(2);
    const top = result.parts[0];
    const bottom = result.parts[1];
    expect(axisSize(top.vertices, 0)).toBeCloseTo(axisSize(bottom.vertices, 0), 0);
    expect(connectedComponents(top)).toBe(1);
    expect(connectedComponents(bottom)).toBe(1);
  });

  it("displaces sphere thickness based on image placement", () => {
    const project = createDefaultProject();
    project.settings.shape = "sphere";
    project.settings.base.enabled = false;
    const left = makeLayer("left", 0, 0);
    left.centerLon = 0;
    left.widthDeg = 80;
    const right = makeLayer("right", 1, 1);
    right.centerLon = 180;
    right.widthDeg = 80;
    const result = generateProjectMeshes(project.settings, [left, right]);
    const samples = result.parts[0].thicknessSamples ?? [];
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(1);
  });

  it("creates an opening when requested", () => {
    const project = createDefaultProject();
    project.settings.shape = "sphere";
    project.settings.base.enabled = false;
    project.settings.openingDiameter = 40;
    const result = generateProjectMeshes(project.settings, [makeLayer("sphere")]);
    const issues = validateResult(result.parts, project.settings);
    expect(issues.some((issue) => issue.code === "invalid-opening")).toBe(false);
  });

  it("exports valid STL text", () => {
    const project = createDefaultProject();
    project.settings.shape = "sphere";
    project.settings.base.enabled = false;
    const result = generateProjectMeshes(project.settings, [makeLayer("sphere")]);
    const stl = meshToStl(result.parts[0]);
    expect(stl.startsWith("solid ")).toBe(true);
    expect(stl.includes("facet normal")).toBe(true);
  });
});
