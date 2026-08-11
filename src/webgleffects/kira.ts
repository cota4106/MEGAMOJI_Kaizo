import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetFloat } from "../utils/webgl";
import shaderHueshift from "../shaders/hueshift.glsl";

const shader = webglEffectShader(shaderHueshift.sourceCode);

const webglKira: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { speed = 2.0 } = params;
  const program = webglLoadEffectShader(shader);

  webglSetFloat(program, "hue", keyframe * speed * Math.PI);

  return program;
};

export default webglKira;
