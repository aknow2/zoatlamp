use <motor_lid.scad>;
$fn = 200;

big_wheel_d = 160;
small_wheel_d = 118;
distance = 100;
wheel_h = 65;

big_wheel_r = big_wheel_d / 2;
small_wheel_r = small_wheel_d / 2;

module frame() {
	cylinder(d=big_wheel_d, h=wheel_h);
	translate([distance, 0, 0])
	cylinder(d=small_wheel_d, h=wheel_h);
    bd = 71;
    sd = 107;
	linear_extrude(height=wheel_h)
	polygon(points = [
		[big_wheel_r * cos(bd), big_wheel_r * sin(bd)],
		[big_wheel_r * cos(bd), -big_wheel_r * sin(bd)],
        [distance - small_wheel_r * cos(sd), -small_wheel_r * sin(sd)],
        [distance - small_wheel_r * cos(sd), small_wheel_r * sin(sd)]
	]);
}

difference() {
    union() {
        frame();
        translate([0, 0, wheel_h]) {
            cylinder(d=64, h=3);
            cylinder(d=59.8, h=9);
        }
    }
    cylinder(d=55, h=140);
}

module guide() {
    translate([0,-25,0])
        cube([60, 4, 20], center=true);
    cube([60, 31.2, 20], center=true);
    translate([0,25,0])
        cube([60, 4, 20], center=true);
}

translate([125, 0, 110]) rotate([0, -90, 0]) {
    motor_lid();
}

translate([112, 0, 60]) {
    guide();
}