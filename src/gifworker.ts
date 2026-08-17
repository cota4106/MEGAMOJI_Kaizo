import { GIFEncoder, quantize, nearestColorIndex } from "gifenc";
import { binarizeTransparency } from "./utils/binarize";

type Options = {
  delay: number,
  width: number,
  height: number,
  transparent: boolean,
};

// eslint-disable-next-line no-restricted-globals, @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

const encoder = GIFEncoder();
const frames: { data: Uint8ClampedArray, delay?: number }[] = [];
let options: Options;

// Make an rgba565 global palette.
const quantizeGlobal = () => {
  const { width, height } = options;
  const mergedFrames = new Uint8Array(frames.length * width * height * 4);
  frames.forEach((frame, ix) => {
    mergedFrames.set(frame.data, ix * width * height * 4);
  });
  const palette = quantize(mergedFrames, 256, { format: "rgb565" });
  return palette;
};

const genColorFinder = (palette: number[][]) => {
  const cache: Record<number, number> = {};
  return (rgb: [number, number, number]) => {
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    if (cache[key] === undefined) {
      cache[key] = nearestColorIndex(palette, rgb);
    }
    return cache[key];
  };
};

ctx.addEventListener("message", (msg) => {
  if (msg.data.initialize) {
    options = msg.data.initialize;
  } else if (msg.data.addFrame) {
    // frameDelayは省略可(省略時はinitialize時のdelayを使う)。
    // 元のGIFを分割するときなど、コマごとに表示時間を変えたい場合に指定する。
    frames.push({ data: msg.data.addFrame, delay: msg.data.frameDelay });
  } else if (msg.data.finish) {
    const { delay, transparent, width, height } = options;
    const palette = quantizeGlobal();
    if (transparent && palette.length === 256) { // preserve 1 room for the transparent color
      palette.pop();
    }
    const colorFinder = genColorFinder(palette);
    const transparentIndex = palette.length; // entry will be added later
    frames.forEach((frame, frameIx) => {
      const pixelData = frame.data;
      // dither and binarize transparency first
      if (transparent) {
        binarizeTransparency(pixelData, width, height);
      }
      // apply palette
      const indexed = new Uint8Array(width * height);
      for (let i = 0; i < indexed.length; i += 1) {
        if (transparent && pixelData[i * 4 + 3] < 128) {
          indexed[i] = transparentIndex;
        } else {
          indexed[i] = colorFinder([pixelData[i * 4], pixelData[i * 4 + 1], pixelData[i * 4 + 2]]);
        }
      }
      encoder.writeFrame(indexed, width, height, {
        palette: frameIx === 0 ? (transparent ? [...palette, [0, 0, 0]] : palette) : undefined,
        delay: frame.delay ?? delay,
        transparent,
        transparentIndex,
      });
    });
    encoder.finish();
    ctx.postMessage(new Blob([encoder.bytes()], { type: "image/gif" }));
  }
});
