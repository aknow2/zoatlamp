// p5.js スケッチテンプレート
// このファイルは p5/runner.html?file=sketch_template.js で開けます。
// setup() / draw() を持つフルスタイルのスケッチです。

let angle = 0;

function setup() {
  canvas = createCanvas(800, 800);
  canvas.parent('canvas-wrap-inner');
  colorMode(HSB, 360, 100, 100, 1);
  background(0);
}

function draw() {
  background(0, 0, 0, 0.04);   // フェードアウト効果

  translate(width / 2, height / 2);

  const r = 200;
  const x = r * cos(angle);
  const y = r * sin(angle);

  noStroke();
  fill((frameCount * 2) % 360, 80, 100, 0.9);
  circle(x, y, 20);

  angle += 0.04;
}

function mousePressed() {
  background(0);
}
