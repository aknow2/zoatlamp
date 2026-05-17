# task.md

# Video Radial Slice Generator — 実装タスク一覧

spec.md に基づく MVP 実装タスク。
フェーズ順に進める。各フェーズ内のタスクは依存関係がなければ並行実施可能。

テスト戦略は `test-strategy.md` を参照。

---

## Phase 1: プロジェクトセットアップ ✅

### T01 `p1-setup` — Vite + TypeScript 初期化 ✅

### T02 `p1-html` — `index.html` の作成 ✅

### T03 `p1-css` — `styles.css` の作成 ✅

---

## Phase 1 テスト

### T17 `p1-test` — Vitest セットアップ + AC1001 作成 + Chrome devtools MCP テスト ✅

- vitest + jsdom インストール
- `vite.config.ts` に test 設定追加
- `package.json` に `test` スクリプト追加
- `tests/AC1001.md` を作成してから Chrome devtools MCP でテスト実行

Depends on: T01, T02, T03

---

## Phase 2: 型定義・状態・動画

### T04 `p2-types` — `src/types.ts`: 共通型定義

spec.md Section 8 の全型を定義してエクスポートする。

```ts
Point / Triangle / VideoMeta / GenerateSettings / ExtractedFrame / AppState
```

Depends on: T01

---

### T05 `p2-state` — `src/state.ts`: アプリ状態

spec.md Section 11.3 の `state` オブジェクトと `defaultSettings` を実装する。

Depends on: T04

---

### T06 `p2-video` — `src/video.ts`: 動画読み込み・シーク

spec.md Section 11.4 の `loadVideoFile` と `seekVideo` を実装する。

Depends on: T04

---

### T07 `p2-ui-basic` — `src/ui.ts`: 基本 UI ユーティリティ

spec.md Section 11.8 の `readSettingsFromUI` / `updateUI` / `showError` / `clearError` を実装する。

エラー状態同期規約: `updateUI` が `state.errorMessage` を見て `showError`/`clearError` を呼ぶ。

Depends on: T04

---

### T08 `p2-main-video` — `main.ts`: 動画読み込みイベント

`#videoFileInput` の change イベントで `loadVideoFile` を呼び、動画プレビューを表示する。

Depends on: T05, T06, T07

---

## Phase 2 テスト

### T18 `p2-test` — `tests/AC1002.md` 作成 + Chrome devtools MCP テスト

`tests/AC1002.md` を作成してから Chrome devtools MCP で動画読み込みをテストする。

Depends on: T08

---

## Phase 3: 基準点とガイド描画

### T09 `p3-click` — `main.ts`: クリックで基準点設定

`#overlayCanvas` の `pointerdown` イベントで基準点を設定する。

1. `getVideoPointFromPointerEvent` で実動画座標に変換
2. `state.samplePoint` を更新
3. `drawInputGuide` を再描画

また、設定 input が変化したときも `drawInputGuide` を再描画する。

**overlayCanvas サイズ同期**: `loadedmetadata` イベント後およびウィンドウリサイズ時に `overlayCanvas.width`/`height` を video 要素の CSS 表示サイズ（`getBoundingClientRect()`）に合わせる処理もここで実装する（spec.md Section 12.2 参照）。

Depends on: T08

---

### T10 `p3-geometry` — `src/geometry.ts`: ジオメトリ計算

spec.md Section 11.6、13 の全関数を実装する。

- `toRad` / `toDeg`
- `getApexAngleDeg`
- `getInputTriangle`
- `getVideoPointFromPointerEvent`

Depends on: T04

---

### T11 `p3-renderer-guide` — `src/renderer.ts`: ガイド描画

spec.md Section 11.7 の `drawInputGuide` を実装する。

Depends on: T10

---

## Phase 3 テスト

### T19 `p3-test` — ユニットテスト (geometry) + `tests/AC1003.md` 作成 + Chrome devtools MCP テスト

- `src/tests/geometry.test.ts` を作成し `npm test` で通す
- `tests/AC1003.md` を作成してから Chrome devtools MCP で基準点・ガイドをテストする

Depends on: T09, T11

---

## Phase 4: フレーム抽出

### T12 `p4-extractor` — `src/frameExtractor.ts`: フレーム抽出

spec.md Section 14.2 の `extractFrames` を実装する。
`seekVideo` は `video.ts` からインポートして使う。

Depends on: T06, T04

---

### T13 `p4-validate` — バリデーション実装

spec.md Section 15 の全バリデーション条件を実装する。
`main.ts` の生成ボタンクリック前に検証を実行する。

Depends on: T07, T05

---

### T14 `p4-main-extract` — `main.ts`: 生成ボタンイベント

`#generateButton` クリックでバリデーション → `extractFrames` 呼び出しを繋ぐ。

Depends on: T12, T13

---

## Phase 4 テスト

### T20 `p4-test` — ユニットテスト (validate) + `tests/AC1004.md` 作成 + Chrome devtools MCP テスト

- `src/tests/validate.test.ts` を作成し `npm test` で通す
- `tests/AC1004.md` を作成してから Chrome devtools MCP でフレーム抽出をテストする

Depends on: T14

---

## Phase 5: ラジアル画像生成

### T15 `p5-renderer` — `src/renderer.ts`: ラジアル画像生成

spec.md Section 14.3 の `renderRadialImage` を実装する。

Depends on: T10, T12

---

### T16 `p5-main-render` — `main.ts`: フレーム抽出後にレンダリング

`extractFrames` 完了後に `renderRadialImage` を呼び、`#outputCanvas` に描画する。

Depends on: T14, T15

---

## Phase 5 テスト

### T21 `p5-test` — `tests/AC1005.md` 作成 + Chrome devtools MCP テスト

`tests/AC1005.md` を作成してから Chrome devtools MCP でラジアル画像生成をテストする。

Depends on: T16

---

## Phase 6: ダウンロード

### T22-impl `p6-download` — `src/download.ts` + `main.ts`: PNG 保存

spec.md Section 11.9、12.6 の `downloadCanvasAsPng` を実装し、`#downloadButton` に接続する。

ファイル名形式: `radial-slice-{frameCount}-{timestamp}.png`

Depends on: T11 (ワークフロー依存。download.ts 自体は汎用ユーティリティだが、出力 canvas と合わせて動作確認するため)

---

## Phase 6 テスト

### T22 `p6-test` — ユニットテスト (download) + `tests/AC1006.md` 作成 + Chrome devtools MCP テスト

- `src/tests/download.test.ts` を作成し `npm test` で通す
- `tests/AC1006.md` を作成してから Chrome devtools MCP でダウンロード + エラー表示をテストする

Depends on: T22-impl

---

## 依存関係ツリー

```txt
T01
├── T02 → T01
├── T03 → T01
├── T04 → T01
│   ├── T05 → T04
│   │   ├── T07 → T04
│   │   │   └── T08 → T05, T06, T07
│   │   │       ├── T09 → T08
│   │   │       └── T18 (test) → T08
│   │   └── T13 → T07, T05
│   ├── T06 → T04
│   │   └── T12 → T06, T04
│   └── T10 → T04
│       ├── T11 → T10
│       └── T15 → T10, T12
└── T17 (test) → T01, T02, T03

T09 → T11 → T19 (test)
T14 → T12, T13 → T20 (test)
T16 → T14, T15 → T21 (test)
T22-impl → T16 → T22 (test)
```
