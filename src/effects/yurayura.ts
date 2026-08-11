import { Effect } from "../types";

const effectYurayura: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 0.25 } = params;
  ctx.translate(cellWidth / 2, cellHeight * 3 / 4);
  ctx.rotate(strength * Math.sin(keyframe * 2 * Math.PI));
  ctx.translate(-cellWidth / 2, -cellHeight * 3 / 4);
};

export default effectYurayura;
