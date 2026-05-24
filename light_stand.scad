$fn=128;
hole=15;
stand_h=90;

difference() {
    union() {
        cylinder(d1=hole/1.1,d2=hole+4,h=stand_h);
        cylinder(d=100, h=2);
        translate([0,0,stand_h]) difference() {
         cylinder(d=hole+4, h=10);
         cylinder(d=hole, h=13);   
        }
    }    
    
    
    translate([0,19,stand_h/2]) rotate([20,0,0])
     cylinder(d=11,h=stand_h);
}

