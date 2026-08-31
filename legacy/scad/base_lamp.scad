/**
 * Base with LED seat and rotating snap-fit socket.
 */

base_fn = 96;

module base_outer_shell(base_diam, base_h, fn = base_fn) {
    union() {
        cylinder(d = base_diam, h = base_h * 0.42, $fn = fn);

        translate([0, 0, base_h * 0.42])
            scale([1, 1, 0.38])
            sphere(r = base_diam / 2, $fn = fn);
    }
}

module base_inner_shell(base_diam, base_h, wall, fn = base_fn) {
    inner_d = base_diam - 2 * wall;

    union() {
        translate([0, 0, wall])
            cylinder(d = inner_d, h = base_h * 0.42, $fn = fn);

        translate([0, 0, base_h * 0.42])
            scale([1, 1, 0.38])
            sphere(r = inner_d / 2, $fn = fn);
    }
}

module socket_cutout(base_h, fn = base_fn) {
    lip_h = 1.4;
    race_h = RETENTION_BEAD_HEIGHT + VERTICAL_CLEARANCE + 0.8;
    taper_h = 1.6;
    shaft_h = max(2, SOCKET_DEPTH - lip_h - race_h - taper_h);
    z0 = base_h - SOCKET_DEPTH;

    union() {
        translate([0, 0, z0])
            cylinder(d = SOCKET_OUTER_DIAMETER, h = shaft_h, $fn = fn);

        translate([0, 0, z0 + shaft_h])
            cylinder(d1 = SOCKET_OUTER_DIAMETER, d2 = SOCKET_LIP_DIAMETER, h = taper_h, $fn = fn);

        translate([0, 0, z0 + shaft_h + taper_h])
            cylinder(d = RETENTION_RACE_DIAMETER, h = race_h, $fn = fn);

        translate([0, 0, base_h - lip_h])
            cylinder(d = SOCKET_LIP_DIAMETER, h = lip_h + 0.2, $fn = fn);
    }
}

module led_support_structure(fn = base_fn) {
    support_z = BASE_WALL_THICKNESS + 4;
    ring_h = 2;
    ring_outer_d = LED_DIAMETER + 12;
    ring_inner_d = LED_DIAMETER - 2;
    rib_w = 8;

    union() {
        translate([0, 0, support_z])
            difference() {
                cylinder(d = ring_outer_d, h = ring_h, $fn = fn);
                cylinder(d = ring_inner_d, h = ring_h + 0.2, $fn = fn);
            }

        for (angle = [0 : 90 : 270]) {
            rotate([0, 0, angle])
                hull() {
                    translate([LED_INSERTION_HOLE_DIAMETER / 2 + 1, -rib_w / 2, 0])
                        cube([rib_w, rib_w, BASE_WALL_THICKNESS]);

                    translate([ring_inner_d / 2, -rib_w / 2, support_z])
                        cube([rib_w, rib_w, ring_h]);
                }
        }
    }
}

module sphere_base_complete(base_diam, base_h, wall, fn = base_fn) {
    outer_r = base_diam / 2;

    union() {
        difference() {
            base_outer_shell(base_diam, base_h, fn);
            base_inner_shell(base_diam, base_h, wall, fn);

            // LED installation opening from the bottom.
            translate([0, 0, -0.2])
                cylinder(d = LED_INSERTION_HOLE_DIAMETER, h = LED_CAVITY_DEPTH + 1.5, $fn = fn);

            // Rotating neck socket at the top.
            socket_cutout(base_h, fn);

            // Light path from the LED cavity through the socket into the sphere.
            translate([0, 0, -0.2])
                cylinder(d = SOCKET_INNER_DIAMETER, h = base_h + 1, $fn = fn);

            // Cable exit slot from the LED opening to the outside wall.
            translate([-CABLE_SLOT_WIDTH / 2, 0, wall])
                cube([CABLE_SLOT_WIDTH, outer_r + 1, CABLE_SLOT_HEIGHT]);

            // Ventilation holes around the lower sidewall.
            for (angle = [0 : 60 : 300]) {
                rotate([0, 0, angle])
                    translate([outer_r - wall * 1.2, 0, base_h * 0.28])
                    rotate([90, 0, 0])
                    cylinder(d = VENT_HOLE_DIAMETER, h = wall * 4, center = true, $fn = 24);
            }
        }

        led_support_structure(fn);
    }
}
