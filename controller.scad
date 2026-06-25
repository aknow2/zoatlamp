$fn=128;

include <BOSL2/std.scad>
include <BOSL2/rounding.scad>

module d_shaft_hole(
    shaft_d = 6.6,
    flat_to_round = 6,
    depth = 17,
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
points = 8;
outer_r = 42;
inner_r = 35;
height  = 12;
profile_steps = 360;

function dial_star_path(n=points, or=outer_r, ir=inner_r, steps=profile_steps) = [
  for (i = [0:steps-1])
    let(
      a = 360 * i / steps,
      lobe = (1 + cos(n * a)) / 2,
      r = ir + (or - ir) * lobe
    )
    [r * cos(a), r * sin(a)]
];

sd=35;

module btn() {
difference() {
 sphere(d=sd);
  translate([0,0,-sd/2+sd/4])
    cube([sd,sd,sd/2], center=true);

  translate([0,0, sd-12])
    cube([sd,sd,sd/2], center=true);
}
}


difference() {
  union() {
    offset_sweep(
      dial_star_path(),
      height=height,
      steps=30
    );
    btn();
    translate([0,0,-2.5])
    cylinder(d=10,h=2.5);
  }

  translate([0,0,-10.5])
  d_shaft_hole();

  
  for (i=[0:points]) {
    a=(360/points)*i;    
    translate([outer_r*cos(a)*0.8,outer_r*sin(a)*0.8,0])
     cylinder(r=10,h=30, center=true);  
  }
  
  
}
