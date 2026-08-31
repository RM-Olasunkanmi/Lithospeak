/**
 * Spherical lithophane shell with integrated rotating snap-fit neck.
 *
 * The photo data drives the outer shell relief, so the images are visible on
 * the globe itself and also become stronger when the assembled sphere is lit.
 */

sphere_fn = 96;

function clamp_value(v, lo, hi) = v < lo ? lo : (v > hi ? hi : v);
function grid_rows(M) = len(M);
function ring_index(ring, x, ring_width) = 1 + ring * ring_width + x;

function point_on_sphere(r, theta, phi) = [
    r * sin(phi) * cos(theta),
    r * sin(phi) * sin(theta),
    r * cos(phi)
];

function surface_radius(M, row, col, inner_r, min_t, max_t) =
    inner_r + clamp_value(M[row][col], min_t, max_t);

function shell_points(M, inner_r, min_t, max_t) =
    let(
        h = len(M),
        w = len(M[0])
    )
    concat(
        [[0, 0, surface_radius(M, 0, 0, inner_r, min_t, max_t)]],
        [
            for (row = [1 : h - 2], col = [0 : w - 1])
                point_on_sphere(
                    surface_radius(M, row, col, inner_r, min_t, max_t),
                    360 * col / w,
                    180 * row / (h - 1)
                )
        ],
        [[0, 0, -surface_radius(M, h - 1, 0, inner_r, min_t, max_t)]]
    );

function shell_faces(M) =
    let(
        h = len(M),
        w = len(M[0]),
        south = 1 + (h - 2) * w
    )
    concat(
        [
            for (col = [0 : w - 1])
                [0, ring_index(0, col, w), ring_index(0, (col + 1) % w, w)]
        ],
        [
            for (ring = [0 : h - 4], col = [0 : w - 1])
                each [
                    [
                        ring_index(ring, col, w),
                        ring_index(ring + 1, col, w),
                        ring_index(ring + 1, (col + 1) % w, w)
                    ],
                    [
                        ring_index(ring, col, w),
                        ring_index(ring + 1, (col + 1) % w, w),
                        ring_index(ring, (col + 1) % w, w)
                    ]
                ]
        ],
        [
            for (col = [0 : w - 1])
                [south, ring_index(h - 3, (col + 1) % w, w), ring_index(h - 3, col, w)]
        ]
    );

module shell_polyhedron(M, inner_r, min_t, max_t) {
    polyhedron(
        points = shell_points(M, inner_r, min_t, max_t),
        faces = shell_faces(M),
        convexity = 12
    );
}

module neck_outer(neck_od, neck_len, outer_r) {
    bead_z = -outer_r - 4.2;
    shaft_end_z = -outer_r - neck_len;

    union() {
        hull() {
            translate([0, 0, -outer_r + neck_od * 0.18])
                sphere(d = neck_od + 3, $fn = sphere_fn);
            translate([0, 0, -outer_r - 2])
                cylinder(d = neck_od, h = 0.2, $fn = sphere_fn);
        }

        translate([0, 0, shaft_end_z])
            cylinder(d = neck_od, h = neck_len, $fn = sphere_fn);

        translate([0, 0, bead_z])
            cylinder(d = RETENTION_BEAD_DIAMETER, h = RETENTION_BEAD_HEIGHT, $fn = sphere_fn);

        translate([0, 0, bead_z - 1.1])
            cylinder(d1 = neck_od, d2 = RETENTION_BEAD_DIAMETER, h = 1.1, $fn = sphere_fn);

        translate([0, 0, bead_z + RETENTION_BEAD_HEIGHT])
            cylinder(d1 = RETENTION_BEAD_DIAMETER, d2 = neck_od, h = 1.1, $fn = sphere_fn);
    }
}

module lithophane_sphere(litho_thickness, sphere_diam, min_t, max_t, neck_od, neck_id, neck_len) {
    outer_r = sphere_diam / 2;
    inner_r = outer_r - max_t;

    difference() {
        union() {
            shell_polyhedron(litho_thickness, inner_r, min_t, max_t);
            neck_outer(neck_od, neck_len, outer_r);
        }

        union() {
            sphere(r = inner_r, $fn = sphere_fn);

            translate([0, 0, -outer_r - neck_len - 0.5])
                cylinder(d = neck_id, h = outer_r + neck_len + 1.5, $fn = sphere_fn);
        }
    }
}
