$fn = 96;

module spherical_lithophane() {
    import("spherical-lithophane.stl", convexity=10);
}

color("white")
    spherical_lithophane();