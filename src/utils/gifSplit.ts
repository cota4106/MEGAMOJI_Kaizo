import { DecodedGifFrame } from "./gifDecode";

/**
 * デコード済みGIFのコマを hCells x vCells のマスに分割し、
 * マスごとに元の動き(表示時間含む)をそのまま保ったGIFを生成する。
 * エフェクトは一切かけない、素の分割専用処理。
 */
export async function splitGifIntoCells(
  frames: DecodedGifFrame[],
  width: number,
  height: number,
  hCells: number,
  vCells: number,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob[][]> {
  const cellWidth = Math.floor(width / hCells);
  const cellHeight = Math.floor(height / vCells);

  const encoders: Worker[][] = [];
  for (let y = 0; y < vCells; y += 1) {
    const row: Worker[] = [];
    for (let x = 0; x < hCells; x += 1) {
      const worker = new Worker("./gifworker.js");
      worker.postMessage({
        initialize: {
          width: cellWidth,
          height: cellHeight,
          delay: 100, // フォールバック値。実際はコマごとにframeDelayを指定する
          transparent: true,
        },
      });
      row.push(worker);
    }
    encoders.push(row);
  }

  const cutoutCanvas = document.createElement("canvas");
  cutoutCanvas.width = cellWidth;
  cutoutCanvas.height = cellHeight;
  const cutoutCtx = cutoutCanvas.getContext("2d");
  if (!cutoutCtx) {
    throw new Error("Failed to get rendering context.");
  }

  const totalSteps = frames.length;
  frames.forEach((frame, frameIx) => {
    for (let y = 0; y < vCells; y += 1) {
      for (let x = 0; x < hCells; x += 1) {
        cutoutCtx.clearRect(0, 0, cellWidth, cellHeight);
        cutoutCtx.drawImage(
          frame.canvas,
          x * cellWidth,
          y * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight,
        );
        const { data } = cutoutCtx.getImageData(0, 0, cellWidth, cellHeight);
        encoders[y][x].postMessage({
          addFrame: data,
          frameDelay: frame.delay,
        });
      }
    }
    if (onProgress) {
      onProgress(frameIx + 1, totalSteps);
    }
  });

  return Promise.all<Blob[]>(
    encoders.map((row) => Promise.all<Blob>(
      row.map((worker) => (
        new Promise((resolve) => {
          worker.addEventListener("message", (res) => {
            worker.terminate();
            resolve(res.data);
          });
          worker.postMessage({ finish: true });
        })
      )),
    )),
  );
}
