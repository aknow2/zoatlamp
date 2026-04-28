$fn = 200;

big_wheel_d = 160;
small_wheel_d = 100;
distance = 100;
wheel_h = 65;
connector_overlap = 1;

big_wheel_r = big_wheel_d / 2;
small_wheel_r = small_wheel_d / 2;
tangent_angle = acos((big_wheel_r - small_wheel_r) / distance);

module frame() {
	cylinder(d=big_wheel_d, h=wheel_h);
	translate([distance, 0, 0])
	cylinder(d=small_wheel_d, h=wheel_h);
    bd = 71;
    sd = 107;
	linear_extrude(height=wheel_h)
	polygon(points = [
		[big_wheel_r*cos(bd), big_wheel_r*sin(bd)],
		[big_wheel_r*cos(bd), -big_wheel_r*sin(bd)],
        [distance-small_wheel_r*cos(sd), -small_wheel_r*sin(sd)],
        [distance-small_wheel_r*cos(sd), small_wheel_r*sin(sd)],
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
