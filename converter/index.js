#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const TWO_PI = Math.PI * 2;
const DEFAULT_INPUT_DIR = path.resolve(__dirname, "input");
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, "output");
const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node index.js [--input-dir ./input] [--output-dir ./output] [--width 2048] [--height 1024] [--no-mirror] [--padding-top 0] [--padding-bottom 0] [--shift-x 0] [--shift-top-x 0] [--shift-bottom-x 0] [--flip-bottom-horizontal] [trim options]",
      "  node index.js <top-image> [bottom-image] [--output ./output.png] [--width 2048] [--height 1024] [--no-mirror] [--padding-top 0] [--padding-bottom 0] [--shift-x 0] [--shift-top-x 0] [--shift-bottom-x 0] [--flip-bottom-horizontal] [trim options]",
      "  node index.js --input ./top.png [--bottom-input ./bottom.png] [--output ./output.png] [width/height/trim/shift/padding/flip options]",
      "",
      "Examples:",
      "  node index.js",
      "  node index.js ./top.png --output ./output/shifted-left.png --shift-x -10",
      "  node index.js ./top.png --output ./output/bottom-shifted-left.png --shift-bottom-x -10",
      "  node index.js ./top.png --output ./output/no-mirror.png --no-mirror --padding-top 64 --padding-bottom 64",
      "  node index.js ./top.png ./bottom.png --output ./output/two-images.png --flip-bottom-horizontal",
      "  npm run convert -- --input-dir ./input --output-dir ./output --width 2048 --height 1024 --trim-all 24",
      "  npm run convert -- --input-dir ./input --output-dir ./output --width 2048 --height 1024 --trim-all 24 --trim-top 32",
      "  npm run convert -- --input ./top.png --bottom-input ./bottom.png --output ./output/two-images.png --flip-bottom-horizontal"
    ].join("\n")
  );
}

function readNumberOption(arg, nextValue, { allowZero = false } = {}) {
  const numericValue = Number.parseInt(nextValue, 10);
  const isValid = allowZero
    ? Number.isInteger(numericValue) && numericValue >= 0
    : Number.isInteger(numericValue) && numericValue > 0;

  if (!isValid) {
    throw new Error(`Invalid value for ${arg}: ${nextValue}`);
  }

  return numericValue;
}

function readIntegerOption(arg, nextValue) {
  const numericValue = Number.parseInt(nextValue, 10);

  if (!Number.isInteger(numericValue)) {
    throw new Error(`Invalid value for ${arg}: ${nextValue}`);
  }

  return numericValue;
}

function parseArgs(argv) {
  const options = {
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    width: 2048,
    height: 1024,
    trimTop: 0,
    trimRight: 0,
    trimBottom: 0,
    trimLeft: 0,
    inputPath: null,
    bottomInputPath: null,
    outputPath: null,
    shiftX: 0,
    shiftTopX: null,
    shiftBottomX: null,
    noMirror: false,
    paddingTop: 0,
    paddingBottom: 0,
    flipBottomHorizontal: false,
    positionalInputs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--flip-bottom-horizontal") {
      options.flipBottomHorizontal = true;
      continue;
    }

    if (arg === "--no-mirror") {
      options.noMirror = true;
      continue;
    }

    if (arg === "--shift-x" || arg === "--shift-top-x" || arg === "--shift-bottom-x") {
      const nextValue = argv[index + 1];

      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }

      const shiftValue = readIntegerOption(arg, nextValue);

      if (arg === "--shift-x") {
        options.shiftX = shiftValue;
      } else if (arg === "--shift-top-x") {
        options.shiftTopX = shiftValue;
      } else {
        options.shiftBottomX = shiftValue;
      }

      index += 1;
      continue;
    }

    if (arg === "--shift-left" || arg === "--shift-right") {
      const nextValue = argv[index + 1];

      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }

      const numericValue = readNumberOption(arg, nextValue, { allowZero: true });
      options.shiftX = arg === "--shift-left" ? -numericValue : numericValue;
      index += 1;
      continue;
    }

    if (
      arg === "--width" ||
      arg === "--height" ||
      arg === "--input-dir" ||
      arg === "--output-dir" ||
      arg === "--input" ||
      arg === "--bottom-input" ||
      arg === "--output" ||
      arg === "--trim-all" ||
      arg === "--trim-top" ||
      arg === "--trim-right" ||
      arg === "--trim-bottom" ||
      arg === "--trim-left" ||
      arg === "--padding-top" ||
      arg === "--padding-bottom"
    ) {
      const key = arg.slice(2);
      const nextValue = argv[index + 1];

      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }

      if (
        arg === "--input-dir" ||
        arg === "--output-dir" ||
        arg === "--input" ||
        arg === "--bottom-input" ||
        arg === "--output"
      ) {
        const optionName = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        const targetName =
          optionName === "input"
            ? "inputPath"
            : optionName === "bottomInput"
              ? "bottomInputPath"
              : optionName === "output"
                ? "outputPath"
                : optionName;
        options[targetName] = path.resolve(nextValue);
        index += 1;
        continue;
      }

      const optionName = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const numericValue = readNumberOption(arg, nextValue, {
        allowZero: optionName.startsWith("trim") || optionName.startsWith("padding")
      });

      if (optionName === "trimAll") {
        options.trimTop = numericValue;
        options.trimRight = numericValue;
        options.trimBottom = numericValue;
        options.trimLeft = numericValue;
        index += 1;
        continue;
      }

      options[optionName] = numericValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.positionalInputs.push(path.resolve(arg));
  }

  if (options.positionalInputs.length > 2) {
    throw new Error("Specify at most two input images.");
  }

  if (options.noMirror && options.positionalInputs.length > 1) {
    throw new Error("--no-mirror does not take a value. Use --padding-top <px> and --padding-bottom <px> for black vertical padding.");
  }

  if ((options.inputPath || options.bottomInputPath) && options.positionalInputs.length > 0) {
    throw new Error("Use either --input/--bottom-input or positional image paths, not both.");
  }

  if (options.positionalInputs.length > 0) {
    options.inputPath = options.positionalInputs[0];
    options.bottomInputPath = options.positionalInputs[1] ?? null;
  }

  if (options.bottomInputPath && !options.inputPath) {
    throw new Error("--bottom-input requires --input or a positional top image.");
  }

  if (options.outputPath && !options.inputPath) {
    throw new Error("--output is only available for single-image conversion. Use --output-dir for directory conversion.");
  }

  return options;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapPixelX(value, width) {
  return ((value % width) + width) % width;
}

function defaultOutputPath(inputPath, { noMirror = false } = {}) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}_${noMirror ? "unwrapped" : "fullsphere_mirror"}.png`);
}

function defaultTwoImageOutputPath(topInputPath, bottomInputPath) {
  const top = path.parse(topInputPath);
  const bottom = path.parse(bottomInputPath);
  return path.join(top.dir, `${top.name}_${bottom.name}_fullsphere.png`);
}

function defaultBatchOutputPath(inputPath, outputDir, { noMirror = false } = {}) {
  const parsed = path.parse(inputPath);
  return path.join(outputDir, `${parsed.name}_${noMirror ? "unwrapped" : "fullsphere_mirror"}.png`);
}

function isSupportedImageFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function getInputImagePaths(inputDir) {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`);
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const imagePaths = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(inputDir, entry.name))
    .filter(isSupportedImageFile)
    .sort((left, right) => left.localeCompare(right));

  if (imagePaths.length === 0) {
    throw new Error(`No supported image files were found in: ${inputDir}`);
  }

  return imagePaths;
}

function copyPixel(source, sourceWidth, sx, sy, target, targetWidth, tx, ty, channels) {
  const sourceOffset = (sy * sourceWidth + sx) * channels;
  const targetOffset = (ty * targetWidth + tx) * channels;
  source.copy(target, targetOffset, sourceOffset, sourceOffset + channels);
}

function createBlackOutput(width, height, channels) {
  const output = Buffer.alloc(width * height * channels);

  if (channels >= 4) {
    for (let index = 3; index < output.length; index += channels) {
      output[index] = 255;
    }
  }

  return output;
}

async function loadPolarSource({
  inputPath,
  trimTop,
  trimRight,
  trimBottom,
  trimLeft
}) {
  if (!inputPath) {
    throw new Error("An input image path is required.");
  }

  const resolvedInput = path.resolve(inputPath);

  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Input image does not exist: ${resolvedInput}`);
  }

  const inputMetadata = await sharp(resolvedInput).metadata();
  const croppedWidth = inputMetadata.width - trimLeft - trimRight;
  const croppedHeight = inputMetadata.height - trimTop - trimBottom;

  if (croppedWidth <= 0 || croppedHeight <= 0) {
    throw new Error(
      `Trim removes the entire image: ${resolvedInput} (${inputMetadata.width}x${inputMetadata.height})`
    );
  }

  let sourcePipeline = sharp(resolvedInput).ensureAlpha();

  if (trimTop > 0 || trimRight > 0 || trimBottom > 0 || trimLeft > 0) {
    sourcePipeline = sourcePipeline.extract({
      left: trimLeft,
      top: trimTop,
      width: croppedWidth,
      height: croppedHeight
    });
  }

  const { data: source, info } = await sourcePipeline.raw().toBuffer({ resolveWithObject: true });

  return {
    input: resolvedInput,
    source,
    sourceWidth: info.width,
    sourceHeight: info.height,
    channels: info.channels
  };
}

function copyPolarHemisphere({
  sourceImage,
  output,
  width,
  height,
  targetHalf,
  flipHorizontal = false,
  shiftX = 0
}) {
  const { source, sourceWidth, sourceHeight, channels } = sourceImage;
  const centerX = sourceWidth / 2;
  const centerY = sourceHeight / 2;
  const maxRadius = Math.min(centerX, centerY);
  const hemisphereHeight = height / 2;

  for (let y = 0; y < hemisphereHeight; y += 1) {
    const radialProgress = hemisphereHeight === 1 ? 0 : y / (hemisphereHeight - 1);
    const radius = radialProgress * maxRadius;

    for (let x = 0; x < width; x += 1) {
      const angularProgress = width === 1 ? 0 : x / (width - 1);
      const theta = angularProgress * TWO_PI;
      const sampleX = clamp(Math.round(centerX + radius * Math.cos(theta)), 0, sourceWidth - 1);
      const sampleY = clamp(Math.round(centerY + radius * Math.sin(theta)), 0, sourceHeight - 1);
      const targetX = wrapPixelX((flipHorizontal ? width - 1 - x : x) + shiftX, width);
      const targetY = targetHalf === "top" ? y : height - 1 - y;

      copyPixel(source, sourceWidth, sampleX, sampleY, output, width, targetX, targetY, channels);
    }
  }
}

function copyPolarBand({
  sourceImage,
  output,
  width,
  targetWidth,
  targetTop,
  targetHeight,
  shiftX = 0
}) {
  const { source, sourceWidth, sourceHeight, channels } = sourceImage;
  const centerX = sourceWidth / 2;
  const centerY = sourceHeight / 2;
  const maxRadius = Math.min(centerX, centerY);

  for (let y = 0; y < targetHeight; y += 1) {
    const radialProgress = targetHeight === 1 ? 0 : y / (targetHeight - 1);
    const radius = radialProgress * maxRadius;
    const targetY = targetTop + y;

    for (let x = 0; x < width; x += 1) {
      const angularProgress = width === 1 ? 0 : x / (width - 1);
      const theta = angularProgress * TWO_PI;
      const sampleX = clamp(Math.round(centerX + radius * Math.cos(theta)), 0, sourceWidth - 1);
      const sampleY = clamp(Math.round(centerY + radius * Math.sin(theta)), 0, sourceHeight - 1);
      const targetX = wrapPixelX(x + shiftX, width);

      copyPixel(source, sourceWidth, sampleX, sampleY, output, targetWidth, targetX, targetY, channels);
    }
  }
}

async function convertPolarToMirroredSphere({
  inputPath,
  bottomInputPath,
  outputPath,
  width,
  height,
  trimTop,
  trimRight,
  trimBottom,
  trimLeft,
  shiftX = 0,
  shiftTopX = null,
  shiftBottomX = null,
  noMirror = false,
  paddingTop = 0,
  paddingBottom = 0,
  flipBottomHorizontal = false
}) {
  if (!inputPath) {
    throw new Error("An input image path is required.");
  }

  if (!noMirror && height % 2 !== 0) {
    throw new Error("--height must be an even number so the hemisphere can be mirrored exactly.");
  }

  if (!noMirror && (paddingTop > 0 || paddingBottom > 0)) {
    throw new Error("--padding-top and --padding-bottom are only available with --no-mirror.");
  }

  if (noMirror && bottomInputPath) {
    throw new Error("--no-mirror uses a single input image. Remove the second image or --bottom-input.");
  }

  if (noMirror && flipBottomHorizontal) {
    throw new Error("--flip-bottom-horizontal is only available in mirrored mode.");
  }

  if (noMirror && (shiftTopX !== null || shiftBottomX !== null)) {
    throw new Error("--shift-top-x and --shift-bottom-x are only available in mirrored mode. Use --shift-x with --no-mirror.");
  }

  if (noMirror && (paddingTop + paddingBottom >= height)) {
    throw new Error("--padding-top and --padding-bottom must leave at least 1px for the converted image.");
  }

  const resolvedInput = path.resolve(inputPath);
  const resolvedBottomInput = bottomInputPath ? path.resolve(bottomInputPath) : resolvedInput;
  const resolvedOutput = path.resolve(
    outputPath ||
      (bottomInputPath
        ? defaultTwoImageOutputPath(resolvedInput, resolvedBottomInput)
        : defaultOutputPath(resolvedInput, { noMirror }))
  );

  const topSource = await loadPolarSource({
    inputPath: resolvedInput,
    trimTop,
    trimRight,
    trimBottom,
    trimLeft
  });
  const bottomSource = bottomInputPath
    ? await loadPolarSource({
        inputPath: resolvedBottomInput,
        trimTop,
        trimRight,
        trimBottom,
        trimLeft
      })
    : topSource;

  if (topSource.channels !== bottomSource.channels) {
    throw new Error(
      `Input images must have the same channel count after loading: ${topSource.input} has ${topSource.channels}, ${bottomSource.input} has ${bottomSource.channels}.`
    );
  }

  const channels = topSource.channels;
  const output = createBlackOutput(width, height, channels);
  const resolvedTopShiftX = shiftTopX ?? shiftX;
  const resolvedBottomShiftX = shiftBottomX ?? shiftX;

  if (noMirror) {
    copyPolarBand({
      sourceImage: topSource,
      output,
      width,
      targetWidth: width,
      targetTop: paddingTop,
      targetHeight: height - paddingTop - paddingBottom,
      shiftX
    });
  } else {
    copyPolarHemisphere({
      sourceImage: topSource,
      output,
      width,
      height,
      targetHalf: "top",
      shiftX: resolvedTopShiftX
    });
    copyPolarHemisphere({
      sourceImage: bottomSource,
      output,
      width,
      height,
      targetHalf: "bottom",
      flipHorizontal: flipBottomHorizontal,
      shiftX: resolvedBottomShiftX
    });
  }

  await sharp(output, {
    raw: {
      width,
      height,
      channels
    }
  }).toFile(resolvedOutput);

  return {
    input: resolvedInput,
    bottomInput: bottomInputPath ? resolvedBottomInput : null,
    output: resolvedOutput,
    sourceWidth: topSource.sourceWidth,
    sourceHeight: topSource.sourceHeight,
    bottomSourceWidth: bottomSource.sourceWidth,
    bottomSourceHeight: bottomSource.sourceHeight,
    shiftX,
    shiftTopX: resolvedTopShiftX,
    shiftBottomX: resolvedBottomShiftX,
    noMirror,
    paddingTop,
    paddingBottom,
    flipBottomHorizontal,
    width,
    height
  };
}

async function convertInputDirectory({
  inputDir,
  outputDir,
  width,
  height,
  trimTop,
  trimRight,
  trimBottom,
  trimLeft,
  shiftX,
  shiftTopX,
  shiftBottomX,
  noMirror,
  paddingTop,
  paddingBottom,
  flipBottomHorizontal
}) {
  if (!noMirror && height % 2 !== 0) {
    throw new Error("--height must be an even number so the hemisphere can be mirrored exactly.");
  }

  const imagePaths = getInputImagePaths(inputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (const inputPath of imagePaths) {
    const result = await convertPolarToMirroredSphere({
      inputPath,
      outputPath: defaultBatchOutputPath(inputPath, outputDir, { noMirror }),
      width,
      height,
      trimTop,
      trimRight,
      trimBottom,
      trimLeft,
      shiftX,
      shiftTopX,
      shiftBottomX,
      noMirror,
      paddingTop,
      paddingBottom,
      flipBottomHorizontal
    });

    results.push(result);
  }

  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const results = options.inputPath
    ? [
        await convertPolarToMirroredSphere({
          ...options,
          inputPath: options.inputPath,
          bottomInputPath: options.bottomInputPath,
          outputPath: options.outputPath
        })
      ]
    : await convertInputDirectory(options);

  for (const result of results) {
    const sourceDescription = result.bottomInput
      ? `${result.sourceWidth}x${result.sourceHeight} + ${result.bottomSourceWidth}x${result.bottomSourceHeight}`
      : `${result.sourceWidth}x${result.sourceHeight}`;
    console.log(`Wrote ${result.output} (${result.width}x${result.height}) from ${sourceDescription}.`);
  }

  if (options.inputPath) {
    console.log(`Converted ${results.length} image(s).`);
  } else {
    console.log(`Converted ${results.length} image(s) from ${options.inputDir} to ${options.outputDir}.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
