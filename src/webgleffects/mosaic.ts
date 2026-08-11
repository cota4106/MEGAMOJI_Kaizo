import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetFloat, webglSetVec2 } from "../utils/webgl";
import shaderMosaic from "../shaders/mosaic.glsl";

const shader = webglEffectShader(shaderMosaic.sourceCode);

const webglMosaic: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { size = 0.075 } = params;
  const program = webglLoadEffectShader(shader);

  const offset = keyframe * size;
  webglSetFloat(program, "size", size);
  webglSetVec2(program, "offset", [offset, offset]);

  return program;
};

export default webglMosaic;
