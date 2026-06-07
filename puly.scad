use <pulleye.scad>

$fn = $preview ? 96 : 220;

// S3M belt pitch is 3mm. pulleye.scad is inch-based, so convert via scale(25.4).
pitch_mm = 3;
pitch_in = pitch_mm / 25.4;

s3m_tooth_thickness_mm = 1.90;



// S3M-519 has 519/3 = 173 belt teeth (reference only).
belt_teeth_s3m_519 = 173;

belt_width_mm = 19;
toothed_height_mm = belt_width_mm;
flange_r_mm = 2.5;
flange_extrude_mm = 1.5;
flange_angle_deg = 45;

// pulleye.scad builds from z = flange_ht + flange_extrude; shift back to ground here.
z_ground_offset_mm = flange_r_mm / tan(flange_angle_deg) + flange_extrude_mm;

module s3m_pulley_teeth_from_pulleye(h_mm, nteeth) {
	// Keep around 120mm pitch radius as requested.

	// S3M approximate tooth geometry for pulleye's trapezoid profile.
	h1_in = 1.15 / 25.4;
	thick_in = 1.90 / 25.4;
	toothwd_in = 1.70 / 25.4;

	scale(25.4)
		translate([0, 0, -z_ground_offset_mm / 25.4])
			pulley(
			h = h_mm / 25.4,
			nteeth = nteeth,
			h1 = h1_in,
			thick = thick_in,
			pitch = pitch_in,
			angle = 42,
			toothwd = toothwd_in,
			fancy = true,
			flange_r = flange_r_mm / 25.4,
			flange_angle = flange_angle_deg,
			flange_extrude = flange_extrude_mm / 25.4
		);
}

function s3m_pitch_radius_for_outer_diameter_mm(outer_diameter_mm) =
	outer_diameter_mm / 2 + s3m_tooth_thickness_mm / 2;

module pulley_reimpl_with_pulleye(target_pitch_radius_mm = 12, h_mm = toothed_height_mm) {

	pulley_teeth = round((2 * PI * target_pitch_radius_mm) / pitch_mm);
	pitch_r = pulley_teeth * pitch_mm / (2 * PI);
	outer_d = 2 * (pitch_r - s3m_tooth_thickness_mm / 2);

	s3m_pulley_teeth_from_pulleye(h_mm = h_mm, nteeth = pulley_teeth);

	echo("pulley_teeth", pulley_teeth);
	echo("pitch_radius_mm", pitch_r);
	echo("outer_diameter_mm", outer_d);
	echo("s3m519_belt_teeth", belt_teeth_s3m_519);
}


module center_gear() {

difference() {
	union() {
		// S3M-519 has 173 teeth, but that would be a very large pulley. Instead, target a more reasonable 120mm pitch radius and see how many teeth that gives us.
		translate([0,0,19])
			difference() {
				cylinder(d=103, h=10);
				cylinder(h=18,r=50, $fn=6);
			}
		cylinder(r=74, h=2);
		pulley_reimpl_with_pulleye(target_pitch_radius_mm = 72.5);
	}
	// Cut out the center hole.
	cylinder(d=78.2, h=13, center=true);
	cylinder(d=55, h=200, center=true);
}
}
// Dカット軸用の穴
// shaft_d: 軸の直径
// flat_to_round: 平面から反対側の丸い外周までの距離
// depth: 穴の深さ
// shaft_d_adjust: 穴の直径を調整するための値（0に近いほど実際の軸に近いサイズになる）
module d_shaft_hole(
    shaft_d = 4.5,
    flat_to_round = 3.85,
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

module motor_gear(shaft_adjust = 0) {
    difference() {
		union() {
			pulley_reimpl_with_pulleye(
				target_pitch_radius_mm = s3m_pitch_radius_for_outer_diameter_mm(25),
				h_mm = 20
			);
			cylinder(h=23, d=9);
		}

		translate([0, 0, 23-12])
        d_shaft_hole(shaft_d_adjust = shaft_adjust);
    }
}

module gear_cover() {
 difference(){
   cylinder(h=2, r=72.5+3);
   cylinder(h=10, r=64,center=true);

 }

}

//center_gear();
//motor_gear();
translate([0,0,20])
gear_cover();
