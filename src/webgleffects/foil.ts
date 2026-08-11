import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetFloat } from "../utils/webgl";
import shaderFoil from "../shaders/foil.glsl";

const shader = webglEffectShader(shaderFoil.sourceCode);

const webglFoil: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { width: bandWidth = 0.2, brightness = 0.4 } = params;
  const program = webglLoadEffectShader(shader);
  webglSetFloat(program, "width", bandWidth);
  webglSetFloat(program, "brightness", brightness);
  webglSetFloat(program, "ratio", width / height);
  webglSetFloat(program, "keyframe", keyframe);
  return program;
};

export default webglFoil;
