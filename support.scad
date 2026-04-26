
module support() {
    difference() {
        sphere(r=1.5, $fn=16);
        translate([0, 0, -1.5])
            cylinder(d=5, h=1.5);
    }

}


for (i = [0, 90, 180, 270]) {
    rotate([0, 0, i])
        translate([0, 20, 0])
            support();
}