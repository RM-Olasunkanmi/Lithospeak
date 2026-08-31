import type { MeshData, ProjectSettings, ValidationIssue } from "../types";

function bounds(mesh: MeshData) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < mesh.vertices.length; i += 3) {
    const x = mesh.vertices[i];
    const y = mesh.vertices[i + 1];
    const z = mesh.vertices[i + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  return { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
}

export function edgeStats(mesh: MeshData) {
  const edgeMap = new Map<string, number>();
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const face = [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]];
    for (let e = 0; e < 3; e += 1) {
      const a = face[e];
      const b = face[(e + 1) % 3];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    }
  }
  let boundary = 0;
  let nonManifold = 0;
  for (const count of edgeMap.values()) {
    if (count === 1) boundary += 1;
    if (count > 2) nonManifold += 1;
  }
  return { boundary, nonManifold };
}

export function connectedComponents(mesh: MeshData): number {
  const faceCount = mesh.indices.length / 3;
  const vertexFaces = new Map<number, number[]>();
  for (let i = 0; i < faceCount; i += 1) {
    const a = mesh.indices[i * 3];
    const b = mesh.indices[i * 3 + 1];
    const c = mesh.indices[i * 3 + 2];
    for (const vertex of [a, b, c]) {
      const current = vertexFaces.get(vertex) ?? [];
      current.push(i);
      vertexFaces.set(vertex, current);
    }
  }

  const seen = new Set<number>();
  let components = 0;
  for (let seed = 0; seed < faceCount; seed += 1) {
    if (seen.has(seed)) continue;
    components += 1;
    const queue = [seed];
    seen.add(seed);
    while (queue.length > 0) {
      const current = queue.pop()!;
      const vertices = [mesh.indices[current * 3], mesh.indices[current * 3 + 1], mesh.indices[current * 3 + 2]];
      for (const vertex of vertices) {
        for (const neighbor of vertexFaces.get(vertex) ?? []) {
          if (!seen.has(neighbor)) {
            seen.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
  }
  return components;
}

export function validateMesh(mesh: MeshData, settings: ProjectSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const size = bounds(mesh);
  if (size.x > settings.buildVolume.x || size.y > settings.buildVolume.y || size.z > settings.buildVolume.z) {
    issues.push({ severity: "warning", code: "build-volume", message: `${mesh.name} exceeds the selected printer build volume.` });
  }
  const { boundary, nonManifold } = edgeStats(mesh);
  if (nonManifold > 0) {
    issues.push({
      severity: mesh.metadata.shape === "split-sphere" ? "warning" : "error",
      code: "non-manifold",
      message:
        mesh.metadata.shape === "split-sphere"
          ? `${mesh.name} uses a connector seam that may need slicer repair on some toolchains.`
          : `${mesh.name} has ${nonManifold} non-manifold edges.`
    });
  }
  if (boundary > 0 && mesh.metadata.shape !== "split-sphere") {
    issues.push({ severity: "warning", code: "open-boundary", message: `${mesh.name} contains ${boundary} boundary edges.` });
  }
  const components = connectedComponents(mesh);
  if (components > 1) {
    issues.push({ severity: "error", code: "disconnected", message: `${mesh.name} contains ${components} disconnected mesh components.` });
  }
  if ((mesh.thicknessSamples?.length ?? 0) > 0) {
    const values = mesh.thicknessSamples!;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min < settings.minThickness - 0.02) {
      issues.push({ severity: "error", code: "thin-wall", message: `${mesh.name} drops below the requested minimum thickness.` });
    }
    if (max > settings.maxThickness + 0.02) {
      issues.push({ severity: "error", code: "thick-wall", message: `${mesh.name} exceeds the requested maximum thickness.` });
    }
  }
  if (mesh.indices.length / 3 > settings.advanced.maxTriangles) {
    issues.push({ severity: "warning", code: "polycount", message: `${mesh.name} is heavier than the selected triangle budget.` });
  }
  if (settings.shape === "sphere") {
    const cavity = settings.sphereDiameter / 2 - settings.maxThickness;
    if (cavity <= 0) {
      issues.push({ severity: "error", code: "invalid-cavity", message: "Sphere shell collapses into a solid because the cavity radius is non-positive." });
    }
    if (!settings.splitSphere && settings.openingDiameter >= settings.sphereDiameter) {
      issues.push({ severity: "error", code: "invalid-opening", message: "Sphere opening is too large for the selected diameter." });
    }
    if (settings.splitSphere && settings.advanced.connectorClearance < 0.15) {
      issues.push({ severity: "warning", code: "connector-clearance", message: "Split connector clearance is very tight and may fuse on FDM printers." });
    }
  }
  return issues;
}

export function validateResult(meshes: MeshData[], settings: ProjectSettings): ValidationIssue[] {
  return meshes.flatMap((mesh) => validateMesh(mesh, settings));
}
