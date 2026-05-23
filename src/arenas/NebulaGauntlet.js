import { Arena } from './Arena.js';
import { Vector2 } from '../math/Vector2.js';

export class NebulaGauntlet extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;
        this.id = 'nebula_gauntlet';
        this.label = 'Nebula Gauntlet';

        this.pillars = [
            { x: cx - radius * 0.4, y: cy - radius * 0.3, r: radius * 0.08 },
            { x: cx + radius * 0.4, y: cy - radius * 0.3, r: radius * 0.08 },
            { x: cx - radius * 0.4, y: cy + radius * 0.3, r: radius * 0.08 },
            { x: cx + radius * 0.4, y: cy + radius * 0.3, r: radius * 0.08 },
            { x: cx, y: cy - radius * 0.5, r: radius * 0.07 },
            { x: cx, y: cy + radius * 0.5, r: radius * 0.07 },
            { x: cx - radius * 0.55, y: cy, r: radius * 0.07 },
            { x: cx + radius * 0.55, y: cy, r: radius * 0.07 },
        ];
    }

    constrainPosition(pos, radius) {
        let result = Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
        let p = result.position;

        for (const pillar of this.pillars) {
            const pr = Arena.constrainToCircle(p, radius, pillar.x, pillar.y, pillar.r, false);
            if (pr.hit) {
                p = pr.position;
                result = { position: p, hit: true, normal: pr.normal };
            }
        }

        return result.hit ? result : { position: p, hit: false, normal: null };
    }

    constrainProjectile(pos, pRadius) {
        let result = Arena.constrainToCircle(pos, pRadius, this.center.x, this.center.y, this.radius, true);
        let p = result.position;

        for (const pillar of this.pillars) {
            const pr = Arena.constrainToCircle(p, pRadius, pillar.x, pillar.y, pillar.r, false);
            if (pr.hit) {
                p = pr.position;
                result = { position: p, hit: true, normal: pr.normal };
            }
        }

        return result.hit ? result : { position: p, hit: false, normal: null };
    }

    getSpawnPoints(count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const r = this.radius * 0.55;
            points.push(new Vector2(
                this.center.x + Math.cos(angle) * r,
                this.center.y + Math.sin(angle) * r
            ));
        }
        return points;
    }

    isInsideBounds(pos) {
        return pos.distanceTo(this.center) < this.radius;
    }

    draw(ctx) {
        ctx.save();
        const cx = this.center.x, cy = this.center.y;

        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        for (const pillar of this.pillars) {
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#aa00ff';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(pillar.x, pillar.y, pillar.r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(80,0,120,0.3)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(pillar.x, pillar.y, pillar.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
