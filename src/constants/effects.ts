import effectBlink from "../effects/blink";
import effectShadowBlur from "../effects/shadowBlur";
import effectShadowNeon from "../effects/shadowNeon";
import effectShadowRotate from "../effects/shadowRotate";
import effectPatapata from "../effects/patapata";
import effectRoulette from "../effects/roulette";
import effectNeruneru from "../effects/neruneru";
import effectYokoyure from "../effects/yokoyure";
import effectTateyure from "../effects/tateyure";
import effectGatagata from "../effects/gatagata";
import effectYatta from "../effects/yatta";
import effectPoyon from "../effects/poyon";
import effectMotimoti from "../effects/motimoti";
import effectNorinori from "../effects/norinori";
import effectYurayura from "../effects/yurayura";
import effectZoom from "../effects/zoom";
import effectStraight from "../effects/straight";
import effectStamp from "../effects/stamp";

export default [
  {
    label: "変形",
    effects: [
      {
        label: "ガタガタ",
        value: effectGatagata,
        params: [
          { key: "strength", label: "強さ", min: 0.2, max: 3, step: 0.1, default: 1 },
        ],
      },
      {
        label: "びょいんびょいん",
        value: effectZoom,
        params: [
          { key: "strength", label: "強さ", min: 0.1, max: 1.2, step: 0.05, default: 0.5 },
        ],
      },
      { label: "ルーレット", value: effectRoulette },
      {
        label: "ねるねる",
        value: effectNeruneru,
        params: [
          { key: "strength", label: "強さ", min: 0.01, max: 0.2, step: 0.01, default: 0.05 },
        ],
      },
      {
        label: "横ゆれ",
        value: effectYokoyure,
        params: [
          { key: "strength", label: "強さ", min: 0.01, max: 0.2, step: 0.01, default: 0.05 },
        ],
      },
      {
        label: "縦ゆれ",
        value: effectTateyure,
        params: [
          { key: "strength", label: "強さ", min: 0.01, max: 0.2, step: 0.01, default: 0.05 },
        ],
      },
      {
        label: "ゆらゆら",
        value: effectYurayura,
        params: [
          { key: "strength", label: "強さ", min: 0.05, max: 0.6, step: 0.01, default: 0.25 },
        ],
      },
      { label: "ぱたぱた", value: effectPatapata },
      { label: "ヤッタ", value: effectYatta },
      {
        label: "ぽよーん",
        value: effectPoyon,
        params: [
          { key: "strength", label: "強さ", min: 0.2, max: 2, step: 0.05, default: 1 },
        ],
      },
      {
        label: "もちもち",
        value: effectMotimoti,
        params: [
          { key: "strength", label: "強さ", min: 0.05, max: 0.6, step: 0.01, default: 0.25 },
        ],
      },
      { label: "ノリノリ", value: effectNorinori },
      { label: "BLINK", value: effectBlink },
      { label: "直球", value: effectStraight },
      {
        label: "スタンプ",
        value: effectStamp,
        params: [
          { key: "strength", label: "強さ", min: 0.1, max: 1, step: 0.05, default: 0.5 },
        ],
      },
    ],
  }, {
    label: "シャドウ",
    effects: [
      { label: "ぐるぐる", value: effectShadowRotate },
      { label: "ブラー", value: effectShadowBlur },
      { label: "ネオン", value: effectShadowNeon },
    ],
  },
];
