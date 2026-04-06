export const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3  uCameraPos;
uniform mat4  uViewMatInv;
uniform mat4  uProjMatInv;
uniform float uMass;
uniform float uSpin;
uniform float uIsco;
uniform float uRs;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskH0;
uniform float uDiskFlare;
uniform float uDiskOpacity;
uniform float uDiskVolSteps;
uniform float uTempScale;
uniform float uTime;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = p * 2.0 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

vec3 blackbody(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 warm = vec3(1.00, 0.84, 0.60);
  vec3 hot  = vec3(1.00, 0.97, 0.90);
  vec3 white = vec3(1.00, 1.00, 0.98);

  if (t < 0.5) {
    return mix(warm, hot, t * 2.0);
  }
  return mix(hot, white, (t - 0.5) * 2.0);
}

float diskHalfHeight(float r) {
  float rn = max(r, uDiskInner) / max(uDiskInner, 1e-4);
  return uDiskH0 * pow(rn, uDiskFlare);
}

vec3 starField(vec3 dir) {
  float theta = atan(dir.z, dir.x) * 0.15915494309 + 0.5;
  float phi   = acos(clamp(dir.y, -1.0, 1.0)) * 0.31830988618;

  vec3 col = vec3(0.0);

  for (int layer = 0; layer < 2; layer++) {
    float scale = 110.0 + float(layer) * 55.0;
    vec2 uv = vec2(theta, phi) * scale;
    vec2 cell = floor(uv);
    vec2 frac = fract(uv);

    for (int dx = -1; dx <= 1; dx++) {
      for (int dy = -1; dy <= 1; dy++) {
        vec2 nb = cell + vec2(float(dx), float(dy));
        float h = hash31(vec3(nb, float(layer) * 7.13));
        if (h > 0.987) {
          vec2 center = vec2(float(dx), float(dy))
                      + vec2(hash21(nb), hash21(nb + 5.7));
          float d = length(frac - center);
          float glow = exp(-d * d * 850.0);
          vec3 sCol = mix(
            vec3(1.0, 0.84, 0.70),
            vec3(0.72, 0.88, 1.0),
            hash21(nb + 3.4)
          );
          col += sCol * glow * 0.75;
        }
      }
    }
  }

  return col;
}

vec3 getRayDir() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, -1.0, 1.0);
  vec4 view = uProjMatInv * clip;
  view = vec4(view.xy, -1.0, 0.0);
  return normalize((uViewMatInv * view).xyz);
}

void main() {
  vec3 pos = uCameraPos;
  vec3 dir = getRayDir();

  vec3 accum = vec3(0.0);
  float transmittance = 1.0;

  const int STEPS = 900;
  const float MAX_R = 500.0;

  float upperLift = 0.0;
  float centerLineBoost = 0.0;

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);

    if (r < uRs) {
      transmittance = 0.0;
      break;
    }

    if (r > MAX_R || transmittance < 0.002) {
      break;
    }

    float dt = clamp(0.020 * (r - uRs), 0.004, 0.70);

    vec3 hVec = cross(pos, dir);
    float h2 = dot(hVec, hVec);

    dir += (-2.05 * h2 / max(pow(r, 5.0), 1e-6)) * pos * dt;

    float dragging = (2.0 * uMass * uSpin) / max(pow(r, 3.0), 1e-6);
    dir += cross(vec3(0.0, 1.0, 0.0), dir) * dragging * dt;
    dir = normalize(dir);

    pos += dir * dt;

    float realInner = max(uDiskInner, uIsco);
    float rPlane = length(pos.xz);
    float H = diskHalfHeight(rPlane);

    if (rPlane > realInner && rPlane < uDiskOuter && abs(pos.y) < H) {
      float Hs = max(H, 0.010);
      float yNorm = pos.y / Hs;

      float vertical = exp(-0.5 * yNorm * yNorm);

      float angle = atan(pos.z, pos.x);
      float swirl = angle + log(max(rPlane * 0.34, 1e-4)) * 2.3 - uTime * 0.06;

      float textureA = fbm(vec2(cos(swirl), sin(swirl)) * rPlane * 0.14);
      float textureB = fbm(vec2(angle * 1.4, rPlane * 0.08));
      float textureMix = 0.96 + 0.05 * textureA + 0.02 * textureB;

      float radialFade = 1.0 - smoothstep(uDiskOuter * 0.72, uDiskOuter, rPlane);
      float innerBoost = 1.0 - smoothstep(realInner, realInner * 1.65, rPlane);
      innerBoost = mix(1.0, 1.35, innerBoost);

      vec3 tangent = normalize(vec3(-pos.z, 0.0, pos.x));
      float cosA = -dot(tangent, normalize(uCameraPos - pos));

      float v = clamp(sqrt(uMass / max(rPlane, 0.1)) + dragging * rPlane, 0.0, 0.86);
      float gamma = 1.0 / sqrt(max(1.0 - v * v, 1e-4));
      float g = sqrt(max(1.0 - uRs / max(rPlane, 0.1), 1e-4))
              / (gamma * (1.0 - v * cosA));

      float temp = clamp(pow(realInner / max(rPlane, realInner), 0.72) / uTempScale, 0.0, 1.0);
      vec3 col = blackbody(temp);

      float gFactor = pow(clamp(g, 0.86, 1.24), 1.9);
      float density = vertical * textureMix * radialFade * innerBoost;

      vec3 rawCol = col * density * gFactor;
      vec3 mappedCol = rawCol / (1.0 + rawCol * 0.95);
      mappedCol = pow(mappedCol, vec3(0.94));

      float localOpacity = uDiskOpacity * mix(1.08, 0.92, smoothstep(0.0, 1.0, abs(yNorm)));
      accum += mappedCol * localOpacity * dt * 0.26;
      transmittance *= exp(-localOpacity * density * dt * 1.18);

      float lift = smoothstep(0.03, 0.90, pos.y / max(H * 1.10, 1e-4));
      upperLift = max(upperLift, lift * 0.34);

      float lineBoost = exp(-abs(pos.y) / max(H * 0.22, 1e-4));
      centerLineBoost = max(centerLineBoost, lineBoost * 0.42);

      if (dot(accum, vec3(0.3333)) > 2.5) {
        break;
      }
    }
  }

  float finalR = length(pos);

  float photonRing =
      smoothstep(uRs * 1.95, uRs * 1.62, finalR) -
      smoothstep(uRs * 1.62, uRs * 1.34, finalR);
  photonRing = pow(max(photonRing, 0.0), 1.6);

  float lowerRing =
      smoothstep(uRs * 1.85, uRs * 1.52, finalR) -
      smoothstep(uRs * 1.52, uRs * 1.22, finalR);
  lowerRing = pow(max(lowerRing, 0.0), 1.2);

  float halo =
      smoothstep(uRs * 2.10, uRs * 1.55, finalR) -
      smoothstep(uRs * 1.55, uRs * 1.10, finalR);
  halo = max(halo, 0.0);

  vec3 ringCol = vec3(1.0, 0.995, 0.96) * photonRing * 0.95;
  vec3 lowerRingCol = vec3(1.0, 0.99, 0.95) * lowerRing * 0.55;
  vec3 haloCol = vec3(1.0, 0.985, 0.94) * halo * 0.16;

  vec3 bg = starField(dir) + vec3(0.004, 0.0045, 0.008);

  vec3 color = accum + ringCol + lowerRingCol + haloCol + bg * transmittance;

  color += vec3(1.0, 0.98, 0.94) * upperLift * 0.18;
  color += vec3(1.0, 0.98, 0.94) * centerLineBoost * 0.10;

  float shadow = smoothstep(uRs * 0.92, uRs * 1.18, finalR);
  color *= shadow;

  color = color / (1.0 + color * 0.52);
  color = pow(color, vec3(0.92));

  float dither = (hash21(gl_FragCoord.xy + vUv * 137.0) - 0.5) * 0.008;
  color += dither;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;