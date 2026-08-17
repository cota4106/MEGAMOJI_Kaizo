<script lang="ts">
import { defineComponent, PropType } from "vue";
import { saveAs } from "file-saver";
import filenamify from "filenamify/browser";
import { extension, prepareDownloadFile } from "../../utils/file";
import Analytics from "../../utils/analytics";
import RawResult from "../emoji/RawResult.vue";
import Preview from "../emoji/Preview.vue";
import Button from "../inputs/Button.vue";
import Checkbox from "../inputs/Checkbox.vue";
import Space from "../global/Space.vue";
import Card from "../global/Card.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Effect from "../icons/Effect.vue";
import Back from "../icons/Back.vue";
import Save from "../icons/Save.vue";
import { NODE_ENV } from "../../utils/env";
import {
  checkEmojiSize, formatKiB, SizeWarningLevel,
} from "../../utils/sizeLimits";
import {
  GalleryEntry, loadGalleryFromStorage, addToGallery, removeFromGallery, clearGallery,
  getGalleryLimit, setGalleryLimit,
} from "../../utils/gallery";
import NumberInput from "../inputs/Number.vue";

export default defineComponent({
  components: {
    RawResult, Preview, Checkbox, Card, Space, Button, Effect, Back, Save, Fieldset, NumberInput,
  },
  props: {
    images: { type: Array as PropType<Blob[][]>, required: true },
    name: { type: String, default: null },
    showTarget: { type: Boolean, required: false },
    getSettingsSnapshot: { type: Function as PropType<() => unknown>, default: null },
    applySettingsSnapshot: { type: Function as PropType<(s: unknown) => void>, default: null },
  },
  emits: [
    "toggleShowTarget",
  ],
  data() {
    return {
      previewMode: false,
      rounded: false,
      isDev: NODE_ENV === "development",
      gallery: [] as GalleryEntry[],
      showGallery: false,
      galleryLimit: 10,
    };
  },
  computed: {
    resultImageUrls(): string[][] {
      return this.images.map((row) => row.map((cell) => URL.createObjectURL(cell)));
    },
    totalSize(): number {
      return this.images.reduce((l, r) => (
        l + r.reduce((ll, rr) => ll + rr.size, 0)
      ), 0);
    },
    maxCellSize(): number {
      return this.images.reduce((max, row) => (
        row.reduce((rowMax, cell) => Math.max(rowMax, cell.size), max)
      ), 0);
    },
    isSplit(): boolean {
      return this.images.length > 1 || this.images[0].length > 1;
    },
    sizeWarning(): SizeWarningLevel {
      return checkEmojiSize(this.maxCellSize);
    },
  },
  mounted() {
    this.gallery = loadGalleryFromStorage();
    this.galleryLimit = getGalleryLimit();
  },
  methods: {
    formatKiB,
    onDownload(): void {
      const download = prepareDownloadFile(this.images);
      const filename = filenamify(this.name ?? "", { replacement: "" }).normalize() || "megamoji";
      download.then((res) => saveAs(res, `${filename}.${extension(res)}`));
      Analytics.download();
      // 履歴(ギャラリー)にサムネイルと、その時の設定を記録する。先頭のマスの絵を代表として使う
      const firstCell = this.images[0]?.[0];
      const settings = this.getSettingsSnapshot ? this.getSettingsSnapshot() : null;
      if (firstCell) {
        addToGallery(firstCell, filename, settings).then((updated) => {
          this.gallery = updated;
        });
      }
    },
    onLoadGalleryEntry(entry: GalleryEntry): void {
      if (!entry.settings || !this.applySettingsSnapshot) {
        return;
      }
      this.applySettingsSnapshot(entry.settings);
    },
    onRemoveGalleryEntry(id: string): void {
      this.gallery = removeFromGallery(id);
    },
    onClearGallery(): void {
      // eslint-disable-next-line no-alert
      if (!window.confirm("履歴を全部削除しますか？")) {
        return;
      }
      clearGallery();
      this.gallery = [];
    },
    onChangeGalleryLimit(value: number): void {
      this.galleryLimit = value;
      this.gallery = setGalleryLimit(value);
    },
    formatDate(timestamp: number): string {
      const d = new Date(timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
  },
});
</script>

<template>
  <Space vertical large>
    <Card class="result" title="プレビュー">
      <Space vertical large>
        <RawResult
            v-if="!previewMode"
            :images="resultImageUrls"
            :rounded="rounded" />
        <Preview
            v-if="previewMode"
            :images="resultImageUrls"
            :dark-mode="false"
            :rounded="rounded" />
        <Preview
            v-if="previewMode"
            :images="resultImageUrls"
            :dark-mode="true"
            :rounded="rounded" />
        <div class="size-info">
          <span class="size-text">
            ファイルサイズ: {{ formatKiB(maxCellSize) }}{{ isSplit ? "(1マスあたり最大)" : "" }}
          </span>
          <span v-if="sizeWarning === 'slack'" class="size-warning size-warning-slack">
            ⚠️ Slackの上限(128KB)を超えています(Discordの256KBまでならOK)
          </span>
          <span v-else-if="sizeWarning === 'both'" class="size-warning size-warning-both">
            ⚠️ Slack(128KB)・Discord(256KB)どちらの上限も超えています
          </span>
        </div>
        <Checkbox v-model="previewMode" name="サンプル表示">
          {{ "サンプル表示" }}
        </Checkbox>
        <Checkbox v-model="rounded" name="角丸">
          {{ "角丸プレビュー" }}
        </Checkbox>
      </Space>
    </Card>
    <Space class="buttons">
      <Button
          v-if="showTarget"
          name="効果をつける(戻る)"
          @click="$emit('toggleShowTarget', $event)">
        <template #icon>
          <Back />
        </template>
        もどる
      </Button>
      <Button
          v-else
          name="効果をつける"
          @click="$emit('toggleShowTarget', $event)">
        <template #icon>
          <Effect />
        </template>
        効果をつける
      </Button>
      <Button type="primary" name="保存" @click="onDownload">
        <template #icon>
          <Save />
        </template>
        絵文字を保存
      </Button>
    </Space>
    <Fieldset label="作った絵文字の履歴">
      <Space vertical full>
        <p class="gallery-hint">
          「絵文字を保存」を押すたびに、見た目のサムネイルとその時の設定を記録します(元のファイルそのものはブラウザに保存されません)。
        </p>
        <div class="gallery-limit-row">
          <span class="gallery-limit-label">保存する件数(上限)</span>
          <NumberInput
              :model-value="galleryLimit"
              :min="1"
              :max="100"
              style="width: 80px;"
              @update:model-value="onChangeGalleryLimit" />
        </div>
        <p v-if="gallery.length === 0" class="gallery-empty">
          まだ履歴はありません。
        </p>
        <template v-else>
          <div class="gallery-grid">
            <div v-for="entry in gallery" :key="entry.id" class="gallery-item">
              <button
                  type="button"
                  class="gallery-thumb-button"
                  :disabled="!entry.settings"
                  :title="entry.settings ? '設定を読み込む' : '設定が記録されていません'"
                  @click="onLoadGalleryEntry(entry)">
                <img :src="entry.thumbnail" :alt="entry.name" class="gallery-thumb">
              </button>
              <span class="gallery-name">{{ entry.name }}</span>
              <span class="gallery-date">{{ formatDate(entry.createdAt) }}</span>
              <button
                  type="button"
                  class="gallery-remove"
                  title="この履歴を削除"
                  @click="onRemoveGalleryEntry(entry.id)">
                ×
              </button>
            </div>
          </div>
          <Button type="text" danger name="履歴を全部削除" @click="onClearGallery">
            履歴を全部削除
          </Button>
        </template>
      </Space>
    </Fieldset>
  </Space>
</template>

<style scoped>
.result {
  background-image:
    linear-gradient(
      45deg,
      var(--bg) 25%,
      transparent 25%,
      transparent 75%,
      var(--bg) 75%,
      var(--bg)
    ),
    linear-gradient(
      45deg,
      var(--bg) 25%,
      transparent 25%,
      transparent 75%,
      var(--bg) 75%,
      var(--bg)
    );
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
}

.size-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacingSmall) var(--spacingMedium);
  align-items: center;
}

.size-text {
  font-size: var(--fontSizeMedium);
  color: var(--fg);
  opacity: 0.7;
}

.size-warning {
  font-size: var(--fontSizeMedium);
  font-weight: bold;
}

.size-warning-slack {
  color: var(--primaryDarker, var(--primary));
}

.size-warning-both {
  color: var(--danger);
}

.gallery-hint {
  margin: 0;
  font-size: var(--fontSizeSmall, var(--fontSizeMedium));
  color: var(--fg);
  opacity: 0.6;
}

.gallery-empty {
  margin: 0;
  font-size: var(--fontSizeMedium);
  color: var(--fg);
  opacity: 0.6;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacingMedium);
}

.gallery-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  gap: 2px;
}

.gallery-limit-row {
  display: flex;
  gap: var(--spacingMedium);
  align-items: center;
}

.gallery-limit-label {
  font-size: var(--fontSizeMedium);
  color: var(--fg);
}

.gallery-thumb-button {
  padding: 0;
  cursor: pointer;
  background: none;
  border: none;
}

.gallery-thumb-button:disabled {
  cursor: default;
}

.gallery-thumb-button:not(:disabled):hover .gallery-thumb {
  border-color: var(--primary);
}

.gallery-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  background-image:
    linear-gradient(45deg, var(--accentBg) 25%, transparent 25%, transparent 75%, var(--accentBg) 75%, var(--accentBg)),
    linear-gradient(45deg, var(--accentBg) 25%, transparent 25%, transparent 75%, var(--accentBg) 75%, var(--accentBg));
  background-position: 0 0, 6px 6px;
  background-size: 12px 12px;
  border: 1px solid var(--border);
  border-radius: var(--borderRadiusSmall, 6px);
}

.gallery-name {
  overflow: hidden;
  width: 100%;
  font-size: var(--fontSizeSmall, var(--fontSizeMedium));
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-date {
  font-size: var(--fontSizeSmall, var(--fontSizeMedium));
  color: var(--fg);
  opacity: 0.5;
}

.gallery-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 1;
  color: var(--bg);
  cursor: pointer;
  background-color: var(--danger);
  border: none;
  border-radius: 50%;
}
</style>
