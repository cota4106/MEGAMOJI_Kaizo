import { Effect } from "../types";

let lastGata = false;

const effectGatagata: Effect = (keyframe, ctx, cellWidth, cellHeight, params = {}) => {
  const { strength = 1 } = params;
  lastGata = !lastGata;
  ctx.translate(
    cellWidth / 2 + (Math.random() - 0.5) * 4 * strength,
    cellHeight / 2 + (Math.random() - 0.5) * 4 * strength,
  );
  ctx.rotate((lastGata ? -0.05 : 0.05) * strength);
  ctx.translate(-cellWidth / 2, -cellHeight / 2);
};

export default effectGatagata;
