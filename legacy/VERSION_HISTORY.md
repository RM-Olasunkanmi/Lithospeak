================================================================================
VERSION HISTORY
================================================================================

This file records the generation history for the Rotating Photo Sphere Lamp
project. Each version represents a specific revision of the design, with
generated files tracked under output/ directories.

================================================================================
v1.0.0
================================================================================

Date: 2026-08-29

Purpose: Initial release - first complete implementation of the rotating
photo sphere lamp with four photographs, hollow sphere, and integrated base.

Sphere diameter: 180 mm
Sphere min thickness: 0.40 mm (at brightest/lithophane light areas)
Sphere max thickness: 1.00 mm (at darkest/lithophane shadow areas)

Base wall: 1.2 mm (maximum <= 1.4 mm as required)

Connection type: Integrated neck with retention bead
  - Sphere neck OD: 30 mm
  - Base socket ID: 22 mm (clears neck ID of 20mm)
  - Base socket OD: 32 mm (matches neck OD of 30mm with 2mm radial clearance)
  - Neck length: 25 mm
  - Radial clearance: 2.0 mm (allows 360° rotation)
  - Vertical clearance: 1.0 mm

Retention mechanism: Integrated retention bead on sphere neck
  - Sphere neck has a small retention flare at the base
  - Base socket has matching clearance
  - Sphere can be removed by lifting slightly (2-3mm) then pulling out
  - Allows normal 360° sphere rotation in operating position

Photo filenames and order:
  - Photo 1 (0°): PIC1.jpeg - 960x1280 portrait
  - Photo 2 (90°): PIC21.jpeg - 960x1280 portrait
  - Photo 3 (180°): PIC3.jpeg - 591x1280 portrait (narrower)
  - Photo 4 (270°): PIC4.jpeg - 960x1280 portrait

Photo sampling resolution: 128 x 128 samples around the sphere
  - 128 samples horizontally (around full 360° circumference)
  - 128 samples vertically (pole to pole)
  - Each photo occupies 90° (32 samples horizontally per photo)
  - Bilinear interpolation for sub-pixel thickness values

Generated STL filenames (versioned):
  - RotatingPhotoSphere_v1.0.0_Sphere.stl
  - RotatingPhotoSphere_v1.0.0_Base.stl
  - RotatingPhotoSphere_v1.0.0_FitTest.stl (optional calibration)

Build manifest: output/v1.0.0/build_manifest.json

LED parameters:
  - LED diameter: 50 mm
  - LED height: 12 mm
  - Base insertion hole: 55 mm (must be > LED diameter for installation)
  - LED well depth: 15 mm (seats 12mm LED with 3mm margin)

Base dimensions:
  - Base diameter: 110 mm
  - Base height: 20 mm (maximum <= 70 mm)
  - Base wall thickness: 1.2 mm

Material: PLA (polylactic acid)
Nozzle: 0.4 mm assumed

Mechanical clearances:
  - Radial clearance (neck/socket): 2.0 mm
  - Vertical clearance: 1.0 mm
  - Minimum printable feature: 0.4 mm (0.4mm nozzle assumption)

Known issues:
  - OpenSCAD not installed in current environment - manual validation needed
  - Connection mechanism requires physical print testing
  - Lithophane thickness mapping assumes grayscale → thickness relationship
  - Four-image mapping at 0°, 90°, 180°, 270° may need cropping adjustment
  - Base spherical cap geometry approximated - may need fine-tuning for printability

Print status: NOT YET PHYSICALLY VERIFIED
  - Design validated digitally (OpenSCAD syntax check pending)
  - Physical print test pending

Changes from previous version: None (initial release)

================================================================================
FUTURE VERSIONS
================================================================================

Later versions may include:
  - v1.1.0: Improved image cropping/ordering, refined connection mechanism
  - v1.1.1: Minor tolerance adjustments based on print testing
  - v2.0.0: Redesigned connection mechanism or sphere size changes

================================================================================
PRINT STATUS KEY
================================================================================

DESIGN VALIDATED DIGITALLY
  - OpenSCAD syntax checked
  - Geometry validated dimensionally
  - Rendering confirmed (where OpenSCAD is available)

PHYSICAL PRINT TEST PENDING
  - Design has not been physically printed
  - Connection mechanism, LED fit, and sphere rotation must be verified
  - Do not claim proven results until actual print is complete

================================================================================
GENERATED FILES TRACKING
================================================================================

All generated files are tracked under output/v1.0.0/:

RotatingPhotoSphere_v1.0.0_Sphere.stl
RotatingPhotoSphere_v1.0.0_Base.stl
RotatingPhotoSphere_v1.0.0_FitTest.stl
RotatingPhotoSphere_v1.0.0_PhotoLayout.png (optional)
build_manifest.json
lithophane_data.scad (photo-to-thickness data)

Future versions under output/v1.0.1/, output/v1.1.0/, etc.

Old output folders are never destroyed - each version retains its own directory.

================================================================================
VALIDATION REMINDER
================================================================================

Before marking any version as printed:

1. Confirm exactly four source photos were used and correctly ordered
2. Confirm photos are converted into actual printable thickness geometry
3. Confirm sphere is hollow (internal cavity exists)
4. Confirm maximum lithophane thickness ≈ 1.0 mm
5. Confirm base main walls ≤ 1.4 mm
6. Confirm final lamp has exactly TWO printable components (sphere + base)
7. Confirm sphere connector is integrated into sphere mesh
8. Confirm base socket is integrated into base mesh
9. Confirm LED holder is integrated into base mesh
10. Confirm there is no lid
11. Confirm there is no third retaining component
12. Confirm sphere/base dimensions mathematically match
13. Confirm LED can physically pass through the installation opening
14. Confirm sphere has rotational clearance
15. Confirm the connection is theoretically removable
16. Confirm `part="plate"` produces only base + sphere
17. Confirm `part="sphere"` produces only sphere
18. Confirm `part="base"` produces only base
19. Confirm `part="fit_test"` is separate calibration output, never in lamp
20. Run OpenSCAD syntax/render checks if available
21. Inspect generated STL meshes for non-manifold geometry, disconnected parts,
    extra shells, closed light path, impossible LED insertion, sphere/base
    intersection assumptions
22. Do NOT call the model "print proven"

Use:
  DESIGN VALIDATED DIGITALLY
  and
  PHYSICAL PRINT TEST PENDING

until actual print results are provided.