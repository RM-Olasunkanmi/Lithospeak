import type { ImageAdjustments, ImageLayer, RasterLayer } from "../types";

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function applyTone(value: number, adjustments: ImageAdjustments): number {
  let v = value;
  v += adjustments.brightness / 100;
  v = (v - 0.5) * (1 + adjustments.contrast / 100) + 0.5;
  v *= Math.pow(2, adjustments.exposure / 100);
  if (adjustments.shadows !== 0) {
    const shadowWeight = 1 - v;
    v += shadowWeight * (adjustments.shadows / 200);
  }
  if (adjustments.highlights !== 0) {
    const highlightWeight = v;
    v -= highlightWeight * (adjustments.highlights / 200);
  }
  v = clamp(v);
  v = Math.pow(v, 1 / Math.max(0.05, adjustments.gamma));
  if (adjustments.invert) {
    v = 1 - v;
  }
  return clamp(v);
}

function convolveGray(values: Float32Array, width: number, height: number, kernel: number[]): Float32Array {
  const output = new Float32Array(values.length);
  const side = Math.sqrt(kernel.length);
  const radius = Math.floor(side / 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let ky = 0; ky < side; ky += 1) {
        for (let kx = 0; kx < side; kx += 1) {
          const px = Math.min(width - 1, Math.max(0, x + kx - radius));
          const py = Math.min(height - 1, Math.max(0, y + ky - radius));
          sum += values[py * width + px] * kernel[ky * side + kx];
        }
      }
      output[y * width + x] = sum;
    }
  }

  return output;
}

function autoEnhance(data: Float32Array): Float32Array {
  const sorted = [...data].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const high = sorted[Math.floor(sorted.length * 0.98)] ?? 1;
  const range = Math.max(0.001, high - low);
  const next = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    next[i] = clamp((data[i] - low) / range);
  }
  return next;
}

function bilinearSample(data: Uint8ClampedArray, sourceWidth: number, sourceHeight: number, u: number, v: number): [number, number, number] {
  const x = clamp(u) * (sourceWidth - 1);
  const y = clamp(v) * (sourceHeight - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(sourceWidth - 1, x0 + 1);
  const y1 = Math.min(sourceHeight - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const read = (px: number, py: number) => {
    const index = (py * sourceWidth + px) * 4;
    return [data[index], data[index + 1], data[index + 2]] as const;
  };

  const c00 = read(x0, y0);
  const c10 = read(x1, y0);
  const c01 = read(x0, y1);
  const c11 = read(x1, y1);

  const mix = (a: number, b: number, t: number) => a * (1 - t) + b * t;
  const r = mix(mix(c00[0], c10[0], tx), mix(c01[0], c11[0], tx), ty);
  const g = mix(mix(c00[1], c10[1], tx), mix(c01[1], c11[1], tx), ty);
  const b = mix(mix(c00[2], c10[2], tx), mix(c01[2], c11[2], tx), ty);
  return [r, g, b];
}

async function decodeImage(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

export async function rasterizeLayer(layer: ImageLayer, targetWidth: number, targetHeight: number): Promise<RasterLayer> {
  const bitmap = await decodeImage(layer.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to create image processing context.");
  }

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(layer.adjustments.flipX ? -1 : 1, layer.adjustments.flipY ? -1 : 1);
  context.rotate((layer.adjustments.rotate * Math.PI) / 180);
  context.drawImage(bitmap, -canvas.width / 2, -canvas.height / 2);
  context.restore();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const cropped = new Float32Array(targetWidth * targetHeight);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const u = layer.crop.x + (x / Math.max(1, targetWidth - 1)) * layer.crop.w;
      const v = layer.crop.y + (y / Math.max(1, targetHeight - 1)) * layer.crop.h;
      const [r, g, b] = bilinearSample(image.data, canvas.width, canvas.height, u, v);
      const luma = clamp((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);
      cropped[y * targetWidth + x] = applyTone(luma, layer.adjustments);
    }
  }

  let processed: Float32Array = cropped;
  if (layer.adjustments.autoEnhance) {
    processed = autoEnhance(processed) as Float32Array;
  }

  if (layer.adjustments.smoothing > 0) {
    const smoothingKernel = [1, 2, 1, 2, 4, 2, 1, 2, 1].map((value) => value / 16);
    processed = convolveGray(processed, targetWidth, targetHeight, smoothingKernel) as Float32Array;
  }

  if (layer.adjustments.sharpness > 0) {
    const sharpened = convolveGray(processed, targetWidth, targetHeight, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
    const next = new Float32Array(processed.length);
    for (let i = 0; i < processed.length; i += 1) {
      next[i] = clamp(processed[i] + (sharpened[i] - processed[i]) * (layer.adjustments.sharpness / 100));
    }
    processed = next;
  }

  return {
    id: layer.id,
    name: layer.name,
    width: targetWidth,
    height: targetHeight,
    pixels: Array.from(processed),
    centerLon: layer.centerLon,
    centerLat: layer.centerLat,
    widthDeg: layer.widthDeg,
    heightDeg: layer.heightDeg,
    rotationDeg: layer.rotationDeg,
    opacity: layer.opacity,
    feather: layer.feather
  };
}

export function createDefaultAdjustments(): ImageAdjustments {
  return {
    invert: false,
    brightness: 0,
    contrast: 12,
    gamma: 1,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 18,
    smoothing: 0,
    autoEnhance: true,
    rotate: 0,
    flipX: false,
    flipY: false
  };
}
