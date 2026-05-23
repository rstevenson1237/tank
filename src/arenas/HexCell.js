import { Vector2 } from '../math/Vector2.js';
import { Arena } from './Arena.js';

export class HexCell extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;

        // 6 pillars at hexagon vertices
        this.pillars = [];
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            this.pillars.push({
                x: cx + Math.cos(a) * radius * 0.42,
                y: cy + Math.sin(a) * radius * 0.42,
                r: radius * 0.065,
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
            // Offset 30° from pillar positions so spawns land in the outer lanes between pillars
            const a = (i / count) * Math.PI * 2 + Math.PI / 6;
            pts.push(new Vector2(
                this.center.x + Math.cos(a) * this.radius * 0.65,
                this.center.y + Math.sin(a) * this.radius * 0.65
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

        // Draw faint hex outline connecting pillar centers for visual clarity
        ctx.save();
        ctx.strokeStyle = 'rgba(0,170,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const p = this.pillars[i];
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        for (const p of this.pillars) {
            ctx.save();
            ctx.fillStyle = 'rgba(80,0,140,0.30)';
            ctx.strokeStyle = '#cc44ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
}
