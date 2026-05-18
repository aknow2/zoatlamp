
# spec.md

# Video Radial Slice Generator

動画から指定フレームを抽出し、各フレームから二等辺三角形スライスを切り出して円形に配置する画像生成 Web アプリ。

MVP は **Vanilla TypeScript + Canvas 2D + HTMLVideoElement** で実装する。

---

## 1. Product Summary

### 1.1 What this app does

このアプリは、ユーザーが読み込んだ動画から指定秒数以降の複数フレームを取得し、それぞれのフレームから三角形領域を切り出して、円形に並べた1枚の画像を生成する。

主な用途は以下。

* ゾートロープ用画像の生成
* フェナキストスコープ風画像の生成
* ストロボアニメーション用素材の作成
* 回転するランプシェードや立体作品向けのパターン制作

---

## 2. Tech Stack

### 2.1 Required

* TypeScript
* HTML
* CSS
* Canvas 2D API
* HTMLVideoElement
* Vite

### 2.2 Not used in MVP

* React
* Vue
* Svelte
* WebCodecs
* ffmpeg.wasm
* Web Worker
* OffscreenCanvas
* Server-side video processing

### 2.3 Future candidates

* WebCodecs
* ffmpeg.wasm
* Web Worker
* OffscreenCanvas
* SVG export
* PDF export

---

## 3. Core Concept

### 3.1 Input

* 動画ファイル
* 開始秒
* 取得フレーム数
* フレーム間隔
* 動画上の基準点
* 三角形の向き
* 三角形の長さ
* 出力半径

### 3.2 Output

* フレーム数と同じ数の三角形を円形に配置した PNG 画像（透明背景）

### 3.3 Angle rule

取得フレーム数を `N` とする。

各三角形の頂点角度は以下で決定する。

```ts
const apexAngleDeg = 360 / frameCount;
```

例:

```txt
12 frames => 30 degrees
24 frames => 15 degrees
36 frames => 10 degrees
60 frames => 6 degrees
```

---

## 4. MVP Scope

### 4.1 Included in MVP

* 動画ファイル読み込み
* 動画プレビュー表示
* 開始秒指定
* フレーム数指定
* フレーム間隔指定
* 動画上の基準点クリック指定
* 三角形ガイド表示
* 向き角度指定
* スライス長さ指定
* 出力半径指定
* ラジアル画像生成
* PNG ダウンロード
* 基本的なバリデーション
* 基本的なエラーメッセージ表示

### 4.2 Excluded from MVP

* GIF 書き出し
* 動画書き出し
* SVG 書き出し
* PDF 書き出し
* 複数動画合成
* キーフレーム編集
* フレーム単位での厳密な動画デコード
* サーバー保存
* ユーザーアカウント
* クラウド同期

---

## 5. User Flow

```txt
1. User opens app
2. User selects a video file
3. App loads video metadata
4. App shows video preview
5. User sets start second, frame count, and frame interval
6. User clicks a point on the video preview
7. User adjusts direction and slice length
8. App shows triangle guide on video preview
9. User clicks Generate
10. App extracts frames from the video
11. App renders radial slice image to output canvas
12. User downloads PNG
```

---

## 6. Screen Layout

```txt
+------------------------------------------------------------+
| Header                                                     |
+----------------------------+-------------------------------+
| Settings Panel             | Preview Area                  |
|                            |                               |
| [Video file input]         | [Video preview]               |
| [Start second]             | [Triangle guide overlay]      |
| [Frame count]              |                               |
| [Frame interval]           | [Output canvas preview]       |
| [Direction angle]          |                               |
| [Slice length]             |                               |
| [Output radius]            |                               |
|                            |                               |
| [Generate]                 |                               |
| [Download PNG]             |                               |
+----------------------------+-------------------------------+
```

---

## 7. UI Elements

### 7.1 Video file input

```html
<input id="videoFileInput" type="file" accept="video/*" />
```

Purpose:

* ローカル動画ファイルを選択する

---

### 7.2 Source video preview

```html
<div class="video-preview">
  <video id="sourceVideo"></video>
  <canvas id="overlayCanvas"></canvas>
</div>
```

Purpose:

* 読み込んだ動画を表示する
* 基準点をクリック指定する
* 三角形ガイドを重ねて描画する

---

### 7.3 Settings inputs

| ID                   |   Type |    Default | Description  |
| -------------------- | -----: | ---------: | ------------ |
| `startSecondInput`   | number |        `0` | フレーム抽出開始秒    |
| `frameCountInput`    | number |       `24` | 取得フレーム数      |
| `frameIntervalInput` | number | `0.033333` | フレーム間隔秒      |
| `directionDegInput`  | number |      `-90` | 三角形を伸ばす方向    |
| `sliceLengthInput`   | number |      `300` | 入力動画上の三角形の長さ |
| `outputRadiusInput`  | number |      `512` | 出力画像の半径      |

---

### 7.4 Buttons

| ID               | Label   | Description          |
| ---------------- | ------- | -------------------- |
| `generateButton` | `生成`    | ラジアル画像を生成する          |
| `downloadButton` | `PNG保存` | 出力 Canvas を PNG 保存する |

---

### 7.5 Error message

```html
<p id="errorMessage" role="alert" aria-live="assertive"></p>
```

Purpose:

* バリデーションエラーや処理エラーをテキストで表示する
* `role="alert"` でスクリーンリーダーに通知する

---

### 7.6 Output canvas

```html
<canvas id="outputCanvas"></canvas>
```

Purpose:

* 生成結果を表示する
* PNG 書き出し元になる

---

## 8. Data Types

### 8.1 Point

```ts
type Point = {
  x: number;
  y: number;
};
```

---

### 8.2 Triangle

```ts
type Triangle = {
  apex: Point;
  left: Point;
  right: Point;
};
```

---

### 8.3 VideoMeta

```ts
type VideoMeta = {
  duration: number;
  width: number;
  height: number;
};
```

---

### 8.4 GenerateSettings

```ts
// Note: sliceLength is used only by drawInputGuide, not by renderRadialImage.
type GenerateSettings = {
  startSecond: number;
  frameCount: number;
  frameInterval: number;
  directionDeg: number;
  sliceLength: number;
  outputRadius: number;
};
```

---

### 8.5 ExtractedFrame

```ts
type ExtractedFrame = {
  index: number;
  time: number;
  bitmap: ImageBitmap;
};
```

---

### 8.6 AppState

```ts
type AppState = {
  videoFile: File | null;
  videoUrl: string | null;
  videoMeta: VideoMeta | null;
  samplePoint: Point | null;
  settings: GenerateSettings;
  frames: ExtractedFrame[];
  isGenerating: boolean;
  errorMessage: string | null;
};
```

---

## 9. Default Settings

```ts
const defaultSettings: GenerateSettings = {
  startSecond: 0,
  frameCount: 24,
  frameInterval: 1 / 30,
  directionDeg: -90,
  sliceLength: 300,
  outputRadius: 512,
};
```

---

## 10. File Structure

```txt
src/
  main.ts
  types.ts
  state.ts
  video.ts
  frameExtractor.ts
  geometry.ts
  renderer.ts
  ui.ts
  download.ts
  styles.css
  tests/
    geometry.test.ts
    download.test.ts
    validate.test.ts
index.html
spec.md
task.md
test-strategy.md
tests/
  AC1001.md
  AC1002.md
  AC1003.md
  AC1004.md
  AC1005.md
  AC1006.md
package.json
tsconfig.json
vite.config.ts
```

---

## 11. Module Responsibilities

### 11.1 `main.ts`

Responsibilities:

* アプリ初期化
* DOM 要素取得
* イベントリスナー登録
* 初期描画

---

### 11.2 `types.ts`

Responsibilities:

* 共通型定義

Contains:

* `Point`
* `Triangle`
* `VideoMeta`
* `GenerateSettings`
* `ExtractedFrame`
* `AppState`

---

### 11.3 `state.ts`

Responsibilities:

* アプリ状態の保持
* 状態更新関数の提供

Example:

```ts
export const state: AppState = {
  videoFile: null,
  videoUrl: null,
  videoMeta: null,
  samplePoint: null,
  settings: defaultSettings,
  frames: [],
  isGenerating: false,
  errorMessage: null,
};
```

---

### 11.4 `video.ts`

Responsibilities:

* 動画ファイル読み込み
* 動画メタデータ取得
* 動画シーク

Functions:

```ts
function loadVideoFile(
  file: File,
  video: HTMLVideoElement
): Promise<VideoMeta>;

function seekVideo(
  video: HTMLVideoElement,
  time: number
): Promise<void>;
```

---

### 11.5 `frameExtractor.ts`

Responsibilities:

* 指定条件で動画から複数フレームを取得する

Functions:

```ts
function extractFrames(
  video: HTMLVideoElement,
  settings: GenerateSettings
): Promise<ExtractedFrame[]>;
```

---

### 11.6 `geometry.ts`

Responsibilities:

* 角度変換
* 三角形計算
* 座標変換

Functions:

```ts
function toRad(deg: number): number;

function toDeg(rad: number): number;

function getApexAngleDeg(frameCount: number): number;

function getInputTriangle(
  samplePoint: Point,
  directionDeg: number,
  sliceLength: number,
  frameCount: number
): Triangle;

function getVideoPointFromPointerEvent(
  event: PointerEvent,
  element: HTMLElement,
  videoMeta: VideoMeta
): Point;
```

---

### 11.7 `renderer.ts`

Responsibilities:

* 動画上の三角形ガイド描画
* ラジアル画像生成

Functions:

```ts
function drawInputGuide(
  canvas: HTMLCanvasElement,
  state: AppState
): void;

function renderRadialImage(
  frames: ExtractedFrame[],
  samplePoint: Point,
  settings: GenerateSettings,
  outputCanvas: HTMLCanvasElement
): void;
```

---

### 11.8 `ui.ts`

Responsibilities:

* DOM から設定値を読む
* UI に状態を反映する
* エラーメッセージ表示
* ボタンの enabled / disabled 制御

Error state convention:

* `main.ts` が `state.errorMessage` を更新し `updateUI(state)` を呼ぶ
* `updateUI` 内で `state.errorMessage` が非 null なら `showError`、null なら `clearError` を呼ぶ

Functions:

```ts
function readSettingsFromUI(): GenerateSettings;
function updateUI(state: AppState): void;
function showError(message: string): void;
function clearError(): void;
```

---

### 11.9 `download.ts`

Responsibilities:

* Canvas を PNG として保存する

Functions:

```ts
function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string
): void;
```

---

## 12. Functional Requirements

## 12.1 Load Video

### Requirement

ユーザーはローカル動画ファイルを読み込める。

### Behavior

1. User selects a video file.
2. App creates object URL.
3. App sets URL to `<video>`.
4. App waits for `loadedmetadata`.
5. App stores video duration, width, and height.
6. App shows video preview.

### Acceptance Criteria

* 動画ファイルを選択できる
* 動画プレビューが表示される
* 動画の長さ、幅、高さを取得できる
* 未対応形式の場合、エラーメッセージを表示する

---

## 12.2 Set Sample Point

### Requirement

ユーザーは動画プレビュー上で三角形切り出しの基準点を指定できる。

### Behavior

1. User clicks video preview.
2. App converts preview coordinate to actual video pixel coordinate.
3. App stores coordinate as `samplePoint`.
4. App redraws overlay guide.

### overlayCanvas size sync

`overlayCanvas` の `width` / `height` は video 要素の CSS 表示サイズ（`getBoundingClientRect()`）に合わせる。

同期タイミング:
* `loadedmetadata` イベント後
* ウィンドウリサイズ時

### Acceptance Criteria

* 動画プレビューをクリックすると基準点が設定される
* 基準点マーカーが表示される
* 表示サイズが変わっても実動画座標に変換される

---

## 12.3 Draw Input Triangle Guide

### Requirement

ユーザーが指定した基準点、向き、長さ、フレーム数に応じて、動画上に三角形ガイドを表示する。

### Behavior

1. App calculates apex angle from frame count.
2. App calculates left and right points of triangle.
3. App draws triangle line on overlay canvas.
4. App draws sample point marker.

### Acceptance Criteria

* フレーム数を変えると三角形の頂点角度が変わる
* 向き角度を変えると三角形の方向が変わる
* 長さを変えると三角形のサイズが変わる

---

## 12.4 Extract Frames

### Requirement

指定秒から指定フレーム数分、動画フレームを取得できる。

### Behavior

For each frame index `i`:

```ts
const time = settings.startSecond + i * settings.frameInterval;
```

Then:

1. Seek video to `time`.
2. Wait for `seeked`.
3. Draw current video frame to temporary canvas.
4. Convert temporary canvas to `ImageBitmap`.
5. Store as `ExtractedFrame`.

### Acceptance Criteria

* `frameCount` と同じ数のフレームが取得される
* 各フレームに `index` と `time` が設定される
* 動画の長さを超える場合は処理せずエラーを表示する

---

## 12.5 Render Radial Image

### Requirement

抽出した各フレームを三角形スライスとして円形に配置する。

### Behavior

1. Output canvas size is set to `outputRadius * 2`.
2. Each frame is assigned one radial segment.
3. Segment angle is `360 / frameCount`.
4. Each segment is clipped as an isosceles triangle.
5. The corresponding frame image is drawn inside the clipped segment.

### Acceptance Criteria

* フレーム数と同数の三角形が描画される
* 各三角形が等角度で配置される
* 全体として円形、またはフレーム数角形の画像になる
* 生成結果が output canvas に表示される

---

## 12.6 Download PNG

### Requirement

生成した画像を PNG として保存できる。

### Behavior

1. User clicks Download PNG.
2. App calls `canvas.toBlob()`.
3. App creates object URL.
4. App triggers download using `<a download>`.

### Filename

```txt
radial-slice-{frameCount}-{timestamp}.png
```

### Acceptance Criteria

* PNG ファイルを保存できる
* ファイル名にフレーム数とタイムスタンプが含まれる

---

## 13. Geometry Specification

## 13.1 Angle conversion

```ts
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
```

---

## 13.2 Apex angle

```ts
function getApexAngleDeg(frameCount: number): number {
  return 360 / frameCount;
}
```

---

## 13.3 Input triangle calculation

Given:

* `samplePoint`
* `directionDeg`
* `sliceLength`
* `frameCount`

Calculate:

```ts
const apexAngleDeg = 360 / frameCount;
const leftAngle = directionDeg - apexAngleDeg / 2;
const rightAngle = directionDeg + apexAngleDeg / 2;

const triangle = {
  apex: samplePoint,
  left: {
    x: samplePoint.x + Math.cos(toRad(leftAngle)) * sliceLength,
    y: samplePoint.y + Math.sin(toRad(leftAngle)) * sliceLength,
  },
  right: {
    x: samplePoint.x + Math.cos(toRad(rightAngle)) * sliceLength,
    y: samplePoint.y + Math.sin(toRad(rightAngle)) * sliceLength,
  },
};
```

---

## 13.4 Output triangle calculation

Given:

* `outputRadius`
* `frameCount` (= `frames.length`)

Calculate:

```ts
const apexAngleRad = (Math.PI * 2) / frameCount;
const baseHalfWidth = Math.tan(apexAngleRad / 2) * outputRadius;
```

Output triangle in local coordinates:

```ts
const outputTriangle = {
  apex: { x: 0, y: 0 },
  left: { x: -baseHalfWidth, y: -outputRadius },
  right: { x: baseHalfWidth, y: -outputRadius },
};
```

---

## 14. Algorithms

## 14.1 Seek video

```ts
function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
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
```

---

## 14.2 Extract frames

```ts
async function extractFrames(
  video: HTMLVideoElement,
  settings: GenerateSettings
): Promise<ExtractedFrame[]> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const frames: ExtractedFrame[] = [];

  for (let i = 0; i < settings.frameCount; i++) {
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
```

---

## 14.3 Render radial image

```ts
function renderRadialImage(
  frames: ExtractedFrame[],
  samplePoint: Point,
  settings: GenerateSettings,
  outputCanvas: HTMLCanvasElement
): void {
  const frameCount = frames.length;
  const radius = settings.outputRadius;
  const size = radius * 2;
  const centerX = radius;
  const centerY = radius;

  const apexAngleRad = (Math.PI * 2) / frameCount;
  const baseHalfWidth = Math.tan(apexAngleRad / 2) * radius;

  outputCanvas.width = size;
  outputCanvas.height = size;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get output canvas context');
  }

  ctx.clearRect(0, 0, size, size);

  for (const frame of frames) {
    const rotation = frame.index * apexAngleRad;

    ctx.save();

    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-baseHalfWidth, -radius);
    ctx.lineTo(baseHalfWidth, -radius);
    ctx.closePath();
    ctx.clip();

    // Align input sample point to output center.
    // directionDeg correction is applied via rotate so that the input slice direction
    // points outward. drawImage dx/dy offsets the frame so samplePoint lands at origin.
    ctx.rotate(-toRad(settings.directionDeg) - Math.PI / 2);
    ctx.drawImage(frame.bitmap, -samplePoint.x, -samplePoint.y);

    ctx.restore();
  }
}
```

---

## 15. Validation

### 15.1 Video required

Condition:

```ts
state.videoFile === null
```

Message:

```txt
動画ファイルを選択してください。
```

---

### 15.2 Sample point required

Condition:

```ts
state.samplePoint === null
```

Message:

```txt
動画上で切り出し基準点を指定してください。
```

---

### 15.3 Frame count minimum

Condition:

```ts
settings.frameCount < 3
```

Message:

```txt
フレーム数は3以上にしてください。
```

---

### 15.4 Frame count recommended maximum

Condition:

```ts
settings.frameCount > 360
```

Message:

```txt
フレーム数は360以下を推奨します。
```

MVP では警告扱いにする（生成はブロックしない）。

---

### 15.5 Frame interval positive

Condition:

```ts
settings.frameInterval <= 0
```

Message:

```txt
フレーム間隔は0より大きくしてください。
```

---

### 15.6 Start second non-negative

Condition:

```ts
settings.startSecond < 0
```

Message:

```txt
開始秒は0以上にしてください。
```

---

### 15.7 Slice length positive

Condition:

```ts
settings.sliceLength <= 0
```

Message:

```txt
スライス長さは0より大きくしてください。
```

---

### 15.8 Frame range within video duration

Condition:

```ts
const lastFrameTime = settings.startSecond +
  (settings.frameCount - 1) * settings.frameInterval;

lastFrameTime > videoMeta.duration;
```

Message:

```txt
指定したフレーム範囲が動画の長さを超えています。
```

---

### 15.9 Output radius positive

Condition:

```ts
settings.outputRadius <= 0
```

Message:

```txt
出力半径は0より大きくしてください。
```

---

## 16. Error Handling

### 16.1 Video load error

Message:

```txt
動画を読み込めませんでした。別の形式の動画を試してください。
```

---

### 16.2 Frame extraction error

Message:

```txt
フレームの取得に失敗しました。
```

---

### 16.3 Render error

Message:

```txt
画像生成に失敗しました。フレーム数や出力サイズを小さくしてください。
```

---

### 16.4 Canvas context error

Message:

```txt
Canvas を初期化できませんでした。
```

---

## 17. Performance Requirements

### 17.1 MVP target

| Item                |                       Target |
| ------------------- | ---------------------------: |
| Video resolution    |      Up to 1080p recommended |
| Frame count         |         12 to 60 recommended |
| Output size         | 1024px to 2048px recommended |
| Processing location |                 Browser only |

---

### 17.2 Notes

MVP では同期的にメインスレッドで処理する。

処理が重くなる場合、将来的に以下を検討する。

* `Web Worker`
* `OffscreenCanvas`
* `WebCodecs`
* `ffmpeg.wasm`

---

## 18. Privacy and Security

### 18.1 Local-only processing

動画ファイルはブラウザ内でのみ処理する。

### 18.2 No upload

MVP では動画をサーバーへアップロードしない。

### 18.3 No persistence

MVP では動画ファイルや生成画像をブラウザストレージに保存しない。

---

## 19. Accessibility

MVP では最低限以下を対応する。

* 各 input に label を付与する
* ボタンに明確なテキストを設定する
* エラー文言をテキストで表示する（`role="alert"`）
* キーボードでフォーム操作可能にする

---

## 20. Implementation Phases

### Phase 1: Project setup

* Vite + TypeScript セットアップ
* `index.html` 作成
* `styles.css` 作成
* 基本レイアウト作成

Done when:

* `npm run dev` で画面が表示される

---

### Phase 2: Video loading

* 動画ファイル input 実装
* 動画 preview 実装
* metadata 取得
* `seekVideo` 実装（`video.ts`）

Done when:

* ローカル動画を選択して画面に表示できる

---

### Phase 3: Sample point and guide

* 動画上のクリック座標取得
* 実動画座標への変換
* 三角形ガイド描画
* `overlayCanvas` サイズ同期

Done when:

* クリックした場所に基準点が表示される
* 設定値に応じて三角形ガイドが変化する

---

### Phase 4: Frame extraction

* `extractFrames` 実装
* 指定フレーム数分の `ImageBitmap` 取得

Done when:

* 指定条件で複数フレームを取得できる

---

### Phase 5: Radial rendering

* `renderRadialImage` 実装
* 三角形 clip 実装
* 各フレームの円形配置実装

Done when:

* output canvas にラジアル画像が表示される

---

### Phase 6: Download

* `downloadCanvasAsPng` 実装
* PNG 保存ボタン実装

Done when:

* 生成画像を PNG として保存できる

---

## 21. Acceptance Criteria

### 21.1 Basic video handling

* 動画ファイルを選択できる
* 動画をプレビューできる
* 動画のメタデータを取得できる

### 21.2 Configuration

* 開始秒を指定できる
* フレーム数を指定できる
* フレーム間隔を指定できる
* 向き角度を指定できる
* スライス長さを指定できる
* 出力半径を指定できる

### 21.3 Input guide

* 動画上で基準点をクリック指定できる
* 基準点が表示される
* 三角形ガイドが表示される
* フレーム数に応じて頂点角度が変わる

### 21.4 Generation

* 指定数のフレームを取得できる
* 取得したフレームからラジアル画像を生成できる
* 各スライスの角度が `360 / frameCount` になる
* output canvas に生成結果が表示される

### 21.5 Download

* PNG として保存できる

### 21.6 Error handling

* 動画未選択時にエラー表示される
* 基準点未指定時にエラー表示される
* フレーム範囲が動画を超える場合にエラー表示される
* Canvas 初期化失敗時にエラー表示される

---

## 22. Design Decisions

以下は検討済みで決定済みの設計事項。

### 22.1 Sample point meaning

サンプル点を **三角形の頂点（apex）** として扱う。

---

### 22.2 Output triangle direction

出力側の三角形は **中心から外側へ伸びる**。

---

### 22.3 Background

出力画像の背景は **透明**（`ctx.clearRect` のみで初期化）。

---

### 22.4 Frame interval input style

`frameInterval` を **秒** で直接指定する。

デフォルト値は `1 / 30`（約 30fps 相当）。

---

## 23. Future Enhancements

### 23.1 Editing

* ドラッグで向きを指定
* スライダーでリアルタイム調整
* ガイドの直接操作
* ズーム表示
* フレームごとの微調整

### 23.2 Export

* SVG 書き出し
* PDF 書き出し
* 高解像度 PNG 書き出し
* 連番 PNG 書き出し
* GIF 書き出し

### 23.3 Video processing

* WebCodecs 対応
* ffmpeg.wasm 対応
* Web Worker 対応
* OffscreenCanvas 対応

### 23.4 Presets

* 12 frames
* 16 frames
* 24 frames
* 36 frames
* 48 frames
* 60 frames

---

## 24. Naming Candidates

内部名候補:

* Video Radial Slice Generator
* Radial Frame Composer
* Zoetrope Slice Maker
* Frame Wheel Generator
* Motion Wheel Maker
