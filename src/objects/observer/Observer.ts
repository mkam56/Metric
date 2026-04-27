export interface ObserverFrame {
  position: [number, number, number];
  forward: [number, number, number];
  right: [number, number, number];
  up: [number, number, number];
  verticalFovRad: number;
  aspect: number;
}

export function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-12) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function rayDirectionFromPixel(
  observer: ObserverFrame,
  px: number,
  py: number,
  width: number,
  height: number,
  sampleOffsetX: number = 0.5,
  sampleOffsetY: number = 0.5
): [number, number, number] {
  const nx = ((px + sampleOffsetX) / width) * 2 - 1;
  const ny = 1 - ((py + sampleOffsetY) / height) * 2;

  const tanHalfY = Math.tan(observer.verticalFovRad * 0.5);
  const tanHalfX = tanHalfY * observer.aspect;

  const x = nx * tanHalfX;
  const y = ny * tanHalfY;

  const f = observer.forward;
  const r = observer.right;
  const u = observer.up;

  return normalize3([
    f[0] + x * r[0] + y * u[0],
    f[1] + x * r[1] + y * u[1],
    f[2] + x * r[2] + y * u[2],
  ]);
}
