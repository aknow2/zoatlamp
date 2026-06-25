sides = 20;
upper_outer_d = 160;
upper_inner_d = 156;
upper_h = 40;
upper_side_x = (upper_outer_d / 2) * cos(180 / sides);
window_w = 20;
window_h = 30;
roof_angle = 40;
roof_inner_top_d = 60;
roof_top_d = roof_inner_top_d + upper_outer_d - upper_inner_d;
roof_h = ((upper_inner_d - roof_inner_top_d) / 2) * tan(roof_angle);
roof_overlap = 0.3;

card_w = 22;
card_h = 35;
card_t = 1;
card_clearance = 0.45;
holder_attach = 0.3;
holder_lip_t = 1;
holder_rail_w = 1.2;
holder_lip_overlap = 0.8;
holder_bottom_h = 1.5;
card_slot_w = card_w + card_clearance;
card_slot_gap = card_t + card_clearance;
holder_depth = holder_attach + card_slot_gap + holder_lip_t;

module card_holder() {
 translate([upper_side_x - holder_attach + holder_depth / 2, card_slot_w / 2 + holder_rail_w / 2, -holder_bottom_h / 2])
 cube([holder_depth, holder_rail_w, card_h + holder_bottom_h], center=true);

 translate([upper_side_x - holder_attach + holder_depth / 2, -card_slot_w / 2 - holder_rail_w / 2, -holder_bottom_h / 2])
 cube([holder_depth, holder_rail_w, card_h + holder_bottom_h], center=true);

 translate([upper_side_x + card_slot_gap + holder_lip_t / 2, card_slot_w / 2 - holder_lip_overlap / 2, 0])
 cube([holder_lip_t, holder_lip_overlap, card_h], center=true);

 translate([upper_side_x + card_slot_gap + holder_lip_t / 2, -card_slot_w / 2 + holder_lip_overlap / 2, 0])
 cube([holder_lip_t, holder_lip_overlap, card_h], center=true);

 translate([upper_side_x - holder_attach + holder_depth / 2, 0, -card_h / 2 - holder_bottom_h / 2])
 cube([holder_depth, card_slot_w + holder_rail_w * 2, holder_bottom_h], center=true);
}

module window_cutout() {
 cube([10,window_w,window_h],center=true);
}

module upper_roof() {
 translate([0,0,upper_h / 2 - roof_overlap])
 difference() {
  cylinder(d1=upper_outer_d, d2=roof_top_d, h=roof_h + roof_overlap, $fn=sides);
  translate([0,0,-0.01])
  cylinder(d1=upper_inner_d, d2=roof_inner_top_d, h=roof_h + roof_overlap + 0.02, $fn=sides);
 }
}

translate([0,0,20]) {
 difference() {
  cylinder(d1=upper_outer_d, d2=upper_outer_d, h=upper_h, $fn=sides, center=true);
  cylinder(d1=upper_inner_d, d2=upper_inner_d, h=upper_h + 2, $fn=sides, center=true);
  for (i = [0:sides - 1])
   rotate([0,0,i * 360 / sides + 180 / sides])
   translate([upper_side_x,0,0])
   window_cutout();
 }

 for (i = [0:sides - 1])
  rotate([0,0,i * 360 / sides + 180 / sides])
  card_holder();

 upper_roof();
}
translate([0,0,-15]) difference() {
 cylinder(d1=140, d2=160, h=30, $fn=20, center=true);
 translate([0,0,1])
 cylinder(d1=136, d2=156, h=28, $fn=20, center=true);
 cylinder(r=39,h=80,$fn=64,center=true);
}

translate([0,0,-8-28])
difference() {
cylinder(r=42,h=15,$fn=64,center=true);
cylinder(r=39,h=50,$fn=64,center=true);
}
