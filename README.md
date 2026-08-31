# Lithospeak

Lithospeak is a GitHub-ready web application for turning photos into 3D-printable lithophanes.

It focuses on a visual workflow:

`Upload photos -> Choose shape -> Adjust -> Preview -> Export`

## Current production features

- Flat lithophanes
- Curved lithophanes
- Cylindrical lithophanes
- Spherical lithophanes
- Multi-photo spherical layouts with automatic placement and manual repositioning
- Split-print spheres with a friction-fit tongue-and-groove style equator joint
- Hemisphere designs
- Lampshade designs
- Heart, oval, ornament, and moon-style panel variants
- Interactive 3D preview with solid, transmission, wireframe, and backlight modes
- STL and OBJ export
- ZIP export for multipart projects
- Local project save/load with IndexedDB
- Geometry validation and print-volume checks
- Worker-based geometry generation
- Automated geometry/export tests

## Important assumptions

- The app is frontend-only so it can deploy easily to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
- 3MF export is not included in the production UI yet. The current exporter pipeline is cleanly separated so 3MF can be added later without reworking the geometry engine.
- The split-sphere connector system uses a mechanically simple friction-fit stepped equator joint instead of more failure-prone snap hooks.
- Cube and rotating globe base mechanisms are intentionally left for the roadmap rather than exposed as incomplete features.

## Stack

- React + TypeScript + Vite
- Three.js + React Three Fiber
- Web Worker for geometry generation
- IndexedDB for local project persistence
- Vitest for geometry tests

## Installation

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

The production bundle is written to `dist/`.

## Test

```bash
npm run test
```

## Deployment

### Vercel / Netlify / Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`

### GitHub Pages

1. Build with `npm run build`.
2. Publish the `dist/` directory with your preferred GitHub Pages workflow.
3. If deploying under a subpath, set `base` in `vite.config.ts`.

## Folder structure

```text
src/
  components/        UI and viewport components
  lib/               geometry, validation, export, image processing
  workers/           background generation worker
docs/
  ARCHITECTURE.md
public/
  samples/
```

## Architecture

See `docs/ARCHITECTURE.md`.

## Roadmap

- 3MF export
- Cube assemblies
- Twist-lock and snap-fit split connectors
- LED cavity variants, USB exits, battery compartments, and rotating globe bases
- Deeper self-intersection analysis

## License

See `LICENSE`.
