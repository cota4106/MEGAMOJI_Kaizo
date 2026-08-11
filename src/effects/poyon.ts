import { Effect } from "../types";

const effectPoyonJump: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 1 } = params;
  ctx.translate(0, -cellHeight / 6 * strength * Math.sin(Math.PI * keyframe));
};

const effectPoyonBounce: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 1 } = params;
  const ratio = Math.sin(Math.PI * keyframe) / 2 * strength;
  ctx.transform(
    1 + ratio,
    0,
    0,
    1 - ratio,
    -ratio * cellWidth / 2,
    ratio * cellHeight * 3 / 4,
  );
};

const effectPoyon: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  if (keyframe < 0.4) {
    effectPoyonBounce(keyframe / 0.4, ctx, cellWidth, cellHeight, params);
  } else {
    effectPoyonJump((keyframe - 0.4) / 0.6, ctx, cellWidth, cellHeight, params);
  }
};

export default effectPoyon;
