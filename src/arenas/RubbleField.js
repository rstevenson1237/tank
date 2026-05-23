import { Vector2 } from '../math/Vector2.js';
import { Arena } from './Arena.js';

export class RubbleField extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;

        this.pillars = [];

        // Inner ring: 6 pillars, evenly spaced
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            this.pillars.push({
                x: cx + Math.cos(a) * radius * 0.30,
                y: cy + Math.sin(a) * radius * 0.30,
                r: radius * 0.065,
            });
        }

        // Outer ring: 8 pillars, offset by 22.5° and slightly varied sizes
        const outerR = [0.060, 0.065, 0.055, 0.070, 0.060, 0.065, 0.055, 0.060];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            this.pillars.push({
                x: cx + Math.cos(a) * radius * 0.58,
                y: cy + Math.sin(a) * radius * 0.58,
                r: radius * outerR[i],
            });
        }
    }

    constrainPosition(pos, radius) {
        let result = Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
        let p = result.hit ? result.position : pos;

        for (const pillar of this.pillars) {
            const r2 = Arena.constrainToCircle(p, radius, pillar.x, pillar.y, pillar.r, false);
            if (r2.hit) { p = r2.position; result = r2; }
        }

        return result.hit ? { ...result, position: p } : { position: p, hit: false, normal: null };
    }

    getSpawnPoints(count) {
        const pts = [];
        for (let i = 0; i < count; i++) {
            // Midpoints between inner-ring pillars at r*0.42
            const a = (i / count) * Math.PI * 2 + Math.PI / 6;
            pts.push(new Vector2(
                this.center.x + Math.cos(a) * this.radius * 0.42,
                this.center.y + Math.sin(a) * this.radius * 0.42
            ));
        }
        return pts;
    }

    isInsideBounds(pos) {
        return pos.distanceTo(this.center) < this.radius;
    }

    draw(ctx, renderer) {
        const cx = this.center.x, cy = this.center.y, r = this.radius;

        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        for (const p of this.pillars) {
            ctx.save();
            ctx.fillStyle = 'rgba(80,0,140,0.25)';
            ctx.strokeStyle = '#cc44ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
}
