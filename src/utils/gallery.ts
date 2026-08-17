export type GalleryEntry = {
  id: string;
  name: string;
  thumbnail: string; // small PNG data URL (見た目の記録用。元ファイルそのものは保存しない)
  createdAt: number;
};

const GALLERY_STORAGE_KEY = "megamoji_gallery_v1";
const GALLERY_LIMIT = 30;
const THUMBNAIL_SIZE = 64;

export function loadGalleryFromStorage(): GalleryEntry[] {
  try {
    const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveGalleryToStorage(entries: GalleryEntry[]): void {
  try {
    window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    // localStorageが使えない/容量オーバーの場合は諦める(サイレントに無視)
  }
}

/* Blobから正方形の小さいサムネイル(PNG dataURL)を作る */
function makeThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_SIZE;
      canvas.height = THUMBNAIL_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get rendering context."));
        return;
      }
      // 中央でcoverするようにトリミングして描画する
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    img.src = url;
  });
}

/* 作った絵文字を履歴に追加する(先頭のマスの絵だけを代表として記録) */
export async function addToGallery(firstCellBlob: Blob, name: string): Promise<GalleryEntry[]> {
  const thumbnail = await makeThumbnail(firstCellBlob);
  const entry: GalleryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    thumbnail,
    createdAt: Date.now(),
  };
  const current = loadGalleryFromStorage();
  const updated = [entry, ...current].slice(0, GALLERY_LIMIT);
  saveGalleryToStorage(updated);
  return updated;
}

export function removeFromGallery(id: string): GalleryEntry[] {
  const updated = loadGalleryFromStorage().filter((e) => e.id !== id);
  saveGalleryToStorage(updated);
  return updated;
}

export function clearGallery(): void {
  saveGalleryToStorage([]);
}
