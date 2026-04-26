use <pulleye.scad>

$fn = $preview ? 96 : 220;

// S3M belt pitch is 3mm. pulleye.scad is inch-based, so convert via scale(25.4).
pitch_mm = 3;
pitch_in = pitch_mm / 25.4;



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

module pulley_reimpl_with_pulleye(target_pitch_radius_mm = 12) {

	pulley_teeth = round((2 * PI * target_pitch_radius_mm) / pitch_mm);
	pitch_r = pulley_teeth * pitch_mm / (2 * PI);

	s3m_pulley_teeth_from_pulleye(h_mm = toothed_height_mm, nteeth = pulley_teeth);

	echo("pulley_teeth", pulley_teeth);
	echo("pitch_radius_mm", pitch_r);
	echo("s3m519_belt_teeth", belt_teeth_s3m_519);
}



difference() {
	union() {
		// S3M-519 has 173 teeth, but that would be a very large pulley. Instead, target a more reasonable 120mm pitch radius and see how many teeth that gives us.
		translate([0,0,19])
			difference() {
				cylinder(d=103, h=10);
				cylinder(h=18,r=49.6, $fn=6);
			}
		cylinder(r=74, h=2);
		pulley_reimpl_with_pulleye(target_pitch_radius_mm = 72.5);
	}
	// Cut out the center hole.
	cylinder(d=78.2, h=13, center=true);
	cylinder(d=55, h=200, center=true);
}
