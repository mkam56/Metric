export const vertexShader = /* glsl */ `
varying vec3 vLocalPos;

void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uCoolColor;
uniform vec3 uHotColor;
uniform float uIntensity;
uniform float uOpacity;
uniform float uTime;

varying vec3 vLocalPos;

void main() {
  float r = length(vLocalPos.xz);
  float span = max(uOuterRadius - uInnerRadius, 1e-3);
  float radial = clamp((r - uInnerRadius) / span, 0.0, 1.0);
  float angle = atan(vLocalPos.z, vLocalPos.x);

  float innerMask = smoothstep(uInnerRadius * 0.96, uInnerRadius * 1.03, r);
  float outerMask = 1.0 - smoothstep(uOuterRadius * 0.9, uOuterRadius * 1.02, r);
  float ringMask = innerMask * outerMask;

  float streamA = 0.5 + 0.5 * sin(angle * 11.0 - uTime * 2.4 + radial * 8.0);
  float streamB = 0.5 + 0.5 * sin(angle * 24.0 + uTime * 4.1 - radial * 17.0);
  float streamC = 0.5 + 0.5 * sin(angle * 6.0 - uTime * 1.2 + radial * 12.0);
  float turbulence = streamA * 0.45 + streamB * 0.35 + streamC * 0.2;

  float hotBand = exp(-pow((radial - 0.22) / 0.18, 2.0));
  float coolBand = exp(-pow((radial - 0.58) / 0.28, 2.0));
  float density = ringMask * (0.14 + turbulence * 0.72 + hotBand * 0.36) * (1.0 - radial * 0.12);

  vec3 color = mix(uCoolColor, uHotColor, clamp(hotBand * 0.8 + turbulence * 0.28, 0.0, 1.0));
  color *= (0.24 + turbulence * 0.9 + coolBand * 0.22) * uIntensity;

  float alpha = density * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
`;
