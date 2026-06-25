$fn = 128;

// OpenSCAD units are treated as millimeters here.
sphere_diameter = 160;   // 16 cm
cut_diameter = 73;       // 7 cm

sphere_radius = sphere_diameter / 2;
cut_radius = cut_diameter / 2;

// Height where the sphere cross-section is exactly cut_diameter.
cut_z = sqrt(
    sphere_radius * sphere_radius -
    cut_radius * cut_radius
);

module top_spherical_cap() {
    intersection() {
        sphere(r = sphere_radius);

        translate([
            -sphere_radius,
            -sphere_radius,
            cut_z
        ])
            cube([
                sphere_diameter,
                sphere_diameter,
                sphere_radius - cut_z + 1
            ]);
    }
}

top_spherical_cap();
