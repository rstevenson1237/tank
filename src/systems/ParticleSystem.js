import { Particle } from '../entities/Particle.js';

export class ParticleSystem {
    #particles = [];

    update(dt) {
        for (let i = this.#particles.length - 1; i >= 0; i--) {
            this.#particles[i].update(dt);
            if (!this.#particles[i].alive) this.#particles.splice(i, 1);
        }
    }

    render(ctx) {
        for (const p of this.#particles) p.draw(ctx);
    }

    emit(x, y, vx, vy, color, life, size = 2) {
        this.#particles.push(new Particle(x, y, vx, vy, color, life, size));
    }

    emitBurst(x, y, color, count, speed, life, size = 2) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random() * 0.5);
            this.emit(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, color, life * (0.5 + Math.random() * 0.5), size);
        }
    }

    emitExplosion(x, y, color) {
        this.emitBurst(x, y, color, 16, 200, 0.8, 3);
        this.emitBurst(x, y, '#ffffff', 8, 120, 0.4, 2);
        this.emitBurst(x, y, '#ffaa00', 12, 80, 1.2, 2.5);
    }

    emitEngineTrail(x, y, heading, color) {
        const backAngle = heading + Math.PI + (Math.random() - 0.5) * 0.4;
        const spd = 30 + Math.random() * 60;
        this.emit(x, y, Math.cos(backAngle) * spd, Math.sin(backAngle) * spd, color, 0.2 + Math.random() * 0.15, 1.5);
    }

    emitShieldSpark(x, y, color) {
        this.emitBurst(x, y, color, 6, 100, 0.25, 2);
    }

    clear() { this.#particles = []; }
    get count() { return this.#particles.length; }
}
