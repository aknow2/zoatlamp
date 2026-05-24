import './styles.css';
import { createRadialSliceFilename, downloadCanvasAsPng } from './download.ts';
import { extractFrames } from './frameExtractor.ts';
import { getVideoPointFromPointerEvent } from './geometry.ts';
import { drawInputGuide, renderRadialImage, drawRotatedImage } from './renderer.ts';
import { state } from './state.ts';
import { readSettingsFromUI, readRotationSettingsFromUI } from './ui.ts';
import { validateGenerateRequest } from './validate.ts';
import { loadVideoFile } from './video.ts';
import { updateUI } from './ui.ts';

const videoFileInput = document.getElementById('videoFileInput') as HTMLInputElement;
const sourceVideo = document.getElementById('sourceVideo') as HTMLVideoElement;
const overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement;
const outputCanvas = document.getElementById('outputCanvas') as HTMLCanvasElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
const rotationEnableInput = document.getElementById('rotationEnableInput') as HTMLInputElement;
const resetRotationButton = document.getElementById('resetRotationButton') as HTMLButtonElement;
const rotationSettingInputIds = ['refreshRateFpsInput', 'rotationSpeedInput'];
const settingInputIds = [
  'startSecondInput',
  'frameCountInput',
  'frameIntervalInput',
  'foldbackCountInput',
  'directionDegInput',
  'sliceLengthInput',
  'outputRadiusInput',
];

// Temporary canvas for storing the base radial image for rotation animation
let baseRadialImageCanvas: HTMLCanvasElement | null = null;
let animationFrameId: number | null = null;

function syncOverlayCanvas(): void {
  const rect = sourceVideo.getBoundingClientRect();
  overlayCanvas.width = rect.width;
  overlayCanvas.height = rect.height;
}

function redrawGuide(): void {
  drawInputGuide(overlayCanvas, state);
}

function clearOutputCanvas(): void {
  outputCanvas.width = 0;
  outputCanvas.height = 0;
}

function startAnimationLoop(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  if (!state.rotationSettings.isEnabled || state.frames.length === 0) {
    return;
  }

  if (!baseRadialImageCanvas) {
    baseRadialImageCanvas = document.createElement('canvas');
  }

  // Copy the current output canvas as the base image
  baseRadialImageCanvas.width = outputCanvas.width;
  baseRadialImageCanvas.height = outputCanvas.height;
  const baseCtx = baseRadialImageCanvas.getContext('2d');
  if (baseCtx) {
    baseCtx.drawImage(outputCanvas, 0, 0);
  }

  state.isAnimating = true;
  state.lastFrameTime = performance.now();
  let accumulatedTimeMs = 0;

  function animate(currentTime: number): void {
    const elapsedMs = currentTime - state.lastFrameTime;
    state.lastFrameTime = currentTime;
    accumulatedTimeMs += elapsedMs;

    const refreshRate = Math.max(1, Math.floor(state.rotationSettings.refreshRateFps));
    const frameIntervalMs = 1000 / refreshRate;
    const stepDeg = state.rotationSettings.rotationSpeedDegPerSec / refreshRate;

    let didRender = false;
    let safety = 0;

    while (accumulatedTimeMs >= frameIntervalMs && safety < 10) {
      state.currentRotationDeg = (state.currentRotationDeg + stepDeg) % 360;
      accumulatedTimeMs -= frameIntervalMs;
      didRender = true;
      safety += 1;
    }

    if (didRender && baseRadialImageCanvas) {
      drawRotatedImage(baseRadialImageCanvas, outputCanvas, state.currentRotationDeg);
      updateUI(state);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animationFrameId = requestAnimationFrame(animate);
}

function stopAnimationLoop(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  state.isAnimating = false;
  state.currentRotationDeg = 0;

  // Restore base image
  if (baseRadialImageCanvas && state.frames.length > 0) {
    const ctx = outputCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(baseRadialImageCanvas, 0, 0);
    }
  }

  updateUI(state);
}

function onOverlayPointerDown(event: PointerEvent): void {
  if (!state.videoMeta) return;

  state.samplePoint = getVideoPointFromPointerEvent(event, overlayCanvas, state.videoMeta);
  state.errorMessage = null;

  redrawGuide();
  updateUI(state);
}

function onSettingsChange(): void {
  state.settings = readSettingsFromUI();
  state.frames = [];
  state.currentRotationDeg = 0;
  clearOutputCanvas();
  redrawGuide();
  stopAnimationLoop();
  updateUI(state);
}

function onRotationSettingsChange(): void {
  state.rotationSettings = readRotationSettingsFromUI();

  if (state.rotationSettings.isEnabled && state.frames.length > 0 && !state.isAnimating) {
    startAnimationLoop();
  } else if (!state.rotationSettings.isEnabled && state.isAnimating) {
    stopAnimationLoop();
  }

  updateUI(state);
}

function onResetRotationClick(): void {
  state.currentRotationDeg = 0;
  if (baseRadialImageCanvas) {
    const ctx = outputCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(baseRadialImageCanvas, 0, 0);
    }
  }
  updateUI(state);
}

async function onVideoFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  if (!file) return;

  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = null;
  }

  state.videoFile = file;
  state.videoMeta = null;
  state.samplePoint = null;
  state.frames = [];
  state.errorMessage = null;
  state.currentRotationDeg = 0;
  clearOutputCanvas();
  stopAnimationLoop();

  try {
    const meta = await loadVideoFile(file, sourceVideo);
    state.videoMeta = meta;
    state.videoUrl = sourceVideo.src;
    requestAnimationFrame(() => {
      syncOverlayCanvas();
      redrawGuide();
    });
  } catch (err) {
    state.errorMessage =
      err instanceof Error
        ? err.message
        : '動画を読み込めませんでした。別の形式の動画を試してください。';
  }

  redrawGuide();
  updateUI(state);
}

async function onGenerateClick(): Promise<void> {
  state.settings = readSettingsFromUI();

  const validationError = validateGenerateRequest(state);
  if (validationError) {
    state.errorMessage = validationError;
    updateUI(state);
    return;
  }

  state.isGenerating = true;
  state.frames = [];
  state.errorMessage = null;
  state.currentRotationDeg = 0;
  stopAnimationLoop();
  updateUI(state);

  try {
    const frames = await extractFrames(sourceVideo, state.settings);
    const samplePoint = state.samplePoint;

    if (!samplePoint) {
      state.errorMessage = '動画上で切り出し基準点を指定してください。';
      return;
    }

    try {
      renderRadialImage(frames, samplePoint, state.settings, outputCanvas);
      state.frames = frames;
      state.rotationSettings = readRotationSettingsFromUI();
      updateUI(state);
    } catch (err) {
      state.frames = [];
      state.errorMessage =
        err instanceof Error && err.message === 'Failed to get output canvas context'
          ? 'Canvas を初期化できませんでした。'
          : '画像生成に失敗しました。フレーム数や出力サイズを小さくしてください。';
    }
  } catch {
    state.frames = [];
    state.errorMessage = 'フレームの取得に失敗しました。';
  } finally {
    state.isGenerating = false;
    updateUI(state);
  }
}

async function onDownloadClick(): Promise<void> {
  if (state.frames.length === 0) return;

  // If animation is active, stop it before downloading
  const wasAnimating = state.isAnimating;
  if (wasAnimating) {
    stopAnimationLoop();
  }

  try {
    const filename = createRadialSliceFilename(state.settings.frameCount);
    await downloadCanvasAsPng(outputCanvas, filename);
    state.errorMessage = null;
  } catch {
    state.errorMessage = '画像生成に失敗しました。フレーム数や出力サイズを小さくしてください。';
  }

  // Resume animation if it was active
  if (wasAnimating) {
    startAnimationLoop();
  }

  updateUI(state);
}

videoFileInput.addEventListener('change', onVideoFileChange);
overlayCanvas.addEventListener('pointerdown', onOverlayPointerDown);
generateButton.addEventListener('click', onGenerateClick);
downloadButton.addEventListener('click', onDownloadClick);
rotationEnableInput.addEventListener('change', onRotationSettingsChange);
resetRotationButton.addEventListener('click', onResetRotationClick);

sourceVideo.addEventListener('loadedmetadata', () => {
  syncOverlayCanvas();
  redrawGuide();
});


// startSecondInput: 動画プレビューもシーク
const startSecondInput = document.getElementById('startSecondInput') as HTMLInputElement | null;
if (startSecondInput) {
  startSecondInput.addEventListener('input', async () => {
    const sec = parseFloat(startSecondInput.value);
    if (!isNaN(sec) && sec >= 0 && sourceVideo.readyState >= 1) {
      try {
        // 動画を指定秒にシーク
        const { seekVideo } = await import('./video.ts');
        await seekVideo(sourceVideo, sec);
      } catch {}
      // シーク後ガイド・UI更新
      redrawGuide();
      updateUI(state);
    }
    onSettingsChange(); // 設定値も反映
  });
}

// 他の設定項目
for (const id of settingInputIds) {
  if (id === 'startSecondInput') continue;
  const input = document.getElementById(id) as HTMLInputElement | null;
  input?.addEventListener('input', onSettingsChange);
}

for (const id of rotationSettingInputIds) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  input?.addEventListener('input', onRotationSettingsChange);
}

window.addEventListener('resize', () => {
  if (!state.videoMeta) return;

  syncOverlayCanvas();
  redrawGuide();
});

state.settings = readSettingsFromUI();
state.rotationSettings = readRotationSettingsFromUI();
redrawGuide();
updateUI(state);
