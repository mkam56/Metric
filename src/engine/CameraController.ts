import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type CameraTransition = {
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  startTime: number;
  durationMs: number;
  arcHeight: number;
  onComplete?: () => void;
};

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private transition: CameraTransition | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );

    this.camera.position.set(0, 30, 60);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 500;
    this.controls.target.set(0, 0, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  private autoOrbit: {
  target: THREE.Vector3;
  baseOffset: THREE.Vector3;
  yawAmplitude: number;
  yawSpeed: number;
  verticalBob: number;
  startTime: number;
} | null = null;

private lastUpdateTime = performance.now();

startAutoOrbit(
  target: THREE.Vector3,
  options: {
    yawAmplitude: number;
    yawSpeed: number;
    verticalBob?: number;
  }
): void {
  const baseOffset = this.camera.position.clone().sub(target);

  this.autoOrbit = {
    target: target.clone(),
    baseOffset,
    yawAmplitude: options.yawAmplitude,
    yawSpeed: options.yawSpeed,
    verticalBob: options.verticalBob ?? 0,
    startTime: performance.now(),
  };

  this.controls.enabled = false;
}

stopAutoOrbit(): void {
  this.autoOrbit = null;

  if (!this.userControlsLocked) {
    this.controls.enabled = true;
  }
}

  animateTo(
  endPosition: THREE.Vector3,
  endTarget: THREE.Vector3,
  durationMs: number,
  onComplete?: () => void,
  arcHeight: number = 0
): void {
  this.autoOrbit = null;
  this.transition = {
    startPosition: this.camera.position.clone(),
    endPosition: endPosition.clone(),
    startTarget: this.controls.target.clone(),
    endTarget: endTarget.clone(),
    startTime: performance.now(),
    durationMs,
    arcHeight,
    onComplete,
  };

  this.controls.enabled = false;
}

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private userControlsLocked = false;

lockUserControls(): void {
  this.userControlsLocked = true;
  this.controls.enabled = false;
}

unlockUserControls(): void {
  this.userControlsLocked = false;
  this.controls.enabled = true;
}

  update(): void {
  const now = performance.now();
  const deltaSeconds = (now - this.lastUpdateTime) / 1000;
  this.lastUpdateTime = now;

  if (this.transition) {
    const elapsed = now - this.transition.startTime;
    const rawT = Math.min(elapsed / this.transition.durationMs, 1);
    const t = this.easeInOutCubic(rawT);

    const basePosition = new THREE.Vector3().lerpVectors(
      this.transition.startPosition,
      this.transition.endPosition,
      t
    );

    const arcOffset = Math.sin(Math.PI * t) * this.transition.arcHeight;
    basePosition.y += arcOffset;

    this.camera.position.copy(basePosition);

    this.controls.target.lerpVectors(
      this.transition.startTarget,
      this.transition.endTarget,
      t
    );

    this.camera.lookAt(this.controls.target);

    if (rawT >= 1) {
      const onComplete = this.transition.onComplete;
      this.transition = null;

      if (!this.userControlsLocked && !this.autoOrbit) {
        this.controls.enabled = true;
        this.controls.update();
      }

      onComplete?.();
    }

    return;
  }

  if (this.autoOrbit) {
    const t = (now - this.autoOrbit.startTime) / 1000;

    const yaw = Math.sin(t * this.autoOrbit.yawSpeed) * this.autoOrbit.yawAmplitude;

    const offset = this.autoOrbit.baseOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    if (this.autoOrbit.verticalBob !== 0) {
      offset.y += Math.sin(t * this.autoOrbit.yawSpeed * 0.7) * this.autoOrbit.verticalBob;
    }

    this.camera.position.copy(this.autoOrbit.target.clone().add(offset));
    this.controls.target.copy(this.autoOrbit.target);
    this.camera.lookAt(this.autoOrbit.target);

    return;
  }

  if (!this.userControlsLocked) {
    this.controls.update();
  }
}
}