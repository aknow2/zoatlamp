# Polar Image Converter

Centered polar images can be converted into a mirrored full-sphere equirectangular image, or a non-mirrored unwrapped image, with optional black vertical padding.

## Install

```bash
cd converter
npm install
```

## Usage

```bash
node index.js --input-dir ./input --output-dir ./output --width 2048 --height 1024 --trim-all 24

node index.js ./input/ink5.png --width 2048 --height 1024 --trim-all 24
```

引数を省略すると `converter/input` 内の対応画像をすべて読み込み、`converter/output` に `<元ファイル名>_fullsphere_mirror.png` として出力します。

単発変換では画像を1枚または2枚指定できます。

```bash
node index.js ./top.png --output ./output/one-image.png
node index.js ./top.png --output ./output/shifted-left.png --shift-x -10
node index.js ./top.png --output ./output/bottom-shifted-left.png --shift-bottom-x -10
node index.js ./top.png --output ./output/padded-mirror.png --padding-top 64 --padding-bottom 64
node index.js ./top.png --output ./output/no-mirror.png --no-mirror --padding-top 64 --padding-bottom 64
node index.js ./top.png ./bottom.png --output ./output/two-images.png
node index.js ./top.png ./bottom.png --output ./output/two-images-flipped.png --flip-bottom-horizontal
node index.js ./top.png ./bottom.png --output ./output/two-images-vertical-flip.png --flip-mirror-vertical
node index.js ./top.png ./bottom.png --output ./output/two-images-trimmed.png --trim-all-top 16 --trim-all-bottom 32
```

またはオプション名で指定できます。

```bash
node index.js --input ./top.png --bottom-input ./bottom.png --output ./output/two-images.png
```

2枚指定した場合、1枚目を出力の上半分に使い、2枚目は上下反転した状態で下半分を埋めます。1枚だけ指定した場合は従来通り、同じ画像で上下をミラーします。

`--flip-bottom-horizontal` を指定すると、下半分に入る画像だけ左右反転します。2枚指定時は2枚目だけ、1枚指定やディレクトリ変換時は下側にミラーされる半分だけが対象です。

`--flip-mirror-vertical` を指定すると、極座標から展開するときの半径方向を上下逆にします。通常は入力円の中心側が出力の上端/下端、外周側が中央に来ますが、このオプションでは外周側から描き始め、中心側が中央に来ます。2枚指定時も1枚目は上半分、2枚目は下半分のままです。

`--shift-x <px>` を指定すると、出力画像の上下両方を左右方向に循環移動できます。正の値は右、負の値は左に移動します。例えば `--shift-x -10` は左に 10px 移動し、左端からはみ出た 10px が右端に回り込みます。`--shift-left 10` と `--shift-right 10` も同じ用途で使えます。

上半分だけ、または下半分だけを動かしたい場合は `--shift-top-x <px>` / `--shift-bottom-x <px>` を使います。例えば `--shift-bottom-x -10` は下半分だけを左へ 10px 循環移動します。`--shift-x` と併用した場合、個別指定した側は `--shift-top-x` / `--shift-bottom-x` の値が優先されます。

`--padding-top <px>` / `--padding-bottom <px>` を指定すると、上下に黒い余白を追加し、残りの高さに変換結果を描画します。ミラーあり・`--no-mirror` のどちらでも使えます。例えば `--padding-top 64 --padding-bottom 64` は上下 64px を黒で埋めます。ミラーありの場合は、`height - paddingTop - paddingBottom` が偶数になる必要があります。

`--no-mirror` を指定すると、上下ミラーせずに入力画像を1回だけ縦方向へ展開します。`--no-mirror` は1枚入力用です。2枚入力、`--bottom-input`、`--flip-bottom-horizontal`、`--flip-mirror-vertical`、`--shift-top-x`、`--shift-bottom-x` とは併用できません。左右に動かしたい場合は `--shift-x` を使います。

対応拡張子は `.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff` です。

`--trim-all` で入力画像の上下左右を同じピクセル数だけ一括で切り取れます。

`--trim-top`, `--trim-right`, `--trim-bottom`, `--trim-left` で入力画像の各辺を個別に切り取れます。`--trim-all` と併用した場合は、個別指定した辺が優先されます。trim は `0` 以上の整数です。

`--trim-all-top <px>` / `--trim-all-bottom <px>` を指定すると、ミラーあり変換で上半分用・下半分用の入力画像を別々に一括 trim できます。指定しない側は `--trim-all` や `--trim-top` などの共通 trim を使います。1枚入力やディレクトリ変換でも、`--trim-all-bottom` を指定すると下側にミラーされる半分だけ別 trim で読み直します。`--no-mirror` では `--trim-all-bottom` は使えません。

The input is expected to be a centered 1:1 polar image. If it is not perfectly square, the script uses the largest centered circle that fits inside the source image.
