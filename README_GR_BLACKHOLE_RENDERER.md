# Scientific GR Black Hole Renderer (Schwarzschild-first, Kerr-ready)

This document defines the mathematically rigorous renderer architecture implemented in this repository and the upgrade path to Kerr spacetime.

## 1) Mathematical formulation

We use geometric units:
- $G = 1$
- $c = 1$
- mass parameter $M$ sets length scale

### 1.1 Schwarzschild metric (Phase 1)

In $(t,r,\theta,\phi)$ coordinates:

$$
\mathrm{d}s^2 = -\left(1-\frac{2M}{r}\right)\mathrm{d}t^2
+ \left(1-\frac{2M}{r}\right)^{-1}\mathrm{d}r^2
+ r^2\mathrm{d}\theta^2
+ r^2\sin^2\theta\,\mathrm{d}\phi^2
$$

Define $f(r)=1-2M/r$.

Contravariant metric entries used by Hamiltonian integration:

$$
g^{tt} = -\frac{1}{f},\quad
g^{rr}=f,\quad
g^{\theta\theta}=\frac{1}{r^2},\quad
g^{\phi\phi}=\frac{1}{r^2\sin^2\theta}
$$

### 1.2 Null geodesics in Hamiltonian form

State vector:

$$
y = (x^\mu,p_\mu) = (t,r,\theta,\phi,p_t,p_r,p_\theta,p_\phi)
$$

Hamiltonian for null rays:

$$
H = \frac{1}{2}g^{\mu\nu}p_\mu p_\nu = 0
$$

Evolution equations:

$$
\frac{\mathrm{d}x^\mu}{\mathrm{d}\lambda} = \frac{\partial H}{\partial p_\mu} = g^{\mu\nu}p_\nu
$$
$$
\frac{\mathrm{d}p_\mu}{\mathrm{d}\lambda} = -\frac{\partial H}{\partial x^\mu}
= -\frac{1}{2}\partial_\mu g^{\alpha\beta}p_\alpha p_\beta
$$

In Schwarzschild, $p_t=-E$ and $p_\phi=L$ are conserved exactly (stationary + axisymmetry).

### 1.3 Horizon/escape criteria

- Event horizon: $r_h=2M$
- Photon sphere: $r_{ph}=3M$ (emerges naturally)
- Escape boundary: $r\ge r_{\text{escape}}$ (finite computational boundary)

Integration stops when:
1. $r\le r_h(1+\epsilon_h)$ (capture)
2. $r\ge r_{\text{escape}}$ (escape)
3. transfer contribution negligible (early termination)

## 2) Numerical integration scheme

Implemented method: Dormand–Prince 5(4), adaptive step.

- Local error estimate: difference between 5th and embedded 4th order solutions
- Step adaptation:

$$
h_{new} = h\,\mathrm{clip}(s\,\text{err}^{-1/5}, s_{\min}, s_{\max})
$$

with safety $s\approx0.9$.

Practical controls:
- absolute tolerance $\epsilon_{abs}$
- relative tolerance $\epsilon_{rel}$
- clamp $h\in[h_{min},h_{max}]$

Stability notes near horizon:
- enforce floor on lapse function
- reduce step size automatically via adaptive controller
- detect horizon crossing by radial condition

## 3) Observer initialization (per pixel)

Given camera frame $(\hat f,\hat r,\hat u)$ and NDC coordinates $(x_{ndc},y_{ndc})$:

$$
\hat n = \mathrm{normalize}(\hat f + x\tan\frac{\mathrm{fov}_x}{2}\,\hat r + y\tan\frac{\mathrm{fov}_y}{2}\,\hat u)
$$

Convert observer position to spherical coordinates and project direction into local spherical orthonormal basis $(\hat e_r,\hat e_\theta,\hat e_\phi)$ to initialize spatial momentum.

Use $p_t=-E$ with $E=1$ convention.

## 4) Disk emission model (thin + thick)

The object layer supports:
- `mode='thin'`: near-surface slab around equatorial plane
- `mode='thick'`: volumetric profile with scale height $H(r)$

### 4.1 Novikov–Thorne radial profile

Implemented shape:

$$
T(r) \propto r^{-3/4}\left(1-\sqrt{\frac{r_{in}}{r}}\right)^{1/4}
$$

with $r_{in}=r_{ISCO}=6M$ for Schwarzschild.

### 4.2 Vertical structure and density

Representative model:

$$
\rho(r,z)=\rho_0\left(\frac{r}{r_{in}}\right)^{-3/2}
\exp\left(-\frac{z^2}{2H(r)^2}\right)
$$

where

$$
H(r)=H_0\left(\frac{r}{r_{in}}\right)^\beta
$$

Emissivity and absorption are parameterized from $\rho$ and the NT profile.

## 5) Radiative transfer + GR invariant

Transfer equation along affine path segment:

$$
\frac{\mathrm{d}I_\nu}{\mathrm{d}s}=j_\nu-\alpha_\nu I_\nu
$$

Invariant quantity:

$$
\frac{I_\nu}{\nu^3}=\text{const along geodesic in vacuum}
$$

Frequency shift:

$$
\nu_{obs}=g\,\nu_{em}
$$

Intensity mapping:

$$
I_{obs}(\nu_{obs})=g^3 I_{em}(\nu_{em})
$$

Using wavelength representation, $\lambda_{em}=g\lambda_{obs}$, and blackbody source term this introduces $g^5$ in the implemented per-step source transformation.

### 5.1 g-factor decomposition (Schwarzschild circular flow)

Approximate decomposition used in current implementation:

$$
g = g_{grav}\,g_{dop}
$$

with

$$
g_{grav}=\sqrt{1-\frac{2M}{r}}
$$
$$
g_{dop}=\frac{1}{\gamma(1-v\mu)}
$$
$$
\gamma=\frac{1}{\sqrt{1-v^2}}
$$

and $\mu$ the cosine between flow tangent and photon direction in local frame. For circular Schwarzschild flow, $v\approx\sqrt{M/(r-2M)}$ (clamped to subluminal range numerically).

## 6) Spectral rendering pipeline

Implemented order:
1. Wavelength grid $\lambda\in[380,780]$ nm
2. Planck blackbody radiance $B_\lambda(\lambda,T)$
3. Shift to emitted wavelength via $\lambda_{em}=g\lambda_{obs}$
4. Integrate transfer per geodesic sample over path
5. Integrate spectrum to CIE XYZ (analytic Gaussian approximation to CMFs)
6. Convert XYZ to linear sRGB
7. Tone map (ACES fitted curve)

This keeps Doppler effect spectral-first instead of a post-hoc RGB brightness hack.

## 7) Pseudocode (end-to-end)

```text
for each pixel (i,j):
  initialize null state y0 = (x^μ, p_μ) from observer camera frame
  Iλ[:] = 0
  λ = 0
  h = h0

  while step < maxSteps:
    if r <= 2M*(1+eps): mark captured; break
    if r >= rEscape:     mark escaped;  break

    y_next, err = DOPRI54_step(y, h)
    adapt h from err
    if rejected: continue

    y = y_next

    if inside disk volume/surface:
      compute density, temperature, emissivity, absorption
      compute g-factor from local flow and gravitational term
      for each wavelength λobs:
        λem = g * λobs
        S = Bλ(λem, T)
        dI = (g^5 * j*S - α*I) * ds
        I += dI

    if total intensity negligible and sufficient travel: optional early-out

  XYZ = ∫ Iλ * CMF(λ) dλ
  rgb_lin = M_XYZ→sRGB * XYZ
  rgb = ToneMap(rgb_lin)
```

## 8) Performance considerations (Apple Silicon, quality-first)

Current path is a CPU reference renderer for physical correctness and debugging.

Recommended production trajectory:
- Move pixel-parallel integration to GPU compute (WebGPU preferred)
- Keep physics kernels API-independent (`core/*`)
- Use tile dispatch and progressive refinement
- Use mixed precision:
  - geodesic state and invariants in FP64 where available
  - transfer accumulation in FP32/FP16 carefully validated
- Adaptive supersampling near high curvature/caustics
- Cache/reuse geodesic segments for static camera frames only when physically valid

## 9) Upgrade path to Kerr (Phase 2)

To support spin parameter $a$ and frame dragging:

1. Replace Schwarzschild metric module with Kerr metric (Boyer–Lindquist) and derivatives
2. Keep Hamiltonian integrator interface unchanged
3. Extend constants of motion:
   - $E=-p_t$
   - $L_z=p_\phi$
   - Carter constant $Q$
4. Observer tetrad initialization at arbitrary inclination
5. Disk kinematics:
   - prograde/retrograde orbital angular velocities
   - ISCO as function of $a$ (different inner edges)
6. Validate with known Kerr shadow boundary and transfer benchmarks

## 10) Naive shader vs GR renderer

### Naive (screen-space / heuristic march)
- Integrates in flat space with ad-hoc bending
- Uses RGB ramps and artistic boosts
- Cannot reliably produce higher-order images
- Does not enforce null constraints or invariants

### GR geodesic renderer (this architecture)
- Integrates null geodesics in curved spacetime
- Uses adaptive ODE solver with error control
- Produces photon ring and multi-image structure naturally
- Uses transfer equation and spectral pipeline grounded in invariants

## 11) Output quality checks and validation targets

For Schwarzschild reference renders:
- Shadow angular diameter consistent with ~5.2M critical impact scale
- Visible asymmetry from Doppler + gravitational shifts
- Secondary/tertiary disk images near photon sphere
- Smooth spectra without RGB banding artifacts

## 12) Current repository mapping

Implemented modules:
- `src/core/spacetime/SchwarzschildMetric.ts`
- `src/core/integrators/DormandPrince54.ts`
- `src/core/geodesics/SchwarzschildHamiltonianSystem.ts`
- `src/core/geodesics/GeodesicTracer.ts`
- `src/core/radiative_transfer/RadiativeTransfer.ts`
- `src/core/spectrum/ColorScience.ts`
- `src/objects/blackhole/BlackHoleObject.ts`
- `src/objects/disk/AccretionDiskObject.ts`
- `src/objects/observer/Observer.ts`
- `src/render/spectral_pipeline/SpectralPipeline.ts`
- `src/render/renderer/ReferenceBlackHoleRenderer.ts`
- scene integration in `src/scenes/BlackHoleScene.ts`

## 13) Scientific caveat (important)

The implementation is physically principled and architecture-correct, but still a Phase-1 reference model:
- Schwarzschild only (no frame dragging yet)
- emissivity/opacity microphysics simplified
- CMFs use analytic approximation rather than tabulated high-precision data

These are deliberate to establish a robust GR foundation before Kerr + advanced plasma/radiation modules.
