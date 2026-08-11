import webglKira from "../webgleffects/kira";
import webglFoil from "../webgleffects/foil";
import webglBlur from "../webgleffects/blur";
import webglBlurVertical from "../webgleffects/blurVertical";
import webglZoom from "../webgleffects/zoom";
import webglDokaben from "../webgleffects/dokaben";
import webglWave from "../webgleffects/wave";
import webglStrobo from "../webgleffects/strobo";
import webglFocusLine from "../webgleffects/focusLine";
import webglGlitch from "../webgleffects/glitch";
import webglMosaic from "../webgleffects/mosaic";
import webglExplode from "../webgleffects/explode";

export default [
  {
    label: "特殊効果",
    effects: [
      {
        label: "キラ",
        value: webglKira,
        params: [
          { key: "speed", label: "速さ", min: 0.5, max: 8, step: 0.1, default: 2.0 },
        ],
      },
      {
        label: "横もや",
        value: webglBlur,
        params: [
          { key: "amount", label: "強さ", min: 0, max: 0.15, step: 0.005, default: 0.04 },
        ],
      },
      {
        label: "縦もや",
        value: webglBlurVertical,
        params: [
          { key: "amount", label: "強さ", min: 0, max: 0.15, step: 0.005, default: 0.04 },
        ],
      },
      {
        label: "Foil",
        value: webglFoil,
        params: [
          { key: "width", label: "帯の幅", min: 0.05, max: 0.6, step: 0.01, default: 0.2 },
          { key: "brightness", label: "明るさ", min: 0, max: 1, step: 0.01, default: 0.4 },
        ],
      },
      {
        label: "カベドン",
        value: webglDokaben,
        params: [
          { key: "strength", label: "強さ", min: 0.2, max: 2.5, step: 0.05, default: 1.0 },
        ],
      },
      {
        label: "残像",
        value: webglZoom,
        params: [
          { key: "amount", label: "強さ", min: 0.05, max: 0.6, step: 0.01, default: 0.25 },
        ],
      },
      {
        label: "ウェイヴ",
        value: webglWave,
        params: [
          { key: "frequency", label: "周波数", min: 0.5, max: 8, step: 0.1, default: 2.0 },
          { key: "amplitude", label: "振幅", min: 0, max: 0.1, step: 0.005, default: 0.02 },
        ],
      },
      {
        label: "ストロボ",
        value: webglStrobo,
        params: [
          { key: "intensity", label: "強さ", min: 0.02, max: 0.5, step: 0.01, default: 0.1 },
        ],
      },
      { label: "集中線", value: webglFocusLine },
      { label: "グリッチ", value: webglGlitch },
      {
        label: "モザイク",
        value: webglMosaic,
        params: [
          { key: "size", label: "粗さ", min: 0.02, max: 0.3, step: 0.005, default: 0.075 },
        ],
      },
      { label: "爆散", value: webglExplode },
    ],
  },
];
