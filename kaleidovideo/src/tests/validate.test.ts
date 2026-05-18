import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../state.ts';
import type { AppState, GenerateSettings, Point, VideoMeta } from '../types.ts';
import {
  FRAME_COUNT_WARNING_MESSAGE,
  getFrameCountWarning,
  getLastFrameTime,
  validateGenerateRequest,
  validateSettings,
} from '../validate.ts';

const videoMeta: VideoMeta = {
  duration: 2,
  width: 320,
  height: 240,
};

function makeSettings(overrides: Partial<GenerateSettings> = {}): GenerateSettings {
  return {
    ...defaultSettings,
    ...overrides,
  };
}

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    videoFile: new File(['test'], 'test.mp4', { type: 'video/mp4' }),
    videoUrl: 'blob:test',
    videoMeta,
    samplePoint: { x: 160, y: 120 } satisfies Point,
    settings: makeSettings(),
    frames: [],
    isGenerating: false,
    errorMessage: null,
    ...overrides,
  };
}

describe('validate', () => {
  it('calculates the last requested frame time', () => {
    expect(getLastFrameTime(makeSettings({ startSecond: 1, frameCount: 4, frameInterval: 0.25 })))
      .toBeCloseTo(1.75);
  });

  it('requires a video file', () => {
    expect(validateGenerateRequest(makeState({ videoFile: null }))).toBe(
      '動画ファイルを選択してください。',
    );
  });

  it('requires a sample point', () => {
    expect(validateGenerateRequest(makeState({ samplePoint: null }))).toBe(
      '動画上で切り出し基準点を指定してください。',
    );
  });

  it('requires frame count to be at least 3', () => {
    expect(validateSettings(makeSettings({ frameCount: 2 }), videoMeta)).toBe(
      'フレーム数は3以上にしてください。',
    );
  });

  it('requires frame interval to be positive', () => {
    expect(validateSettings(makeSettings({ frameInterval: 0 }), videoMeta)).toBe(
      'フレーム間隔は0より大きくしてください。',
    );
  });

  it('requires start second to be non-negative', () => {
    expect(validateSettings(makeSettings({ startSecond: -0.1 }), videoMeta)).toBe(
      '開始秒は0以上にしてください。',
    );
  });

  it('requires slice length to be positive', () => {
    expect(validateSettings(makeSettings({ sliceLength: 0 }), videoMeta)).toBe(
      'スライス長さは0より大きくしてください。',
    );
  });

  it('requires output radius to be positive', () => {
    expect(validateSettings(makeSettings({ outputRadius: 0 }), videoMeta)).toBe(
      '出力半径は0より大きくしてください。',
    );
  });

  it('blocks a frame range that exceeds the video duration', () => {
    expect(
      validateSettings(
        makeSettings({ startSecond: 1.5, frameCount: 3, frameInterval: 0.3 }),
        videoMeta,
      ),
    ).toBe('指定したフレーム範囲が動画の長さを超えています。');
  });

  it('does not block frame counts above the recommended maximum', () => {
    const settings = makeSettings({ frameCount: 361, frameInterval: 0.001 });

    expect(validateSettings(settings, videoMeta)).toBeNull();
    expect(getFrameCountWarning(settings)).toBe(FRAME_COUNT_WARNING_MESSAGE);
  });
});
