import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetMat3 } from "../utils/webgl";
import shaderWarp from "../shaders/warp.glsl";
import { matrixPerspective, matrixFlatten } from "../utils/matrix";

const shader = webglEffectShader(shaderWarp.sourceCode);

const webglDokaben: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { strength = 1.0 } = params;
  const program = webglLoadEffectShader(shader);

  const pos = keyframe < 0.25 ? 0 : 1 - (keyframe - 0.25) / 0.75; /* 0 -> 1 -> 0 */
  const diffH = 0.3 * strength * pos / 2;
  const diffV = 1.0 * strength * pos / 2;
  const m = matrixPerspective(
    [0.25, 0.25, 0.75, 0.25, 0.25, 0.75, 0.75, 0.75],
    [0.25 + diffH, 0.25 + diffV, 0.75 - diffH, 0.25 + diffV, 0.25, 0.75, 0.75, 0.75],
  );
  webglSetMat3(program, "matrix", matrixFlatten(m));

  return program;
};

export default webglDokaben;
