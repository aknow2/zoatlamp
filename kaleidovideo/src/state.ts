import type { AppState, GenerateSettings } from './types.ts';

export const defaultSettings: GenerateSettings = {
  startSecond: 0,
  frameCount: 24,
  frameInterval: 1 / 30,
  directionDeg: -90,
  sliceLength: 300,
  outputRadius: 512,
};

export const state: AppState = {
  videoFile: null,
  videoUrl: null,
  videoMeta: null,
  samplePoint: null,
  settings: { ...defaultSettings },
  frames: [],
  isGenerating: false,
  errorMessage: null,
};
