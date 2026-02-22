import { Engine } from './engine/Engine';

const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
document.body.appendChild(canvas);

const engine = new Engine(canvas);
engine.start();
