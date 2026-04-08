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
uniform float uRs;

uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskH0;
uniform float uDiskFlare;
uniform float uDiskOpacity;
uniform float uDiskVolSteps;
uniform float uTempScale;

uniform float uJetPower;
uniform float uCoreStrength;
uniform float uDustStrength;
uniform float uTime;

varying vec2 vUv;

// ─────────────────────────────────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.31830 + 0.11);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * valueNoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return v;
}

// ─────────────────────────────────────────────────────────────────
float diskHalfHeight(float r) {
  float rn = max(r, uDiskInner) / max(uDiskInner, 1e-4);
  return uDiskH0 * pow(rn, uDiskFlare);
}

vec3 quasarColor(float t) {
  t = clamp(t, 0.0, 1.0);

  vec3 c1 = vec3(0.02, 0.06, 0.18);
  vec3 c2 = vec3(0.08, 0.22, 0.56);
  vec3 c3 = vec3(0.30, 0.66, 0.94);
  vec3 c4 = vec3(0.88, 0.95, 1.00);

  if (t < 0.33) {
    return mix(c1, c2, t / 0.33);
  } else if (t < 0.66) {
    return mix(c2, c3, (t - 0.33) / 0.33);
  }
  return mix(c3, c4, (t - 0.66) / 0.34);
}

// ─────────────────────────────────────────────────────────────────
vec3 starField(vec3 dir) {
  float theta = atan(dir.z, dir.x) * 0.15915 + 0.5;
  float phi   = acos(clamp(dir.y, -1.0, 1.0)) * 0.31831;

  vec3 col = vec3(0.0);

  for (int layer = 0; layer < 3; layer++) {
    float scale = 90.0 + float(layer) * 60.0;
    vec2  scaledUV = vec2(theta, phi) * scale;
    vec2  cellID   = floor(scaledUV);
    vec2  cellFrac = fract(scaledUV);

    for (int dx = -1; dx <= 1; dx++) {
      for (int dy = -1; dy <= 1; dy++) {
        vec2 nb = cellID + vec2(float(dx), float(dy));
        float h = hash31(vec3(nb, float(layer) * 7.1));

        float spawnThresh = 0.982 - float(layer) * 0.004;
        if (h > spawnThresh) {
          float ox = hash21(nb + float(layer) * 17.3) * 0.7 + 0.15;
          float oy = hash21(nb + float(layer) * 43.1) * 0.7 + 0.15;
          vec2 starCenter = vec2(float(dx), float(dy)) + vec2(ox, oy);

          vec2 d = cellFrac - starCenter;
          float dist = length(d);

          float brightness = hash21(nb + float(layer) * 5.9) * 0.7 + 0.3;
          float core = exp(-dist * dist * 900.0) * brightness;
          float halo = exp(-dist * dist * 120.0) * brightness * 0.35;
          float colorRand = hash21(nb + float(layer) * 61.1);
          vec3 starCol = mix(vec3(1.0, 0.82, 0.55), vec3(0.72, 0.88, 1.0), colorRand);

          col += starCol * (core + halo);
        }
      }
    }
  }

  return col;
}

// ─────────────────────────────────────────────────────────────────
vec3 getRayDir() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, -1.0, 1.0);
  vec4 vDir = uProjMatInv * clip;
  vDir = vec4(vDir.xy, -1.0, 0.0);
  return normalize((uViewMatInv * vDir).xyz);
}

// ─────────────────────────────────────────────────────────────────
void main() {
  vec3 pos = uCameraPos;
  vec3 dir = getRayDir();

  vec3 accum = vec3(0.0);
  float transmittance = 1.0;

  const int STEPS = 220;
  const int MAX_VOL_STEPS = 24;
  const float MAX_R = 500.0;

  int volSteps = clamp(int(uDiskVolSteps), 1, MAX_VOL_STEPS);

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);

    if (r > MAX_R) break;
    if (transmittance < 0.002) break;

    float dt = clamp(0.08 * max(1.0, r - 1.0), 0.03, 1.6);

    vec3 prevPos = pos;
    pos += dir * dt;

    // -------------------------------------------------------------
    // ЯДРО — СЛАБЕЕ И КОМПАКТНЕЕ
    float coreR = length(pos);

    float coreInner = exp(-coreR * 1.75);
    float coreMid   = exp(-coreR * 0.62);
    float coreOuter = exp(-coreR * 0.18);

    accum += vec3(1.00, 0.99, 0.97) * coreInner * 0.080 * uCoreStrength * transmittance * dt;
    accum += vec3(0.86, 0.94, 1.00) * coreMid   * 0.052 * uCoreStrength * transmittance * dt;
    accum += vec3(0.18, 0.34, 0.72) * coreOuter * 0.016 * uCoreStrength * transmittance * dt;

    // -------------------------------------------------------------
    // ДИСК
    float r0 = length(prevPos.xz);
    float r1 = length(pos.xz);
    float Hseg = max(diskHalfHeight(r0), diskHalfHeight(r1));

    vec3 seg = pos - prevPos;
    float segLen = length(seg);

    if (Hseg > 0.0 && segLen > 1e-6) {
      float y0 = prevPos.y;
      float dy = seg.y;
      float tEnter = 0.0;
      float tExit = 1.0;
      bool hitSlab = true;

      if (abs(dy) < 1e-6) {
        if (abs(y0) > Hseg) hitSlab = false;
      } else {
        float t0 = (-Hseg - y0) / dy;
        float t1 = ( Hseg - y0) / dy;
        tEnter = max(0.0, min(t0, t1));
        tExit  = min(1.0, max(t0, t1));
        if (tExit <= tEnter) hitSlab = false;
      }

      if (hitSlab) {
        float segFrac  = tExit - tEnter;
        float segLenIn = segLen * segFrac;
        float dtSeg    = segFrac / float(volSteps);
        float ds       = segLenIn / float(volSteps);

        for (int s = 0; s < MAX_VOL_STEPS; s++) {
          if (s >= volSteps) break;

          float t = tEnter + (float(s) + 0.5) * dtSeg;
          vec3 p = prevPos + seg * t;
          float rp = length(p.xz);

          if (rp <= uDiskInner || rp >= uDiskOuter) continue;

          float Hs = max(diskHalfHeight(rp), 1e-4);
          float z  = p.y;
          float rho = exp(-0.5 * (z * z) / (Hs * Hs));

          float angle = atan(p.z, p.x);
          float spiral = angle + log(max(rp, 1e-4)) * 8.8 - uTime * (uTempScale * 4.0);

          float arms1 = 0.5 + 0.5 * sin(spiral * 3.0);
          float arms2 = 0.5 + 0.5 * sin(spiral * 4.0 + 0.7);
          float arms3 = 0.5 + 0.5 * sin(spiral * 5.0 - 0.4);
          float arms = arms1 * 0.45 + arms2 * 0.35 + arms3 * 0.20;
          arms = pow(arms, 2.2);
          arms = smoothstep(0.18, 1.0, arms);

          float turb1 = fbm(vec2(angle * 3.8, rp * 0.42 - uTime * 0.20));
          float turb2 = fbm(vec2(cos(angle), sin(angle)) * rp * 0.35 + uTime * 0.08);
          float turb = 0.70 + 0.22 * turb1 + 0.14 * turb2;

          float temp = 1.0 - smoothstep(uDiskInner, uDiskOuter, rp);
          vec3 dCol = quasarColor(temp);

          float radialInner = 1.0 - smoothstep(uDiskInner, uDiskInner + 2.5, rp);
          float radialOuter = 1.0 - smoothstep(uDiskInner, uDiskOuter, rp);
          float radialFade = radialOuter * 0.82 + radialInner * 0.38;

          float structure = mix(0.35, 2.10, arms) * turb;
          float armBoost = mix(0.65, 1.85, arms);

          float density = rho * radialFade * structure * armBoost * uDiskOpacity;
          float emission = density * 0.04;

          accum += dCol * emission * transmittance * ds;

          // Пыль / дымка на концах
          float dustNoise1 = fbm(p.xz * 0.12 + vec2(0.0, uTime * 0.010));
          float dustNoise2 = fbm(p.xz * 0.22 - vec2(uTime * 0.016, 0.0));
          float dustBand = smoothstep(uDiskOuter * 0.55, uDiskOuter * 0.95, rp) *
                           (1.0 - smoothstep(uDiskOuter * 0.95, uDiskOuter * 1.55, rp));

          vec3 dustCol = vec3(0.03, 0.08, 0.18) * dustBand * dustNoise1 * 0.030 * uDustStrength;
          dustCol += vec3(0.08, 0.18, 0.38) * dustBand * dustNoise2 * 0.020 * uDustStrength;
          accum += dustCol * transmittance * ds;

          transmittance *= exp(-0.035 * rho * ds);
          if (transmittance < 0.002) break;
        }
      }
    }

    // -------------------------------------------------------------
    // ДЖЕТ — ДЕЛАЕМ ДЛИННЕЕ И ВИДИМЕЕ
    float jetRadius = length(pos.xz);

    float jetCore = exp(-jetRadius * 2.2) * smoothstep(2.0, 30.0, abs(pos.y));
    float jetHalo = exp(-jetRadius * 1.0) * smoothstep(2.0, 45.0, abs(pos.y));

    // НЕ даём диску "съедать" джет
    float jetTrans = max(transmittance, 0.35);

    accum += vec3(0.96, 0.99, 1.0) * jetCore * 0.20 * uJetPower * jetTrans * dt;
    accum += vec3(0.28, 0.56, 1.0) * jetHalo * 0.05 * uJetPower * jetTrans * dt; 
  }

  vec3 bg = starField(dir) + vec3(0.006, 0.006, 0.018);
  vec3 color = accum + bg * transmittance;

  float dither = hash21(gl_FragCoord.xy) - 0.5;
  color += dither / 255.0;

  color *= 0.92;
  color = 1.0 - exp(-color * 1.04);
  color = pow(color, vec3(0.92));

  gl_FragColor = vec4(color, 1.0);
}
`;