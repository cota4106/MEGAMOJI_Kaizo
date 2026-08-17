export type GalleryEntry = {
  id: string;
  name: string;
  thumbnail: string; // small PNG data URL (見た目の記録用。元ファイルそのものは保存しない)
  createdAt: number;
  settings: unknown; // Target.vueのConfSnapshot(型はTarget.vue側に閉じているのでここではunknown)
};

const GALLERY_STORAGE_KEY = "megamoji_gallery_v1";
const GALLERY_LIMIT_STORAGE_KEY = "megamoji_gallery_limit_v1";
const DEFAULT_GALLERY_LIMIT = 10;
const MAX_GALLERY_LIMIT = 100;
const THUMBNAIL_SIZE = 64;

export function getGalleryLimit(): number {
  try {
    const raw = window.localStorage.getItem(GALLERY_LIMIT_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : DEFAULT_GALLERY_LIMIT;
    if (Number.isNaN(parsed) || parsed < 1) {
      return DEFAULT_GALLERY_LIMIT;
    }
    return Math.min(parsed, MAX_GALLERY_LIMIT);
  } catch (e) {
    return DEFAULT_GALLERY_LIMIT;
  }
}

export function setGalleryLimit(limit: number): GalleryEntry[] {
  const clamped = Math.max(1, Math.min(limit, MAX_GALLERY_LIMIT));
  try {
    window.localStorage.setItem(GALLERY_LIMIT_STORAGE_KEY, String(clamped));
  } catch (e) {
    // 無視
  }
  // 上限を減らした場合は、古いものから切り詰める
  const trimmed = loadGalleryFromStorage().slice(0, clamped);
  saveGalleryToStorage(trimmed);
  return trimmed;
}

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

/* 作った絵文字を履歴に追加する(先頭のマスの絵と、その時の設定を記録) */
export async function addToGallery(
  firstCellBlob: Blob,
  name: string,
  settings: unknown,
): Promise<GalleryEntry[]> {
  const thumbnail = await makeThumbnail(firstCellBlob);
  const entry: GalleryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    thumbnail,
    createdAt: Date.now(),
    settings,
  };
  const current = loadGalleryFromStorage();
  const updated = [entry, ...current].slice(0, getGalleryLimit());
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
