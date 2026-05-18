import { describe, expect, it } from 'vitest';
import {
  toRad,
  toDeg,
  getApexAngleDeg,
  getInputTriangle,
  getVideoPointFromPointerEvent,
} from '../geometry.ts';

describe('geometry', () => {
  it('converts degrees to radians', () => {
    expect(toRad(180)).toBeCloseTo(Math.PI);
    expect(toRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts radians to degrees', () => {
    expect(toDeg(Math.PI)).toBeCloseTo(180);
    expect(toDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('calculates apex angle from frame count', () => {
    expect(getApexAngleDeg(24)).toBeCloseTo(15);
    expect(getApexAngleDeg(12)).toBeCloseTo(30);
  });

  it('calculates input triangle endpoints based on direction and frame count', () => {
    const triangle = getInputTriangle({ x: 100, y: 50 }, -90, 100, 4);

    expect(triangle.apex).toEqual({ x: 100, y: 50 });
    expect(triangle.left.x).toBeCloseTo(29.289321, 5);
    expect(triangle.left.y).toBeCloseTo(-20.710678, 5);
    expect(triangle.right.x).toBeCloseTo(170.710678, 5);
    expect(triangle.right.y).toBeCloseTo(-20.710678, 5);
  });

  it('maps pointer coordinates from displayed element space to video pixel space', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({
        left: 10,
        top: 20,
        width: 200,
        height: 100,
        right: 210,
        bottom: 120,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }),
    });

    const point = getVideoPointFromPointerEvent(
      { clientX: 110, clientY: 45 } as PointerEvent,
      element,
      { duration: 2, width: 1000, height: 500 },
    );

    expect(point.x).toBeCloseTo(500);
    expect(point.y).toBeCloseTo(125);
  });
});
