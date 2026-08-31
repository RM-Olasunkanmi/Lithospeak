/**
 * Main OpenSCAD entrypoint.
 *
 * Example CLI usage:
 *   openscad -D 'part="sphere"' -o output/v1.0.0/RotatingPhotoSphere_v1.0.0_Sphere.stl scad/sphere_lamp.scad
 */

include <../generated/config.scad>
include <../generated/lithophane_data.scad>
include <sphere_lithophane.scad>
include <base_lamp.scad>

part = "plate";
preview_gap = 30;

module fit_test() {
    cut_w = RETENTION_BEAD_DIAMETER + 12;

    intersection() {
        union() {
            difference() {
                translate([0, 0, -SPHERE_DIAMETER / 2])
                    neck_outer(NECK_OUTER_DIAMETER, NECK_LENGTH, SPHERE_DIAMETER / 2);
                translate([0, 0, -SPHERE_DIAMETER / 2 - NECK_LENGTH - 1])
                    cylinder(d = NECK_INNER_DIAMETER, h = NECK_LENGTH + 3, $fn = 64);
            }

            translate([0, 0, 6])
                difference() {
                    cylinder(d = RETENTION_RACE_DIAMETER + 10, h = SOCKET_DEPTH + 6, $fn = 64);
                    socket_cutout(SOCKET_DEPTH + 6, 64);
                    translate([0, 0, -0.2])
                        cylinder(d = SOCKET_INNER_DIAMETER, h = SOCKET_DEPTH + 6.4, $fn = 64);
                }
        }

        translate([-cut_w / 2, -cut_w / 2, -SPHERE_DIAMETER / 2 - NECK_LENGTH - 2])
            cube([cut_w, cut_w / 2, SPHERE_DIAMETER / 2 + SOCKET_DEPTH + NECK_LENGTH + 20]);
    }
}

module main_assembly(selected_part = part) {
    if (selected_part == "sphere") {
        lithophane_sphere(
            lithophane_thickness,
            SPHERE_DIAMETER,
            SPHERE_MIN_THICKNESS,
            SPHERE_MAX_THICKNESS,
            NECK_OUTER_DIAMETER,
            NECK_INNER_DIAMETER,
            NECK_LENGTH
        );
    } else if (selected_part == "base") {
        sphere_base_complete(BASE_DIAMETER, BASE_HEIGHT, BASE_WALL_THICKNESS);
    } else if (selected_part == "plate") {
        lithophane_sphere(
            lithophane_thickness,
            SPHERE_DIAMETER,
            SPHERE_MIN_THICKNESS,
            SPHERE_MAX_THICKNESS,
            NECK_OUTER_DIAMETER,
            NECK_INNER_DIAMETER,
            NECK_LENGTH
        );

        translate([SPHERE_DIAMETER + preview_gap, 0, 0])
            sphere_base_complete(BASE_DIAMETER, BASE_HEIGHT, BASE_WALL_THICKNESS);
    } else if (selected_part == "fit_test") {
        fit_test();
    } else {
        echo(str("Unknown part: ", selected_part));
    }
}

main_assembly(part);
