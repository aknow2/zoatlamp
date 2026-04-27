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
      "  node index.js [--input-dir ./input] [--output-dir ./output] [--width 2048] [--height 1024]",
      "",
      "Examples:",
      "  node index.js",
      "  npm run convert -- --input-dir ./input --output-dir ./output --width 2048 --height 1024"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const options = {
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    width: 2048,
    height: 1024
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--width" || arg === "--height" || arg === "--input-dir" || arg === "--output-dir") {
      const key = arg.slice(2);
      const nextValue = argv[index + 1];

      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }

      if (arg === "--input-dir" || arg === "--output-dir") {
        options[key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = path.resolve(nextValue);
        index += 1;
        continue;
      }

      const numericValue = Number.parseInt(nextValue, 10);

      if (!Number.isInteger(numericValue) || numericValue <= 0) {
        throw new Error(`Invalid value for ${arg}: ${nextValue}`);
      }

      options[key] = numericValue;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}_fullsphere_mirror.png`);
}

function defaultBatchOutputPath(inputPath, outputDir) {
  const parsed = path.parse(inputPath);
  return path.join(outputDir, `${parsed.name}_fullsphere_mirror.png`);
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

async function convertPolarToMirroredSphere({ inputPath, outputPath, width, height }) {
  if (!inputPath) {
    throw new Error("An input image path is required.");
  }

  if (height % 2 !== 0) {
    throw new Error("--height must be an even number so the hemisphere can be mirrored exactly.");
  }

  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath || defaultOutputPath(resolvedInput));

  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Input image does not exist: ${resolvedInput}`);
  }

  const { data: source, info } = await sharp(resolvedInput)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sourceWidth = info.width;
  const sourceHeight = info.height;
  const channels = info.channels;
  const centerX = sourceWidth / 2;
  const centerY = sourceHeight / 2;
  const maxRadius = Math.min(centerX, centerY);
  const hemisphereHeight = height / 2;
  const output = Buffer.alloc(width * height * channels);

  for (let y = 0; y < hemisphereHeight; y += 1) {
    const radialProgress = hemisphereHeight === 1 ? 0 : y / (hemisphereHeight - 1);
    const radius = radialProgress * maxRadius;

    for (let x = 0; x < width; x += 1) {
      const angularProgress = width === 1 ? 0 : x / (width - 1);
      const theta = angularProgress * TWO_PI;
      const sampleX = clamp(Math.round(centerX + radius * Math.cos(theta)), 0, sourceWidth - 1);
      const sampleY = clamp(Math.round(centerY + radius * Math.sin(theta)), 0, sourceHeight - 1);

      copyPixel(source, sourceWidth, sampleX, sampleY, output, width, x, y, channels);

      const mirroredY = height - 1 - y;
      copyPixel(source, sourceWidth, sampleX, sampleY, output, width, x, mirroredY, channels);
    }
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
    output: resolvedOutput,
    sourceWidth,
    sourceHeight,
    width,
    height
  };
}

async function convertInputDirectory({ inputDir, outputDir, width, height }) {
  if (height % 2 !== 0) {
    throw new Error("--height must be an even number so the hemisphere can be mirrored exactly.");
  }

  const imagePaths = getInputImagePaths(inputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (const inputPath of imagePaths) {
    const result = await convertPolarToMirroredSphere({
      inputPath,
      outputPath: defaultBatchOutputPath(inputPath, outputDir),
      width,
      height
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

  const results = await convertInputDirectory(options);

  for (const result of results) {
    console.log(`Wrote ${result.output} (${result.width}x${result.height}) from ${result.sourceWidth}x${result.sourceHeight}.`);
  }

  console.log(`Converted ${results.length} image(s) from ${options.inputDir} to ${options.outputDir}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});