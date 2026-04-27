export const vertexShader = /* glsl */ `
varying vec3 vLocalNormal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vLocalNormal = normalize(normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform float uSurfaceRedshift;
uniform float uTime;

varying vec3 vLocalNormal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 localNormal = normalize(vLocalNormal);
  vec3 worldNormal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 lightDir = normalize(vec3(-0.28, 0.76, 0.32));

  float pole = abs(localNormal.y);
  float polar = smoothstep(0.78, 0.97, pole);
  float diffuse = 0.35 + 0.65 * max(dot(worldNormal, lightDir), 0.0);
  float fresnel = pow(1.0 - max(dot(worldNormal, viewDir), 0.0), 2.35);
  float redshiftFactor = 1.0 / (1.0 + uSurfaceRedshift * 0.55);
  float shimmer = 0.992 + 0.008 * sin(uTime * 0.2 + localNormal.x * 2.0);

  vec3 base = mix(vec3(0.28, 0.42, 0.84), vec3(0.62, 0.75, 1.06), diffuse);
  vec3 polarGlow = vec3(0.22, 0.42, 0.96) * polar * 0.16;
  vec3 rim = vec3(0.30, 0.50, 1.08) * fresnel * 0.58;

  vec3 color = base * redshiftFactor * shimmer + polarGlow + rim;
  gl_FragColor = vec4(color, 1.0);
}
`;
