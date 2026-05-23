import { Vector2 } from '../math/Vector2.js';

const PERSONALITIES = [
    { id: 'rusher',    aggression: 0.9, aimVariance: 0.15, weaponBias: ['plasma_bolt', 'vector_laser'],   predicts: false },
    { id: 'sniper',    aggression: 0.4, aimVariance: 0.04, weaponBias: ['vector_laser'],                  predicts: true  },
    { id: 'support',   aggression: 0.3, aimVariance: 0.20, weaponBias: ['seeker_missile'],                predicts: false },
    { id: 'berserker', aggression: 1.0, aimVariance: 0.30, weaponBias: ['heavy_mortar', 'the_nuke'],      predicts: false },
    { id: 'coward',    aggression: 0.1, aimVariance: 0.25, weaponBias: ['reflective_shrapnel'],           predicts: false },
    { id: 'balanced',  aggression: 0.6, aimVariance: 0.12, weaponBias: [],                               predicts: true  },
];

export class BotAI {
    static get PERSONALITIES() { return PERSONALITIES; }

    constructor() {
        this.#botState = new Map();
    }

    #botState;

    #getState(tank) {
        if (!this.#botState.has(tank)) {
            this.#botState.set(tank, {
                target: null,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderTimer: 0,
                fireDelayTimer: 0
            });
        }
        return this.#botState.get(tank);
    }

    updateBot(tank, dt, allTanks, arena) {
        const cfg = tank.botConfig;
        if (!cfg) return this.#nullInput();
        const state = this.#getState(tank);

        const enemies = allTanks.filter(t => t.alive && t !== tank && !(tank.team && t.team === tank.team));
        if (enemies.length === 0) return this.#nullInput();

        state.target = this.#pickTarget(tank, enemies, state.target);
        if (!state.target || !state.target.alive) {
            state.target = enemies[0];
        }

        const target = state.target;

        let aimPos;
        if (cfg.predicts && target) {
            aimPos = this.#predictIntercept(tank.position, tank.activeWeapon?.speed || 600, target);
        } else {
            aimPos = target.position;
        }

        const toAim = aimPos.sub(tank.position);
        const distance = toAim.length();

        const variance = (Math.random() - 0.5) * 2 * cfg.aimVariance;
        const aimAngle = toAim.angle() + variance;
        const desiredAngle = aimAngle;
        const angleDiff = this.#wrapAngle(desiredAngle - tank.heading);

        const rotateLeft = angleDiff < -0.05;
        const rotateRight = angleDiff > 0.05;

        const idealDist = 150 + cfg.aggression * 80;
        const thrust = distance > idealDist * 0.6;
        const brake = distance < idealDist * 0.3 && cfg.aggression < 0.7;

        state.fireDelayTimer -= dt;
        const aimAccuracy = Math.abs(angleDiff);
        const canFire = aimAccuracy < 0.35 + cfg.aimVariance && state.fireDelayTimer <= 0;

        let fire = false;
        if (canFire) {
            const weapon = tank.activeWeapon;
            const needsEnergy = weapon && weapon.energyCost > 0;
            if (!needsEnergy || tank.energy >= weapon.energyCost) {
                fire = true;
                state.fireDelayTimer = 0.1 + Math.random() * 0.15;
            }
        }

        if (Math.random() < 0.01) {
            const weaponPrev = Math.random() < 0.5;
            return { thrust, brake, rotateLeft, rotateRight, fire, weaponPrev, weaponNext: !weaponPrev, fireHeld: false };
        }

        return { thrust, brake, rotateLeft, rotateRight, fire, weaponPrev: false, weaponNext: false, fireHeld: false };
    }

    #pickTarget(tank, enemies, current) {
        if (current && current.alive) {
            if (Math.random() > 0.02) return current;
        }
        let best = null;
        let bestScore = Infinity;
        for (const e of enemies) {
            const dist = tank.position.distanceTo(e.position);
            const score = dist * (0.5 + Math.random() * 0.5);
            if (score < bestScore) { bestScore = score; best = e; }
        }
        return best;
    }

    #predictIntercept(origin, projSpeed, target) {
        const tp = target.position;
        const tv = target.velocity;
        const op = origin;

        const dx = tp.x - op.x;
        const dy = tp.y - op.y;
        const a = tv.x * tv.x + tv.y * tv.y - projSpeed * projSpeed;
        const b = 2 * (dx * tv.x + dy * tv.y);
        const c = dx * dx + dy * dy;

        if (Math.abs(a) < 0.001) {
            if (Math.abs(b) < 0.001) return tp.clone();
            const t = -c / b;
            if (t >= 0) return new Vector2(tp.x + tv.x * t, tp.y + tv.y * t);
            return tp.clone();
        }

        const disc = b * b - 4 * a * c;
        if (disc < 0) return tp.clone();
        const sqrtDisc = Math.sqrt(disc);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);
        const t = (t1 >= 0 ? t1 : t2);
        if (t < 0) return tp.clone();
        return new Vector2(tp.x + tv.x * t, tp.y + tv.y * t);
    }

    #wrapAngle(a) {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    }

    #nullInput() {
        return { thrust: false, brake: false, rotateLeft: false, rotateRight: false, fire: false, weaponPrev: false, weaponNext: false, fireHeld: false };
    }

    reset() { this.#botState.clear(); }
}
