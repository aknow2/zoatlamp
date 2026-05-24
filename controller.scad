$fn=128;

include <BOSL2/std.scad>
include <BOSL2/rounding.scad>

module d_shaft_hole(
    shaft_d = 6.7,
    flat_to_round = 6,
    depth = 13,
    shaft_d_adjust = 0
) {
    r = (shaft_d + shaft_d_adjust) / 2;

    intersection() {
        // 丸軸部分
        cylinder(h = depth, r = r, $fn = 60);
        // Dカットするための四角形
        // y方向を削ってD形状にする
        translate([-r, -r, 0])
            cube([
                shaft_d,
                flat_to_round,
                depth
            ]);
    }
}


points = 5;
outer_r = 30;
inner_r = 20;
height  = 10;

base_star = star(points, r=outer_r, ir=inner_r);

rounded_star = round_corners(
  base_star,
  r=7,
  closed=true
);

sd=35;
difference() {

union() {
offset_sweep(
  rounded_star,
  height=height,
  steps=18
);
sphere(d=sd);    


}
d_shaft_hole();
translate([0,0,-sd/2+sd/4])
cube([sd,sd,sd/2], center=true);
    
translate([0,0, sd-12])
cube([sd,sd,sd/2], center=true);

}





