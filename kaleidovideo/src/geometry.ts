import type { Point, Triangle, VideoMeta } from './types.ts';

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function getApexAngleDeg(frameCount: number): number {
  return 360 / frameCount;
}

export function getInputTriangle(
  samplePoint: Point,
  directionDeg: number,
  sliceLength: number,
  frameCount: number,
): Triangle {
  const apexAngleDeg = getApexAngleDeg(frameCount);
  const leftAngle = directionDeg - apexAngleDeg / 2;
  const rightAngle = directionDeg + apexAngleDeg / 2;

  return {
    apex: { ...samplePoint },
    left: {
      x: samplePoint.x + Math.cos(toRad(leftAngle)) * sliceLength,
      y: samplePoint.y + Math.sin(toRad(leftAngle)) * sliceLength,
    },
    right: {
      x: samplePoint.x + Math.cos(toRad(rightAngle)) * sliceLength,
      y: samplePoint.y + Math.sin(toRad(rightAngle)) * sliceLength,
    },
  };
}

export function getVideoPointFromPointerEvent(
  event: PointerEvent,
  element: HTMLElement,
  videoMeta: VideoMeta,
): Point {
  const rect = element.getBoundingClientRect();

  const relativeX = (event.clientX - rect.left) / rect.width;
  const relativeY = (event.clientY - rect.top) / rect.height;

  return {
    x: relativeX * videoMeta.width,
    y: relativeY * videoMeta.height,
  };
}
