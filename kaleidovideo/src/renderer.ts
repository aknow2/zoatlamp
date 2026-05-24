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

// Temporary canvas for rendering the radial image before rotation is applied
let radialImageCanvas: HTMLCanvasElement | null = null;

function getSourceFrameIndex(
  outputIndex: number,
  outputFrameCount: number,
  foldbackCount: number,
): number {
  const normalizedFoldbackCount = Math.max(0, Math.floor(foldbackCount));
  const segmentCount = normalizedFoldbackCount + 1;
  const segmentLength = Math.ceil(outputFrameCount / segmentCount);

  if (segmentLength <= 0) {
    return 0;
  }

  const segmentIndex = Math.floor(outputIndex / segmentLength);
  const inSegmentIndex = outputIndex % segmentLength;
  const isForward = segmentIndex % 2 === 0;

  if (isForward) {
    return inSegmentIndex;
  }

  return segmentLength - 1 - inSegmentIndex;
}

export function renderRadialImage(
  frames: ExtractedFrame[],
  samplePoint: Point,
  settings: GenerateSettings,
  outputCanvas: HTMLCanvasElement,
): void {
  const outputFrameCount = settings.frameCount;
  const virtualRadius = settings.sliceLength;
  const outputRadius = settings.outputRadius;
  const virtualSize = virtualRadius * 2;
  const outputSize = outputRadius * 2;
  const centerX = virtualRadius;
  const centerY = virtualRadius;

  if (frames.length === 0) {
    throw new Error('No frames to render');
  }

  // Create or reuse temporary canvas for the base radial image (virtual size)
  if (!radialImageCanvas) {
    radialImageCanvas = document.createElement('canvas');
  }
  radialImageCanvas.width = virtualSize;
  radialImageCanvas.height = virtualSize;

  const tempCtx = radialImageCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get temporary canvas context');
  }

  tempCtx.clearRect(0, 0, virtualSize, virtualSize);

  const apexAngleRad = (Math.PI * 2) / outputFrameCount;
  const baseHalfWidth = Math.tan(apexAngleRad / 2) * virtualRadius;

  for (let outputIndex = 0; outputIndex < outputFrameCount; outputIndex++) {
    const sourceIndex = getSourceFrameIndex(
      outputIndex,
      outputFrameCount,
      settings.foldbackCount,
    );
    const frame = frames[Math.max(0, Math.min(sourceIndex, frames.length - 1))];
    const rotation = outputIndex * apexAngleRad;

    tempCtx.save();
    tempCtx.translate(centerX, centerY);
    tempCtx.rotate(rotation);

    tempCtx.beginPath();
    tempCtx.moveTo(0, 0);
    tempCtx.lineTo(-baseHalfWidth, -virtualRadius);
    tempCtx.lineTo(baseHalfWidth, -virtualRadius);
    tempCtx.closePath();
    tempCtx.clip();

    tempCtx.rotate(-toRad(settings.directionDeg) - Math.PI / 2);
    tempCtx.drawImage(frame.bitmap, -samplePoint.x, -samplePoint.y);
    tempCtx.restore();
  }

  // Draw the virtual-size radial image to output canvas, scaling to output radius
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get output canvas context');
  }

  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(radialImageCanvas, 0, 0, virtualSize, virtualSize, 0, 0, outputSize, outputSize);
}

export function drawRotatedImage(
  sourceCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  rotationDeg: number,
): void {
  const size = sourceCanvas.width; // Assuming square canvas
  const centerX = size / 2;
  const centerY = size / 2;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get output canvas context');
  }

  outputCanvas.width = size;
  outputCanvas.height = size;
  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(toRad(rotationDeg));
  ctx.drawImage(sourceCanvas, -centerX, -centerY);
  ctx.restore();
}
