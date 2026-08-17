<script lang="ts">
import { defineComponent } from "vue";
import { saveAs } from "file-saver";
import filenamify from "filenamify/browser";
import { imgToCanvas } from "../../utils/canvas";
import { decodeGif, DecodedGifFrame } from "../../utils/gifDecode";
import { splitGifIntoCells } from "../../utils/gifSplit";
import { loadFileAsArrayBuffer, prepareDownloadFile, extension } from "../../utils/file";
import Card from "../global/Card.vue";
import FileSelect from "../inputs/FileSelect.vue";
import Select from "../inputs/Select.vue";
import NumberInput from "../inputs/Number.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Space from "../global/Space.vue";
import Button from "../inputs/Button.vue";
import Image from "../icons/Image.vue";
import { Filter } from "../../types";
import filters from "../../constants/filters";

type FilterOption = { label: string, value: Filter };
type GifStatus = "idle" | "loading" | "splitting" | "error";

export default defineComponent({
  components: {
    FileSelect, Select, Image, Card, Fieldset, Space, NumberInput, Button,
  },
  props: {
    show: { type: Boolean, required: true },
  },
  emits: [
    "render",
  ],
  data() {
    return {
      FILTER_OPTIONS: filters,
      conf: {
        img: null as (HTMLImageElement | null),
        filter: null as (FilterOption | null),
      },
      /* GIF分割ツール(エフェクトなし・独立機能) */
      gif: {
        fileName: null as (string | null),
        frames: [] as DecodedGifFrame[],
        width: 0,
        height: 0,
        cells: [2, 2] as [number, number],
        status: "idle" as GifStatus,
        progress: null as ({ done: number, total: number } | null),
        errorMessage: "",
      },
    };
  },
  watch: {
    conf: {
      handler(): void {
        this.render();
      },
      deep: true,
    },
  },
  methods: {
    render(): void {
      if (this.conf.img) {
        if (this.conf.filter) {
          this.$emit("render", this.conf.filter.value(this.conf.img), null);
        } else {
          this.$emit("render", imgToCanvas(this.conf.img), null);
        }
      }
    },
    // --- GIF分割ツール ---------------------------------------------
    async onGifFileChange(e: { target: { files: FileList, value: string } }): Promise<void> {
      const file = e.target.files[0];
      // eslint-disable-next-line no-param-reassign
      e.target.value = "";
      if (!file) {
        return;
      }
      this.gif.status = "loading";
      this.gif.errorMessage = "";
      this.gif.frames = [];
      try {
        const buffer = await loadFileAsArrayBuffer(file);
        const decoded = await decodeGif(buffer);
        if (decoded.frames.length < 2) {
          this.gif.status = "error";
          this.gif.errorMessage = "アニメーションしないGIF(コマが1枚だけ)のようです。通常のファイルアップロードをお使いください。";
          return;
        }
        this.gif.fileName = file.name;
        this.gif.frames = decoded.frames;
        this.gif.width = decoded.width;
        this.gif.height = decoded.height;
        this.gif.status = "idle";
      } catch (err) {
        this.gif.status = "error";
        this.gif.errorMessage = "GIFの読み込みに失敗しました。ファイルが壊れていないか確認してください。";
      }
    },
    async onSplitGifDownload(): Promise<void> {
      if (this.gif.frames.length === 0) {
        return;
      }
      const [hCells, vCells] = this.gif.cells;
      if (hCells < 1 || vCells < 1) {
        return;
      }
      this.gif.status = "splitting";
      this.gif.progress = { done: 0, total: this.gif.frames.length };
      try {
        const images = await splitGifIntoCells(
          this.gif.frames,
          this.gif.width,
          this.gif.height,
          hCells,
          vCells,
          (done, total) => {
            this.gif.progress = { done, total };
          },
        );
        const download = await prepareDownloadFile(images);
        const baseName = filenamify(
          (this.gif.fileName ?? "gif").replace(/\.gif$/i, ""),
          { replacement: "" },
        ).normalize() || "megamoji-gif";
        saveAs(download, `${baseName}-split.${extension(download)}`);
        this.gif.status = "idle";
        this.gif.progress = null;
      } catch (err) {
        this.gif.status = "error";
        this.gif.errorMessage = "分割処理に失敗しました。マスの数を減らして試してみてください。";
        this.gif.progress = null;
      }
    },
  },
});
</script>

<template>
  <Card v-if="show">
    <Space vertical xlarge full>
      <Fieldset label="ファイル">
        <FileSelect type="img" name="ファイルを選ぶ" @load="conf.img = $event">
          <Image /> ファイルを選ぶ
        </FileSelect>
      </Fieldset>
      <Fieldset label="前処理">
        <Select v-model="conf.filter" name="前処理" nullable :options="FILTER_OPTIONS" />
      </Fieldset>
      <Fieldset label="GIFを分割(動きそのまま・エフェクトなし)">
        <Space vertical full>
          <p class="gif-hint">
            アップロードしたGIFの動きをそのまま保ったまま、複数マスに分割してダウンロードします
            (Slackなどで大きい絵文字として使う用)。ここでは絵文字の効果はかかりません。
          </p>
          <input
              ref="gifInput"
              type="file"
              accept="image/gif"
              style="display: none;"
              @change="onGifFileChange">
          <Button type="dashed" name="分割用GIFを選ぶ" @click="($refs.gifInput as HTMLInputElement).click()">
            <Image /> 分割用GIFを選ぶ
          </Button>
          <span v-if="gif.fileName" class="gif-filename">
            {{ gif.fileName }} ({{ gif.frames.length }}コマ)
          </span>
          <span v-if="gif.status === 'loading'" class="gif-status">
            読み込み中...
          </span>
          <span v-if="gif.status === 'error'" class="gif-status gif-status-error">
            {{ gif.errorMessage }}
          </span>
          <template v-if="gif.frames.length > 0">
            <div class="gif-cells-row">
              <NumberInput v-model="gif.cells[0]" :min="1" style="width: 80px;" />
              <span>x</span>
              <NumberInput v-model="gif.cells[1]" :min="1" style="width: 80px;" />
            </div>
            <Button
                type="text"
                name="分割してダウンロード"
                :disabled="gif.status === 'splitting'"
                @click="onSplitGifDownload">
              <template #icon>
                💾
              </template>
              {{ gif.status === 'splitting'
                ? `処理中... (${gif.progress ? gif.progress.done : 0}/${gif.progress ? gif.progress.total : 0}コマ)`
                : "分割してダウンロード" }}
            </Button>
          </template>
        </Space>
      </Fieldset>
    </Space>
  </Card>
</template>

<style scoped>
.gif-hint {
  margin: 0;
  font-size: var(--fontSizeMedium);
  color: var(--fg);
  opacity: 0.7;
}

.gif-filename,
.gif-status {
  font-size: var(--fontSizeMedium);
  color: var(--fg);
}

.gif-status-error {
  color: var(--danger);
}

.gif-cells-row {
  display: flex;
  gap: var(--spacingMedium);
  align-items: center;
}
</style>
