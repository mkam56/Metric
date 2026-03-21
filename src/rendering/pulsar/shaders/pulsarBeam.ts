export const vertexShader = /* glsl */ `
varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vLocalPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform float uHalfHeight;
uniform float uBaseRadius;
uniform float uTipRadius;
uniform float uIntensity;
uniform float uOpacity;
uniform float uTime;

varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  float axial = clamp(vLocalPos.y / (uHalfHeight * 2.0) + 0.5, 0.0, 1.0);
  float beamRadius = mix(uBaseRadius, uTipRadius, axial);
  float radial = length(vLocalPos.xz);

  float core = 1.0 - smoothstep(0.0, beamRadius * 0.34, radial);
  float body = 1.0 - smoothstep(beamRadius * 0.18, beamRadius * 0.82, radial);
  float sheath = 1.0 - smoothstep(beamRadius * 0.82, beamRadius * 1.08, radial);
  float nearFade = smoothstep(0.0, 0.03, axial);
  float farFade = 1.0 - smoothstep(0.97, 1.0, axial);
  float envelope = nearFade * farFade;

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), 1.2);

  float density = envelope;
  vec3 color = uPrimaryColor * (body * 0.9 + sheath * 0.26) + uSecondaryColor * core * 1.15;
  color *= (0.96 + rim * 0.38) * density * uIntensity;

  float alpha = (core * 0.24 + body * 0.12 + sheath * 0.04) * density * (0.82 + rim * 0.28) * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
`;
