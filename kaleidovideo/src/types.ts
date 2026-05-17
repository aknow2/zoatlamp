export type Point = {
  x: number;
  y: number;
};

export type Triangle = {
  apex: Point;
  left: Point;
  right: Point;
};

export type VideoMeta = {
  duration: number;
  width: number;
  height: number;
};

// Note: sliceLength is used only by drawInputGuide, not by renderRadialImage.
export type GenerateSettings = {
  startSecond: number;
  frameCount: number;
  frameInterval: number;
  directionDeg: number;
  sliceLength: number;
  outputRadius: number;
};

export type ExtractedFrame = {
  index: number;
  time: number;
  bitmap: ImageBitmap;
};

export type AppState = {
  videoFile: File | null;
  videoUrl: string | null;
  videoMeta: VideoMeta | null;
  samplePoint: Point | null;
  settings: GenerateSettings;
  frames: ExtractedFrame[];
  isGenerating: boolean;
  errorMessage: string | null;
};
