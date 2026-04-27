export const magnetosphereVertex = `
  attribute float aSize;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    float t = uTime * 0.5;
    pos.x += sin(pos.y * 1.2 + t) * 0.02;
    pos.z += cos(pos.x * 1.2 + t) * 0.02; 

    vAlpha = 0.6 + 0.4 * sin(length(pos) * 1.2 + t);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (120.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const magnetosphereFragment = `
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d);

    vec3 color = vec3(0.2, 0.6, 1.0);
    gl_FragColor = vec4(color, alpha * vAlpha * 0.35);
  }
`;