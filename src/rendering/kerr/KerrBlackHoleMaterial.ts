import * as THREE from 'three';
// Важно: импортируем из нового файла шейдеров, который ты создашь
import { vertexShader, fragmentShader } from './shaders/kerr';

export interface KerrBlackHoleUniforms {
    [key: string]: THREE.IUniform;
    uCameraPos:   { value: THREE.Vector3 };
    uViewMatInv:  { value: THREE.Matrix4 };
    uProjMatInv:  { value: THREE.Matrix4 };
    uMass:        { value: number };
    uSpin:        { value: number }; // НОВОЕ: Спин ЧД
    uIsco:        { value: number }; // НОВОЕ: Внутренняя стабильная орбита
    uRs:          { value: number }; // У Керра это r+ (горизонт событий)
    uDiskInner:   { value: number };
    uDiskOuter:   { value: number };
    uDiskH0:      { value: number };
    uDiskFlare:   { value: number };
    uDiskOpacity: { value: number };
    uDiskVolSteps:{ value: number };
    uTempScale:   { value: number };
    uTime:        { value: number };
}

export class KerrBlackHoleMaterial extends THREE.ShaderMaterial {
    readonly kerrUniforms: KerrBlackHoleUniforms;

    constructor(params: {
        mass:         number;
        spin:         number; // НОВОЕ
        isco:         number; // НОВОЕ
        rs:           number;
        diskInner:    number;
        diskOuter:    number;
        diskH0:       number;
        diskFlare:    number;
        diskOpacity:  number;
        diskVolSteps: number;
        tempScale:    number;
    }) {
        const uniforms: KerrBlackHoleUniforms = {
            uCameraPos:   { value: new THREE.Vector3() },
            uViewMatInv:  { value: new THREE.Matrix4() },
            uProjMatInv:  { value: new THREE.Matrix4() },
            uMass:        { value: params.mass },
            uSpin:        { value: params.spin },
            uIsco:        { value: params.isco },
            uRs:          { value: params.rs },
            uDiskInner:   { value: params.diskInner },
            uDiskOuter:   { value: params.diskOuter },
            uDiskH0:      { value: params.diskH0 },
            uDiskFlare:   { value: params.diskFlare },
            uDiskOpacity: { value: params.diskOpacity },
            uDiskVolSteps:{ value: params.diskVolSteps },
            uTempScale:   { value: params.tempScale },
            uTime:        { value: 0.0 },
        };

        super({
            vertexShader,
            fragmentShader,
            uniforms,
            depthWrite: false,
            depthTest: false,
            dithering: true,
        });

        this.kerrUniforms = uniforms;
    }

    updateCamera(camera: THREE.Camera): void {
        this.kerrUniforms.uCameraPos.value.copy(camera.position);
        this.kerrUniforms.uViewMatInv.value.copy(camera.matrixWorld);
        this.kerrUniforms.uProjMatInv.value.copy(
            (camera as THREE.PerspectiveCamera).projectionMatrixInverse
        );
    }

    updateTime(t: number): void {
        this.kerrUniforms.uTime.value = t;
    }

    // Метод для обновления физических параметров на лету
    updatePhysics(spin: number, isco: number, rs: number): void {
        this.kerrUniforms.uSpin.value = spin;
        this.kerrUniforms.uIsco.value = isco;
        this.kerrUniforms.uRs.value = rs;
    }
}
