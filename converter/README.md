# Polar Image Converter

Centered polar images can be converted into a mirrored full-sphere equirectangular image with this CLI.

## Install

```bash
cd converter
npm install
```

## Usage

```bash
node index.js --input-dir ./input --output-dir ./output --width 2048 --height 1024
```

引数を省略すると `converter/input` 内の対応画像をすべて読み込み、`converter/output` に `<元ファイル名>_fullsphere_mirror.png` として出力します。

対応拡張子は `.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff` です。

The input is expected to be a centered 1:1 polar image. If it is not perfectly square, the script uses the largest centered circle that fits inside the source image.