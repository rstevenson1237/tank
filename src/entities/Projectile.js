import { Vector2 } from '../math/Vector2.js';

export class Projectile {
    constructor(owner, config, position, direction) {
        this.owner = owner;
        this.config = config;
        this.position = position.clone();
        this.velocity = direction.normalized().scale(config.speed);
        this.alive = true;
        this.age = 0;
        this.bouncesLeft = config.bouncesLeft;
        this.target = null;
        this.trail = [];
        this.hitOwnerCooldown = config.ownerCooldown ?? 0.15;
    }

    findTarget(tanks) {
        if (!this.config.homing) return;
        let best = null;
        let bestDist = Infinity;
        for (const t of tanks) {
            if (!t.alive || t === this.owner) continue;
            if (this.owner && t.team && t.team === this.owner.team) continue;
            const d = this.position.distanceSqTo(t.position);
            if (d < bestDist) { bestDist = d; best = t; }
        }
        this.target = best;
    }

    update(dt, tanks, arena) {
        if (!this.alive) return;

        this.age += dt;
        if (this.hitOwnerCooldown > 0) this.hitOwnerCooldown -= dt;
        if (this.age >= this.config.maxLifetime) {
            if (this.config.aoeRadius > 0) this.#triggerAoe(tanks);
            this.alive = false;
            return;
        }

        if (this.config.homing && this.target) {
            if (!this.target.alive) this.target = null;
            if (this.target) {
                const toTarget = this.target.position.sub(this.position).normalized();
                const currentDir = this.velocity.normalized();
                const cross = currentDir.cross(toTarget);
                const turnAmount = Math.sign(cross) * this.config.homingStrength * dt;
                const newAngle = this.velocity.angle() + turnAmount;
                this.velocity = Vector2.fromAngle(newAngle).scale(this.config.speed);
            }
        }

        this.trail.push(this.position.clone());
        if (this.trail.length > this.config.trailLength) this.trail.shift();

        // Sub-step movement so fast projectiles can't tunnel through thin walls.
        // Each sub-step moves at most one projectile-radius, keeping every sample
        // point inside the wall collision zone (2 * radius wide).
        const projRadius = this.config.size || 3;
        const totalDist = this.velocity.length() * dt;
        const steps = Math.max(1, Math.ceil(totalDist / projRadius));
        const subDt = dt / steps;

        for (let s = 0; s < steps; s++) {
            this.position = this.position.add(this.velocity.scale(subDt));

            if (this.config.wallPhasing) {
                // Phase weapons ignore internal geometry; only the outer boundary kills them.
                const bound = arena.constrainBoundary(this.position, projRadius);
                if (bound.hit) {
                    if (this.config.aoeRadius > 0) this.#triggerAoe(tanks);
                    this.alive = false;
                    return;
                }
            } else {
                const wallResult = arena.constrainProjectile(this.position, projRadius);
                if (wallResult.hit) {
                    if (this.bouncesLeft > 0) {
                        this.velocity = this.velocity.reflect(wallResult.normal);
                        this.position = wallResult.position;
                        this.bouncesLeft--;
                    } else if (this.config.proximityTrigger > 0) {
                        // Mines stop at walls rather than detonating on contact.
                        this.velocity = Vector2.zero();
                        this.position = wallResult.position;
                    } else {
                        if (this.config.aoeRadius > 0) this.#triggerAoe(tanks);
                        this.alive = false;
                        return;
                    }
                }
            }

            for (const tank of tanks) {
                if (!tank.alive) continue;
                if (tank === this.owner && this.hitOwnerCooldown > 0) continue;
                const dist = this.position.distanceTo(tank.position);
                // Proximity mines use their trigger radius; all others use direct contact.
                const hitRange = this.config.proximityTrigger > 0
                    ? this.config.proximityTrigger
                    : tank.size + projRadius;
                if (dist < hitRange) {
                    if (this.config.aoeRadius > 0) {
                        this.#triggerAoe(tanks);
                    } else {
                        tank.takeDamage(this.config.damage, this.config.shieldPenetration, this.owner);
                    }
                    this.alive = false;
                    return;
                }
            }
        }
    }

    #triggerAoe(tanks) {
        this.aoeTriggered = { x: this.position.x, y: this.position.y, radius: this.config.aoeRadius };
        for (const tank of tanks) {
            if (!tank.alive) continue;
            const dist = this.position.distanceTo(tank.position);
            if (dist < this.config.aoeRadius + tank.size) {
                const falloff = Math.max(0, 1 - (dist / this.config.aoeRadius));
                const dmg = this.config.damage * falloff;
                if (dmg > 0) tank.takeDamage(dmg, this.config.shieldPenetration, this.owner);
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = i / this.trail.length;
                const p0 = this.trail[i - 1];
                const p1 = this.trail[i];
                ctx.strokeStyle = this.config.color;
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineWidth = (this.config.size || 3) * alpha;
                ctx.shadowColor = this.config.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = this.config.color;
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.config.size || 3, 0, Math.PI * 2);
        ctx.fill();

        if (this.config.id === 'the_nuke') {
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, (this.config.size || 3) * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.config.proximityTrigger > 0) {
            ctx.strokeStyle = this.config.color;
            ctx.globalAlpha = 0.18 + 0.10 * Math.sin(this.age * 5);
            ctx.lineWidth = 1;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.config.color;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.config.proximityTrigger, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
