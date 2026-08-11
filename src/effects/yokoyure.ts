import { Effect } from "../types";

const effectYokoyure: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 0.05 } = params;
  ctx.translate(
    Math.sin(Math.PI * 2 * keyframe) * strength * cellWidth,
    0,
  );
};

export default effectYokoyure;
