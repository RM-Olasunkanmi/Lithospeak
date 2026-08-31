import type { GeneratedResult, MeshData, ProjectSettings, RasterLayer, ShapeKind } from "../types";

type Vec3 = [number, number, number];

interface MeshBuilder {
  vertices: number[];
  indices: number[];
}

function builder(): MeshBuilder {
  return { vertices: [], indices: [] };
}

function addVertex(mesh: MeshBuilder, vertex: Vec3): number {
  mesh.vertices.push(vertex[0], vertex[1], vertex[2]);
  return mesh.vertices.length / 3 - 1;
}

function addTri(mesh: MeshBuilder, a: number, b: number, c: number): void {
  mesh.indices.push(a, b, c);
}

function addQuad(mesh: MeshBuilder, a: number, b: number, c: number, d: number, flip = false): void {
  if (flip) {
    addTri(mesh, a, c, b);
    addTri(mesh, a, d, c);
    return;
  }
  addTri(mesh, a, b, c);
  addTri(mesh, a, c, d);
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function wrapAngleDegrees(angle: number): number {
  let result = angle;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
}

function bilinear(layer: RasterLayer, u: number, v: number): number {
  const x = clamp(u) * (layer.width - 1);
  const y = clamp(v) * (layer.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(layer.width - 1, x0 + 1);
  const y1 = Math.min(layer.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const read = (px: number, py: number) => layer.pixels[py * layer.width + px] ?? 1;
  const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;
  return mix(mix(read(x0, y0), read(x1, y0), tx), mix(read(x0, y1), read(x1, y1), tx), ty);
}

function mapLumaToThickness(luma: number, settings: ProjectSettings): number {
  return settings.minThickness + (1 - luma) * (settings.maxThickness - settings.minThickness);
}

function featherAlpha(localX: number, localY: number, feather: number): number {
  const softness = Math.max(0.001, feather / 100);
  const edgeX = Math.max(0, Math.abs(localX) - (0.5 - softness));
  const edgeY = Math.max(0, Math.abs(localY) - (0.5 - softness));
  const edge = Math.max(edgeX, edgeY) / softness;
  return clamp(1 - edge);
}

function sampleSphereLuma(layers: RasterLayer[], lon: number, lat: number, settings: ProjectSettings): number {
  if (layers.length === 0) return 1;
  let accum = 0;
  let total = 0;
  let darkest = 1;
  let lightest = 0;

  for (const layer of layers) {
    const dx0 = wrapAngleDegrees(lon - layer.centerLon) / Math.max(1, layer.widthDeg);
    const dy0 = (lat - layer.centerLat) / Math.max(1, layer.heightDeg);
    const radians = (-layer.rotationDeg * Math.PI) / 180;
    const dx = dx0 * Math.cos(radians) - dy0 * Math.sin(radians);
    const dy = dx0 * Math.sin(radians) + dy0 * Math.cos(radians);
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) continue;
    const alpha = featherAlpha(dx, dy, layer.feather) * layer.opacity;
    if (alpha <= 0) continue;
    const sample = bilinear(layer, dx + 0.5, dy + 0.5);
    darkest = Math.min(darkest, sample);
    lightest = Math.max(lightest, sample);
    accum += sample * alpha;
    total += alpha;
  }

  if (settings.sphereBlendMode === "darkest-wins") return darkest;
  if (settings.sphereBlendMode === "lightest-wins") return lightest;
  return total > 0 ? accum / total : 1;
}

function samplePrimaryLuma(layers: RasterLayer[], u: number, v: number): number {
  if (!layers[0]) return 1;
  return bilinear(layers[0], u, v);
}

function finalizeMesh(name: string, mesh: MeshBuilder, metadata: MeshData["metadata"], thicknessSamples?: number[]): MeshData {
  return {
    name,
    vertices: mesh.vertices,
    indices: mesh.indices,
    metadata,
    thicknessSamples
  };
}

function generatePanel(settings: ProjectSettings, layers: RasterLayer[], shape: ShapeKind): MeshData {
  const mesh = builder();
  const cols = settings.advanced.meshResolution;
  const rows = settings.advanced.meshResolution;
  const front: number[][] = [];
  const back: number[][] = [];
  const thicknessSamples: number[] = [];

  const shapeScaleX = settings.panelWidth / 2;
  const shapeScaleY = settings.panelHeight / 2;

  const shapeBoundary = (angle: number): number => {
    if (shape === "heart") {
      return 0.75 - 0.25 * Math.sin(angle) + 0.08 * Math.sin(2 * angle);
    }
    if (shape === "oval") {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return 1 / Math.sqrt(c * c + 1.6 * s * s);
    }
    return 1;
  };

  if (shape === "flat") {
    for (let y = 0; y < rows; y += 1) {
      front[y] = [];
      back[y] = [];
      for (let x = 0; x < cols; x += 1) {
        const u = x / (cols - 1);
        const v = y / (rows - 1);
        const thickness = mapLumaToThickness(samplePrimaryLuma(layers, u, v), settings);
        thicknessSamples.push(thickness);
        const px = (u - 0.5) * settings.panelWidth;
        const py = (0.5 - v) * settings.panelHeight;
        front[y][x] = addVertex(mesh, [px, py, thickness]);
        back[y][x] = addVertex(mesh, [px, py, 0]);
      }
    }
  } else {
    for (let y = 0; y < rows; y += 1) {
      front[y] = [];
      back[y] = [];
      const radiusNorm = y / (rows - 1);
      for (let x = 0; x < cols; x += 1) {
        const angle = (x / (cols - 1)) * Math.PI * 2;
        const bound = shapeBoundary(angle);
        const r = radiusNorm * bound;
        const px = Math.cos(angle) * r * shapeScaleX;
        const py = Math.sin(angle) * r * shapeScaleY;
        const u = clamp(px / (shapeScaleX * 2) + 0.5);
        const v = clamp(0.5 - py / (shapeScaleY * 2));
        let thickness = mapLumaToThickness(samplePrimaryLuma(layers, u, v), settings);
        if (shape === "moon") {
          thickness += (Math.sin(angle * 6) * 0.08 + Math.cos(radiusNorm * 20) * 0.05) * (settings.maxThickness - settings.minThickness);
        }
        thicknessSamples.push(thickness);
        front[y][x] = addVertex(mesh, [px, py, thickness]);
        back[y][x] = addVertex(mesh, [px, py, 0]);
      }
    }
  }

  for (let y = 0; y < rows - 1; y += 1) {
    for (let x = 0; x < cols - 1; x += 1) {
      addQuad(mesh, front[y][x], front[y][x + 1], front[y + 1][x + 1], front[y + 1][x]);
      addQuad(mesh, back[y][x], back[y + 1][x], back[y + 1][x + 1], back[y][x + 1]);
    }
  }

  const sidePairs: Array<[number[], number[]]> = [];
  sidePairs.push([front[0], back[0]]);
  sidePairs.push([front[rows - 1], back[rows - 1]]);
  sidePairs.push([front.map((row) => row[0]), back.map((row) => row[0])]);
  sidePairs.push([front.map((row) => row[cols - 1]), back.map((row) => row[cols - 1])]);

  for (const [outer, inner] of sidePairs) {
    for (let i = 0; i < outer.length - 1; i += 1) {
      addQuad(mesh, outer[i], outer[i + 1], inner[i + 1], inner[i], true);
    }
  }

  if (shape === "ornament") {
    const loopOuter = 8;
    const loopInner = 4.2;
    const y = settings.panelHeight / 2 + 8;
    const segments = 28;
    const outerRing: number[] = [];
    const innerRing: number[] = [];
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      outerRing.push(addVertex(mesh, [Math.cos(angle) * loopOuter, y + Math.sin(angle) * loopOuter, settings.maxThickness]));
      innerRing.push(addVertex(mesh, [Math.cos(angle) * loopInner, y + Math.sin(angle) * loopInner, 0]));
    }
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      addQuad(mesh, outerRing[i], outerRing[next], innerRing[next], innerRing[i], true);
    }
  }

  return finalizeMesh(`${shape}_lithophane`, mesh, { shape }, thicknessSamples);
}

function generateCurved(settings: ProjectSettings, layers: RasterLayer[]): MeshData {
  const mesh = builder();
  const cols = settings.advanced.meshResolution;
  const rows = settings.advanced.meshResolution;
  const angleSpan = (settings.curveDegrees * Math.PI) / 180;
  const outerRadius = settings.panelWidth / angleSpan;
  const inner: number[][] = [];
  const outer: number[][] = [];
  const thicknessSamples: number[] = [];

  for (let y = 0; y < rows; y += 1) {
    inner[y] = [];
    outer[y] = [];
    const v = y / (rows - 1);
    const py = (0.5 - v) * settings.panelHeight;
    for (let x = 0; x < cols; x += 1) {
      const u = x / (cols - 1);
      const theta = (u - 0.5) * angleSpan;
      const thickness = mapLumaToThickness(samplePrimaryLuma(layers, u, v), settings);
      thicknessSamples.push(thickness);
      const inPoint: Vec3 = [Math.sin(theta) * (outerRadius - thickness), py, Math.cos(theta) * (outerRadius - thickness)];
      const outPoint: Vec3 = [Math.sin(theta) * outerRadius, py, Math.cos(theta) * outerRadius];
      inner[y][x] = addVertex(mesh, inPoint);
      outer[y][x] = addVertex(mesh, outPoint);
    }
  }

  for (let y = 0; y < rows - 1; y += 1) {
    for (let x = 0; x < cols - 1; x += 1) {
      addQuad(mesh, outer[y][x], outer[y][x + 1], outer[y + 1][x + 1], outer[y + 1][x]);
      addQuad(mesh, inner[y][x], inner[y + 1][x], inner[y + 1][x + 1], inner[y][x + 1]);
    }
  }

  for (let y = 0; y < rows - 1; y += 1) {
    addQuad(mesh, outer[y][0], outer[y + 1][0], inner[y + 1][0], inner[y][0], true);
    addQuad(mesh, outer[y][cols - 1], inner[y][cols - 1], inner[y + 1][cols - 1], outer[y + 1][cols - 1], true);
  }

  for (let x = 0; x < cols - 1; x += 1) {
    addQuad(mesh, outer[0][x], inner[0][x], inner[0][x + 1], outer[0][x + 1], true);
    addQuad(mesh, outer[rows - 1][x], outer[rows - 1][x + 1], inner[rows - 1][x + 1], inner[rows - 1][x], true);
  }

  return finalizeMesh("curved_lithophane", mesh, { shape: "curved", radius: outerRadius }, thicknessSamples);
}

function generateRevolvedShell(
  name: string,
  settings: ProjectSettings,
  layers: RasterLayer[],
  radiusAt: (v: number) => number,
  topOpen: boolean,
  bottomOpen: boolean,
  fullWrap: boolean
): MeshData {
  const mesh = builder();
  const cols = settings.advanced.meshResolution;
  const rows = settings.advanced.meshResolution;
  const outer: number[][] = [];
  const inner: number[][] = [];
  const height = name === "cylinder_lithophane" ? settings.cylinderHeight : settings.lampshadeHeight;
  const thicknessSamples: number[] = [];

  for (let y = 0; y < rows; y += 1) {
    outer[y] = [];
    inner[y] = [];
    const v = y / (rows - 1);
    const py = (0.5 - v) * height;
    const baseRadius = radiusAt(v);
    for (let x = 0; x < cols; x += 1) {
      const u = x / (cols - 1);
      const theta = u * Math.PI * 2;
      const thickness = mapLumaToThickness(samplePrimaryLuma(layers, u, v), settings);
      thicknessSamples.push(thickness);
      const outerRadius = baseRadius;
      const innerRadius = Math.max(1, baseRadius - thickness);
      outer[y][x] = addVertex(mesh, [Math.cos(theta) * outerRadius, py, Math.sin(theta) * outerRadius]);
      inner[y][x] = addVertex(mesh, [Math.cos(theta) * innerRadius, py, Math.sin(theta) * innerRadius]);
    }
  }

  const wrapLimit = fullWrap ? cols : cols - 1;
  for (let y = 0; y < rows - 1; y += 1) {
    for (let x = 0; x < wrapLimit - 1; x += 1) {
      const nx = (x + 1) % cols;
      addQuad(mesh, outer[y][x], outer[y][nx], outer[y + 1][nx], outer[y + 1][x]);
      addQuad(mesh, inner[y][x], inner[y + 1][x], inner[y + 1][nx], inner[y][nx]);
    }
  }

  for (let x = 0; x < cols - 1; x += 1) {
    if (!topOpen) {
      addQuad(mesh, outer[0][x], inner[0][x], inner[0][x + 1], outer[0][x + 1], true);
    } else {
      addQuad(mesh, outer[0][x], outer[0][x + 1], inner[0][x + 1], inner[0][x], true);
    }
    if (!bottomOpen) {
      addQuad(mesh, outer[rows - 1][x], outer[rows - 1][x + 1], inner[rows - 1][x + 1], inner[rows - 1][x], true);
    } else {
      addQuad(mesh, outer[rows - 1][x], inner[rows - 1][x], inner[rows - 1][x + 1], outer[rows - 1][x + 1], true);
    }
  }

  return finalizeMesh(name, mesh, { shape: name }, thicknessSamples);
}

function openingLatitude(settings: ProjectSettings): number {
  const radius = settings.sphereDiameter / 2;
  const chordRadius = settings.openingDiameter / 2;
  if (chordRadius <= 0) return settings.openingPosition === "top" ? 90 : -90;
  const capAngle = Math.acos(clamp(Math.sqrt(Math.max(0, radius * radius - chordRadius * chordRadius)) / radius, 0, 1));
  return settings.openingPosition === "top" ? 90 - (capAngle * 180) / Math.PI : -90 + (capAngle * 180) / Math.PI;
}

function generateSphereShell(settings: ProjectSettings, layers: RasterLayer[], split: "none" | "top" | "bottom"): MeshData {
  const mesh = builder();
  const cols = settings.advanced.meshResolution * 2;
  const rows = settings.advanced.meshResolution;
  const outerR = settings.sphereDiameter / 2;
  const seamLat = 0;
  const seamBand = settings.advanced.seamBandDegrees / 2;
  const minLat = split === "top" ? 0 : split === "bottom" ? -90 : -90;
  const maxLat = split === "top" ? 90 : split === "bottom" ? 0 : 90;
  const sampledMinLat = minLat === -90 ? -89.4 : minLat;
  const sampledMaxLat = maxLat === 90 ? 89.4 : maxLat;
  const openingLat = settings.openingDiameter > 0 && !settings.splitSphere ? openingLatitude(settings) : undefined;
  const outer: number[][] = [];
  const inner: number[][] = [];
  const thicknessSamples: number[] = [];

  for (let y = 0; y < rows; y += 1) {
    outer[y] = [];
    inner[y] = [];
    const lat = sampledMinLat + ((sampledMaxLat - sampledMinLat) * y) / (rows - 1);
    for (let x = 0; x < cols; x += 1) {
      const lon = ((x / (cols - 1)) * 360 + settings.orientationDeg) % 360;
      let luma = sampleSphereLuma(layers, lon, lat, settings);
      let thickness = mapLumaToThickness(luma, settings);
      if (settings.splitSphere && Math.abs(lat - seamLat) < seamBand) {
        thickness = settings.maxThickness;
      }
      thicknessSamples.push(thickness);
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180;
      const innerR = outerR - thickness;
      outer[y][x] = addVertex(mesh, [
        outerR * Math.sin(phi) * Math.cos(theta),
        outerR * Math.cos(phi),
        outerR * Math.sin(phi) * Math.sin(theta)
      ]);
      inner[y][x] = addVertex(mesh, [
        innerR * Math.sin(phi) * Math.cos(theta),
        innerR * Math.cos(phi),
        innerR * Math.sin(phi) * Math.sin(theta)
      ]);
    }
  }

  for (let y = 0; y < rows - 1; y += 1) {
    const latA = sampledMinLat + ((sampledMaxLat - sampledMinLat) * y) / (rows - 1);
    const latB = sampledMinLat + ((sampledMaxLat - sampledMinLat) * (y + 1)) / (rows - 1);
    const skipBand = openingLat !== undefined && ((settings.openingPosition === "top" && latA >= openingLat && latB >= openingLat) || (settings.openingPosition === "bottom" && latA <= openingLat && latB <= openingLat));
    if (skipBand) continue;
    for (let x = 0; x < cols - 1; x += 1) {
      addQuad(mesh, outer[y][x], outer[y][x + 1], outer[y + 1][x + 1], outer[y + 1][x]);
      addQuad(mesh, inner[y][x], inner[y + 1][x], inner[y + 1][x + 1], inner[y][x + 1]);
    }
  }

  const closeLatitudeRing = (ringIndex: number, reverse: boolean) => {
    for (let x = 0; x < cols - 1; x += 1) {
      addQuad(mesh, outer[ringIndex][x], outer[ringIndex][x + 1], inner[ringIndex][x + 1], inner[ringIndex][x], reverse);
    }
  };

  if (split === "none") {
    const hasTopOpening = settings.openingDiameter > 0 && settings.openingPosition === "top";
    const hasBottomOpening = settings.openingDiameter > 0 && settings.openingPosition === "bottom";
    if (!hasBottomOpening) closeLatitudeRing(0, false);
    if (!hasTopOpening) closeLatitudeRing(rows - 1, true);
  }
  if (split === "top") closeLatitudeRing(rows - 1, true);
  if (split === "bottom") closeLatitudeRing(0, false);

  if (!settings.splitSphere && settings.openingDiameter > 0 && openingLat !== undefined) {
    const ringIndex = Math.max(
      0,
      Math.min(
        rows - 1,
        Math.round(((openingLat - sampledMinLat) / Math.max(1, sampledMaxLat - sampledMinLat)) * (rows - 1))
      )
    );
    closeLatitudeRing(ringIndex, settings.openingPosition === "top");
  }

  if (settings.splitSphere) {
    const seamRadius = outerR * Math.sin(Math.PI / 2);
    const lipOuter = Math.max(1, seamRadius - settings.maxThickness * 0.35);
    const lipInner = Math.max(1, lipOuter - 2.2);
    const collarHeight = 5;
    const clearance = settings.advanced.connectorClearance;
    const isTop = split === "top";
    const y1 = isTop ? -collarHeight : collarHeight;
    const seamIndex = isTop ? 0 : rows - 1;
    const outerRingA = outer[seamIndex];
    const outerRingB: number[] = [];
    const innerRingA = inner[seamIndex];
    const innerRingB: number[] = [];
    for (let x = 0; x < cols; x += 1) {
      const theta = ((x / (cols - 1)) * Math.PI * 2);
      const innerOffset = isTop ? 0 : clearance;
      const outerOffset = isTop ? 0 : clearance;
      outerRingB.push(addVertex(mesh, [Math.cos(theta) * (lipOuter - outerOffset), y1, Math.sin(theta) * (lipOuter - outerOffset)]));
      innerRingB.push(addVertex(mesh, [Math.cos(theta) * (lipInner - innerOffset), y1, Math.sin(theta) * (lipInner - innerOffset)]));
    }
    for (let x = 0; x < cols - 1; x += 1) {
      addQuad(mesh, outerRingA[x], outerRingA[x + 1], outerRingB[x + 1], outerRingB[x]);
      addQuad(mesh, innerRingA[x], innerRingB[x], innerRingB[x + 1], innerRingA[x + 1]);
      addQuad(mesh, outerRingA[x], innerRingA[x], innerRingA[x + 1], outerRingA[x + 1], true);
      addQuad(mesh, outerRingB[x], outerRingB[x + 1], innerRingB[x + 1], innerRingB[x], true);
    }
  }

  return finalizeMesh(
    split === "none" ? "sphere_shell" : split === "top" ? "sphere_top" : "sphere_bottom",
    mesh,
    { shape: split === "none" ? "sphere" : "split-sphere", split, diameter: settings.sphereDiameter },
    thicknessSamples
  );
}

function generateBase(settings: ProjectSettings): MeshData {
  const mesh = builder();
  const segments = 56;
  const h = settings.base.height;
  const outerR = settings.base.diameter / 2;
  const cavityR = settings.base.cavityDiameter / 2;
  const pegR = settings.base.pegDiameter / 2;

  const makeRing = (radius: number, y: number): number[] => {
    const ring: number[] = [];
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      ring.push(addVertex(mesh, [Math.cos(angle) * radius, y, Math.sin(angle) * radius]));
    }
    return ring;
  };

  const bottomOuter = makeRing(outerR, 0);
  const topOuter = makeRing(outerR, h);
  const bottomCavity = makeRing(cavityR, 0);
  const cavityTop = makeRing(cavityR, Math.max(1, h - settings.base.cavityDepth));
  const pegBottom = makeRing(pegR, h);
  const pegTop = makeRing(pegR, h + settings.base.pegHeight);

  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    addQuad(mesh, bottomOuter[i], bottomOuter[next], topOuter[next], topOuter[i]);
    addQuad(mesh, bottomCavity[i], cavityTop[i], cavityTop[next], bottomCavity[next]);
    addQuad(mesh, topOuter[i], topOuter[next], cavityTop[next], cavityTop[i], true);
    addQuad(mesh, pegBottom[i], pegBottom[next], pegTop[next], pegTop[i]);
    addQuad(mesh, topOuter[i], pegBottom[i], pegBottom[next], topOuter[next], true);
    addQuad(mesh, pegTop[i], pegTop[next], pegBottom[next], pegBottom[i], true);
  }

  return finalizeMesh("sphere_base", mesh, { shape: "base" });
}

export function generateProjectMeshes(settings: ProjectSettings, layers: RasterLayer[]): GeneratedResult {
  const parts: MeshData[] = [];
  switch (settings.shape) {
    case "flat":
    case "heart":
    case "oval":
    case "ornament":
    case "moon":
      parts.push(generatePanel(settings, layers, settings.shape));
      break;
    case "curved":
      parts.push(generateCurved(settings, layers));
      break;
    case "cylinder":
      parts.push(generateRevolvedShell("cylinder_lithophane", settings, layers, () => settings.cylinderDiameter / 2, true, true, true));
      break;
    case "lampshade":
      parts.push(
        generateRevolvedShell(
          "lampshade_lithophane",
          settings,
          layers,
          (v) => settings.lampshadeTopDiameter / 2 + (settings.lampshadeBottomDiameter / 2 - settings.lampshadeTopDiameter / 2) * v,
          true,
          true,
          true
        )
      );
      break;
    case "hemisphere":
      parts.push(generateSphereShell({ ...settings, splitSphere: false, openingDiameter: settings.sphereDiameter }, layers, "top"));
      break;
    case "sphere":
      if (settings.splitSphere) {
        parts.push(generateSphereShell(settings, layers, "top"));
        parts.push(generateSphereShell(settings, layers, "bottom"));
      } else {
        parts.push(generateSphereShell(settings, layers, "none"));
      }
      if (settings.base.enabled) {
        parts.push(generateBase(settings));
      }
      break;
  }

  return { parts, validation: [], notes: [] };
}
