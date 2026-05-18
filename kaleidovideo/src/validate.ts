import type { AppState, GenerateSettings, VideoMeta } from './types.ts';

export const FRAME_COUNT_WARNING_MESSAGE = 'フレーム数は360以下を推奨します。';

export function getLastFrameTime(settings: GenerateSettings): number {
  return settings.startSecond + (settings.frameCount - 1) * settings.frameInterval;
}

export function validateGenerateRequest(state: AppState): string | null {
  if (state.videoFile === null) {
    return '動画ファイルを選択してください。';
  }

  if (state.samplePoint === null) {
    return '動画上で切り出し基準点を指定してください。';
  }

  return validateSettings(state.settings, state.videoMeta);
}

export function validateSettings(
  settings: GenerateSettings,
  videoMeta: VideoMeta | null,
): string | null {
  if (settings.frameCount < 3) {
    return 'フレーム数は3以上にしてください。';
  }

  if (settings.frameInterval <= 0) {
    return 'フレーム間隔は0より大きくしてください。';
  }

  if (settings.startSecond < 0) {
    return '開始秒は0以上にしてください。';
  }

  if (settings.sliceLength <= 0) {
    return 'スライス長さは0より大きくしてください。';
  }

  if (settings.outputRadius <= 0) {
    return '出力半径は0より大きくしてください。';
  }

  if (videoMeta && getLastFrameTime(settings) > videoMeta.duration) {
    return '指定したフレーム範囲が動画の長さを超えています。';
  }

  return null;
}

export function getFrameCountWarning(settings: GenerateSettings): string | null {
  return settings.frameCount > 360 ? FRAME_COUNT_WARNING_MESSAGE : null;
}
