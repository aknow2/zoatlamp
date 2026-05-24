import type { ExtractedFrame, GenerateSettings } from './types.ts';
import { getEffectiveExtractionFrameCount } from './validate.ts';
import { seekVideo } from './video.ts';

export async function extractFrames(
  video: HTMLVideoElement,
  settings: GenerateSettings,
): Promise<ExtractedFrame[]> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const frames: ExtractedFrame[] = [];
  const extractionFrameCount = getEffectiveExtractionFrameCount(settings);

  for (let i = 0; i < extractionFrameCount; i++) {
    const time = settings.startSecond + i * settings.frameInterval;

    await seekVideo(video, time);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const bitmap = await createImageBitmap(canvas);

    frames.push({
      index: i,
      time,
      bitmap,
    });
  }

  return frames;
}
