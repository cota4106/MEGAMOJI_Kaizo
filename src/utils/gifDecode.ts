import { parseGIF, decompressFrames } from "gifuct-js";

export type DecodedGifFrame = {
  canvas: HTMLCanvasElement,
  delay: number, // milliseconds
};

export type DecodedGif = {
  frames: DecodedGifFrame[],
  width: number,
  height: number,
};

/**
 * GIFファイル(ArrayBuffer)を、disposalMethodを考慮した「完成形のコマ」のリストにデコードする。
 * gifuct-jsは差分パッチのみ返すため、ここで前のコマの上に重ねる/消す処理を行う。
 */
export async function decodeGif(buffer: ArrayBuffer): Promise<DecodedGif> {
  const gif = parseGIF(buffer);
  const rawFrames = decompressFrames(gif, true);

  const { width, height } = gif.lsd;

  // 全体を合成していく作業用canvas
  const workCanvas = document.createElement("canvas");
  workCanvas.width = width;
  workCanvas.height = height;
  const workCtx = workCanvas.getContext("2d");
  if (!workCtx) {
    throw new Error("Failed to get rendering context.");
  }

  const frames: DecodedGifFrame[] = [];
  // disposalType === 3 (前の状態に戻す) 用に、直前フレーム描画前の状態を保持する
  let previousImageData: ImageData | null = null;

  rawFrames.forEach((frame) => {
    const { disposalType } = frame;

    if (disposalType === 3) {
      previousImageData = workCtx.getImageData(0, 0, width, height);
    }

    const patchCanvas = document.createElement("canvas");
    patchCanvas.width = frame.dims.width;
    patchCanvas.height = frame.dims.height;
    const patchCtx = patchCanvas.getContext("2d");
    if (!patchCtx) {
      throw new Error("Failed to get rendering context.");
    }
    const patchImageData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
    patchImageData.data.set(frame.patch);
    patchCtx.putImageData(patchImageData, 0, 0);

    workCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

    // この時点の見た目を1コマとして確定させる
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext("2d");
    if (!frameCtx) {
      throw new Error("Failed to get rendering context.");
    }
    frameCtx.drawImage(workCanvas, 0, 0);

    frames.push({
      canvas: frameCanvas,
      // gifuct-jsのdelayは既にミリ秒換算。0や極端に短い値は再生ソフトによって
      // 既定値(100ms相当)扱いされることが多いため、下限を設けておく。
      delay: Math.max(frame.delay || 0, 20),
    });

    // 次コマの描画前処理(disposalMethod)
    if (disposalType === 2) {
      // 背景色相当でクリア(透過として扱う)
      workCtx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } else if (disposalType === 3 && previousImageData) {
      workCtx.putImageData(previousImageData, 0, 0);
    }
    // disposalType 0 or 1 はそのまま(上に重ね続ける)
  });

  return { frames, width, height };
}
