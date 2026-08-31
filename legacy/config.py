"""
Rotating Photo Sphere Lamp - Central Configuration
===================================================

Central configuration file for the lithophane sphere lamp project.
All dimensions and parameters are defined here and should be used
by the Python preprocessing and OpenSCAD generation scripts.
"""

# ============================================================
# PROJECT IDENTIFICATION
# ============================================================
PROJECT_NAME = "RotatingPhotoSphere"
VERSION = "1.0.0"

# ============================================================
# SPHERE PARAMETERS
# ============================================================
SPHERE_DIAMETER = 180  # mm, target print diameter
SPHERE_RADIUS = SPHERE_DIAMETER / 2  # mm

# Maximum lithophane thickness at darkest areas
# Target: ~1.00 mm for good FDM readability and light diffusion
SPHERE_MAX_THICKNESS = 1.00  # mm
# Minimum lithophane thickness at lightest areas
# Based on 0.4 mm nozzle reliability and FDM best practices
SPHERE_MIN_THICKNESS = 0.40  # mm

# ============================================================
# CONNECTOR MECHANICAL PARAMETERS
# ============================================================
# Neck geometry that integrates with the base.
# The neck is sized to leave a wide light path into the sphere.
NECK_OUTER_DIAMETER = 60  # mm, OD of the rotating sphere neck
NECK_INNER_DIAMETER = 56  # mm, ID of the sphere neck / light path
NECK_LENGTH = 18  # mm, insertion length into the base socket

# Socket parameters in the base.
# SOCKET_OUTER_DIAMETER is the running bore the neck rotates inside.
SOCKET_OUTER_DIAMETER = 61.2  # mm, bore diameter for free rotation
SOCKET_INNER_DIAMETER = 56.5  # mm, center opening for the light path
SOCKET_DEPTH = 16  # mm, depth of the base socket

# Radial clearance between sphere neck and base socket
RADIAL_CLEARANCE = 0.6  # mm per side, tuned for printable rotation

# Vertical clearance
VERTICAL_CLEARANCE = 1.2  # mm, lets the retention bead move within its race

# Retention features
RETENTION_RACE_DIAMETER = 63.4  # mm, diameter of the circular retention race
RETENTION_GROOVE_DEPTH = 1.2  # mm, radial relief in the race
RETENTION_BEAD_DIAMETER = 62.6  # mm, snap bead on the sphere neck
RETENTION_BEAD_HEIGHT = 2.2  # mm, axial height of the snap bead
SOCKET_LIP_DIAMETER = 61.4  # mm, entry lip that retains the bead after assembly

# ============================================================
# LED PARAMETERS
# ============================================================
LED_DIAMETER = 50  # mm, assume standard 50mm diameter LED
LED_HEIGHT = 12  # mm, assume standard LED height
LED_INSERTION_HOLE_DIAMETER = 56  # mm, lets the LED pass into position from below

# ============================================================
# BASE PARAMETERS
# ============================================================
BASE_DIAMETER = 110  # mm, base overall diameter
BASE_HEIGHT = 32  # mm, includes the socket and the LED support cavity
BASE_WALL_THICKNESS = 1.2  # mm, main base shell thickness (<= 1.4 mm)

# LED cavity in base
LED_CAVITY_DIAMETER = 54  # mm, diameter of LED seat area
LED_CAVITY_DEPTH = 14  # mm, depth of LED seat

# Cable exit parameters
CABLE_SLOT_WIDTH = 8  # mm, width of cable slot in base
CABLE_SLOT_HEIGHT = 5  # mm, height of cable slot

# Ventilation holes - kept minimal to preserve wall thickness
VENT_HOLE_DIAMETER = 4  # mm, diameter of ventilation holes

# ============================================================
# IMAGE PROCESSING PARAMETERS
# ============================================================
# Photo sampling resolution - balance between quality and OpenSCAD performance
# These control the grid of thickness samples on the sphere surface
PHOTO_WIDTH_SAMPLES = 128  # number of samples around horizontal circumference
PHOTO_HEIGHT_SAMPLES = 128  # number of samples from pole to pole

# Minimum thickness after gamma/correction adjustments
MIN_THICKNESS_FLOOR = 0.30  # absolute floor, shouldn't go below this

# Gamma correction factor for lithophane brightening
GAMMA_CORRECTION = 0.8  # slightly brighten shadows

# ============================================================
# THICKNESS MAPPING
# ============================================================
# Map grayscale (0-255) to thickness (SPHERE_MIN_THICKNESS to SPHERE_MAX_THICKNESS)
# Darker pixels (low grayscale) → thicker print
# Lighter pixels (high grayscale) → thinner print

# Formula: thickness = SPHERE_MIN_THICKNESS + (255 - gray) * thickness_range / 255
# where thickness_range = SPHERE_MAX_THICKNESS - SPHERE_MIN_THICKNESS

# Alternative: thickness = SPHERE_MAX_THICKNESS - (gray / 255) * (SPHERE_MAX_THICKNESS - SPHERE_MIN_THICKNESS)
# This gives: gray=0 → max thickness, gray=255 → min thickness

# ============================================================
# SPHERE LITHOPHANE MAPPING
# ============================================================
# Spherical coordinate mapping:
# - Theta (horizontal): maps around the sphere 0-360°
# - Phi (vertical): maps from pole to pole 0-180°
#
# Each (theta, phi) sample maps to a pixel in the processed image grid.
# Images are placed at approximate azimuths: 0°, 90°, 180°, 270°

# ============================================================
# MANUFACTURING CLEARANCES (PLA, 0.4mm nozzle)
# ============================================================
# These are the minimum printable features and clearances for PLA with 0.4mm nozzle
MIN_PRINTABLE_FEATURE = 0.4  # mm, smallest reliable feature
MIN_HORIZONTAL_CLEARANCE = 0.5  # mm, minimum horizontal clearance
MIN_VERTICAL_CLEARANCE = 0.3  # mm, minimum vertical clearance

# ============================================================
# DERIVED PARAMETERS (do not set directly)
# ============================================================
SPHERE_CIRCUMFERENCE = SPHERE_DIAMETER * 3.14159  # mm
THICKNESS_RANGE = SPHERE_MAX_THICKNESS - SPHERE_MIN_THICKNESS

print(f"=== {PROJECT_NAME} v{VERSION} Configuration ===")
print(f"Sphere diameter: {SPHERE_DIAMETER} mm")
print(f"Sphere radius: {SPHERE_RADIUS} mm")
print(f"Max lithophane thickness: {SPHERE_MAX_THICKNESS} mm")
print(f"Min lithophane thickness: {SPHERE_MIN_THICKNESS} mm")
print(f"Neck OD: {NECK_OUTER_DIAMETER} mm")
print(f"Socket ID: {SOCKET_INNER_DIAMETER} mm")
print(f"Photo samples: {PHOTO_WIDTH_SAMPLES}x{PHOTO_HEIGHT_SAMPLES}")
print(f"LED diameter: {LED_DIAMETER} mm")
print(f"Base wall thickness: {BASE_WALL_THICKNESS} mm")
