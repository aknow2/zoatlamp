$fn = $preview ? 96 : 220;

// S3M values in centimeters.
pitch_cm = 0.3;         // 3 mm
h1_cm = 0.115;          // 1.15 mm
tooth_thick_cm = 0.190; // 1.90 mm
toothwd_cm = 0.170;     // 1.70 mm

fudge_ir_cm = -0.01 / 2.54;
fudge_or_cm = 0;

// S3M-519 has 519/3 = 173 belt teeth (reference only).
belt_teeth_s3m_519 = 173;

function tan_deg(theta_deg) = sin(theta_deg) / cos(theta_deg);

module pulley_cm(
	h_cm,
	nteeth,
	h1_cm,
	thick_cm,
	pitch_cm,
	angle_deg,
	toothwd_cm,
	fancy = true,
	flange_r_cm = 0,
	flange_angle_deg = 45,
	flange_extrude_cm = 0
) {
	flange_ht_cm = flange_r_cm / tan_deg(flange_angle_deg);
	a_cm = pitch_cm - toothwd_cm;
	z_orig_deg = 90 - (angle_deg / 2);
	t_orig_cm = a_cm + 2 * h1_cm / tan_deg(z_orig_deg);

	phi_deg = fancy ? 360 / nteeth : 0;
	effective_angle_deg = angle_deg - phi_deg / 2;
	pitch_r_cm = (nteeth * pitch_cm) / (2 * PI);
	outer_r_cm = pitch_r_cm - thick_cm / 2 + fudge_or_cm;
	inner_r_cm = pitch_r_cm - thick_cm / 2 - h1_cm + fudge_ir_cm;
	z_deg = 90 - (effective_angle_deg / 2);
	t_cm = a_cm + 2 * h1_cm / tan_deg(z_deg);
	tdiff_cm = t_orig_cm - t_cm;
	b_cm = a_cm + tdiff_cm;
	z_base_cm = flange_ht_cm + flange_extrude_cm;

	for (tooth_index = [0:nteeth - 1]) {
		rotate([0, 0, tooth_index * (360 / nteeth)])
			translate([-t_cm / 2, 0, z_base_cm])
				linear_extrude(height = h_cm)
					polygon(points = [
						[0, 0],
						[0, inner_r_cm],
						[(t_cm - b_cm) / 2, outer_r_cm],
						[b_cm + (t_cm - b_cm) / 2, outer_r_cm],
						[t_cm, inner_r_cm],
						[t_cm, 0]
					]);
	}

	translate([0, 0, z_base_cm])
		cylinder(r = inner_r_cm, h = h_cm, $fn = 64);
}

module s3m_pulley_teeth_cm(
	h_cm,
	nteeth,
	flange_r_cm = 0.25,
	flange_extrude_cm = 0.15,
	flange_angle_deg = 45
) {
	pulley_cm(
		h_cm = h_cm,
		nteeth = nteeth,
		h1_cm = h1_cm,
		thick_cm = tooth_thick_cm,
		pitch_cm = pitch_cm,
		angle_deg = 42,
		toothwd_cm = toothwd_cm,
		fancy = true,
		flange_r_cm = flange_r_cm,
		flange_angle_deg = flange_angle_deg,
		flange_extrude_cm = flange_extrude_cm
	);
}

module s3m_pulley_teeth_from_pulleye_cm(
	h_cm,
	nteeth,
	flange_r_cm = 0.25,
	flange_extrude_cm = 0.15,
	flange_angle_deg = 45
) {
	s3m_pulley_teeth_cm(
		h_cm = h_cm,
		nteeth = nteeth,
		flange_r_cm = flange_r_cm,
		flange_extrude_cm = flange_extrude_cm,
		flange_angle_deg = flange_angle_deg
	);
}

module pulley_reimpl_cm(
	target_pitch_radius_cm = 7.25,
	toothed_height_cm = 1.9,
	flange_r_cm = 0.25,
	flange_extrude_cm = 0.15,
	flange_angle_deg = 45
) {
	pulley_teeth = round((2 * PI * target_pitch_radius_cm) / pitch_cm);
	pitch_r_cm = pulley_teeth * pitch_cm / (2 * PI);

	s3m_pulley_teeth_cm(
		h_cm = toothed_height_cm,
		nteeth = pulley_teeth,
		flange_r_cm = flange_r_cm,
		flange_extrude_cm = flange_extrude_cm,
		flange_angle_deg = flange_angle_deg
	);

	echo("pulley_teeth", pulley_teeth);
	echo("pitch_radius_cm", pitch_r_cm);
	echo("s3m519_belt_teeth", belt_teeth_s3m_519);
}

module pulley_reimpl_with_pulleye_cm(
	target_pitch_radius_cm = 7.25,
	toothed_height_cm = 1.9,
	flange_r_cm = 0.25,
	flange_extrude_cm = 0.15,
	flange_angle_deg = 45
) {
	pulley_reimpl_cm(
		target_pitch_radius_cm = target_pitch_radius_cm,
		toothed_height_cm = toothed_height_cm,
		flange_r_cm = flange_r_cm,
		flange_extrude_cm = flange_extrude_cm,
		flange_angle_deg = flange_angle_deg
	);
}

// Example render in cm units.
pulley_reimpl_cm();
