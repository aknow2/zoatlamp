$fn=128;

body_h = 130;

c_hole_d = 7;
c_hole_distance = 17;
c_hole_h = 5;
c_board_h = 3;
c_board_s = 30;

module cover() {
    scale([1,1,1.3]) rotate([0,-90,0]) difference() {
      cylinder(h=body_h, d=body_h, center=true);
      cylinder(h=body_h+1, d=body_h-8, center=true);
      translate([-body_h/2,0,0])
      cube([body_h, body_h, body_h+5], center=true);    
        translate([30,-50,0])  
      cube([80, 60, 70], center=true);    
    }
}



module screw_board(){
    difference() {
      cylinder(d=c_hole_d, h= c_hole_h, center=true);
      cylinder(d=1, h= c_hole_h+1, center=true);
    }
}


module c_board() {
    translate([0,0,c_hole_h/2+c_board_h/2]) {
        screw_board();
        translate([c_hole_distance,0,0])
        screw_board();
    }
    translate([c_hole_distance/2, -8, 0]) {
        cube([c_board_s,c_board_s,c_board_h,], center=true);
        translate([0,-c_board_s/2+c_board_s/5,c_hole_h/2+c_board_h/2])
        cube([c_board_s,c_board_s/2.5,c_hole_h,], center=true);    
    }
}


difference() {
    cover();
    translate([0,41,40])
    rotate([-65,0,0])
    cube([c_board_s+5,c_board_s+5, 50], center=true);
}


    translate([0,41,40])
    rotate([-64,0,0]) {
      difference() {
            cube([c_board_s+8,c_board_s+8, 25], center=true);
            translate([0,0,2])
            cube([c_board_s+1,c_board_s+1, 25], center=true);
            translate([0,-10,3])
            cube([c_board_s+1,c_board_s+1, 27], center=true);
      }    
    }
    


//cube([body_h-10,body_h-10,3], center=true);

//c_board();

