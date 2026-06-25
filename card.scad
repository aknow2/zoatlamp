card_w = 22;
card_h = 35;
insert_t = 1;
body_t = 1.7;
cutout_floor_t = 0.5;
insert_edge_w = 1.5;
corner_r = 1;
svg_viewbox_w = 720;
svg_viewbox_h = 600;
svg_unit = 25.4 / 72;
svg_margin = 0.6;
grid_cols = 6;
grid_gap = 5;
batch = 0;
batch_size = 6;
$fn = 24;

svg_cards = [
 ["stickmans/stickman-bothWave-01.svg", 360.000, 293.000, 322.000, 508.000],
 ["stickmans/stickman-dance-01.svg", 367.000, 271.921, 328.000, 474.158],
 ["stickmans/stickman-dance-02.svg", 353.000, 271.921, 328.000, 474.158],
 ["stickmans/stickman-standing.svg", 360.000, 298.500, 218.000, 501.000],
 ["stickmans/stickman-wave-01.svg", 362.000, 298.500, 230.000, 501.000],
 ["stickmans/stickman-wave-02.svg", 342.567, 298.500, 229.299, 501.000]
];

module rounded_rect(w, h, r) {
 hull() {
  translate([r, r])
  circle(r=r);

  translate([w - r, r])
  circle(r=r);

  translate([w - r, h - r])
  circle(r=r);

  translate([r, h - r])
  circle(r=r);
 }
}

module svg_cutout(svg_file, svg_center_x, svg_center_y, svg_art_w, svg_art_h) {
 body_w = card_w - insert_edge_w * 2;
 body_h = card_h - insert_edge_w * 2;
 svg_scale = min(
  (body_w - svg_margin) / (svg_art_w * svg_unit),
  (body_h - svg_margin) / (svg_art_h * svg_unit)
 );

 translate([body_w / 2, body_h / 2])
 scale([svg_scale, svg_scale])
 translate([
  -svg_center_x * svg_unit,
  -(svg_viewbox_h - svg_center_y) * svg_unit
 ])
 import(svg_file);
}

module card(svg_card) {
 difference() {
  union() {
   linear_extrude(height=insert_t)
   rounded_rect(card_w, card_h, corner_r);

   translate([insert_edge_w, insert_edge_w, insert_t])
   linear_extrude(height=body_t - insert_t)
   rounded_rect(card_w - insert_edge_w * 2, card_h - insert_edge_w * 2, corner_r);
  }

  translate([insert_edge_w, insert_edge_w, cutout_floor_t])
  linear_extrude(height=body_t - cutout_floor_t + 0.02)
  svg_cutout(svg_card[0], svg_card[1], svg_card[2], svg_card[3], svg_card[4]);
 }
}

module card_grid() {
 start_i = max(0, batch * batch_size);
 end_i = min(start_i + batch_size - 1, len(svg_cards) - 1);

 if (batch_size > 0 && start_i <= end_i) {
  for (i = [start_i:end_i]) {
   local_i = i - start_i;
   col = local_i % grid_cols;
   row = floor(local_i / grid_cols);

   translate([col * (card_w + grid_gap), -row * (card_h + grid_gap), 0])
   card(svg_cards[i]);
  }
 }
}

card_grid();
