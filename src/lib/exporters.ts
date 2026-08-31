import { zipSync, strToU8 } from "fflate";
import type { GeneratedResult, MeshData } from "../types";

function triangleNormal(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number) {
  const ux = bx - ax;
  const uy = by - ay;
  const uz = bz - az;
  const vx = cx - ax;
  const vy = cy - ay;
  const vz = cz - az;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length] as const;
}

export function meshToStl(mesh: MeshData): string {
  const lines = [`solid ${mesh.name}`];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ai = mesh.indices[i] * 3;
    const bi = mesh.indices[i + 1] * 3;
    const ci = mesh.indices[i + 2] * 3;
    const a = mesh.vertices.slice(ai, ai + 3);
    const b = mesh.vertices.slice(bi, bi + 3);
    const c = mesh.vertices.slice(ci, ci + 3);
    const n = triangleNormal(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    lines.push(`facet normal ${n[0]} ${n[1]} ${n[2]}`);
    lines.push("outer loop");
    lines.push(`vertex ${a[0]} ${a[1]} ${a[2]}`);
    lines.push(`vertex ${b[0]} ${b[1]} ${b[2]}`);
    lines.push(`vertex ${c[0]} ${c[1]} ${c[2]}`);
    lines.push("endloop");
    lines.push("endfacet");
  }
  lines.push(`endsolid ${mesh.name}`);
  return lines.join("\n");
}

export function meshToObj(mesh: MeshData): string {
  const lines = [`o ${mesh.name}`];
  for (let i = 0; i < mesh.vertices.length; i += 3) {
    lines.push(`v ${mesh.vertices[i]} ${mesh.vertices[i + 1]} ${mesh.vertices[i + 2]}`);
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    lines.push(`f ${mesh.indices[i] + 1} ${mesh.indices[i + 1] + 1} ${mesh.indices[i + 2] + 1}`);
  }
  return lines.join("\n");
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportZip(result: GeneratedResult): void {
  const entries: Record<string, Uint8Array> = {};
  for (const part of result.parts) {
    entries[`${part.name}.stl`] = strToU8(meshToStl(part));
  }
  entries["print_notes.txt"] = strToU8([
    "Lithospeak export bundle",
    "",
    ...result.notes,
    "",
    "Validation:",
    ...result.validation.map((issue) => `[${issue.severity}] ${issue.message}`)
  ].join("\n"));

  const blob = new Blob([zipSync(entries)], { type: "application/zip" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lithospeak-export.zip";
  link.click();
  URL.revokeObjectURL(link.href);
}
