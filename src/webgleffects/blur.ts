import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetVec2 } from "../utils/webgl";
import shaderBlur from "../shaders/blur.glsl";

const shader = webglEffectShader(shaderBlur.sourceCode);

const webglBlur: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { amount = 0.04 } = params;
  const program = webglLoadEffectShader(shader);

  const radius = amount + amount * Math.cos(2 * Math.PI * (keyframe + 0.5));
  webglSetVec2(program, "delta", [radius, 0]);

  return program;
};

export default webglBlur;
