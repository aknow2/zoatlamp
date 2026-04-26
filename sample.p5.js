const baseRadius = 350;
const numOfCircles = 40;

canvas.style('width', '800px');
canvas.style('height', '800px');
const angleDelta = TWO_PI / numOfCircles;

fill('green')
for (let angle=0; angle<TWO_PI; angle+=angleDelta) {
  const x = baseRadius * cos(angle) + abs(sin(angle * 2)) * 60;
  const y = baseRadius * sin(angle);
  const sizeOffset = sin(angle * 2) * 10;
  circle(x, y, 20 + sizeOffset);
}

fill('red')
for (let angle=0; angle<TWO_PI; angle+=angleDelta) {
  const x = 230 * cos(angle) + sin(angle * 2) * 20;
  const y = 230 * sin(angle);
  const sizeOffset = sin(angle * 4) * 10;
  circle(x, y, 20 + sizeOffset);
}

fill('yellow')
for (let angle=0; angle<TWO_PI; angle+=angleDelta) {
  const x = 100 * cos(angle) + sin(angle) * 20;
  const y = 100 * sin(angle);
  const sizeOffset = sin(angle) * 3;
  circle(x, y, 20 + sizeOffset);
}
fill('purple')
for (let angle=0; angle<TWO_PI; angle+=angleDelta) {
  const x = 50 * cos(angle*-1) + sin(angle) * 20;
  const y = 50 * sin(angle*-1);
  circle(x, y, 10);
}

fill('white');

circle(0, 0, 30);
