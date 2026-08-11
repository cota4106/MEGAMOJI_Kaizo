import { Effect } from "../types";

const effectMotimoti: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 0.25 } = params;
  const ratio = Math.sin(Math.PI * Math.abs(keyframe - 0.5) / 0.5) * strength;
  ctx.transform(1 + ratio, 0, 0, 1 - ratio, -ratio * cellWidth / 2, ratio * cellHeight * 3 / 4);
};

export default effectMotimoti;
