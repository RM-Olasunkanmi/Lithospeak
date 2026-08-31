"""
Rotating Photo Sphere Lamp - Image Preprocessing
===================================================

Processes the four source photographs into lithophane thickness data
usable by the OpenSCAD generator.

Images are arranged around the sphere at approximately 0°, 90°, 180°, 270°.
Each photo maps to a quarter of the sphere's circumference.

The script outputs:
- processed/thickness data as OpenSCAD code
- a photo layout preview PNG
"""

import os
import sys
import math
import json
from PIL import Image, ImageFilter, ImageOps
import numpy as np

# Add project root to path so we can import config
# When run as: python scripts/build_lithophane_data.py from project root
# __file__ gives full path to this script
_PROJECT_ROOT_FROM_SCRIPT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# When run directly from project root: python -m scripts.build_lithophane_data
# __file__ may not be reliable, fall back to known structure
PROJECT_ROOT = _PROJECT_ROOT_FROM_SCRIPT
# Verify the structure exists, otherwise use current directory
if not os.path.isdir(os.path.join(PROJECT_ROOT, "Sphereslithos")):
    PROJECT_ROOT = os.getcwd()
sys.path.insert(0, PROJECT_ROOT)
from config import *

# ============================================================
# PATHS
# ============================================================
SPHEROLITHOS_DIR = os.path.join(PROJECT_ROOT, "Sphereslithos")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "generated")
SCAD_DIR = os.path.join(PROJECT_ROOT, "scad")
OUTPUT_IMG_DIR = os.path.join(OUTPUT_DIR, "images")

# Ensure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_IMG_DIR, exist_ok=True)
os.makedirs(SCAD_DIR, exist_ok=True)

# ============================================================
# IMAGE LOADING AND VALIDATION
# ============================================================

def load_source_images():
    """Load and validate the four source images from spherelithos/."""
    required_files = ["PIC1.jpeg", "PIC21.jpeg", "PIC3.jpeg", "PIC4.jpeg"]
    images = []
    
    for fname in required_files:
        fpath = os.path.join(SPHEROLITHOS_DIR, fname)
        if not os.path.exists(fpath):
            print(f"ERROR: Required image not found: {fpath}")
            sys.exit(1)
        img = Image.open(fpath)
        images.append(img)
        print(f"Loaded: {fname} - {img.size[0]}x{img.size[1]}, mode={img.mode}")
    
    return images

# ============================================================
# IMAGE PREPROCESSING PIPELINE
# ============================================================

def preprocess_image(img, target_width_samples, target_height_samples):
    """
    Preprocess a single image for lithophane mapping.
    
    Steps:
    1. Convert to grayscale
    2. Apply gamma correction
    3. Resize to target grid
    4. Enhance contrast for readability
    5. Return numpy array of thickness values
    """
    # Step 1: Convert to grayscale (luminance)
    gray = img.convert("L")
    
    # Step 2: Apply gamma correction
    # Gamma < 1 brightens shadows; gamma > 1 darkens them
    gamma = GAMMA_CORRECTION
    # Build lookup table
    table = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype(np.uint8)
    gray = gray.point(table)
    
    # Step 3: Resize to target grid dimensions
    # We resize to the exact sample grid so each pixel maps directly to a sample
    new_width = target_width_samples
    new_height = target_height_samples
    gray = gray.resize((new_width, new_height), Image.LANCZOS)
    
    # Step 4: Convert to numpy array of thickness values
    # Grayscale 0 = black → maximum thickness
    # Grayscale 255 = white → minimum thickness
    arr = np.array(gray, dtype=float)
    
    # Map grayscale to thickness:
    # thickness = SPHERE_MIN_THICKNESS + (255 - gray) * thickness_range / 255
    # This gives: gray=0 (black) → max thickness, gray=255 (white) → min thickness
    thickness_range = SPHERE_MAX_THICKNESS - SPHERE_MIN_THICKNESS
    thickness = SPHERE_MIN_THICKNESS + (255 - arr) * thickness_range / 255.0
    
    # Apply minimum thickness floor
    thickness = np.maximum(thickness, MIN_THICKNESS_FLOOR)
    
    return thickness

# ============================================================
# FOUR-PHOTO LAYOUT MAPPING
# ============================================================

def map_pixel_to_spherical_coords(x, y, width_samples, height_samples, 
                                   photo_idx, total_photos=4):
    """
    Map a pixel (x, y) from a specific photo to spherical coordinates.
    
    The sphere uses theta (azimuthal, 0-2π) and phi (polar, 0-π).
    
    Four photos are arranged at:
    - Photo 0: azimuth -45° to +45° (centered at 0°)
    - Photo 1: azimuth 45° to 135° (centered at 90°)
    - Photo 2: azimuth 135° to 225° (centered at 180°)
    - Photo 3: azimuth 225° to 315° (centered at 270°)
    
    Each photo gets 90° of azimuthal range.
    """
    # Photo's azimuthal range
    photo_az_start = photo_idx * 90  # 0, 90, 180, 270
    photo_az_end = photo_az_start + 90
    photo_az_center = photo_az_start + 45  # center azimuth
    
    # Pixel x maps to azimuth within photo's range
    # x=0 → photo_az_start, x=width-1 → photo_az_end
    if width_samples > 1:
        az_offset = (x / (width_samples - 1)) * 90  # 90 degrees per photo
    else:
        az_offset = 0
    
    azimuth = photo_az_center - 45 + az_offset
    # Convert to radians for sphere math
    azimuth_rad = math.radians(azimuth)
    
    # Pixel y maps to polar angle (from North Pole = 0 to South Pole = π)
    # y=0 → pole (phi=0), y=height-1 → opposite pole (phi=π)
    if height_samples > 1:
        phi = (y / (height_samples - 1)) * math.pi
    else:
        phi = math.pi / 2
    
    return azimuth, phi

# ============================================================
# BUILD FULL SPHERE THICKNESS GRID
# ============================================================

def build_sphere_thickness_grid():
    """
    Build the complete spherical thickness grid from all four photos.
    
    Returns a 3D array [y][x][0] where:
    - x: horizontal position 0..PHOTO_WIDTH_SAMPLES-1 (around sphere circumference)
    - y: vertical position 0..PHOTO_HEIGHT_SAMPLES-1 (pole to pole)
    - value: lithophane thickness at that point
    """
    # Load all four source images
    images = load_source_images()
    
    width_samples = PHOTO_WIDTH_SAMPLES
    height_samples = PHOTO_HEIGHT_SAMPLES
    
    per_photo_width = width_samples // 4  # samples per photo horizontally
    per_photo_height = height_samples  # samples vertically (full pole-to-pole)
    
    print(f"\nBuilding sphere grid: {width_samples}x{height_samples}")
    print(f"Per photo: {per_photo_width} horizontal x {per_photo_height} vertical samples")
    
    sphere_grid = np.zeros((height_samples, width_samples), dtype=float)
    
    for photo_idx, img in enumerate(images):
        thickness = preprocess_image(img, per_photo_width, per_photo_height)

        start = photo_idx * per_photo_width
        end = start + per_photo_width
        sphere_grid[:, start:end] = thickness

    # If width isn't divisible by four, repeat the last column to fill the remainder.
    if per_photo_width * 4 < width_samples:
        sphere_grid[:, per_photo_width * 4 :] = sphere_grid[:, per_photo_width * 4 - 1 : per_photo_width * 4]
    
    print("Sphere thickness grid built successfully")
    return sphere_grid

# ============================================================
# OUTPUT GENERATION
# ============================================================

def output_scad_data(sphere_grid, output_path, width_samples, height_samples):
    """
    Output the sphere thickness data as OpenSCAD code.
    
    Generates a thickness lookup that OpenSCAD can use to create
    the lithophane sphere geometry.
    """
    # Output as a matrix variable
    var_name = "lithophane_thickness"
    
    # OpenSCAD expects column-major or row-major? 
    # OpenSCAD uses row-major for arrays, but we need to be careful
    # about the mapping. Let's output as a nested array.
    
    lines = []
    lines.append(f"// Lithophane thickness data for {PROJECT_NAME} v{VERSION}")
    lines.append(f"// Generated from {PHOTO_WIDTH_SAMPLES}x{PHOTO_HEIGHT_SAMPLES} sample grid")
    lines.append(f"// {len(sphere_grid)} rows x {len(sphere_grid[0])} columns")
    lines.append(f"// Thickness range: {SPHERE_MIN_THICKNESS}-{SPHERE_MAX_THICKNESS} mm")
    lines.append("")
    lines.append("// Photo arrangement: 0deg=PIC1.jpeg,")
    lines.append("//                    90deg=PIC21.jpeg,")
    lines.append("//                    180deg=PIC3.jpeg,")
    lines.append("//                    270deg=PIC4.jpeg")
    lines.append("")
    
    # Generate the OpenSCAD array
    # sphere_grid is (height_samples, width_samples) - y by x
    # In OpenSCAD, we'll use [y][x] indexing
    
    lines.append("lithophane_thickness = [")
    for y in range(height_samples):
        row_str = "    ["
        for x in range(width_samples):
            t = sphere_grid[y, x]
            # Format with 4 decimal places for readability
            row_str += f"{t:.4f}"
            if x < width_samples - 1:
                row_str += ", "
        row_str += "],"
        lines.append(row_str)
    lines.append("];")
    
    # Also output the min/max for reference
    all_vals = sphere_grid.flatten()
    min_t = np.min(all_vals)
    max_t = np.max(all_vals)
    mean_t = np.mean(all_vals)
    
    lines.append("")
    lines.append(f"// Thickness statistics:")
    lines.append(f"// min: {min_t:.4f} mm")
    lines.append(f"// max: {max_t:.4f} mm")
    lines.append(f"// mean: {mean_t:.4f} mm")
    lines.append(f"// range: {max_t - min_t:.4f} mm")
    
    output_file = os.path.join(output_path, "lithophane_data.scad")
    with open(output_file, "w") as f:
        f.write("\n".join(lines))
    
    print(f"Output {output_file}")
    print(f"  Min thickness: {min_t:.4f} mm, Max thickness: {max_t:.4f} mm")
    
    return output_file


def output_scad_config(output_path):
    """Export the Python config values as valid OpenSCAD assignments."""
    config_values = {
        "PROJECT_NAME": PROJECT_NAME,
        "VERSION": VERSION,
        "SPHERE_DIAMETER": SPHERE_DIAMETER,
        "SPHERE_RADIUS": SPHERE_RADIUS,
        "SPHERE_MAX_THICKNESS": SPHERE_MAX_THICKNESS,
        "SPHERE_MIN_THICKNESS": SPHERE_MIN_THICKNESS,
        "NECK_OUTER_DIAMETER": NECK_OUTER_DIAMETER,
        "NECK_INNER_DIAMETER": NECK_INNER_DIAMETER,
        "NECK_LENGTH": NECK_LENGTH,
        "SOCKET_OUTER_DIAMETER": SOCKET_OUTER_DIAMETER,
        "SOCKET_INNER_DIAMETER": SOCKET_INNER_DIAMETER,
        "SOCKET_DEPTH": SOCKET_DEPTH,
        "RADIAL_CLEARANCE": RADIAL_CLEARANCE,
        "VERTICAL_CLEARANCE": VERTICAL_CLEARANCE,
        "RETENTION_RACE_DIAMETER": RETENTION_RACE_DIAMETER,
        "RETENTION_GROOVE_DEPTH": RETENTION_GROOVE_DEPTH,
        "RETENTION_BEAD_DIAMETER": RETENTION_BEAD_DIAMETER,
        "RETENTION_BEAD_HEIGHT": RETENTION_BEAD_HEIGHT,
        "SOCKET_LIP_DIAMETER": SOCKET_LIP_DIAMETER,
        "LED_DIAMETER": LED_DIAMETER,
        "LED_HEIGHT": LED_HEIGHT,
        "LED_INSERTION_HOLE_DIAMETER": LED_INSERTION_HOLE_DIAMETER,
        "BASE_DIAMETER": BASE_DIAMETER,
        "BASE_HEIGHT": BASE_HEIGHT,
        "BASE_WALL_THICKNESS": BASE_WALL_THICKNESS,
        "LED_CAVITY_DIAMETER": LED_CAVITY_DIAMETER,
        "LED_CAVITY_DEPTH": LED_CAVITY_DEPTH,
        "CABLE_SLOT_WIDTH": CABLE_SLOT_WIDTH,
        "CABLE_SLOT_HEIGHT": CABLE_SLOT_HEIGHT,
        "VENT_HOLE_DIAMETER": VENT_HOLE_DIAMETER,
        "PHOTO_WIDTH_SAMPLES": PHOTO_WIDTH_SAMPLES,
        "PHOTO_HEIGHT_SAMPLES": PHOTO_HEIGHT_SAMPLES,
        "MIN_THICKNESS_FLOOR": MIN_THICKNESS_FLOOR,
        "GAMMA_CORRECTION": GAMMA_CORRECTION,
    }

    lines = [
        f"// Generated OpenSCAD config for {PROJECT_NAME} v{VERSION}",
        "",
    ]

    for key, value in config_values.items():
        if isinstance(value, str):
            lines.append(f'{key} = "{value}";')
        else:
            lines.append(f"{key} = {value};")

    output_file = os.path.join(output_path, "config.scad")
    with open(output_file, "w", encoding="ascii") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Output {output_file}")
    return output_file

# ============================================================
# PHOTO LAYOUT PREVIEW
# ============================================================

def output_photo_layout_preview(sphere_grid, output_path):
    """
    Generate a visual preview of how the four photos map to the sphere.
    """
    import matplotlib.pyplot as plt
    
    # Create a visualization showing the four source images and the mapped grid
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    flat_axes = axes.flatten()
    
    # Show original images
    img_dir = SPHEROLITHOS_DIR
    image_files = ["PIC1.jpeg", "PIC21.jpeg", "PIC3.jpeg", "PIC4.jpeg"]
    
    for i, fname in enumerate(image_files):
        ax = flat_axes[i]
        img = Image.open(os.path.join(img_dir, fname))
        ax.imshow(img)
        ax.set_title(f"Original {fname}")
        ax.axis('off')
    
    # Show the mapped grid as an image
    # Normalize thickness to 0-255 for display
    grid_display = (sphere_grid - np.min(sphere_grid)) / (np.max(sphere_grid) - np.min(sphere_grid)) * 255
    grid_display = grid_display.astype(np.uint8)
    
    ax_img = flat_axes[4]
    ax_img.imshow(grid_display, cmap='plasma')
    ax_img.set_title("Mapped Thickness Grid\n(Dark=Thick, Light=Thin)")
    ax_img.axis('off')

    flat_axes[5].axis('off')
    
    plt.tight_layout()
    preview_file = os.path.join(output_path, "photo_layout.png")
    plt.savefig(preview_file, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Output {preview_file}")

# ============================================================
# MAIN PIPELINE
# ============================================================

def main():
    print("=" * 60)
    print("Rotating Photo Sphere Lamp - Image Preprocessing")
    print(f"Version: {VERSION}")
    print("=" * 60)
    
    # Build the sphere thickness grid from all four photos
    sphere_grid = build_sphere_thickness_grid()
    
    # Output as OpenSCAD data
    config_file = output_scad_config(OUTPUT_DIR)
    scad_file = output_scad_data(sphere_grid, OUTPUT_DIR, PHOTO_WIDTH_SAMPLES, PHOTO_HEIGHT_SAMPLES)
    
    # Output photo layout preview (if matplotlib available)
    try:
        output_photo_layout_preview(sphere_grid, OUTPUT_IMG_DIR)
    except ImportError:
        print(" matplotlib not available, skipping preview")
    
    # Output build manifest info
    manifest = {
        "version": VERSION,
        "sphere_samples": f"{PHOTO_WIDTH_SAMPLES}x{PHOTO_HEIGHT_SAMPLES}",
        "photo_filenames": ["PIC1.jpeg", "PIC21.jpeg", "PIC3.jpeg", "PIC4.jpeg"],
        "photo_dimensions": [
            {"file": "PIC1.jpeg", "width": 960, "height": 1280},
            {"file": "PIC21.jpeg", "width": 960, "height": 1280},
            {"file": "PIC3.jpeg", "width": 591, "height": 1280},
            {"file": "PIC4.jpeg", "width": 960, "height": 1280},
        ],
        "thickness_min": float(np.min(sphere_grid)),
        "thickness_max": float(np.max(sphere_grid)),
        "thickness_range": float(np.max(sphere_grid) - np.min(sphere_grid)),
        "material": "PLA",
        "nozzle": 0.4,
    }
    
    manifest_file = os.path.join(OUTPUT_DIR, "v1.0.0", "build_manifest.json")
    os.makedirs(os.path.dirname(manifest_file), exist_ok=True)
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Output manifest: {manifest_file}")
    
    print("\nPreprocessing complete!")
    print(f"Generated: {config_file}")
    print(f"Generated: {scad_file}")
    print(f"Thickness range: {manifest['thickness_min']:.2f}-{manifest['thickness_max']:.2f} mm")

if __name__ == "__main__":
    main()
