include <BOSL2/std.scad>
include <BOSL2/gears.scad>
$fn=128;
pteeth=15; cteeth=42;
circ_pitch=10; thick=12; pa=20;
gd = gear_dist(circ_pitch=circ_pitch, cteeth, pteeth)+0.08;

ppr = pitch_radius(teeth=pteeth, pitch=circ_pitch);
echo("ppr: ",ppr);

p_shaft_diam = 10;
p4_shaft_diam = 3;
planet4_index = 3;
stand_top_z = -10;
stand_h = 70;
stand_z_offset = stand_top_z - stand_h/2;
stand_bottom_z = stand_top_z - stand_h;
echo("gd", gd);

module planet_gear(shaft_diam) {
    color("green")
    spur_gear(
        circ_pitch=circ_pitch,
        teeth=pteeth,
        thickness=thick,
        shaft_diam=shaft_diam,
        pressure_angle=pa);
}

module draw_planets() {
    for (a=[0:3]) {
        zrot($t*90+a*90) back(gd) {
            planet_gear((a == 3 ? p4_shaft_diam : p_shaft_diam));
        }
    }
}


module centerGear() {
    cpr = pitch_radius(teeth=cteeth, pitch=circ_pitch);
    echo("cpr: ",cpr);
    color("orange")
    spur_gear(
        circ_pitch=circ_pitch,
        teeth=cteeth,
        thickness=thick,
        shaft_diam=90,
        pressure_angle=pa);
    translate([0,0,thick-1.5])
    color("orange")
    difference() {
    cylinder(h=10,r=60,center=true);
    cylinder(h=18,r=50,center=true, $fn=6);
    }
}



// Motor dimensions
motor_d = 31;
motor_len = 57;
front_flange_t = 3.5;
motor_center_height = 0;
motor_top = motor_center_height + motor_d/2;
motor_bottom = motor_center_height - motor_d/2;

clearance = 0.9;
wall = 2;

// Shaft settings
shaft_d = 12.5;
stand_motor_fit = 0;

// Screw/Flange pattern
hole_r = 11;        // screw center radius
hole_d = 4;       // hole diameter

// Box parameters
box_w = 60;         // width (X)
box_h = motor_d+wall;         // height (Z)
box_t = motor_len + front_flange_t + 2;   // depth (Y)
case_outer_h = stand_top_z - stand_bottom_z;
case_outer_w = box_h + 5;
case_outer_d = box_h;
motor_mount_drop = case_outer_h/2 - stand_top_z;
lid_t = 3;


module screw_holes() {
  difference() {
    cube([box_t, 9, 4.6], center=true);
     cylinder(d=hole_d, h=30, center=true);        
  }
  
    
}

// ----------------- Case -----------------
module motor_case_outer(extra=0) {
    translate([0,0,motor_bottom+box_h/2])
        cube([case_outer_h + extra, case_outer_w + extra, case_outer_d + extra], center=true);
}

module motor_case_cutouts() {
       translate([wall+1,0,motor_center_height])
       rotate([0,90,0])
       cylinder(d=(motor_d+clearance), h=case_outer_h + 2, center=true);
       
       // shaft
       translate([0,0,motor_center_height])
       rotate([0,90,0])
        cylinder(d=shaft_d, h=100, center=true);
       
       // line
      translate([20, 0, motor_bottom])
       cube([2, 4, 20], center=true);


       translate([0,0,motor_center_height]) {
            // 4 mounting holes 45° pattern
            for(a = [0, 90, 180, 270]) {
                rotate([a,0,0])
                translate([0,0,hole_r])
                    rotate([0, 90, 0])
                        cylinder(d=hole_d, h=230, center=true);
            }
        }
}

module motor_case_shell(extra=0) {
    difference() {
       motor_case_outer(extra);
       motor_case_cutouts();
    }
}

module motor_case_lid_mask(extra=0) {
    case_h = case_outer_h + extra;
    translate([-(case_h - lid_t)/2, 0, motor_bottom+box_h/2])
        cube([lid_t, case_outer_w + extra + 2, case_outer_d + extra + 2], center=true);
}

module motor_case_body_mask(extra=0) {
    case_h = case_outer_h + extra;
    translate([lid_t/2, 0, motor_bottom+box_h/2])
        cube([case_h - lid_t, case_outer_w + extra + 2, case_outer_d + extra + 2], center=true);
}

module motor_case_box(part="all", extra=0, extar=undef) {
    shell_extra = is_undef(extar) ? extra : extar;
    if (part == "lid") {
        intersection() {
            motor_case_shell(shell_extra);
            motor_case_lid_mask(shell_extra);
        }
    } else if (part == "body") {
        intersection() {
            motor_case_shell(shell_extra);
            motor_case_body_mask(shell_extra);
        }
    } else {
        motor_case_shell(shell_extra);
    }
}

module planet4_mount_frame() {
    zrot($t*90 + planet4_index*90) back(gd) children();
}

module stand_motor_hole() {
    // Match the stand cutout to the motor case outer profile.
    planet4_mount_frame()
        down(motor_mount_drop)
        rotate([0,90,0])
        motor_case_outer(stand_motor_fit);
}

module stand_body() {

// polls
for (a=[0:2]) {
    zrot($t*90+a*90) back(gd) {
        color("red")
        cylinder(h=thick+8,r=p_shaft_diam/2-0.5,center=true);
    }
}
    translate([0,0,stand_z_offset])
    difference() {
        cylinder(r=108, h=stand_h, center=true, $fn=12);
        cylinder(r=60, h=90, center=true);
        translate([0,0,-5])
            cylinder(r=100, h=70, center=true);
        translate([60,-100,-70])
            cube([100,200,100]);
        up(-stand_z_offset)
            stand_motor_hole();
    }

    // Center gear support torus: single-line contact instead of ring face
    // r_maj=63 (tube center radius), r_min=2 -> top reaches z=-6 (gear bottom face)
    translate([0, 0, stand_top_z-2])
        color("red")
        torus(r_maj=63, r_min=1.5, anchor=BOT, $fn=64);
}

module motor_under_planet4() {
    // Put the motor case top flush with the stand top under the 4th planet gear.
    planet4_mount_frame()
        down(motor_mount_drop)
        rotate([0,90,0])
        color("lightgray")
        motor_case_box("body");
}

stand_body();
motor_under_planet4();

//draw_planets();
//centerGear();


//motor_case_box("lid", extra=-0.5);
