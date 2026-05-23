import { Vector2 } from '../math/Vector2.js';
import { Projectile } from './Projectile.js';

export class Tank {
    constructor(playerIndex, hullConfig, weaponConfigs, position, color, name) {
        this.playerIndex = playerIndex;
        this.color = color;
        this.name = name;
        this.botConfig = null;
        this.team = null;

        this.position = position.clone();
        this.velocity = Vector2.zero();
        this.heading = -Math.PI / 2;
        this.angularVelocity = 0;

        this.hullConfig = hullConfig;
        this.size = hullConfig.size;
        this.maxSpeed = hullConfig.maxSpeed;
        this.acceleration = hullConfig.acceleration;
        this.brakeFriction = hullConfig.brakeFriction;
        this.idleFriction = hullConfig.idleFriction;
        this.turnRate = hullConfig.turnRate;
        this.maxShields = hullConfig.maxShields;
        this.maxHullHp = hullConfig.maxHullHp;
        this.maxEnergy = hullConfig.maxEnergy;
        this.energyRegen = hullConfig.energyRegen;

        this.shields = this.maxShields;
        this.hullHp = this.maxHullHp;
        this.energy = this.maxEnergy;
        this.alive = true;
        this.fireCooldown = 0;

        this.weaponConfigs = weaponConfigs;
        this.weapons = [weaponConfigs.find(w => w.id === 'vector_laser')];
        this.activeWeaponIndex = 0;

        this.cash = 0;
        this.kills = 0;
        this.deaths = 0;
        this.damageDealt = 0;

        this.upgrades = {
            shieldCapacitor: 0,
            energyOverclocker: 0,
            engineThruster: 0,
            radarScanner: false,
            autoRepair: 0
        };

        this.timeSinceDamage = 0;
        this.flashTimer = 0;
        this.deathEffect = 0;
        this.killedBy = null;

        this.fuelParticles = this.#initFuelParticles();
    }

    #initFuelParticles() {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * this.size * 0.6;
            particles.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40
            });
        }
        return particles;
    }

    getEffectiveStats() {
        const s = this.upgrades.shieldCapacitor;
        const e = this.upgrades.energyOverclocker;
        const t = this.upgrades.engineThruster;
        return {
            maxShields: this.maxShields * (1 + s * 0.2),
            maxEnergy: this.maxEnergy,
            energyRegen: this.energyRegen * (1 + e * 0.25),
            maxSpeed: this.maxSpeed * (1 + t * 0.15),
            acceleration: this.acceleration * (1 + t * 0.15)
        };
    }

    applyHull(hullConfig) {
        const shieldRatio = this.shields / this.maxShields;
        const energyRatio = this.energy / this.maxEnergy;

        this.hullConfig = hullConfig;
        this.size = hullConfig.size;
        this.maxSpeed = hullConfig.maxSpeed;
        this.acceleration = hullConfig.acceleration;
        this.brakeFriction = hullConfig.brakeFriction;
        this.idleFriction = hullConfig.idleFriction;
        this.turnRate = hullConfig.turnRate;
        this.maxShields = hullConfig.maxShields;
        this.maxHullHp = hullConfig.maxHullHp;
        this.maxEnergy = hullConfig.maxEnergy;
        this.energyRegen = hullConfig.energyRegen;

        this.shields = this.maxShields * shieldRatio;
        this.hullHp = this.maxHullHp;
        this.energy = this.maxEnergy * energyRatio;
    }

    addWeapon(weaponConfig) {
        if (!this.weapons.find(w => w.id === weaponConfig.id)) {
            this.weapons.push(weaponConfig);
        }
    }

    get activeWeapon() {
        return this.weapons[this.activeWeaponIndex] || this.weapons[0];
    }

    update(dt, input) {
        if (!this.alive) return;

        const stats = this.getEffectiveStats();
        this.timeSinceDamage += dt;
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        if (input.rotateLeft) this.heading -= this.turnRate * dt;
        if (input.rotateRight) this.heading += this.turnRate * dt;

        const dir = Vector2.fromAngle(this.heading);

        if (input.thrust) {
            this.velocity = this.velocity.add(dir.scale(stats.acceleration * dt));
        } else if (input.brake) {
            this.velocity = this.velocity.add(dir.scale(-stats.acceleration * 0.6 * dt));
        }

        this.velocity = this.velocity.scale(Math.pow(1 - this.idleFriction, dt));

        const speed = this.velocity.length();
        if (speed > stats.maxSpeed) {
            this.velocity = this.velocity.scale(stats.maxSpeed / speed);
        }

        this.position = this.position.add(this.velocity.scale(dt));

        if (input.weaponPrev) this.#cycleWeapon(-1);
        if (input.weaponNext) this.#cycleWeapon(1);

        this.energy = Math.min(stats.maxEnergy, this.energy + stats.energyRegen * dt);

        if (this.upgrades.autoRepair > 0 && this.timeSinceDamage > 5) {
            const effMax = this.maxShields * (1 + this.upgrades.shieldCapacitor * 0.2);
            this.shields = Math.min(effMax, this.shields + 3 * dt);
        }

        this.#updateFuelParticles(dt, input);
    }

    #cycleWeapon(dir) {
        this.activeWeaponIndex = (this.activeWeaponIndex + dir + this.weapons.length) % this.weapons.length;
    }

    tryFire() {
        if (this.fireCooldown > 0 || !this.alive) return null;
        const weapon = this.activeWeapon;
        if (!weapon) return null;

        if (weapon.energyCost > 0 && this.energy < weapon.energyCost) return null;

        this.energy = Math.max(0, this.energy - weapon.energyCost);
        this.fireCooldown = weapon.cooldown;

        const muzzleOffset = this.size + (weapon.size || 3) + 2;
        const startPos = this.position.add(Vector2.fromAngle(this.heading).scale(muzzleOffset));
        const proj = new Projectile(this, weapon, startPos, Vector2.fromAngle(this.heading));
        return proj;
    }

    takeDamage(amount, shieldPenetration = 0, attacker = null) {
        if (!this.alive) return;
        this.timeSinceDamage = 0;
        this.flashTimer = 0.12;

        if (attacker && attacker !== this) {
            attacker.damageDealt = (attacker.damageDealt || 0) + amount;
        }

        const directHull = amount * shieldPenetration;
        const vsShields = amount * (1 - shieldPenetration);
        const absorbed = Math.min(this.shields, vsShields);
        this.shields -= absorbed;
        this.hullHp -= directHull + (vsShields - absorbed);
        this.hullHp = Math.max(0, this.hullHp);

        if (this.hullHp <= 0) {
            this.alive = false;
            this.deathEffect = 1;
            this.killedBy = (attacker && attacker !== this) ? attacker : null;
            this.deaths = (this.deaths || 0) + 1;
        }
    }

    respawn(position) {
        this.position = position.clone();
        this.velocity = Vector2.zero();
        this.heading = -Math.PI / 2;
        const stats = this.getEffectiveStats();
        this.shields = stats.maxShields;
        this.hullHp = this.maxHullHp;
        this.energy = stats.maxEnergy;
        this.alive = true;
        this.fireCooldown = 0;
        this.timeSinceDamage = 0;
        this.killedBy = null;
        this.fuelParticles = this.#initFuelParticles();
    }

    #updateFuelParticles(dt, input) {
        const gravX = 0;
        const gravY = 60;
        const localGrav = new Vector2(gravX, gravY).rotatedBy(-this.heading);
        const accelReaction = input.thrust
            ? Vector2.fromAngle(this.heading + Math.PI).scale(20)
            : Vector2.zero();

        for (const p of this.fuelParticles) {
            p.vx += (localGrav.x + accelReaction.x) * dt;
            p.vy += (localGrav.y + accelReaction.y) * dt;
            p.vx *= Math.pow(0.85, dt * 60);
            p.vy *= Math.pow(0.85, dt * 60);
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            const distSq = p.x * p.x + p.y * p.y;
            const maxR = this.size * 0.65;
            if (distSq > maxR * maxR) {
                const len = Math.sqrt(distSq);
                const nx = p.x / len;
                const ny = p.y / len;
                p.x = nx * maxR;
                p.y = ny * maxR;
                const dot = p.vx * nx + p.vy * ny;
                if (dot > 0) {
                    p.vx -= nx * dot * 1.5;
                    p.vy -= ny * dot * 1.5;
                }
            }
        }
    }

    draw(ctx, renderer) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.heading);

        const s = this.size;
        const v0x = s, v0y = 0;
        const v1x = -s * 0.5, v1y = s * 0.866;
        const v2x = -s * 0.5, v2y = -s * 0.866;

        if (this.flashTimer > 0) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.strokeStyle = '#ffffff';
        } else {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 18;
            ctx.strokeStyle = this.color;
        }
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(v0x, v0y);
        ctx.lineTo(v1x, v1y);
        ctx.lineTo(v2x, v2y);
        ctx.closePath();
        ctx.stroke();

        const cylR = s * 0.28;
        const vertices = [[v0x, v0y], [v1x, v1y], [v2x, v2y]];
        for (const [vx, vy] of vertices) {
            ctx.beginPath();
            ctx.arc(vx, vy, cylR, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.fireCooldown > 0) {
            ctx.fillStyle = '#ff2200';
            ctx.shadowColor = '#ff2200';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.heading);

        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.fuelParticles) {
            const intensity = 0.6 + Math.random() * 0.2;
            ctx.globalAlpha = intensity * 0.55;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawRadarArrows(ctx, canvasW, canvasH) {
        if (!this.upgrades.radarScanner) return;
    }
}
