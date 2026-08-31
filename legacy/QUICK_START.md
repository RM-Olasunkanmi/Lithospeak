================================================================================
QUICK START
================================================================================

FOR A NEW PROJECT:

1. Copy four photographs into `Sphereslithos/`.
   Supported formats: JPEG, PNG, BMP (24-bit color supported)
   Recommended: portrait orientation, similar aspect ratios

2. Run the image preprocessing command:
   python scripts/build_lithophane_data.py

   Or run the full STL build in one step:
   powershell -ExecutionPolicy Bypass -File scripts/build_stls.ps1

3. Inspect the generated photo preview:
    - Open `generated/lithophane_data.scad` to verify thickness mapping
    - Check that dark areas print thicker and light areas print thinner
    - Verify all four photographs are represented
    - The pictures appear in the printed globe when the sphere is backlit by the LED

4. Render the fit test (optional but recommended):
   openscad -D 'part="fit_test"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_FitTest.stl scad/sphere_lamp.scad
   - `part="fit_test"` generates a small connector/test section
   - Print this first to verify insertion, retention, and rotation
   - Adjust tolerances if needed before printing the full sphere

5. Adjust tolerance if necessary:
   - If the sphere doesn't enter the base, increase radial clearance
   - If the sphere is too loose, decrease radial clearance
   - Modify RADIAL_CLEARANCE in config.py
   - Re-run the Python script and OpenSCAD generator

6. Render the sphere:
   openscad -D 'part="sphere"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Sphere.stl scad/sphere_lamp.scad
   - `part="sphere"` renders only the sphere for STL export
   - This generates the full 180mm diameter lithophane sphere

7. Render the base:
   openscad -D 'part="base"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Base.stl scad/sphere_lamp.scad
   - `part="base"` renders only the base for STL export
   - This generates the base with LED holder and socket

8. Export versioned STLs:
   The plate mode generates both parts:
   openscad -D 'part="plate"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_plate_reference.png scad/sphere_lamp.scad
   - `part="plate"` renders base + sphere side by side (not assembled)

9. Slice:
   - Slice the sphere and base separately in your slicer (PrusaSlicer, Cura, etc.)
   - Use PLA print profile settings (see PLIC profile documentation)
   - Sphere: print orientation as documented in the guide
   - Base: flat side down on print bed

10. Print:
    - Print the base first (takes less time)
    - Print the sphere (takes longer, especially at 180mm diameter)
    - Print the fit test first if you haven't already

11. Assemble:
    1. Print base
    2. Insert LED through the bottom opening in the base
    3. Seat the LED on the integrated support ring inside the base
    4. Route cable through base cable exit
    5. Push the sphere neck into the base socket until the retention bead snaps in
    6. Sphere should rotate 360° freely once seated
    7. To remove: pull the sphere upward firmly to release the snap fit

================================================================================
EXACT COMMANDS FOR THIS PROJECT
================================================================================

# Step 1: Preprocess images (from project root)
python scripts/build_lithophane_data.py

# One-command build for all STL files
powershell -ExecutionPolicy Bypass -File scripts/build_stls.ps1

# Include the plate preview too
powershell -ExecutionPolicy Bypass -File scripts/build_stls.ps1 -IncludePlateReference

# Step 2: Generate sphere STL
# (After step 1 has generated generated/config.scad and generated/lithophane_data.scad)
openscad -D 'part="sphere"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Sphere.stl scad/sphere_lamp.scad

# Step 3: Generate base STL
openscad -D 'part="base"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Base.stl scad/sphere_lamp.scad

# Step 4: Generate fit test STL
openscad -D 'part="fit_test"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_FitTest.stl scad/sphere_lamp.scad

# Step 5: Generate plate reference (base + sphere side by side)
openscad -D 'part="plate"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_plate_reference.png scad/sphere_lamp.scad

# Step 6: View the version manifest
type output\v1.0.0\build_manifest.json

================================================================================
TROUBLESHOOTING QUICK TIPS
================================================================================

Photos invisible in lithophane:
  - Check that the Python script loaded all four images
  - Verify images are not too similar (contrast may be too low)
  - Increase PHOTO_WIDTH_SAMPLES or PHOTO_HEIGHT_SAMPLES in config.py

Sphere does not enter base:
  - Increase RADIAL_CLEARANCE in config.py by 0.5mm increments
  - Re-run: python scripts/build_lithophane_data.py
  - Re-generate OpenSCAD: openscad -D 'part="sphere"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Sphere.stl scad/sphere_lamp.scad

Sphere wobbles or is loose:
  - Decrease RADIAL_CLEARANCE in config.py
  - Check that NECK_OUTER_DIAMETER and SOCKET_OUTER_DIAMETER are correct

LED cannot enter base:
  - Verify LED_INSERTION_HOLE_DIAMETER >= LED_DIAMETER + 2mm minimum clearance
  - Check base_led_well depth is sufficient for LED height

Sphere does not rotate:
  - Check radial clearance is sufficient (2mm recommended)
  - Ensure sphere neck is not binding against socket
  - Verify no supports were printed inside the sphere neck area

Cable does not fit:
  - Widen/cable_slot_width and cable_slot_height in config.py
  - Typical USB/cable diameter is 3-5mm, slot of 8x5mm should accommodate

Photos inverted (upside down):
  - The vertical mapping places photo row 0 at the North Pole and row H-1 at
    the South Pole. If images appear upside down, swap the photo order in the
    Python script or adjust the vertical mapping.

Photos too dark/washed out:
  - Adjust GAMMA_CORRECTION in config.py (try 0.6-1.0 range)
  - Increase PHOTO_HEIGHT_SAMPLES for better tonal resolution
  - Check that MIN_THICKNESS_FLOOR is not set too high

Sphere wall too thin:
  - Increase SPHERE_MAX_THICKNESS in config.py
  - Ensure minimum thickness floor is appropriate for 0.4mm nozzle
  - Check that images have sufficient contrast (very bright images produce
    very thin walls that may be unreliable)
================================================================================
