import './styles.css';
import { extractFrames } from './frameExtractor.ts';
import { getVideoPointFromPointerEvent } from './geometry.ts';
import { drawInputGuide } from './renderer.ts';
import { state } from './state.ts';
import { readSettingsFromUI } from './ui.ts';
import { validateGenerateRequest } from './validate.ts';
import { loadVideoFile } from './video.ts';
import { updateUI } from './ui.ts';

const videoFileInput = document.getElementById('videoFileInput') as HTMLInputElement;
const sourceVideo = document.getElementById('sourceVideo') as HTMLVideoElement;
const overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
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
    state.frames = await extractFrames(sourceVideo, state.settings);
  } catch {
    state.errorMessage = 'フレームの取得に失敗しました。';
  } finally {
    state.isGenerating = false;
    updateUI(state);
  }
}

videoFileInput.addEventListener('change', onVideoFileChange);
overlayCanvas.addEventListener('pointerdown', onOverlayPointerDown);
generateButton.addEventListener('click', onGenerateClick);

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
