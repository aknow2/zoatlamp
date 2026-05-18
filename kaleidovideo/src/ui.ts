import type { AppState, GenerateSettings } from './types.ts';
import { defaultSettings } from './state.ts';

function getNumberInputValue(id: string, fallback: number): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return fallback;
  const val = parseFloat(el.value);
  return isNaN(val) ? fallback : val;
}

function getIntInputValue(id: string, fallback: number): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return fallback;
  const val = parseInt(el.value, 10);
  return isNaN(val) ? fallback : val;
}

export function readSettingsFromUI(): GenerateSettings {
  return {
    startSecond: getNumberInputValue('startSecondInput', defaultSettings.startSecond),
    frameCount: getIntInputValue('frameCountInput', defaultSettings.frameCount),
    frameInterval: getNumberInputValue('frameIntervalInput', defaultSettings.frameInterval),
    directionDeg: getNumberInputValue('directionDegInput', defaultSettings.directionDeg),
    sliceLength: getNumberInputValue('sliceLengthInput', defaultSettings.sliceLength),
    outputRadius: getNumberInputValue('outputRadiusInput', defaultSettings.outputRadius),
  };
}

export function showError(message: string): void {
  const el = document.getElementById('errorMessage');
  if (el) el.textContent = message;
}

export function clearError(): void {
  const el = document.getElementById('errorMessage');
  if (el) el.textContent = '';
}

export function updateUI(state: AppState): void {
  if (state.errorMessage !== null) {
    showError(state.errorMessage);
  } else {
    clearError();
  }

  const generateBtn = document.getElementById('generateButton') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('downloadButton') as HTMLButtonElement | null;

  if (generateBtn) {
    generateBtn.disabled = state.isGenerating || state.videoFile === null;
  }
  if (downloadBtn) {
    downloadBtn.disabled = state.frames.length === 0;
  }
}
