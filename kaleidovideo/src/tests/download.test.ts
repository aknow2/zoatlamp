import { describe, expect, it } from 'vitest';
import { createRadialSliceFilename } from '../download.ts';

describe('download', () => {
  it('creates a PNG filename with frame count and timestamp', () => {
    const filename = createRadialSliceFilename(24, new Date('2026-05-18T02:30:15.123Z'));

    expect(filename).toBe('radial-slice-24-2026-05-18T02-30-15Z.png');
  });
});
