// GLSL source for the full-screen ray-marching black hole render.
// Exported as TypeScript string constants — no Vite plugin required.

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

// ─────────────────────────────────────────────────────────────────
// fBm noise — used for disk turbulence
// ─────────────────────────────────────────────────────────────────
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Quintic smoothstep
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
  // 5 octaves of value noise for fiery turbulence
  for (int i = 0; i < 5; i++) {
    v   += amp * valueNoise(p);
    p    = p * 2.03 + vec2(1.7, 9.2); // slight offset per octave to break regularity
    amp *= 0.5;
  }
  return v; // range [0, ~1]
}

// ─────────────────────────────────────────────────────────────────
// Blackbody color ramp
// t=0 → deep red-orange (cool outer disk), t=1 → blue-white (hot inner edge)
// ─────────────────────────────────────────────────────────────────
vec3 blackbody(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 cool = vec3(0.80, 0.08, 0.00);
  vec3 mid  = vec3(1.00, 0.52, 0.05);
  vec3 hot  = vec3(0.80, 0.90, 1.00);
  return t < 0.5 ? mix(cool, mid, t * 2.0) : mix(mid, hot, (t - 0.5) * 2.0);
}

// ─────────────────────────────────────────────────────────────────
// Novikov-Thorne emissivity
// ─────────────────────────────────────────────────────────────────
float emissivity(float r, float rIn) {
  float f = rIn / r;
  float t = 1.0 - sqrt(f);
  return (t > 0.0) ? f * f * f * t : 0.0;
}

float diskHalfHeight(float r) {
  float rn = max(r, uDiskInner) / max(uDiskInner, 1e-4);
  return uDiskH0 * 0.42 * pow(rn, max(0.55, uDiskFlare * 0.55));
}

// ─────────────────────────────────────────────────────────────────
// Procedural star field with soft Gaussian profiles
// Stars are sampled on a spherical UV grid, each cell can spawn one star.
// Sub-cell position gives correct circular shape + soft glow rim.
// ─────────────────────────────────────────────────────────────────
vec3 starField(vec3 dir) {
  float theta = atan(dir.z, dir.x) * 0.15915 + 0.5; // /2π + 0.5
  float phi   = acos(clamp(dir.y, -1.0, 1.0)) * 0.31831; // /π

  vec3 col = vec3(0.0);

  for (int layer = 0; layer < 3; layer++) {
    float scale = 90.0 + float(layer) * 60.0;
    vec2  scaledUV = vec2(theta, phi) * scale;
    vec2  cellID   = floor(scaledUV);
    vec2  cellFrac = fract(scaledUV);

    // Sample current cell + 3x3 neighbors so stars near edges aren’t clipped
    for (int dx = -1; dx <= 1; dx++) {
      for (int dy = -1; dy <= 1; dy++) {
        vec2 nb   = cellID + vec2(float(dx), float(dy));
        float h   = hash31(vec3(nb, float(layer) * 7.1));

        // ~1.8 % of cells contain a star
        float spawnThresh = 0.982 - float(layer) * 0.004;
        if (h > spawnThresh) {
          // Random offset of star center within cell [0.15, 0.85]
          float ox = hash21(nb + float(layer) * 17.3) * 0.7 + 0.15;
          float oy = hash21(nb + float(layer) * 43.1) * 0.7 + 0.15;
          vec2  starCenter = vec2(float(dx), float(dy)) + vec2(ox, oy);

          // Distance in cell-space
          vec2  d    = cellFrac - starCenter;
          float dist = length(d);

          float brightness = hash21(nb + float(layer) * 5.9) * 0.7 + 0.3;

          // Tight core + soft halo (Gaussian)
          float core = exp(-dist * dist * 900.0) * brightness;
          float halo = exp(-dist * dist * 120.0) * brightness * 0.35;

          // Star color: blue-white hot or yellow-orange cool
          float colorRand = hash21(nb + float(layer) * 61.1);
          vec3  starCol   = mix(vec3(1.0, 0.82, 0.55), vec3(0.72, 0.88, 1.0), colorRand);

          col += starCol * (core + halo);
        }
      }
    }
  }

  return col;
}

// ─────────────────────────────────────────────────────────────────
vec3 getRayDir() {
  vec2 ndc  = vUv * 2.0 - 1.0;
  vec4 clip = vec4(ndc, -1.0, 1.0);
  vec4 vDir = uProjMatInv * clip;
  vDir      = vec4(vDir.xy, -1.0, 0.0);
  return normalize((uViewMatInv * vDir).xyz);
}

// ─────────────────────────────────────────────────────────────────
void main() {
  vec3  pos           = uCameraPos;
  vec3  dir           = getRayDir();
  vec3  hVec          = cross(pos, dir);
  float h2            = dot(hVec, hVec);
  vec3  accum         = vec3(0.0);
  float transmittance = 1.0;

  const int   STEPS = 300;
  const int   MAX_VOL_STEPS = 128;
  const float MAX_R = 500.0;
  // Slightly reduced lensing to recover a wider, less pinched disk silhouette.
  const float LENS_BASE = 1.28;
  const float LENS_NEAR_GAIN = 1.05;
  const float LENS_NEAR_POWER = 1.75;
  const float MAX_TURN_NEAR = 0.060;
  const float MAX_TURN_FAR = 0.016;

  int volSteps = clamp(int(uDiskVolSteps), 1, MAX_VOL_STEPS);

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);

    if (r < uRs) { transmittance = 0.0; break; }
    if (r > MAX_R) break;
    if (transmittance < 0.002) break;

    float dt = clamp(0.06 * (r - uRs), 0.015, 2.5);
    // Keep integration tighter near horizon: stronger bending needs a smaller local step.
    float nearH = pow(clamp(uRs / max(r, 1e-4), 0.0, 1.0), 1.8);
    dt *= mix(1.0, 0.58, nearH);
    vec3 marchDir = dir;
    vec3 prevPos  = pos;
    pos          += marchDir * dt;

    // Nonlinear lensing boost: much stronger close to horizon, gentle far away.
    vec3 midPos = 0.5 * (prevPos + pos);
    float rMid = length(midPos);
    float r2 = rMid * rMid;
    float r5 = r2 * r2 * rMid;
    float nearBoost = pow(clamp(uRs / max(rMid, 1e-4), 0.0, 1.0), LENS_NEAR_POWER);
    float lensCoeff = -1.5 * LENS_BASE * (1.0 + LENS_NEAR_GAIN * nearBoost);
    vec3 dDir = (lensCoeff * h2 / max(r5, 1e-6)) * midPos * dt;

    // Clamp per-step turn to avoid direction blow-ups while preserving stronger wrap.
    float maxTurn = mix(MAX_TURN_FAR, MAX_TURN_NEAR, clamp(uRs / max(rMid, 1e-4), 0.0, 1.0));
    float dDirLen = length(dDir);
    if (dDirLen > maxTurn) dDir *= maxTurn / dDirLen;
    dir = normalize(dir + dDir);

    if (transmittance > 0.002 && uDiskH0 > 0.0) {
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
          int segSteps = volSteps;
          float dtSeg = segFrac / float(segSteps);
          float ds    = segLenIn / float(segSteps);
          vec3 segDir = seg / segLen;

          for (int s = 0; s < MAX_VOL_STEPS; s++) {
            if (s >= segSteps) break;

            float t = tEnter + (float(s) + 0.5) * dtSeg;
            vec3 p = prevPos + seg * t;
            float rp = length(p.xz);

            if (rp >= uDiskOuter) continue;
            // Keep only the deep cavity empty (and never below horizon), avoid a hard inner edge cut.
            // Pull visible disk closer to the shadow while keeping a safe empty cavity.
            float innerVoid = max(uRs * 1.002, uDiskInner * 0.90);
            if (rp <= innerVoid) continue;

            float Hs = max(diskHalfHeight(rp), 1e-4);
            float z  = p.y;

             float rho = exp(-0.5 * (z * z) / (Hs * Hs));

             float angle      = atan(p.z, p.x);
             float swirl      = angle + log(max(rp * 0.3, 1e-4)) * 2.5 - uTime * 0.12;
             vec2 noiseP      = vec2(cos(swirl), sin(swirl)) * rp * 0.28;
             float turbulence = fbm(noiseP);
             
             // === AGGRESSIVE MULTISCALE PROCEDURAL STRUCTURE ===
             // Radial normalized coordinate for layer modulation
             float rNorm = (rp - uDiskInner) / max(uDiskOuter - uDiskInner, 1e-4);
             // Soft radial ramps: brighter/denser inner approach + gentle outer taper.
             float innerFade = smoothstep(uDiskInner * 0.90, uDiskInner * 1.03, rp);
             float outerFade = 1.0 - smoothstep(uDiskOuter * 0.95, uDiskOuter, rp);
             // Mild bright rim near the inner edge to visually reduce the BH-disk gap.
             float innerRimBoost = 1.0 + 0.48 * (1.0 - smoothstep(uDiskInner * 0.98, uDiskInner * 1.38, rp));
             
             // ===== LAYER 1: ULTRA-FINE GRAIN (dust particles) =====
             vec2 ultraFineP = noiseP * 8.5;
             ultraFineP += vec2(cos(uTime * 0.025), sin(uTime * 0.025)) * 0.2;
             float ultraFineGrain = fbm(ultraFineP * 0.3) * 0.08;
             
             // ===== LAYER 2: FINE GRAIN (pebble-scale texture) =====
             vec2 fineNoiseP = noiseP * 4.2;
             fineNoiseP += vec2(cos(uTime * 0.02), sin(uTime * 0.02)) * 0.15;
             float fineGrain = fbm(fineNoiseP * 0.5) * 0.15;
             
             // ===== LAYER 3: MEDIUM CLUMPS (dominant multiscale) =====
             vec2 clumpNoiseP = vec2(noiseP.x * 0.7, noiseP.y * 2.1);
             float clumpRaw = fbm(clumpNoiseP);
             float clumps = pow(clamp(clumpRaw * 0.8 + 0.2, 0.0, 1.0), 1.4) * 0.5;
             
             // ===== LAYER 4: AGGRESSIVE ANISOTROPIC FILAMENTS (plasma streams) =====
             // Primary filament layer: thread-like structures along azimuth
             vec2 filament1P = vec2(angle * 3.0, log(rp) * 1.2) + vec2(uTime * 0.015, 0.0);
             float filament1Raw = fbm(filament1P);
             // Apply threshold and power for sharp, defined streaks
             float filaments1 = pow(clamp(filament1Raw - 0.65, 0.0, 1.0), 2.8) * 0.7;
             
             // Secondary filament layer: finer, more chaotic threads
             vec2 filament2P = vec2(angle * 5.5, log(rp) * 2.8) - vec2(uTime * 0.018, uTime * 0.008);
             float filament2Raw = fbm(filament2P * 1.3);
             float filaments2 = pow(clamp(filament2Raw - 0.72, 0.0, 1.0), 3.2) * 0.5;
             
             // ===== LAYER 5: HOT CLUMPS (rare bright knots, concentrated inner disk) =====
             float hotspotNoise = valueNoise(noiseP * 3.0);
             float timePhase = sin(uTime * 0.04) * 0.1;
             float hotspots = pow(clamp(hotspotNoise - 0.70 + timePhase, 0.0, 1.0), 2.5) * 0.8;
             // Boost hotspots near inner disk
             hotspots *= 1.0 + (1.0 - clamp(rNorm * 2.0, 0.0, 1.0)) * 1.5;
             
             // ===== LAYER 6: DISK MIDPLANE INTENSITY VARIATION =====
             // Create z-dependent variation: bright core, fading into haze layers
             float zNorm = abs(z) / max(diskHalfHeight(rp), 1e-4);
             float midplaneCore = exp(-zNorm * zNorm * 6.5);
             float hazeLayer = exp(-zNorm * zNorm * 0.3) * (1.0 - midplaneCore); // Outer glow
             // Broader emissive envelope so upper/lower arcs stay thicker and more readable.
             float verticalEmissive = exp(-zNorm * zNorm * 3.2);
             float arcLift = smoothstep(0.08, 0.65, zNorm) * (1.0 - smoothstep(0.72, 1.0, rNorm));
             
             // ===== LAYER 7: SCATTERING FILAMENT NOISE (volumetric threads) =====
             // High-frequency noise for thin scattering features
             vec2 scatterP = vec2(angle * 8.0 + sin(log(rp) * 2.0), log(rp) * 0.8);
             scatterP += vec2(cos(uTime * 0.022) * 0.08, sin(uTime * 0.019) * 0.08);
             float scatter = fbm(scatterP * 2.1) * 0.12;
             
             // ===== COMPOSITE DETAIL: Aggressive multiscale mix =====
             // Combine all layers with different weights
             float detailBase = ultraFineGrain * 0.3 + fineGrain * 0.5 + clumps * 1.3 
                              + filaments1 * 1.8 + filaments2 * 1.2 + hotspots * 1.5 + scatter * 0.8;
             
             // Apply radial modulation: inner disk much more active
             float radialIntensity = mix(2.0, 0.4, clamp(rNorm, 0.0, 1.0));
             float detailModulation = clamp(detailBase * radialIntensity * midplaneCore, 0.0, 2.0);
             
             float turbulenceTerm = 0.6 * turbulence + 0.35 * detailModulation;

             // ===== AGGRESSIVE EMISSIVITY MODULATION =====
             // Use both base Novikov-Thorne and procedural detail boost
             // Use a slightly softened inner radius for emissivity and blend by innerFade.
             float rpEm = max(rp, uDiskInner * 1.04);
             float j = emissivity(rpEm, uDiskInner) * rho * (0.85 + 0.45 * verticalEmissive) * (1.0 + turbulenceTerm);
             j *= innerFade * outerFade * innerRimBoost;
             // Extra boost for inner disk filament activity
             j *= 1.0 + filaments1 * 1.2 + filaments2 * 0.8;
             
             // ===== COMPLEX DENSITY MODULATION =====
             // Different structures affect absorption differently
             float densityMod = 1.0 
                              + clumps * 0.65 * radialIntensity 
                              + filaments1 * 0.35 
                              + filaments2 * 0.25
                              + hotspots * 0.3
                              + scatter * 0.15
                              + (1.0 - midplaneCore) * 0.5; // Haze absorption
             // Softer inner absorption falloff avoids a hard dark notch at the inner edge.
             float innerAbsorbFade = mix(0.78, 1.0, innerFade);
             float kappa = uDiskOpacity * rho * pow(max(rp / max(uDiskInner, 1e-4), 1e-4), -0.6) * densityMod * innerAbsorbFade * outerFade;

             vec3  tangent = normalize(vec3(-p.z, 0.0, p.x));
             vec3  toObs   = normalize(uCameraPos - p);
             float cosA    = -dot(tangent, toObs);
             float v       = clamp(sqrt(uMass / max(1e-4, rp - uRs)), 0.0, 0.999);
             float gamma   = 1.0 / sqrt(max(1e-5, 1.0 - v * v));
             float grav    = sqrt(max(0.0, 1.0 - uRs / rp));
             float doppler = 1.0 / max(1e-4, gamma * (1.0 - v * cosA));
             float g       = grav * doppler;
             // NORMALIZED: replace aggressive g^3 with softer power (g^1.2) to reduce Doppler overheat
             float g_smooth = pow(clamp(g, 0.0, 2.0), 1.2);

             float sqF     = sqrt(uDiskInner / rp);
             float tempRaw = pow(rp, -0.75) * pow(max(1e-4, 1.0 - sqF), 0.25);
             float temp    = clamp(tempRaw / uTempScale, 0.0, 1.0);

             float mu    = clamp(abs(dot(vec3(0.0, 1.0, 0.0), -segDir)), 0.0, 1.0);
             float limb  = mix(0.35, 1.0, pow(mu, 0.7));
             
              // === AGGRESSIVE BRIGHTNESS MODULATION ===
              // Ultra-fine grain contributes minimally
              float ultraFineContrib = ultraFineGrain * 0.08;
              // Fine grain subtle
              float fineContrib = fineGrain * 0.12;
              // Clumps darken regions
              float clumpContrib = -clumps * 0.5;
              // Primary filaments: bright plasma streams (REDUCED for balance)
              float filament1Contrib = filaments1 * 1.8;
              // Secondary filaments: additional fine bright features
              float filament2Contrib = filaments2 * 1.2;
              // Hot clumps: intense bright knots
              float hotspotsContrib = hotspots * 1.8;
              // Haze glow: soft surrounding light
              float hazeGlow = hazeLayer * 0.4;
              
              // Balanced composite brightness WITHOUT excessive inner disk boost
              float localBrightness = 1.0 + ultraFineContrib + fineContrib + clumpContrib 
                                    + filament1Contrib + filament2Contrib + hotspotsContrib 
                                    + hazeGlow;
              
              // More balanced brightness range - INCREASED for vivid plasma
              localBrightness = clamp(localBrightness, 0.6, 2.8);
              
              // NORMALIZED: reduce Doppler influence on color temp
              vec3 col    = blackbody(clamp(temp * clamp(g * 0.3, 0.0, 1.0), 0.0, 1.0));

              // === BALANCED EMISSION: Bright plasma WITHOUT Doppler overkill ===
              // Keep emission strong for plazma visibility, but REDUCE Doppler multiplier
              // Base: 5.5 + detail boost for bright, vivid plasma
              float emissionBase = 5.0 + filaments1 * 2.0 + filaments2 * 1.2;
              // CRITICAL: Reduce g_smooth influence to prevent half-disk overexposure
              float g_doppler = mix(1.0, g_smooth, 0.4); // Only 40% of Doppler effect
              // Slightly lift off-midplane / farther-ring contribution to widen lensed upper arc.
              // Extra lift for the receding/lensed side so the upper arc reads as a second bright band.
              float farSideBoost = smoothstep(0.02, 0.82, -cosA);

              // Верхняя линзованная полоса должна читаться как вторая яркая лента
              float arcEmissionBoost = 1.0 + 0.85 * arcLift + 0.95 * arcLift * farSideBoost;

              float emission = j * g_doppler * limb * emissionBase * localBrightness * arcEmissionBoost;
              float absorb   = max(kappa, 0.0);

             accum += col * emission * transmittance * ds;
             transmittance *= exp(-absorb * ds);
             if (transmittance < 0.002) break;
          }
        }
      }
    }
  }

  // Background: soft Gaussian stars + faint space tint
  vec3 bg    = starField(dir) + vec3(0.006, 0.006, 0.018);

  vec3 color = accum + bg * transmittance;

  // Tiny screen-space dither to reduce smooth-gradient banding.
  float dither = hash21(gl_FragCoord.xy) - 0.5;
  color += dither / 255.0;

  // Output HDR linear — ACES applied by Three.js renderer + composer.
  gl_FragColor = vec4(color, 1.0);
}
`;
