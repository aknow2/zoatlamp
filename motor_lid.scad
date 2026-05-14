$fn = 200;

// Motor envelope along the X axis. The lid is sliced from the left end of this box.
motor_d = 25.1;
front_flange_t = 3.5;
motor_center_height = 0;
motor_bottom = motor_center_height - motor_d / 2;

// Clearance and fastener dimensions used to hollow the case for the motor body.
clearance = 0.9;
wall = 1.8;
shaft_d = 8;
hole_r = 17/2;
hole_d = 3.8;

// Outer case dimensions. X is motor depth, Y is width, Z is height.
box_h = motor_d + wall;
box_t = motor_d + front_flange_t + 2;
case_outer_h = 70;
case_outer_w = box_h + 40;
case_outer_d = box_h+5;
lid_t = 3;

// The lid sits on the left face of the case and is rectangular in front view.
module motor_lid_blank(extra=0) {
    case_h = case_outer_h + extra;
    translate([-(case_h - lid_t) / 2, 0, 0])
    cube([lid_t, case_outer_w + extra, case_outer_d + extra], center=true);
}

module motor_case_cutouts() {
    // Main motor cylinder clearance.
    translate([wall + 1, 0, motor_center_height])
        rotate([0, 90, 0])
        cylinder(d=motor_d + clearance, h=case_outer_h + 2, center=true);

    // Through-hole for the output shaft.
    translate([0, 0, motor_center_height])
        rotate([0, 90, 0])
        cylinder(d=shaft_d, h=100, center=true);

    translate([0, 0, motor_center_height]) {
        // Four mounting screw holes around the motor face.
        for (a = [0, 180]) {
            rotate([a, 0, 0])
                translate([0, 0, hole_r])
                    rotate([0, 90, 0])
                        cylinder(d=hole_d, h=230, center=true);
        }
    }
}

module adjust_hole(x=0) {
    translate([0, x, motor_center_height])
        rotate([0, 90, 0]) {
            cylinder(d=hole_d, h=case_outer_h + 2, center=true);
        }
}

module motor_lid(extra=-0.5) {
    // Slight negative extra keeps the lid from binding when printed as a separate part.
    // Build the front plate directly so the outer profile stays rectangular.
    difference() {
        motor_lid_blank(extra);
        motor_case_cutouts();
        adjust_hole(25);
        adjust_hole(-25);
    }
}
