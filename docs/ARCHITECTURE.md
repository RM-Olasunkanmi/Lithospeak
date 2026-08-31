# Lithospeak Architecture

## Overview

Lithospeak is a frontend-only application with a worker-backed geometry engine.

## Main subsystems

- `src/App.tsx`: overall workflow, project state, save/load, regeneration lifecycle
- `src/components/ThreeViewport.tsx`: interactive preview and sphere image placement
- `src/lib/imageProcessing.ts`: image loading, adjustment pipeline, sample raster generation
- `src/lib/geometry.ts`: parametric generators for flat, curved, cylinder, sphere, hemisphere, lampshade, and radial panel variants
- `src/lib/validation.ts`: print checks, mesh integrity checks, thickness and size checks
- `src/lib/exporters.ts`: STL, OBJ, and ZIP packaging
- `src/workers/generationWorker.ts`: background mesh generation and validation

## Why frontend-only

- Easy GitHub deployment
- No server costs for the core product
- Private user photos remain local
- Geometry is deterministic and testable in TypeScript

## Geometry model

The engine produces triangle meshes directly from sampled thickness fields.

- Panels: variable front surface + flat back + perimeter side walls
- Curved panels: cylindrical segment with variable wall thickness
- Cylinders and lampshades: constant outer silhouette + variable inner cavity offset + closed top/bottom rim thickness
- Spheres: exact target outer diameter + variable inner radius for lithophane thickness + optional opening ring + optional split equator connector

## Split sphere design

The production split sphere uses a constant-thickness seam band near the equator so the connector dimensions remain stable even when the photo data changes. The top half gets a male locating collar and the bottom half gets the complementary female receiving collar with a configurable clearance.

## Validation strategy

Validation mixes exact mesh checks and parametric safety checks.

- Bounding box vs printer build volume
- Wall thickness range vs requested settings
- Edge manifold / watertight check
- Disconnected component detection
- Polygon count warnings
- Sphere cavity viability and opening sanity
- Connector clearance checks for split spheres

## Export strategy

Meshes export directly to STL and OBJ. Multipart projects can be bundled into a ZIP with print notes. Export functions are shape-agnostic and operate on mesh arrays, which keeps future 3MF work isolated to the exporter layer.
