# cloud/index.html 設計まとめ

## 1. 目的
このページは WebGPU を使って、点対称の「墨雲」パターンをリアルタイム生成する単一ページアプリです。
UI でパラメータを調整し、回転や再シード、1:1 切り抜き PNG 保存まで行えます。

## 2. 構成
cloud フォルダ内は現在 1 ファイルのみです。

- `index.html`

`index.html` は以下を 1 ファイルで持っています。

- HTML: 操作パネル + キャンバス + エラー表示
- CSS: 全画面レイアウトと配色
- JavaScript: UI 制御、WebGPU 初期化、WGSL シェーダ、アニメーション、PNG 書き出し

## 3. UI と操作項目
左側 `aside` に操作パネル、右側 `main` に描画キャンバスを配置しています。

主な入力:

- 対称数 (`symmetry`)
- 雲の濃さ (`cloud`)
- 雲の渦 (`swirl`)
- 余白 (`paper`)
- 中心Y位置 (`centerY`)
- 位相ずれ (`stagger`)
- 初期回転 (`rotation`)
- 自動回転 (`autoRotate`)
- 回転スピード (`rotationSpeed`)
- リフレッシュレート (`refreshRate`)

主なボタン:

- 模様を再生成 (`reroll`): 乱数シード更新
- 回転をリセット (`resetSpin`): 回転オフセットを 0 に戻す
- 中心位置を1:1でPNG保存 (`savePng`): 現在表示を正方形で切り抜いて保存

## 4. レンダリングアーキテクチャ
初期化は `main()` で実行されます。

1. `navigator.gpu` と Adapter/Device を取得
2. `canvas.getContext('webgpu')` を設定
3. Uniform バッファ作成 (`GPUBufferUsage.UNIFORM | COPY_DST`)
4. WGSL シェーダを `createShaderModule` で登録
5. `BindGroupLayout` / `BindGroup` / `PipelineLayout` 作成
6. `RenderPipeline` 作成（フルスクリーントライアングル）

描画は `render()` で行います。

- `resize()` で DPR を考慮し `canvas.width/height` を同期
- `updateUniforms()` で UI 値を GPU に送信
- RenderPass を `clearValue` 黒で開始
- 三角形 1 枚 (`draw(3)`) で画面全体をフラグメントシェーダで塗る

## 5. シェーダ設計（WGSL）
### 5.1 Uniforms
`Uniforms` は以下を持ちます。

- `resolution`
- `symmetry`, `cloud`, `swirl`, `paper`
- `centerY`, `stagger`, `rotation`
- `seed`

### 5.2 ノイズ生成
関数 `hash` / `noise` / `fbm` で 2D ノイズを合成し、墨の濃淡とゆらぎを作ります。

### 5.3 点対称ロジック
- `rawAngle` と `sectorAngle` からセクター番号を計算
- `mirroredIndex = min(sectorIndex, symmetry - sectorIndex)` で鏡映インデックス化
- セクターごとに `phase = mirroredIndex * stagger` を与えて位相差を表現

### 5.4 中心固定回転
- 画面基準の中心を `center = vec2f(0.0, u.centerY)` で定義
- `localUv = uv - center` を回転して、中心が流れない回転を実現

### 5.5 最終色
現在は白模様ではなく「黒背景 + 白模様」構成です。

- `paperColor = vec3f(0.0, 0.0, 0.0)`（背景）
- `inkColor = vec3f(1.0, 1.0, 1.0)`（模様）
- `mix(paperColor, inkColor, mixAmount)` で合成

## 6. アニメーション制御
`requestAnimationFrame` で `animationLoop()` を回します。

- 毎フレーム `deltaMs` を計算
- `autoRotate` 有効時に `spinOffsetDeg += rotationSpeed * dt`
- `refreshRate` に合わせて間引き描画

これにより、内部ループは高速でも実描画頻度をユーザー指定 FPS に制限できます。

## 7. PNG 書き出し仕様
`saveSquarePng()` が保存を担当します。

1. `render()` 実行後、`device.queue.onSubmittedWorkDone()` で GPU 完了待ち
2. `getSquareCropRect(width, height, centerY)` で切り抜き矩形を計算
3. 一時 2D canvas に `drawImage` で正方形転送
4. `toBlob('image/png')` で PNG 化
5. `a` 要素のダウンロードで保存

切り抜きルール:

- サイズは `min(width, height)`
- 中心 X は常に画面中央
- 中心 Y は `centerY` 値をピクセル変換して追従
- 画面外に出ないようにクランプ

## 8. 例外処理と表示
- WebGPU 未対応時は中央エラーメッセージを表示
- 初期化例外や PNG 保存例外は `error` 要素にメッセージ表示

## 9. 簡易セルフテスト
`runSelfTests()` で `console.assert` による軽量チェックを起動時に実行します。

- スライダー存在
- 値の型
- `rotationSpeed` 範囲
- 1:1 切り抜き計算の基本チェック

## 11. 今後の拡張案
- `centerX` も UI 化して切り抜き中心を 2 軸制御
- PNG 解像度倍率指定（2x, 4x 書き出し）
- プリセット保存/読込
- シェーダパラメータのランダム探索モード

## 12. 関連ドキュメント
- Shader と雲の動きの詳解: `shader-motion-guide.md`
