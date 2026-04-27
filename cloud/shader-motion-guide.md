# Shader と雲の動きの詳解

## 1. このドキュメントの狙い
この文書は cloud/index.html の中でも、次の 2 点を重点的に解説します。

- Shader がどのように雲模様を生成しているか
- 雲の動きがどのレイヤーで実現されているか

ここでの「動き」は、模様の時系列変形ではなく、主に画面全体の回転として実装されています。

## 2. 描画パイプラインの全体像
この実装はフルスクリーントライアングル方式です。

1. 頂点シェーダで画面全体を覆う三角形 1 枚を出力
2. フラグメントシェーダで各ピクセルの色を計算
3. JavaScript 側が毎フレーム Uniform を更新

重要な点として、頂点シェーダはほぼ固定で、見た目の複雑さはフラグメントシェーダ側に集中しています。

## 3. Uniform とパラメータの意味
フラグメントシェーダの入力 Uniform は以下です。

- resolution: キャンバスのピクセル解像度
- symmetry: 対称分割数
- cloud: 雲濃度ゲイン
- swirl: 渦の強さ
- paper: 墨の出現しやすさを調整する閾値側パラメータ
- centerY: 模様中心の Y オフセット
- stagger: セクターごとの位相ずれ
- rotation: 表示全体の回転角
- seed: 乱数空間オフセット

JavaScript 側の readParams と updateUniforms で UI 値が毎フレーム GPU に送られます。

## 4. 座標正規化と中心固定回転
### 4.1 画面座標を正規化する理由
フラグメントシェーダの最初で次の変換を行い、座標系を正規化します。

- 画面中心を原点にする
- 短辺基準でスケールする
- Y 軸の向きを直感的に扱うため符号を反転する

この短辺基準により、縦長・横長でも模様のスケールが破綻しにくくなります。

### 4.2 centerY が効く仕組み
中心は center = (0, centerY) として定義されています。

その後、localUv = uv - center を回転します。ここが重要です。

- 先に中心差分を取る
- 差分ベクトルだけを回転する

この順番で実装すると、回転時に中心位置が流れず、指定した centerY に模様中心が留まります。

## 5. 点対称を作る角度処理
### 5.1 基本角度
各ピクセルに対して次を求めます。

- radius = 距離
- rawAngle = 角度

### 5.2 セクター分割
対称数 symmetry から 1 セクター角を作ります。

sectorAngle = 2π / symmetry

rawAngle を 0 から 2π にラップしてセクター番号を得ます。

### 5.3 鏡映インデックス
鏡映は以下の考え方で実現します。

mirroredIndex = min(sectorIndex, symmetry - sectorIndex)

これでインデックス列が往復形になり、左右反転した対称性が得られます。

### 5.4 セクターごとの位相差
位相は phase = mirroredIndex × stagger。

さらに phaseVec = (cos(phase), sin(phase)) を使い、ノイズ入力座標を少しずつずらして、同じ対称性を維持しつつセクターごとの個性を出しています。

## 6. ノイズから雲模様を作る手順
### 6.1 hash と noise
hash は格子点ごとの疑似乱数を作ります。
noise は格子 4 点の乱数を補間して連続ノイズを返します。

### 6.2 fbm
fbm は複数オクターブの noise を加算する関数です。

- 振幅を段階的に減衰
- 座標を回転拡大しながら再サンプリング

これで単純ノイズより自然な雲状パターンになります。

### 6.3 雲座標の構築
basePoint を作った後、以下を足して cloudPoint を作ります。

- swirl × warp: 乱流的な曲げ
- 半径依存の縦方向変位
- phaseOffset2: セクター差分

この cloudPoint を複数スケールで fbm サンプリングし、ink 値を合成しています。

## 7. 墨として見える形への成形
ink はそのままだと全面に広がるため、いくつかのマスクで形を整えます。

1. radialRays: 角度と半径の関数で筋状成分を追加
2. radialMask: 外周で減衰
3. inkMask: smoothstep で濃淡をマスク化
4. edgeFade: 外縁フェード
5. mixAmount: 0 から 0.95 にクランプ

最終的に color = mix(paperColor, inkColor, mixAmount) で背景色と模様色を合成します。

現設定では次の配色です。

- paperColor = 黒
- inkColor = 白

## 8. 雲の動きはどこで発生するか
この実装での動きは JavaScript の animationLoop が担当します。

毎フレーム:

- deltaMs を計算
- autoRotate が有効なら spinOffsetDeg を更新
- rotation + spinOffsetDeg を Uniform の rotation に反映

重要な点として、シェーダ内部に time を直接入れていないため、雲パターン自体は時間変形しません。動くのは画面全体の回転です。

## 9. なぜ模様が安定して見えるか
模様がフレームごとに崩れない理由は 2 つです。

1. seed が固定される限りノイズ空間が固定
2. シェーダ側で時間パラメータを使わない

そのため、回転停止時には完全に静止画像として扱えます。

## 10. refreshRate の意味
requestAnimationFrame は通常高頻度ですが、実際の描画は refreshRate で間引いています。

- frameIntervalMs = 1000 / refreshRate
- 経過時間が閾値以上のときだけ render

これにより、GPU 負荷と見た目更新頻度を分離して制御できます。

## 11. 1:1 PNG 保存と centerY の整合
保存時は次の流れです。

1. 最新状態を render
2. GPU 完了待ち
3. getSquareCropRect で正方形切り抜き
4. 2D canvas 経由で PNG 化

getSquareCropRect では centerY をピクセル位置へ変換し、保存画像の中心が表示中心と一致するようにしています。

## 12. 調整の勘所
見た目を調整するときは、次の優先順が実用的です。

1. symmetry で構図の幾何学を決める
2. stagger でセクター差の強さを決める
3. swirl で流れ方向のうねりを作る
4. cloud と paper で白領域の占有率を整える
5. centerY と rotation 系で最終レイアウトを追い込む

## 13. 実装上の注意
自己テストの対称数上限チェックに不一致があります。

- HTML の symmetry max は 40
- 自己テストも max 40 を期待

表示そのものには直ちに致命ではありませんが、開発時の console.assert が失敗する要因になります。
