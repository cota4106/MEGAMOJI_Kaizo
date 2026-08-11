import { Effect } from "../types";

const effectNeruneru: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 0.05 } = params;
  ctx.translate(
    Math.cos(Math.PI * 2 * keyframe) * strength * cellWidth,
    Math.sin(Math.PI * 2 * keyframe) * strength * cellHeight,
  );
};

export default effectNeruneru;
