import type { AppState, GenerateSettings, RotationSettings } from './types.ts';
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

function getBoolInputValue(id: string, fallback: boolean): boolean {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return fallback;
  return el.checked;
}

export function readSettingsFromUI(): GenerateSettings {
  const foldbackCount = getIntInputValue('foldbackCountInput', defaultSettings.foldbackCount);

  return {
    startSecond: getNumberInputValue('startSecondInput', defaultSettings.startSecond),
    frameCount: getIntInputValue('frameCountInput', defaultSettings.frameCount),
    frameInterval: getNumberInputValue('frameIntervalInput', defaultSettings.frameInterval),
    foldbackCount: Math.max(0, foldbackCount),
    directionDeg: getNumberInputValue('directionDegInput', defaultSettings.directionDeg),
    sliceLength: getNumberInputValue('sliceLengthInput', defaultSettings.sliceLength),
    outputRadius: getNumberInputValue('outputRadiusInput', defaultSettings.outputRadius),
  };
}

export function readRotationSettingsFromUI(): RotationSettings {
  const refreshRateFps = getNumberInputValue('refreshRateFpsInput', 60);
  const rotationSpeedDegPerSec = getNumberInputValue('rotationSpeedInput', 30);

  return {
    isEnabled: getBoolInputValue('rotationEnableInput', false),
    refreshRateFps: Math.max(1, Math.floor(refreshRateFps)),
    rotationSpeedDegPerSec: Math.max(0, rotationSpeedDegPerSec),
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

  // Update rotation UI controls based on whether image has been generated
  const rotationEnableInput = document.getElementById('rotationEnableInput') as HTMLInputElement | null;
  const refreshRateInput = document.getElementById('refreshRateFpsInput') as HTMLInputElement | null;
  const rotationSpeedInput = document.getElementById('rotationSpeedInput') as HTMLInputElement | null;
  const resetRotationBtn = document.getElementById('resetRotationButton') as HTMLButtonElement | null;

  const hasFrames = state.frames.length > 0;

  if (rotationEnableInput) {
    rotationEnableInput.disabled = !hasFrames;
  }

  const isRotationEnabled = state.rotationSettings.isEnabled && hasFrames;

  if (refreshRateInput) {
    refreshRateInput.disabled = !isRotationEnabled;
  }
  if (rotationSpeedInput) {
    rotationSpeedInput.disabled = !isRotationEnabled;
  }
  if (resetRotationBtn) {
    resetRotationBtn.disabled = !isRotationEnabled;
  }

  // Update rotation display
  const rotationDisplay = document.getElementById('currentRotationDisplay') as HTMLElement | null;
  if (rotationDisplay) {
    rotationDisplay.textContent = `${state.currentRotationDeg.toFixed(1)}°`;
  }

  const rotationSpeedValue = document.getElementById('rotationSpeedValue') as HTMLElement | null;
  if (rotationSpeedValue) {
    rotationSpeedValue.textContent = `${state.rotationSettings.rotationSpeedDegPerSec.toFixed(0)} deg/sec`;
  }
}
