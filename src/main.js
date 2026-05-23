import { AssetLoader } from './core/AssetLoader.js';
import { InputManager } from './core/InputManager.js';
import { Renderer } from './core/Renderer.js';
import { AudioManager } from './core/AudioManager.js';
import { Game } from './Game.js';

const canvas = document.getElementById('game');
canvas.width = 1280;
canvas.height = 720;

const renderer = new Renderer(canvas);
const input = new InputManager();
const audio = new AudioManager();
const loader = new AssetLoader();

const initAudio = () => { audio.init(); };
canvas.addEventListener('click', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

loader.loadAll([
    'src/config/weapons.json',
    'src/config/shop.json',
]).then(configs => {
    const game = new Game(canvas, renderer, input, audio, configs);
    game.start();
}).catch(err => {
    console.error('Failed to load game configs:', err);
    document.body.innerHTML = `<p style="color:#ff4444;font-family:monospace;padding:20px">
        Failed to load game assets. Please serve via HTTP (not file://).<br>
        Run: python3 -m http.server 8080<br><br>
        Error: ${err.message}
    </p>`;
});
