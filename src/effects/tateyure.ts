import { Effect } from "../types";

const effectTateyure: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 0.05 } = params;
  ctx.translate(
    0,
    -Math.sin(Math.PI * 2 * keyframe) * strength * cellHeight,
  );
};

export default effectTateyure;
