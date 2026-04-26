

const drawPattern = (c, radius, amplitude) => {

  drawingContext.shadowBlur = 45;
  drawingContext.shadowColor = color(c[0], c[1], c[2]);
  drawingContext.filter = 'blur(1.5px)';
  stroke(255);
  strokeWeight(8);
  fill(c[0], c[1], c[2]);
  beginShape();

  const waveCount = Math.floor(random()*3);
  const radOffset = random() - 0.5;
  const waveFn = getWaveFnPure(teeth + Math.floor(random()*2-1))
  for (let a = 0; a < TWO_PI; a += 0.01) {
    let r = radius + amplitude * waveFn(a)*sin(a*waveCount)+random()*4;
    let x = r * cos(a+radOffset);
    let y = r * sin(a+radOffset);
    vertex(x, y);
  }
  endShape(CLOSE);
}

function getWaveFnPure(freq) {
  const waveTypes = [
    // 1️⃣ sin波
    () => (a) => sin(a * freq),

    // 2️⃣ cos波
    () => (a) => cos(a * freq),

    // 3️⃣ 絶対値sin波
    () => (a) => abs(sin(a * freq)),

    // 4️⃣ 三角波
    () => (a) => {
      let t = (a * freq / TWO_PI) % 1;
      return 1 - 4 * abs(t - 0.5);
    },
    // 5️⃣ ノコギリ波
    () => (a) => {
      let t = (a * freq / TWO_PI) % 1;
      return 2 * t - 1;
    },
    // 6️⃣ 高調波合成（sin波ミックス）
    () => (a) => sin(a*freq) + 0.5*sin(a*freq*3),
  ];
  return random(waveTypes)();
}

// メインコード
let baseRadius = 300;
let teeth = 60;     // 歯の数

canvas.style('width', '800px');
canvas.style('height', '800px');
applyRotationSpeed(180);
applyFPS(30);

angleMode(RADIANS);
const rainbowColors = [
  [200, 0, 200],
  [180, 0, 40],
  [45, 0, 90],
  [120, 0, 130],
  [220, 20, 20],
  [255, 220, 0],
  [0, 255, 100],
  [0, 255, 255],
  [0, 50, 255],
];

const stepRadius = 467 / rainbowColors.length;
const stepAmplitude = 75/rainbowColors.length
background(70);
for (let i=rainbowColors.length-1; i>=4; i--) {
  drawPattern(rainbowColors[i], stepRadius+stepRadius*i, stepAmplitude+stepAmplitude*i);
}

