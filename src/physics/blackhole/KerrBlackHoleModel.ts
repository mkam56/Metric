import { BlackHoleModel } from './BlackHoleModel';

export class KerrBlackHoleModel extends BlackHoleModel {
    readonly spin: number;

    // Объявляем те же свойства, что и в базовом классе, чтобы перетереть их значения
    readonly eventHorizon: number;
    readonly innerHorizon: number;
    readonly ergosphereRadius: number;
    readonly iscoRadius: number; // Теперь это свойство, а не геттер

    constructor(mass: number, spin: number) {
        super(mass);

        // Ограничение спина
        this.spin = Math.min(spin, mass * 0.998);

        // Считаем значения один раз при создании объекта
        const discriminant = Math.sqrt(this.mass * this.mass - this.spin * this.spin);
        this.eventHorizon = this.mass + discriminant;
        this.innerHorizon = this.mass - discriminant;
        this.ergosphereRadius = 2 * this.mass;

        // Расчет ISCO для Керра (формула Бардина)
        const m = this.mass;
        const a = this.spin;
        const z1 = 1 + Math.pow(1 - (a * a) / (m * m), 1 / 3) * (Math.pow(1 + a / m, 1 / 3) + Math.pow(1 - a / m, 1 / 3));
        const z2 = Math.sqrt(3 * (a * a) / (m * m) + z1 * z1);
        this.iscoRadius = m * (3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
    }

    // Угловая скорость (теперь без лишних переменных)
    omega(r: number, theta: number): number {
        const a2 = this.spin * this.spin;
        const sinT2 = Math.pow(Math.sin(theta), 2);
        const delta = r * r - 2 * this.mass * r + a2;

        const numerator = 2 * this.mass * r * this.spin;
        const denominator = Math.pow(r * r + a2, 2) - delta * a2 * sinT2;

        return numerator / denominator;
    }
}
