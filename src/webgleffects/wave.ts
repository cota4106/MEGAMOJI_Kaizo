import { WebGLEffect } from "../types";
import { webglEffectShader, webglLoadEffectShader, webglSetFloat } from "../utils/webgl";
import shaderWave from "../shaders/wave.glsl";

const shader = webglEffectShader(shaderWave.sourceCode);

const webglWave: WebGLEffect = (keyframe, width, height, params = {}) => {
  const { frequency = 2.0, amplitude = 0.02 } = params;
  const program = webglLoadEffectShader(shader);
  webglSetFloat(program, "frequency", frequency);
  webglSetFloat(program, "amplitude", amplitude);
  webglSetFloat(program, "keyframe", keyframe);
  return program;
};

export default webglWave;
