
include <BOSL2/std.scad>
include <BOSL2/gears.scad>

fn_shell = $preview ? 48 : 128;
fn_cut   = $preview ? 12 : 24;
dbg_echo = false;



max_radius = 70;
max_height = 100;
s_count = 27;

angle_delta = 360/s_count;

total_loop = 20;

step_loop_angle = 180/total_loop;
step_size = 180/(s_count*total_loop);
step_radius = max_radius/(total_loop*s_count);
step_height = max_height/(total_loop*s_count);




module shell() {
scale([1,1,0.7])
translate([0,0, 58]) {

 difference(){
  sphere(r=max_radius, $fn=fn_shell);
  sphere(r=max_radius-3, $fn=fn_shell);
 }
}

}

module body() {
difference() {
    union() {
      shell();

    }

    for (loop=[1:1:total_loop]) {

        for (count = [1:1:s_count]) {
            current_count = ((loop-1)*s_count)+count;
            z =  max_height-(current_count)*step_height;
            z_angle = current_count*step_size;
            r = max_radius*sin(z_angle);
            hor_angle = count*angle_delta;
            x = cos(hor_angle)*r  ;
            y = sin(hor_angle)*r ;
                   if (dbg_echo) echo("h", z);
            translate([x,y,z])
            rotate([-z_angle,0,hor_angle-90])
                 cylinder(r=min(4*sin(current_count*step_size)+0.2, 2), h=50, center=true, $fn=fn_cut);
    }
}
}

}

light_hole=40;
joint_r= light_hole+9;

translate([0,0,23])
difference() {
 
  union() {
    translate([0,0,80])
        cylinder(r=20,h=10,$fn=32);   
   body();
          translate([0,0,-10])
        cylinder(r=joint_r,h=10,$fn=6);  
  } 
translate([0,0,-10])
          cylinder(r=light_hole,h=40,$fn=6);    
}


main_hole=45;
wall_h=40;




module main() {
    
    difference() {
      spur_gear(teeth=pteeth,
        pressure_angle=PA, thickness=face,
         gear_spin=180/pteeth,
        profile_shift=0, circ_pitch=circ_pitch);
        
     translate([0,0,face/2-5])
        cylinder(h=6, r=joint_r+0.5,  $fn=6);  
              cylinder(h=70, r=light_hole,  $fn=6);  
      translate([0,0,-8])
        cylinder(h=face, r=main_hole+0.1, center=true);
    }

}

//translate([0,0,face/2+50])
//main();
