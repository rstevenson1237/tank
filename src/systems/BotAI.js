import { Vector2 } from '../math/Vector2.js';

// Core personality archetypes — used by Mixed mode and as internal building blocks
const PERSONALITIES = [
    { id: 'rusher',    aggression: 0.9, aimVariance: 0.15, weaponBias: ['plasma_bolt', 'vector_laser'],   predicts: false, movement: 'charge'  },
    { id: 'sniper',    aggression: 0.4, aimVariance: 0.04, weaponBias: ['vector_laser'],                  predicts: true,  movement: 'orbit'   },
    { id: 'support',   aggression: 0.3, aimVariance: 0.20, weaponBias: ['seeker_missile'],                predicts: false, movement: 'orbit'   },
    { id: 'berserker', aggression: 1.0, aimVariance: 0.30, weaponBias: ['heavy_mortar', 'the_nuke'],      predicts: false, movement: 'charge'  },
    { id: 'coward',    aggression: 0.1, aimVariance: 0.25, weaponBias: ['reflective_shrapnel'],           predicts: false, movement: 'evade'   },
    { id: 'balanced',  aggression: 0.6, aimVariance: 0.12, weaponBias: [],                               predicts: true,  movement: 'orbit'   },
];

// Difficulty presets — predictable behaviour scaled to skill level
const DIFFICULTY_CONFIGS = {
    easy: {
        id: 'easy',    aggression: 0.20, aimVariance: 0.55,
        weaponBias: ['vector_laser'], predicts: false, movement: 'orbit',
    },
    medium: {
        id: 'medium',  aggression: 0.50, aimVariance: 0.25,
        weaponBias: [], predicts: false, movement: 'charge',
    },
    hard: {
        id: 'hard',    aggression: 0.85, aimVariance: 0.07,
        weaponBias: ['plasma_bolt', 'seeker_missile'], predicts: true, movement: 'orbit',
    },
};

// Strategy AIs — each built around one defining tactic
const STRATEGY_CONFIGS = {
    // Stays at extreme range, almost never misses, waits for the right shot
    phantom: {
        id: 'phantom', aggression: 0.25, aimVariance: 0.02,
        weaponBias: ['vector_laser', 'seeker_missile'], predicts: true, movement: 'phantom',
    },
    // Closes the gap instantly and never stops firing — pure overwhelming pressure
    blitzer: {
        id: 'blitzer', aggression: 1.0, aimVariance: 0.38,
        weaponBias: ['plasma_bolt', 'vector_laser'], predicts: false, movement: 'blitz',
    },
    // Gets to your blind side, attacks the angle you're not covering
    flanker: {
        id: 'flanker', aggression: 0.70, aimVariance: 0.14,
        weaponBias: ['plasma_bolt', 'seeker_missile'], predicts: true, movement: 'flank',
    },
};

export class BotAI {
    static get PERSONALITIES() { return PERSONALITIES; }

    // Returns the right personality config for a roster slot
    static pickBotConfig(rosterId) {
        if (rosterId === 'mixed') {
            return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
        }
        if (rosterId === 'mayhem') {
            const pool = [...PERSONALITIES, ...Object.values(STRATEGY_CONFIGS)];
            return pool[Math.floor(Math.random() * pool.length)];
        }
        if (DIFFICULTY_CONFIGS[rosterId]) return DIFFICULTY_CONFIGS[rosterId];
        if (STRATEGY_CONFIGS[rosterId])   return STRATEGY_CONFIGS[rosterId];
        return DIFFICULTY_CONFIGS.medium;
    }

    constructor() {
        this.#botState = new Map();
    }

    #botState;

    #getState(tank) {
        if (!this.#botState.has(tank)) {
            this.#botState.set(tank, {
                target: null,
                fireDelayTimer: 0,
                orbitAngle: Math.random() * Math.PI * 2,
                jinkTimer: 0,
                jinkDir: 1,
                flankTimer: 4,
                flankSide: Math.random() < 0.5 ? 1 : -1,
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
        if (!state.target?.alive) state.target = enemies[0];
        const target = state.target;

        // Aim position: predicted intercept for smart bots, else current position
        let aimPos = (cfg.predicts && target)
            ? this.#predictIntercept(tank.position, tank.activeWeapon?.speed || 600, target)
            : target.position;

        const toTarget = target.position.sub(tank.position);
        const idealDist = 150 + cfg.aggression * 80;
        const movement = cfg.movement || 'charge';

        // --- AIM ANGLE (drives firing decisions) ---
        const toAim = aimPos.sub(tank.position);
        const variance = (Math.random() - 0.5) * 2 * cfg.aimVariance;
        const aimAngle = toAim.angle() + variance;
        const aimDiff = this.#wrapAngle(aimAngle - tank.heading);

        // --- MOVE TARGET (drives thrust/steering) ---
        let moveTarget = target.position;

        if (movement === 'orbit') {
            state.orbitAngle += 0.8 * dt;
            moveTarget = target.position.add(Vector2.fromAngle(state.orbitAngle).scale(idealDist));

        } else if (movement === 'evade') {
            const away = tank.position.sub(target.position).normalized();
            moveTarget = tank.position.add(away.scale(200));

        } else if (movement === 'charge') {
            state.jinkTimer -= dt;
            if (state.jinkTimer <= 0) {
                state.jinkDir   = state.jinkDir === 1 ? -1 : 1;
                state.jinkTimer = 0.4 + Math.random() * 0.6;
            }
            if (toTarget.length() > 0.001) {
                moveTarget = target.position.add(toTarget.perp().normalized().scale(state.jinkDir * 60));
            }

        } else if (movement === 'phantom') {
            // Orbit at 2.5× range; slow, patient, deadly
            state.orbitAngle += 0.35 * dt;
            moveTarget = target.position.add(Vector2.fromAngle(state.orbitAngle).scale(idealDist * 2.5));

        } else if (movement === 'blitz') {
            // Drive straight through — no jink, no retreat
            moveTarget = target.position;

        } else if (movement === 'flank') {
            // Position perpendicular to the target's facing, attacking the blind side
            state.flankTimer -= dt;
            if (state.flankTimer <= 0) {
                state.flankSide  = state.flankSide === 1 ? -1 : 1;
                state.flankTimer = 3 + Math.random() * 4;
            }
            const perp = new Vector2(-Math.sin(target.heading), Math.cos(target.heading));
            moveTarget = target.position.add(perp.scale(state.flankSide * idealDist));
        }

        // --- STEERING: blend aim vs move based on aggression ---
        const toMove   = moveTarget.sub(tank.position);
        const moveDist = toMove.length();
        const moveDiff = this.#wrapAngle(toMove.angle() - tank.heading);

        const steerAngle = cfg.aggression > 0.5 ? aimDiff : moveDiff;
        const rotateLeft  = steerAngle < -0.05;
        const rotateRight = steerAngle > 0.05;

        // Blitzer always thrusts; others use distance thresholds
        const thrust = movement === 'blitz' ? true  : moveDist > idealDist * 0.55;
        const brake  = movement === 'blitz' ? false : moveDist < idealDist * 0.3;

        // --- FIRING ---
        state.fireDelayTimer -= dt;
        const canFire = Math.abs(aimDiff) < 0.35 + cfg.aimVariance && state.fireDelayTimer <= 0;
        let fire = false;
        if (canFire) {
            const weapon = tank.activeWeapon;
            const hasEnergy = !weapon || weapon.energyCost <= 0 || tank.energy >= weapon.energyCost;
            if (hasEnergy) {
                fire = true;
                state.fireDelayTimer = 0.1 + Math.random() * 0.15;
            }
        }

        // Occasional weapon switch
        if (Math.random() < 0.01) {
            const weaponPrev = Math.random() < 0.5;
            return { thrust, brake, rotateLeft, rotateRight, fire, weaponPrev, weaponNext: !weaponPrev, fireHeld: false };
        }

        return { thrust, brake, rotateLeft, rotateRight, fire, weaponPrev: false, weaponNext: false, fireHeld: false };
    }

    #pickTarget(tank, enemies, current) {
        if (current?.alive && Math.random() > 0.02) return current;
        let best = null, bestScore = Infinity;
        for (const e of enemies) {
            const score = tank.position.distanceTo(e.position) * (0.5 + Math.random() * 0.5);
            if (score < bestScore) { bestScore = score; best = e; }
        }
        return best;
    }

    #predictIntercept(origin, projSpeed, target) {
        const dx = target.position.x - origin.x;
        const dy = target.position.y - origin.y;
        const vx = target.velocity.x, vy = target.velocity.y;

        const a = vx * vx + vy * vy - projSpeed * projSpeed;
        const b = 2 * (dx * vx + dy * vy);
        const c = dx * dx + dy * dy;

        if (Math.abs(a) < 0.001) {
            if (Math.abs(b) < 0.001) return target.position.clone();
            const t = -c / b;
            return t >= 0 ? new Vector2(target.position.x + vx * t, target.position.y + vy * t) : target.position.clone();
        }

        const disc = b * b - 4 * a * c;
        if (disc < 0) return target.position.clone();
        const sq = Math.sqrt(disc);
        const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
        const t = t1 >= 0 ? t1 : t2;
        return t >= 0 ? new Vector2(target.position.x + vx * t, target.position.y + vy * t) : target.position.clone();
    }

    #wrapAngle(a) {
        while (a >  Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    }

    #nullInput() {
        return { thrust: false, brake: false, rotateLeft: false, rotateRight: false,
                 fire: false, weaponPrev: false, weaponNext: false, fireHeld: false };
    }

    reset() { this.#botState.clear(); }
}
