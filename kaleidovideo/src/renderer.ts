import { getInputTriangle, toRad } from './geometry.ts';
import type { AppState, ExtractedFrame, GenerateSettings, Point } from './types.ts';

function toCanvasPoint(videoPoint: Point, state: AppState, canvas: HTMLCanvasElement): Point {
  const videoMeta = state.videoMeta;
  if (!videoMeta) return { x: 0, y: 0 };

  return {
    x: (videoPoint.x / videoMeta.width) * canvas.width,
    y: (videoPoint.y / videoMeta.height) * canvas.height,
  };
}

export function drawInputGuide(canvas: HTMLCanvasElement, state: AppState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get overlay canvas context');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.videoMeta || !state.samplePoint) {
    return;
  }

  const triangle = getInputTriangle(
    state.samplePoint,
    state.settings.directionDeg,
    state.settings.sliceLength,
    state.settings.frameCount,
  );

  const apex = toCanvasPoint(triangle.apex, state, canvas);
  const left = toCanvasPoint(triangle.left, state, canvas);
  const right = toCanvasPoint(triangle.right, state, canvas);

  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.fillStyle = '#00e5ff';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(apex.x, apex.y, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderRadialImage(
  frames: ExtractedFrame[],
  samplePoint: Point,
  settings: GenerateSettings,
  outputCanvas: HTMLCanvasElement,
): void {
  const frameCount = frames.length;
  const radius = settings.outputRadius;
  const size = radius * 2;
  const centerX = radius;
  const centerY = radius;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get output canvas context');
  }

  outputCanvas.width = size;
  outputCanvas.height = size;
  ctx.clearRect(0, 0, size, size);

  const apexAngleRad = (Math.PI * 2) / frameCount;
  const baseHalfWidth = Math.tan(apexAngleRad / 2) * radius;

  for (const frame of frames) {
    const rotation = frame.index * apexAngleRad;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-baseHalfWidth, -radius);
    ctx.lineTo(baseHalfWidth, -radius);
    ctx.closePath();
    ctx.clip();

    ctx.rotate(-toRad(settings.directionDeg) - Math.PI / 2);
    ctx.drawImage(frame.bitmap, -samplePoint.x, -samplePoint.y);
    ctx.restore();
  }
}
