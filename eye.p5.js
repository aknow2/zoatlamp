function flushLightbeam({ blur = 6, addGlow = true } = {}) {
  pgGlow.filter(BLUR, blur);

  push();
  resetMatrix();
  if (addGlow) blendMode(ADD);
  image(pgGlow, 0, 0, width, height);
  pop();

  blendMode(BLEND);
}

// ---- Glow線（テーパー付き）----
function addRainbowGlowLine(x1, y1, x2, y2, opts = {}) {
  const {
    steps = 120,
    glowWeight = 24,
    hueStart = 0,
    hueSpan = 360,
    sat = 100,
    bri = 100,
    alphaGlow = 0.3
  } = opts;

  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  pgGlow.strokeCap(ROUND);
  pgGlow.strokeJoin(ROUND);
  pgGlow.noFill();

  for (let i = 0; i < steps; i++) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;

    const xa = lerp(x1, x2, t1);
    const ya = lerp(y1, y2, t1);
    const xb = lerp(x1, x2, t2);
    const yb = lerp(y1, y2, t2);

    const hue = (hueStart + hueSpan * t1) % 360;

    // ★ テーパー: 中央太く端細い
    const w = lerp(0.4, 1.0, sin(PI * t1));
    pgGlow.strokeWeight(glowWeight * w);

    pgGlow.stroke(hue, sat, bri, alphaGlow);
    pgGlow.line(xa, ya, xb, yb);
  }
}

// ---- Core線（テーパー付き）----
function drawRainbowCoreLine(x1, y1, x2, y2, opts = {}) {
  const {
    steps = 120,
    coreWeight = 8,
    hueStart = 0,
    hueSpan = 360,
    sat = 100,
    bri = 100,
    alphaCore = 1,
    coreStyle = "white"
  } = opts;

  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  strokeCap(ROUND);
  strokeJoin(ROUND);
  noFill();

  for (let i = 0; i < steps; i++) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;

    const xa = lerp(x1, x2, t1);
    const ya = lerp(y1, y2, t1);
    const xb = lerp(x1, x2, t2);
    const yb = lerp(y1, y2, t2);

    // ★ テーパー
    const w = lerp(0.4, 1.0, sin(PI * t1));
    strokeWeight(coreWeight * w);

    if (coreStyle === "white") {
      stroke(0, 0, 100, alphaCore);
    } else {
      const hue = (hueStart + hueSpan * t1) % 360;
      stroke(hue, sat, bri, alphaCore);
    }
    line(xa, ya, xb, yb);
  }
}
pixelDensity(2);
colorMode(HSB, 360, 100, 100, 1);
background(0);

let pgGlow;
pgGlow = createGraphics(width, height);
pgGlow.pixelDensity(2);
pgGlow.colorMode(HSB, 360, 100, 100, 1);
pgGlow.clear();

  const count = 42;
  const stepAngle = TWO_PI / count;
  const cx = width/2, cy = height/2;

  let circle0 = [], circle1 = [], circle2 = [], circle3 = [], circle4 = [], circle5 = [], circle6 = [];

  for (let num = 0; num < count; num++) {
    const angle = num * stepAngle;
    circle0.push([600 * cos(angle + PI/10) + cx, 600 * sin(angle) + cy]);
    circle1.push([470 * cos(angle) - 50 * cos(angle) + cx, 470 * sin(angle) + cy]);
    circle2.push([400 * cos(angle) + 50 * sin(angle) + cx, 400 * sin(angle) + cy]);
    circle3.push([300 * cos(angle + PI/8) + 50 * cos(angle) + cx, 300 * sin(angle) + 50 * cos(angle) + cy]);
    circle4.push([180 * cos(angle) + cx, 180 * sin(angle) + cy]);
    circle5.push([100 * cos(angle) + cx + 30, 100 * sin(angle) + cy]);
    circle6.push([40 + cx, 10 + cy]);
  }

  function connect(c1, c2, opts = {}) {
    for (let num = 0; num < count; num++) {
      const src = c1[num];
      const dst = c2[num];

      addRainbowGlowLine(src[0], src[1], dst[0], dst[1], {
        steps: 90,
        glowWeight: 26,
        alphaGlow: 0.32,
        ...opts
      });

      drawRainbowCoreLine(src[0], src[1], dst[0], dst[1], {
        steps: 90,
        coreWeight: 8,
        coreStyle: "rainbow",
        ...opts
      });
    }
  }

  connect(circle0, circle1);
  connect(circle1, circle2);
  connect(circle2, circle3);
  connect(circle3, circle4);
  connect(circle4, circle5);
  connect(circle5, circle6);
  fill('black');
  circle(40 + cx, 10 + cy,20)

  flushLightbeam({ blur: 12, addGlow: true });
