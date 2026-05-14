use <motor_lid.scad>;
$fn = 200;

big_wheel_d = 160;
small_wheel_d = 118;
distance = 100;
wheel_h = 65;

big_wheel_r = big_wheel_d / 2;
small_wheel_r = small_wheel_d / 2;

side_wall_t = 10;
top_wall_t = 5;

module frame_profile() {
    bd = 71;
    sd = 107;
    union() {
        circle(d=big_wheel_d);
        translate([distance, 0, 0])
            circle(d=small_wheel_d);
        polygon(points = [
		    [big_wheel_r * cos(bd), big_wheel_r * sin(bd)],
		    [big_wheel_r * cos(bd), -big_wheel_r * sin(bd)],
        [distance - small_wheel_r * cos(sd), -small_wheel_r * sin(sd)],
        [distance - small_wheel_r * cos(sd), small_wheel_r * sin(sd)]
	    ]);
    }
}

module frame() {
    linear_extrude(height=wheel_h)
        frame_profile();
}

module frame_inner() {
    linear_extrude(height=wheel_h - top_wall_t)
        offset(delta=-side_wall_t)
            frame_profile();
}

module guide() {
    translate([0,-25,0])
        cube([60, 3.75, 20], center=true);
    cube([60, 25.6, 20], center=true);
    translate([0,25,0])
        cube([60, 3.75, 20], center=true);
}

difference() {
    union() {
        frame();
        translate([0, 0, wheel_h]) {
            cylinder(d=64, h=3);
            cylinder(d=59.8, h=9);
        }
    }
    frame_inner();
    cylinder(d=55, h=140);
    translate([105, 0, 60]) {
        guide();
    }
    translate([-60, 0, 30])
    cube([80, 86, 60], center=true);
}

// rotate([0, -90, 0]) {
//    motor_lid();
// }

//guide test
//difference() {
//    cube([80, 86, 5], center=true);
//    guide();
//}
