import type { VideoMeta } from './types.ts';

export function seekVideo(
  video: HTMLVideoElement,
  time: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to seek video'));
    };

    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = time;
  });
}

export function loadVideoFile(
  file: File,
  video: HTMLVideoElement,
): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const onLoadedMetadata = () => {
      cleanup();
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    const onError = () => {
      cleanup();
      reject(new Error('動画を読み込めませんでした。別の形式の動画を試してください。'));
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);

    const url = URL.createObjectURL(file);
    video.src = url;
  });
}
