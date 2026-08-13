<script lang="ts">
import { defineComponent, PropType } from "vue";
import Analytics from "../../utils/analytics";
import EffectBlock from "../formblocks/EffectBlock.vue";
import CellcountBlock from "../formblocks/CellcountBlock.vue";
import Button from "../inputs/Button.vue";
import Select from "../inputs/Select.vue";
import Checkbox from "../inputs/Checkbox.vue";
import NumberInput from "../inputs/Number.vue";
import Slider from "../inputs/Slider.vue";
import Fieldset from "../inputs/Fieldset.vue";
import Color from "../inputs/Color.vue";
import Input from "../inputs/Input.vue";
import Space from "../global/Space.vue";
import Card from "../global/Card.vue";
import Grid from "../global/Grid.vue";
import GridItem from "../global/GridItem.vue";
import DevTool from "./DevTool.vue";

import {
  Animation, Effect, WebGLEffect, EffectParamDef,
} from "../../types";
import animations from "../../constants/animations";
import effects from "../../constants/effects";
import bgeffects from "../../constants/bgeffects";
import staticeffects from "../../constants/staticeffects";
import webgleffects from "../../constants/webgleffects";
import easings from "../../constants/easings";

import { renderAllCells } from "../../utils/emoji";
import {
  EMOJI_SIZE,
  ANIMATED_EMOJI_SIZE,
  BINARY_SIZE_LIMIT,
  FRAMERATE_MAX,
  FRAMECOUNT_MAX,
} from "../../constants/emoji";

import { NODE_ENV } from "../../utils/env";

type AnimationOption = { label: string, value: Animation };
type EffectOption = { label: string, value: Effect, params?: EffectParamDef[] };
type WebGLEffectOption = { label: string, value: WebGLEffect, params?: EffectParamDef[] };
type SpeedOption = { label: string, value: number };
type ParamValues = Record<string, Record<string, number>>;

const TRIMMING_OPTIONS = [
  { label: "ぴっちり", value: "" },
  { label: "はみだす (アス比維持)", value: "cover" },
  { label: "おさめる (アス比維持)", value: "contain" },
  { label: "そのまま (長方形)", value: "stretch" },
];

const SPEED_OPTIONS = [
  { label: "コマ送り", value: 2.0 },
  { label: "ゆっくり", value: 1.3 },
  { label: "ふつう", value: 0.8 },
  { label: "はやい", value: 0.3 },
];

// --- Undo/Redo helpers -----------------------------------------------
// conf の中身は関数を値に持つオブジェクト参照(Effect/Animation本体など)を含むため、
// そのままJSONにできない。かわりに label で参照し直せる "スナップショット" 形式にする。

type ConfSnapshot = {
  trimming: string;
  targetAspect: number;
  speedLabel: string;
  cells: [number, number];
  animation: string | null;
  animationInvert: boolean;
  staticEffects: string[];
  effects: string[];
  webglEffects: string[];
  staticEffectParams: ParamValues;
  effectParams: ParamValues;
  webglEffectParams: ParamValues;
  trimH: [number, number];
  trimV: [number, number];
  noCrop: boolean;
  easing: string;
  duration: number;
  backgroundColor: string;
  transparent: boolean;
};

function findByLabel<T extends { label: string }>(list: T[], label: string | null): T | null {
  if (label === null) return null;
  return list.find((item) => item.label === label) ?? null;
}

function flattenCategories<T>(categories: { label: string, effects: T[] }[]): T[] {
  return categories.flatMap((category) => category.effects);
}

const HISTORY_LIMIT = 50;
const HISTORY_DEBOUNCE_MS = 500;

// --- Preset helpers -----------------------------------------------
type Preset = {
  id: string;
  name: string;
  snapshot: ConfSnapshot;
  savedAt: number;
};

const PRESET_STORAGE_KEY = "megamoji_presets_v1";

function loadPresetsFromStorage(): Preset[] {
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function savePresetsToStorage(presets: Preset[]): void {
  try {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    // localStorageが使えない環境(プライベートブラウズ等)では何もしない
  }
}

// 名前+設定内容だけをコード化する(id/savedAtは共有先で新規に振り直す)
const PRESET_CODE_PREFIX = "MGMJPRESET1:";

function encodePresetToCode(preset: Preset): string {
  const payload = JSON.stringify({ name: preset.name, snapshot: preset.snapshot });
  // 絵文字等のマルチバイト文字を含むためencodeURIComponentを経由してbase64化する
  const base64 = window.btoa(encodeURIComponent(payload).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16)),
  ));
  return `${PRESET_CODE_PREFIX}${base64}`;
}

function decodePresetFromCode(code: string): { name: string, snapshot: ConfSnapshot } | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PRESET_CODE_PREFIX)) {
    return null;
  }
  try {
    const base64 = trimmed.slice(PRESET_CODE_PREFIX.length);
    const binary = window.atob(base64);
    const percentEncoded = binary.split("").map(
      (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
    ).join("");
    const payload = JSON.parse(decodeURIComponent(percentEncoded));
    if (typeof payload.name !== "string" || typeof payload.snapshot !== "object") {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export default defineComponent({
  components: {
    Color,
    EffectBlock,
    Checkbox,
    CellcountBlock,
    Card,
    Button,
    Number: NumberInput,
    Grid,
    GridItem,
    Fieldset,
    Space,
    Select,
    Slider,
    Input,
    DevTool,
  },
  props: {
    baseImage: { type: Object as PropType<HTMLCanvasElement>, default: null },
    show: { type: Boolean, required: true },
    emojiSize: { type: Number, default: null },
  },
  emits: [
    "render",
    "update:emojiSize",
  ],
  data() {
    return {
      animations,
      effects,
      bgeffects,
      staticeffects,
      webgleffects,
      easings,
      TRIMMING_OPTIONS,
      SPEED_OPTIONS,
      isDev: NODE_ENV === "development",
      conf: {
        /* basic */
        trimming: TRIMMING_OPTIONS[0],
        targetAspect: 1,
        speed: SPEED_OPTIONS[2],
        cells: [1, 1],
        animation: null as (AnimationOption | null),
        animationInvert: false,
        staticEffects: [] as EffectOption[],
        effects: [] as EffectOption[],
        webglEffects: [] as WebGLEffectOption[],
        staticEffectParams: {} as ParamValues,
        effectParams: {} as ParamValues,
        webglEffectParams: {} as ParamValues,
        /* advanced */
        trimH: [0, 0],
        trimV: [0, 0],
        noCrop: false,
        easing: easings[0],
        duration: SPEED_OPTIONS[2].value,
        backgroundColor: "#ffffff",
        transparent: false,
      },
      showDetails: false,
      devMode: false,
      /* internals */
      running: false,
      dirty: false,
      /* undo/redo */
      undoStack: [] as string[],
      redoStack: [] as string[],
      applyingHistory: false,
      historyTimer: null as (ReturnType<typeof setTimeout> | null),
      /* presets */
      presets: [] as Preset[],
      newPresetName: "",
      importCode: "",
      importError: false,
      copiedPresetId: null as (string | null),
    };
  },
  computed: {
    naturalAspect(): number {
      return (this.conf.trimH[1] - this.conf.trimH[0]) / (this.conf.trimV[1] - this.conf.trimV[0]);
    },
    canUndo(): boolean {
      return this.undoStack.length > 1;
    },
    canRedo(): boolean {
      return this.redoStack.length > 0;
    },
  },
  watch: {
    baseImage: {
      handler(): void {
        if (this.baseImage) {
          this.refreshDefaultSettings();
          this.render(true);
        }
      },
    },
    emojiSize: {
      handler(): void {
        if (this.baseImage) {
          this.render(true);
        }
      },
    },
    conf: {
      handler(): void {
        const animationName = this.conf.animation ? this.conf.animation.label : "";
        const effectNames = [
          ...this.conf.staticEffects.map((e) => e.label),
          ...this.conf.effects.map((e) => e.label),
          ...this.conf.webglEffects.map((e) => e.label),
        ];
        Analytics.changeAnimation(animationName, effectNames);
        this.render(true);
        this.scheduleHistoryPush();
      },
      deep: true,
    },
    devMode: {
      handler(): void {
        this.conf.animation = null;
        this.conf.effects = [];
        this.conf.webglEffects = [];
      },
    },
  },
  mounted() {
    Analytics.changeAnimation("", []);
    this.undoStack = [JSON.stringify(this.snapshotConf())];
    this.presets = loadPresetsFromStorage();
    window.addEventListener("keydown", this.onKeydown);
  },
  unmounted() {
    window.removeEventListener("keydown", this.onKeydown);
    if (this.historyTimer !== null) {
      clearTimeout(this.historyTimer);
    }
  },
  methods: {
    // --- undo/redo -------------------------------------------------
    snapshotConf(): ConfSnapshot {
      return {
        trimming: this.conf.trimming.label,
        targetAspect: this.conf.targetAspect,
        speedLabel: this.conf.speed.label,
        cells: [this.conf.cells[0], this.conf.cells[1]],
        animation: this.conf.animation ? this.conf.animation.label : null,
        animationInvert: this.conf.animationInvert,
        staticEffects: this.conf.staticEffects.map((e) => e.label),
        effects: this.conf.effects.map((e) => e.label),
        webglEffects: this.conf.webglEffects.map((e) => e.label),
        staticEffectParams: JSON.parse(JSON.stringify(this.conf.staticEffectParams)),
        effectParams: JSON.parse(JSON.stringify(this.conf.effectParams)),
        webglEffectParams: JSON.parse(JSON.stringify(this.conf.webglEffectParams)),
        trimH: [this.conf.trimH[0], this.conf.trimH[1]],
        trimV: [this.conf.trimV[0], this.conf.trimV[1]],
        noCrop: this.conf.noCrop,
        easing: this.conf.easing.label,
        duration: this.conf.duration,
        backgroundColor: this.conf.backgroundColor,
        transparent: this.conf.transparent,
      };
    },
    applyConfSnapshot(snapshot: ConfSnapshot): void {
      const allEffectOptions = flattenCategories<EffectOption>(this.effects)
        .concat(flattenCategories<EffectOption>(this.bgeffects));
      const allStaticOptions = flattenCategories<EffectOption>(this.staticeffects);
      const allWebglOptions = flattenCategories<WebGLEffectOption>(this.webgleffects);

      this.applyingHistory = true;
      this.conf.trimming = findByLabel(TRIMMING_OPTIONS, snapshot.trimming) ?? TRIMMING_OPTIONS[0];
      this.conf.targetAspect = snapshot.targetAspect;
      this.conf.speed = findByLabel(SPEED_OPTIONS, snapshot.speedLabel) ?? SPEED_OPTIONS[2];
      this.conf.cells = [snapshot.cells[0], snapshot.cells[1]];
      this.conf.animation = snapshot.animation
        ? findByLabel(this.animations, snapshot.animation)
        : null;
      this.conf.animationInvert = snapshot.animationInvert;
      this.conf.staticEffects = snapshot.staticEffects
        .map((label) => findByLabel(allStaticOptions, label))
        .filter((option): option is EffectOption => option !== null);
      this.conf.effects = snapshot.effects
        .map((label) => findByLabel(allEffectOptions, label))
        .filter((option): option is EffectOption => option !== null);
      this.conf.webglEffects = snapshot.webglEffects
        .map((label) => findByLabel(allWebglOptions, label))
        .filter((option): option is WebGLEffectOption => option !== null);
      this.conf.staticEffectParams = snapshot.staticEffectParams;
      this.conf.effectParams = snapshot.effectParams;
      this.conf.webglEffectParams = snapshot.webglEffectParams;
      this.conf.trimH = [snapshot.trimH[0], snapshot.trimH[1]];
      this.conf.trimV = [snapshot.trimV[0], snapshot.trimV[1]];
      this.conf.noCrop = snapshot.noCrop;
      this.conf.easing = findByLabel(easings, snapshot.easing) ?? easings[0];
      this.conf.duration = snapshot.duration;
      this.conf.backgroundColor = snapshot.backgroundColor;
      this.conf.transparent = snapshot.transparent;
      this.$nextTick(() => {
        this.applyingHistory = false;
      });
    },
    scheduleHistoryPush(): void {
      if (this.applyingHistory) {
        return;
      }
      if (this.historyTimer !== null) {
        clearTimeout(this.historyTimer);
      }
      this.historyTimer = setTimeout(() => {
        this.historyTimer = null;
        this.pushHistory();
      }, HISTORY_DEBOUNCE_MS);
    },
    pushHistory(): void {
      const snapshot = JSON.stringify(this.snapshotConf());
      if (snapshot === this.undoStack[this.undoStack.length - 1]) {
        return;
      }
      this.undoStack.push(snapshot);
      if (this.undoStack.length > HISTORY_LIMIT) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    },
    undo(): void {
      // pending debounced changes should count as "the current state" first
      if (this.historyTimer !== null) {
        clearTimeout(this.historyTimer);
        this.historyTimer = null;
        this.pushHistory();
      }
      if (!this.canUndo) {
        return;
      }
      const current = this.undoStack.pop() as string;
      this.redoStack.push(current);
      const previous = this.undoStack[this.undoStack.length - 1];
      this.applyConfSnapshot(JSON.parse(previous));
    },
    redo(): void {
      if (!this.canRedo) {
        return;
      }
      const snapshot = this.redoStack.pop() as string;
      this.undoStack.push(snapshot);
      this.applyConfSnapshot(JSON.parse(snapshot));
    },
    onKeydown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      const isEditable = !!target && (
        target.tagName === "INPUT"
        || target.tagName === "TEXTAREA"
        || target.isContentEditable
      );
      if (isEditable) {
        return;
      }
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      if (!ctrlOrCmd || event.key.toLowerCase() !== "z") {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    },
    // --- presets -----------------------------------------------------
    savePreset(): void {
      const name = this.newPresetName.trim() || `プリセット ${this.presets.length + 1}`;
      const preset: Preset = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        snapshot: this.snapshotConf(),
        savedAt: Date.now(),
      };
      this.presets = [preset, ...this.presets];
      savePresetsToStorage(this.presets);
      this.newPresetName = "";
    },
    applyPreset(preset: Preset): void {
      this.applyConfSnapshot(preset.snapshot);
      this.scheduleHistoryPush();
    },
    deletePreset(preset: Preset): void {
      // eslint-disable-next-line no-alert
      if (!window.confirm(`「${preset.name}」を削除しますか？`)) {
        return;
      }
      this.presets = this.presets.filter((p) => p.id !== preset.id);
      savePresetsToStorage(this.presets);
    },
    async sharePreset(preset: Preset): Promise<void> {
      const code = encodePresetToCode(preset);
      try {
        await navigator.clipboard.writeText(code);
        this.copiedPresetId = preset.id;
        window.setTimeout(() => {
          if (this.copiedPresetId === preset.id) {
            this.copiedPresetId = null;
          }
        }, 2000);
      } catch (e) {
        // クリップボードAPIが使えない場合は手動コピー用に表示する
        // eslint-disable-next-line no-alert
        window.prompt("このコードをコピーしてください:", code);
      }
    },
    importPresetFromCode(): void {
      const decoded = decodePresetFromCode(this.importCode);
      if (!decoded) {
        this.importError = true;
        return;
      }
      this.importError = false;
      const preset: Preset = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: decoded.name,
        snapshot: decoded.snapshot,
        savedAt: Date.now(),
      };
      this.presets = [preset, ...this.presets];
      savePresetsToStorage(this.presets);
      this.importCode = "";
    },
    // merges an effect's param defaults with the current slider values
    resolveParams(
      option: EffectOption | WebGLEffectOption,
      store: ParamValues,
    ): Record<string, number> | undefined {
      if (!option.params) {
        return undefined;
      }
      const current = store[option.label] || {};
      const resolved: Record<string, number> = {};
      option.params.forEach((param) => {
        resolved[param.key] = typeof current[param.key] === "number"
          ? current[param.key]
          : param.default;
      });
      return resolved;
    },
    withEffectParams(option: EffectOption, store: ParamValues): Effect {
      const params = this.resolveParams(option, store);
      if (!params) {
        return option.value;
      }
      return (keyframe, ctx, width, height) => option.value(keyframe, ctx, width, height, params);
    },
    withWebGLEffectParams(option: WebGLEffectOption, store: ParamValues): WebGLEffect {
      const params = this.resolveParams(option, store);
      if (!params) {
        return option.value;
      }
      return (keyframe, width, height) => option.value(keyframe, width, height, params);
    },
    refreshDefaultSettings(): void {
      if (this.baseImage) {
        const image = this.baseImage;
        const { height, width } = image;
        const hCells = this.conf.cells[0];
        const vCells = this.conf.cells[1];
        let widthPerCell = width / hCells;
        let heightPerCell = height / vCells;
        let aspect = 1;
        if (this.conf.trimming.value === "cover") {
          widthPerCell = Math.min(widthPerCell, heightPerCell);
          heightPerCell = widthPerCell;
        } else if (this.conf.trimming.value === "contain") {
          widthPerCell = Math.max(widthPerCell, heightPerCell);
          heightPerCell = widthPerCell;
        } else if (this.conf.trimming.value === "stretch") {
          aspect = width / height;
        }
        const offsetH = Math.floor((width - widthPerCell * hCells) / 2);
        const offsetV = Math.floor((height - heightPerCell * vCells) / 2);
        this.conf.trimH = [offsetH, width - offsetH];
        this.conf.trimV = offsetV < 0 ? (
          [offsetV, height - offsetV]
        ) : (
          [0, height - offsetV * 2]
        );
        this.conf.targetAspect = aspect;
      }
    },
    selectSpeed(speed: SpeedOption): void {
      this.conf.duration = speed.value;
    },
    toggleAutoSize(value: boolean): void {
      this.$emit("update:emojiSize", value ? null : EMOJI_SIZE);
    },
    changeEmojiSize(value: number): void {
      this.$emit("update:emojiSize", value);
    },
    render(dirty?: boolean): void {
      if (dirty) {
        this.dirty = true;
      }
      if (!this.dirty || this.running) {
        return;
      }
      this.running = true;
      this.dirty = false;
      if (this.baseImage) {
        const animated = !!(
          this.conf.animation
          || this.conf.effects.length
          || this.conf.webglEffects.length
        );

        const framerate = Math.min(FRAMERATE_MAX, Math.ceil(FRAMECOUNT_MAX / this.conf.duration));
        const framecount = Math.floor(this.conf.duration * framerate);

        const maxSize = this.emojiSize || (animated ? ANIMATED_EMOJI_SIZE : EMOJI_SIZE);
        const aspectCoef = Math.sqrt(this.conf.targetAspect);
        const binarySizeLimit = this.emojiSize ? Infinity : BINARY_SIZE_LIMIT;
        renderAllCells(
          this.baseImage,
          this.conf.trimH[0],
          this.conf.trimV[0],
          this.conf.cells[0],
          this.conf.cells[1],
          this.conf.trimH[1] - this.conf.trimH[0],
          this.conf.trimV[1] - this.conf.trimV[0],
          Math.max(maxSize * aspectCoef, 1),
          Math.max(maxSize / aspectCoef, 1),
          this.conf.noCrop,
          animated,
          this.conf.animation ? this.conf.animation.value : null,
          this.conf.animationInvert,
          this.conf.effects.map((eff) => this.withEffectParams(eff, this.conf.effectParams)).concat(
            this.conf.staticEffects.map((eff) => this.withEffectParams(eff, this.conf.staticEffectParams)),
          ),
          this.conf.webglEffects.map((eff) => this.withWebGLEffectParams(eff, this.conf.webglEffectParams)),
          this.conf.easing.value,
          framerate,
          framecount,
          this.conf.backgroundColor,
          this.conf.transparent,
          binarySizeLimit,
        ).then((res) => {
          this.$emit("render", res);
          this.running = false;
          this.render();
        });
      }
    },
  },
});
</script>

<template>
  <Card v-if="show">
    <div class="history-bar">
      <Button
          type="text"
          name="元に戻す (Ctrl+Z)"
          :disabled="!canUndo"
          @click="undo">
        <template #icon>
          ↩️
        </template>
        元に戻す
      </Button>
      <Button
          type="text"
          name="やり直す (Ctrl+Shift+Z)"
          :disabled="!canRedo"
          @click="redo">
        <template #icon>
          ↪️
        </template>
        やり直す
      </Button>
    </div>
    <Fieldset label="プリセット" class="preset-fieldset">
      <Space vertical full>
        <div class="preset-save-row">
          <Input
              v-model="newPresetName"
              name="プリセット名"
              block
              placeholder="プリセット名(空欄でも可)" />
          <Button type="text" name="現在の設定を保存" @click="savePreset">
            <template #icon>
              💾
            </template>
            保存
          </Button>
        </div>
        <p v-if="presets.length === 0" class="preset-empty">
          保存したプリセットはまだありません。
        </p>
        <ul v-else class="preset-list">
          <li v-for="preset in presets" :key="preset.id" class="preset-item">
            <span class="preset-name">{{ preset.name }}</span>
            <Button type="text" name="このプリセットを読み込む" @click="applyPreset(preset)">
              読み込む
            </Button>
            <Button type="text" name="このプリセットの共有コードをコピー" @click="sharePreset(preset)">
              {{ copiedPresetId === preset.id ? "コピーしました！" : "共有" }}
            </Button>
            <Button type="text" danger name="このプリセットを削除" @click="deletePreset(preset)">
              削除
            </Button>
          </li>
        </ul>
        <div class="preset-import-row">
          <Input
              v-model="importCode"
              name="共有コード"
              block
              :error="importError"
              placeholder="もらった共有コードを貼り付け" />
          <Button type="text" name="共有コードから追加" @click="importPresetFromCode">
            <template #icon>
              📥
            </template>
            追加
          </Button>
        </div>
        <p v-if="importError" class="preset-import-error">
          コードを読み取れませんでした。コピーミスがないか確認してください。
        </p>
      </Space>
    </Fieldset>
    <Grid v-if="!devMode" :columns="[[450, 1], [Infinity, 2]]" spaced>
      <GridItem>
        <Space vertical xlarge full>
          <Fieldset label="アニメーション">
            <Space vertical full>
              <Select
                  v-model="conf.animation"
                  name="アニメーション"
                  nullable :options="animations" />
              <Checkbox v-model="conf.animationInvert" name="逆再生">
                {{ "逆再生" }}
              </Checkbox>
            </Space>
          </Fieldset>
          <EffectBlock
              v-model="conf.webglEffects"
              v-model:paramValues="conf.webglEffectParams"
              :effects="webgleffects" />
          <EffectBlock
              v-model="conf.effects"
              v-model:paramValues="conf.effectParams"
              :effects="effects" />
          <EffectBlock
              v-if="showDetails"
              v-model="conf.effects"
              v-model:paramValues="conf.effectParams"
              :effects="bgeffects" />
          <Fieldset v-if="showDetails" label="画像サイズ">
            <Space vertical full>
              <Checkbox
                  :model-value="emojiSize === null"
                  name="画像サイズ自動"
                  @update:model-value="toggleAutoSize">
                自動
              </Checkbox>
              <Number
                  v-if="emojiSize !== null"
                  :model-value="emojiSize"
                  :min="1"
                  @update:model-value="changeEmojiSize" />
            </Space>
          </Fieldset>
          <Fieldset v-if="showDetails && isDev" label="開発者向け">
            <Button danger type="text" name="エフェクトエディタ" @click="devMode = true">
              <template #icon>
                🔨
              </template>
              エフェクトエディタ
            </Button>
          </Fieldset>
        </Space>
      </GridItem>
      <GridItem>
        <Space vertical xlarge full>
          <Fieldset v-if="!showDetails" label="切り抜き">
            <Select
                v-model="conf.trimming"
                name="切り抜き"
                :options="TRIMMING_OPTIONS"
                @update:model-value="refreshDefaultSettings" />
          </Fieldset>
          <CellcountBlock
              v-if="showDetails"
              v-model="conf.cells"
              @update:model-value="refreshDefaultSettings" />
          <Fieldset v-if="showDetails" label="トリミング (横)">
            <Slider
                v-model="conf.trimH"
                block
                nonzero
                :marks="[0, baseImage.width]"
                :min="baseImage ? - Math.floor(baseImage.width * 0.5) : 0"
                :max="baseImage ? Math.ceil(baseImage.width * 1.5) : 0" />
          </Fieldset>
          <Fieldset v-if="showDetails" label="トリミング (縦)">
            <Slider
                v-model="conf.trimV"
                block
                nonzero
                :marks="[0, baseImage.height]"
                :min="baseImage ? - Math.floor(baseImage.height * 0.5) : 0"
                :max="baseImage ? Math.ceil(baseImage.height * 1.5) : 0" />
          </Fieldset>
          <Fieldset v-if="showDetails" label="アス比">
            <Slider
                v-model="conf.targetAspect"
                block
                nonzero
                :step="0.01"
                :marks="[1, naturalAspect]"
                :min="Math.min(0.2, naturalAspect)"
                :max="Math.max(5, naturalAspect)" />
          </Fieldset>
          <EffectBlock
              v-model="conf.staticEffects"
              v-model:paramValues="conf.staticEffectParams"
              :effects="staticeffects" />
          <Fieldset v-if="!showDetails" label="速度 (アニメ)">
            <Select
                v-model="conf.speed"
                name="速度(アニメ)"
                :options="SPEED_OPTIONS"
                @update:model-value="selectSpeed($event)" />
          </Fieldset>
          <Fieldset v-if="showDetails" label="長さ (アニメ)">
            <Slider
                v-model="conf.duration"
                block
                :min="0.1"
                :step="0.1"
                :max="2.0" />
          </Fieldset>
          <Fieldset label="イージング (アニメ)">
            <Select v-model="conf.easing" name="イージング" :options="easings" />
          </Fieldset>
          <Fieldset label="背景色">
            <Space vertical full>
              <Color
                  v-model="conf.backgroundColor"
                  name="背景色"
                  block
                  @update:model-value="conf.transparent = false" />
              <Checkbox v-model="conf.transparent" name="背景色(透過)">
                {{ "透過" }}
              </Checkbox>
            </Space>
          </Fieldset>
        </Space>
      </GridItem>
    </Grid>
    <template v-if="!devMode" #footer>
      <Checkbox v-model="showDetails" name="職人モード(効果)">
        {{ "職人モード" }}
      </Checkbox>
    </template>
    <DevTool
        v-if="devMode"
        v-model:no-crop="conf.noCrop"
        :show="show && devMode"
        @close="devMode = false"
        @build-animation="conf.animation = $event"
        @build-effect="conf.effects = [$event]"
        @build-shader="conf.webglEffects = [$event]" />
  </Card>
</template>

<style scoped>
.history-bar {
  display: flex;
  gap: var(--spacingMedium);
  margin-bottom: var(--spacingMedium);
}

.history-bar :deep(.button:disabled) {
  cursor: default;
  opacity: 0.35;
}

.preset-fieldset {
  margin-bottom: var(--spacingLarge);
}

.preset-save-row {
  display: flex;
  gap: var(--spacingMedium);
  align-items: center;
}

.preset-empty {
  margin: 0;
  font-size: var(--fontSizeMedium);
  color: var(--fg);
  opacity: 0.6;
}

.preset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: var(--spacingMedium);
  padding: var(--spacingSmall) 0;
}

.preset-name {
  overflow: hidden;
  font-size: var(--fontSizeMedium);
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.preset-import-row {
  display: flex;
  gap: var(--spacingMedium);
  align-items: center;
  padding-top: var(--spacingSmall);
  margin-top: var(--spacingSmall);
  border-top: 1px solid var(--border);
}

.preset-import-error {
  margin: 0;
  font-size: var(--fontSizeSmall, var(--fontSizeMedium));
  color: var(--danger);
}
</style>
