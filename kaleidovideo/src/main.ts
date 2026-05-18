import './styles.css';
import { createRadialSliceFilename, downloadCanvasAsPng } from './download.ts';
import { extractFrames } from './frameExtractor.ts';
import { getVideoPointFromPointerEvent } from './geometry.ts';
import { drawInputGuide, renderRadialImage } from './renderer.ts';
import { state } from './state.ts';
import { readSettingsFromUI } from './ui.ts';
import { validateGenerateRequest } from './validate.ts';
import { loadVideoFile } from './video.ts';
import { updateUI } from './ui.ts';

const videoFileInput = document.getElementById('videoFileInput') as HTMLInputElement;
const sourceVideo = document.getElementById('sourceVideo') as HTMLVideoElement;
const overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement;
const outputCanvas = document.getElementById('outputCanvas') as HTMLCanvasElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
const settingInputIds = [
  'startSecondInput',
  'frameCountInput',
  'frameIntervalInput',
  'directionDegInput',
  'sliceLengthInput',
  'outputRadiusInput',
];

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
  clearOutputCanvas();
  redrawGuide();
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
  clearOutputCanvas();

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

  try {
    const filename = createRadialSliceFilename(state.settings.frameCount);
    await downloadCanvasAsPng(outputCanvas, filename);
    state.errorMessage = null;
  } catch {
    state.errorMessage = '画像生成に失敗しました。フレーム数や出力サイズを小さくしてください。';
  }

  updateUI(state);
}

videoFileInput.addEventListener('change', onVideoFileChange);
overlayCanvas.addEventListener('pointerdown', onOverlayPointerDown);
generateButton.addEventListener('click', onGenerateClick);
downloadButton.addEventListener('click', onDownloadClick);

sourceVideo.addEventListener('loadedmetadata', () => {
  syncOverlayCanvas();
  redrawGuide();
});

for (const id of settingInputIds) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  input?.addEventListener('input', onSettingsChange);
}

window.addEventListener('resize', () => {
  if (!state.videoMeta) return;

  syncOverlayCanvas();
  redrawGuide();
});

state.settings = readSettingsFromUI();
redrawGuide();
updateUI(state);
