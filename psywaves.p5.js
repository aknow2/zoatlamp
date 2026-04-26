
const numOfCircles = 173;
const angleDelta = TWO_PI / numOfCircles;

const colors = [
    '#fc4f4fff',
    '#b928e9ff',
    '#037e91ff',
    '#f1ba23ff'
]

const maxRadius = 700;
const stepRadius = 42;
let angleOffset = 0;
for (let radius = maxRadius; radius >=0; radius -= stepRadius) {
    for (let angle=0; angle<TWO_PI; angle+=2*angleDelta) {
        const x = (radius*0.5) * cos(angle);
        const y = (radius*0.5) * sin(angle);
        const color = colors[Math.floor((angle+angleOffset) / angleDelta) % colors.length];
        fill(color);
        stroke('black');
        strokeWeight(8);
        const circleRadius = sin(PI/numOfCircles) * radius;
        rotate(-angleDelta/2);
        ellipse(x, y, circleRadius*25, circleRadius*7.5);
    }
    for (let angle=angleDelta; angle<TWO_PI; angle+= 2*angleDelta) {
        const x = (radius*0.8) * cos(angle)+5*sin(angle*3);
        const y = (radius*0.8) * sin(angle)+5*sin(angle*1);
        const color = colors[Math.floor((angle+angleOffset) / angleDelta) % colors.length];
        fill(color);
        stroke('black');
        strokeWeight(6);
        const circleRadius = sin(PI/numOfCircles) * radius;
        rotate(angleDelta);
        ellipse(x, y, circleRadius*10.5, circleRadius*19.2);
    }
    angleOffset += angleDelta;
}



drawingContext.shadowBlur = 30;
drawingContext.filter = 'blur(10.5px)';
fill('#444444cc');
circle(0, 0, 360);
strokeWeight(0);
fill('#222222cc');
circle(0, 0, 340);
fill('#111111dd');
circle(0, 0, 320);
fill('#111111ee');
circle(0, 0, 270);
fill('#000000ff');
circle(0, 0, 250);
