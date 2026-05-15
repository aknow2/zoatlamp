# Polar Image Converter

Centered polar images can be converted into a mirrored full-sphere equirectangular image with this CLI.

## Install

```bash
cd converter
npm install
```

## Usage

```bash
node index.js --input-dir ./input --output-dir ./output --width 2048 --height 1024 --trim-all 24
```

引数を省略すると `converter/input` 内の対応画像をすべて読み込み、`converter/output` に `<元ファイル名>_fullsphere_mirror.png` として出力します。

対応拡張子は `.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff` です。

`--trim-all` で入力画像の上下左右を同じピクセル数だけ一括で切り取れます。

`--trim-top`, `--trim-right`, `--trim-bottom`, `--trim-left` で入力画像の各辺を個別に切り取れます。`--trim-all` と併用した場合は、個別指定した辺が優先されます。trim は `0` 以上の整数です。

The input is expected to be a centered 1:1 polar image. If it is not perfectly square, the script uses the largest centered circle that fits inside the source image.