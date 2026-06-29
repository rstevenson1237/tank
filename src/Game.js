import { Vector2 } from './math/Vector2.js';
import { Tank } from './entities/Tank.js';
import { Explosion } from './entities/Explosion.js';
import { AlphaRing } from './arenas/AlphaRing.js';
import { GeometricCross } from './arenas/GeometricCross.js';
import { NebulaGauntlet } from './arenas/NebulaGauntlet.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { BotAI } from './systems/BotAI.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { HUD } from './ui/HUD.js';
import { LobbyScreen } from './ui/LobbyScreen.js';
import { ShopScreen } from './ui/ShopScreen.js';
import { IntermissionScreen } from './ui/IntermissionScreen.js';
import { GameOverScreen } from './ui/GameOverScreen.js';
import { WelcomeScreen } from './ui/WelcomeScreen.js';
import { Vortex } from './arenas/Vortex.js';
import { TheDivide } from './arenas/TheDivide.js';
import { RubbleField } from './arenas/RubbleField.js';
import { Catacombs } from './arenas/Catacombs.js';
import { IonCross } from './arenas/IonCross.js';
import { HexCell } from './arenas/HexCell.js';
import { GrandStadium } from './arenas/GrandStadium.js';

const GameState = {
    WELCOME: 'WELCOME',
    LOBBY: 'LOBBY',
    COMBAT_ROUND: 'COMBAT_ROUND',
    INTERMISSION: 'INTERMISSION',
    SHOP: 'SHOP',
    GAME_OVER: 'GAME_OVER'
};

const PLAYER_COLORS = ['#00ffff', '#ff2244', '#ffcc00'];
const PLAYER_NAMES = ['ALPHA', 'BRAVO', 'CHARLIE'];
const BOT_COLORS = ['#ff8800', '#aa00ff', '#00ff44', '#ff00aa', '#88aaff', '#ffaa44'];
const BOT_NAMES = ['AXIS-1', 'AXIS-2', 'AXIS-3', 'AXIS-4', 'AXIS-5', 'AXIS-6'];

export class Game {
    constructor(canvas, renderer, inputManager, audioManager, configs) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = inputManager;
        this.audio = audioManager;

        this.weaponConfigs = configs.weapons.weapons;
        this.hullConfigs = configs.weapons.hulls;
        this.shopConfig = configs.shop;

        this.economy = new EconomySystem(this.shopConfig, this.weaponConfigs);
        this.particles = new ParticleSystem();
        this.botAI = new BotAI();
        this.hud = new HUD();
        this.lobby = new LobbyScreen();
        this.intermission = new IntermissionScreen();
        this.shop = new ShopScreen(this.economy);
        this.gameOver = new GameOverScreen();
        this.welcome = new WelcomeScreen();

        this.state = GameState.WELCOME;
        this.roundNumber = 0;
        this.gameTime = 0;
        this.flashAlpha = 0;

        this.tanks = [];
        this.projectiles = [];
        this.explosions = [];
        this.arena = null;

        this.gameConfig = null;
        this.roundAge = 0;
        this.waveTimer = 0;
        this.waveNumber = 0;

        this.#lastTimestamp = 0;
        this.#rafId = null;
    }

    #lastTimestamp;
    #rafId;

    start() {
        this.state = GameState.WELCOME;
        this.#rafId = requestAnimationFrame(ts => this.#loop(ts));
    }

    #loop(timestamp) {
        const rawDt = (timestamp - this.#lastTimestamp) / 1000;
        const dt = Math.min(rawDt || 0, 0.05);
        this.#lastTimestamp = timestamp;
        this.gameTime += dt;

        this.input.update();
        this.#update(dt);
        this.#render();
        this.#rafId = requestAnimationFrame(ts => this.#loop(ts));
    }

    #update(dt) {
        switch (this.state) {
            case GameState.WELCOME: this.#updateWelcome(dt); break;
            case GameState.LOBBY: this.#updateLobby(dt); break;
            case GameState.COMBAT_ROUND: this.#updateCombat(dt); break;
            case GameState.INTERMISSION: this.#updateIntermission(dt); break;
            case GameState.SHOP: this.#updateShop(dt); break;
            case GameState.GAME_OVER: this.#updateGameOver(dt); break;
        }
    }

    #render() {
        this.renderer.clear();
        switch (this.state) {
            case GameState.WELCOME: this.#renderWelcome(); break;
            case GameState.LOBBY: this.#renderLobby(); break;
            case GameState.COMBAT_ROUND: this.#renderCombat(); break;
            case GameState.INTERMISSION: this.#renderIntermission(); break;
            case GameState.SHOP: this.#renderShop(); break;
            case GameState.GAME_OVER: this.#renderGameOver(); break;
        }
    }

    #updateWelcome(dt) {
        if (this.input.anyJustPressed()) {
            this.state = GameState.LOBBY;
        }
    }

    #updateLobby(dt) {
        const p1 = this.input.getPlayerInput(0);
        if (p1) {
            p1.thrustJP      = p1.thrustJP      || this.input.isJustPressed('ArrowUp');
            p1.brakeJP       = p1.brakeJP       || this.input.isJustPressed('ArrowDown');
            p1.rotateLeftJP  = p1.rotateLeftJP  || this.input.isJustPressed('ArrowLeft');
            p1.rotateRightJP = p1.rotateRightJP || this.input.isJustPressed('ArrowRight');
            p1.fire          = p1.fire           || this.input.isJustPressed('Enter')
                                                 || this.input.isJustPressed('NumpadEnter');
            this.lobby.handleInput(p1);
        }
        if (this.lobby.ready) {
            this.lobby.ready = false;
            this.#startGame(this.lobby.config);
        }
    }

    #startGame(config) {
        this.gameConfig = config;
        this.roundNumber = 0;
        this.tanks = [];
        this.#startRound();
    }

    #startRound() {
        this.roundNumber++;
        this.projectiles = [];
        this.explosions = [];
        this.particles.clear();
        this.botAI.reset();

        const arenaRadius = Math.min(this.renderer.width, this.renderer.height) * 0.44;
        const cx = this.renderer.width / 2;
        const cy = this.renderer.height / 2 + 34;
        this.arena = this.#buildArena(this.gameConfig.arenaId, cx, cy, arenaRadius);

        const totalCount = this.gameConfig.humanCount + this.gameConfig.botCount;
        const spawns = this.arena.getSpawnPoints(Math.max(totalCount, 2));

        const isFirstRound = this.roundNumber === 1;
        const startingHull = this.hullConfigs.find(h => h.id === 'medium_assault');

        if (isFirstRound) {
            this.tanks = [];
            for (let i = 0; i < this.gameConfig.humanCount; i++) {
                const tank = new Tank(i, startingHull, this.weaponConfigs, spawns[i] || Vector2.zero(), PLAYER_COLORS[i], PLAYER_NAMES[i]);
                this.economy.initTank(tank);
                if (this.gameConfig.mode === 'team') tank.team = i === 0 ? 'red' : 'blue';
                this.tanks.push(tank);
            }
            for (let i = 0; i < this.gameConfig.botCount; i++) {
                const color = BOT_COLORS[i % BOT_COLORS.length];
                const idx = this.gameConfig.humanCount + i;
                const tank = new Tank(-1, startingHull, this.weaponConfigs, spawns[idx] || Vector2.zero(), color, BOT_NAMES[i]);
                tank.botConfig = BotAI.pickBotConfig(this.gameConfig.botRoster);
                this.economy.initTank(tank);
                if (this.gameConfig.mode === 'team') tank.team = (i % 2 === 0) ? 'blue' : 'red';
                this.tanks.push(tank);
            }
        } else {
            for (let i = 0; i < this.tanks.length; i++) {
                this.tanks[i].respawn(spawns[i] || Vector2.zero());
            }
        }

        if (this.gameConfig.mode === 'survival') {
            this.waveNumber = 0;
            this.waveTimer = 3;
        }

        this.roundAge = 0;
        this.state = GameState.COMBAT_ROUND;
        if (this.audio.ready) this.audio.playRoundStart();
    }

    #buildArena(id, cx, cy, r) {
        switch (id) {
            case 'geometric_cross': return new GeometricCross(cx, cy, r);
            case 'nebula_gauntlet': return new NebulaGauntlet(cx, cy, r);
            case 'vortex':          return new Vortex(cx, cy, r);
            case 'the_divide':      return new TheDivide(cx, cy, r);
            case 'rubble_field':    return new RubbleField(cx, cy, r);
            case 'catacombs':       return new Catacombs(cx, cy, r);
            case 'ion_cross':       return new IonCross(cx, cy, r);
            case 'hex_cell':        return new HexCell(cx, cy, r);
            case 'grand_stadium':   return new GrandStadium(cx, cy, r);
            default:                return new AlphaRing(cx, cy, r);
        }
    }

    #updateCombat(dt) {
        this.roundAge += dt;

        for (const tank of this.tanks) {
            if (!tank.alive) continue;
            let inp;
            if (tank.playerIndex >= 0) {
                inp = this.input.getPlayerInput(tank.playerIndex);
            } else {
                inp = this.botAI.updateBot(tank, dt, this.tanks, this.arena);
            }
            if (!inp) continue;

            tank.update(dt, inp);

            const result = this.arena.constrainPosition(tank.position, tank.size);
            if (result.hit) {
                tank.position = result.position;
                if (result.normal) {
                    const vDotN = tank.velocity.dot(result.normal);
                    if (vDotN < 0) {
                        tank.velocity = tank.velocity.sub(result.normal.scale(vDotN));
                    }
                }
            }

            if (inp.fire) {
                const weapon = tank.activeWeapon;
                if (weapon && weapon.energyCost > 0 && tank.energy < weapon.energyCost) {
                    if (this.audio.ready && tank.playerIndex >= 0) this.audio.playEnergyWarning();
                } else {
                    const projs = tank.tryFire();
                    if (projs.length > 0) {
                        for (const proj of projs) {
                            proj.findTarget(this.tanks);
                            this.projectiles.push(proj);
                        }
                        if (this.audio.ready) this.audio.getWeaponSound(weapon.id)();
                    }
                }
            }

            if (inp.weaponPrev || inp.weaponNext) {
                if (this.audio.ready && tank.playerIndex >= 0) this.audio.playWeaponCycle();
            }

            if (inp.thrust) {
                this.particles.emitEngineTrail(tank.position.x, tank.position.y, tank.heading, tank.color);
            }
        }

        // Tank-tank collision: separate overlapping tanks and exchange momentum
        for (let i = 0; i < this.tanks.length; i++) {
            for (let j = i + 1; j < this.tanks.length; j++) {
                const a = this.tanks[i], b = this.tanks[j];
                if (!a.alive || !b.alive) continue;
                const delta = b.position.sub(a.position);
                const dist = delta.length();
                const minDist = a.size + b.size;
                if (dist < minDist && dist > 0) {
                    const n = delta.scale(1 / dist);
                    const overlap = (minDist - dist) * 0.5;
                    a.position = a.position.sub(n.scale(overlap));
                    b.position = b.position.add(n.scale(overlap));
                    const vRel = a.velocity.sub(b.velocity).dot(n);
                    if (vRel > 0) {
                        const impulse = vRel * 0.7;
                        a.velocity = a.velocity.sub(n.scale(impulse));
                        b.velocity = b.velocity.add(n.scale(impulse));
                    }
                }
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.tanks, this.arena);
            if (!proj.alive) {
                if (proj.aoeTriggered) {
                    const ae = proj.aoeTriggered;
                    const explR = Math.min(ae.radius, 200);
                    this.explosions.push(new Explosion(ae.x, ae.y, explR));
                    this.particles.emitExplosion(ae.x, ae.y, '#ffaa00');
                    if (proj.config.fullScreenFlash) {
                        this.flashAlpha = 1.0;
                    } else if (this.audio.ready) {
                        this.audio.playBigExplosion();
                    }
                }
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update(dt);
            if (!this.explosions[i].alive) this.explosions.splice(i, 1);
        }

        this.particles.update(dt);

        if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);

        for (const tank of this.tanks) {
            if (tank.deathEffect && tank.deathEffect > 0) {
                tank.deathEffect = 0;
                this.particles.emitExplosion(tank.position.x, tank.position.y, tank.color);
                this.particles.emitBurst(tank.position.x, tank.position.y, '#ffffff', 12, 150, 0.5, 2);
                if (this.audio.ready) this.audio.playDeath();
                const killer = tank.killedBy;
                if (killer && killer !== tank) {
                    killer.kills = (killer.kills || 0) + 1;
                    this.economy.awardKill(killer, tank);
                }
            }
        }

        if (this.gameConfig.mode === 'survival') {
            this.#updateHorde(dt);
        }

        this.#checkRoundEnd();
    }

    #updateHorde(dt) {
        const humanAlive = this.tanks.some(t => t.playerIndex >= 0 && t.alive);
        if (!humanAlive) return;

        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.waveTimer = Math.max(8, 20 - this.waveNumber * 1.5);
            this.waveNumber++;
            this.#spawnWave();
        }

        for (const tank of this.tanks) {
            if (tank.playerIndex < 0 && !tank.alive) {
                const aggMult = 1 + this.waveNumber * 0.1;
                const cfg = BotAI.pickBotConfig(this.gameConfig.botRoster);
                const spawn = this.arena.getSpawnPoints(1)[0];
                const hull = this.hullConfigs.find(h => h.id === 'medium_assault');
                tank.respawn(spawn);
                tank.botConfig = { ...cfg, aggression: Math.min(1, cfg.aggression * aggMult) };
            }
        }
    }

    #spawnWave() {
        const bots = this.tanks.filter(t => t.playerIndex < 0);
        const spawns = this.arena.getSpawnPoints(bots.length);
        bots.forEach((t, i) => {
            if (!t.alive) t.respawn(spawns[i % spawns.length]);
        });
    }

    #checkRoundEnd() {
        if (this.roundAge < 1.0) return;
        const alive = this.tanks.filter(t => t.alive);
        const mode = this.gameConfig.mode;

        if (mode === 'survival') {
            const humanAlive = alive.some(t => t.playerIndex >= 0);
            if (!humanAlive) this.#endRound();
            return;
        }

        if (mode === 'ffa' || mode === 'base_destruction') {
            if (alive.length <= 1) this.#endRound();
            return;
        }

        if (mode === 'team') {
            const teamsAlive = new Set(alive.map(t => t.team).filter(Boolean));
            if (teamsAlive.size <= 1) this.#endRound();
        }
    }

    #endRound() {
        const alive = this.tanks.filter(t => t.alive);
        if (alive.length === 1) this.economy.awardRoundWinner(alive[0]);

        const winKill = this.shopConfig.winKillLimit || 10;
        const mode = this.gameConfig.mode;
        const hasWinner = this.tanks.some(t => t.kills >= winKill);

        if (mode === 'survival' || hasWinner) {
            this.gameOver.init(this.tanks, null);
            this.state = GameState.GAME_OVER;
            return;
        }

        this.intermission.init(this.tanks, this.roundNumber);
        this.state = GameState.INTERMISSION;
    }

    #updateIntermission(dt) {
        this.intermission.update(dt);
        if (this.intermission.done) {
            if (this.roundNumber % 3 === 0) {
                const humans = this.tanks.filter(t => t.playerIndex >= 0);
                this.shop.init(humans);
                this.state = GameState.SHOP;
            } else {
                this.#startRound();
            }
        }
    }

    #updateShop(dt) {
        const humans = this.tanks.filter(t => t.playerIndex >= 0);
        humans.forEach((tank, i) => {
            const inp = this.input.getPlayerInput(tank.playerIndex);
            if (inp) this.shop.handleInput(i, inp, this.hullConfigs, this.renderer.height);
        });
        if (this.shop.allReady) {
            this.#startRound();
        }
    }

    #updateGameOver(dt) {
        this.gameOver.update(dt);
        if (this.gameOver.waitingForInput) {
            for (let i = 0; i < 3; i++) {
                const inp = this.input.getPlayerInput(i);
                if (inp && inp.fire) {
                    this.lobby.ready = false;
                    this.lobby.menuIndex = 0;
                    this.state = GameState.LOBBY;
                    return;
                }
            }
        }
    }

    #renderWelcome() {
        this.#drawBackground();
        this.welcome.draw(this.renderer, this.gameTime);
    }

    #renderLobby() {
        this.#drawBackground();
        this.lobby.draw(this.renderer, this.gameTime);
    }

    #renderCombat() {
        const ctx = this.renderer.context;
        this.#drawBackground();
        this.arena.draw(ctx, this.renderer);

        ctx.save();
        for (const exp of this.explosions) exp.draw(ctx);
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const proj of this.projectiles) proj.draw(ctx);
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.particles.render(ctx);
        ctx.restore();

        for (const tank of this.tanks) {
            tank.draw(ctx, this.renderer);
        }

        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha * 0.9})`;
            ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
            ctx.restore();
        }

        this.hud.draw(this.renderer, this.tanks, this.roundNumber, this.gameConfig.mode);
        this.hud.drawRadarArrows(this.renderer, this.tanks, this.arena);

        if (this.gameConfig.mode === 'survival' && this.waveNumber > 0) {
            this.renderer.drawText(`WAVE ${this.waveNumber}`, this.renderer.width - 20, 80, '#ff4400', 8, 'right');
        }
    }

    #renderIntermission() {
        this.#drawBackground();
        this.intermission.draw(this.renderer);
    }

    #renderShop() {
        this.#drawBackground();
        this.shop.draw(this.renderer, this.gameTime);
    }

    #renderGameOver() {
        this.#drawBackground();
        this.gameOver.draw(this.renderer, this.gameTime);
    }

    #drawBackground() {
        const ctx = this.renderer.context;
        const w = this.renderer.width;
        const h = this.renderer.height;

        const t = this.gameTime * 0.02;
        for (let x = 0; x < w; x += 80) {
            for (let y = 0; y < h; y += 80) {
                const shimmer = Math.sin(x * 0.05 + t) * Math.cos(y * 0.04 - t * 0.7);
                const alpha = Math.max(0, shimmer * 0.04);
                ctx.fillStyle = `rgba(0,30,60,${alpha})`;
                ctx.fillRect(x, y, 80, 80);
            }
        }
    }
}
