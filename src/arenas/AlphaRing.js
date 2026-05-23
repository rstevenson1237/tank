import { Arena } from './Arena.js';
import { Vector2 } from '../math/Vector2.js';

export class AlphaRing extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;
        this.id = 'alpha_ring';
        this.label = 'Alpha Ring';
    }

    constrainPosition(pos, radius) {
        return Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
    }

    constrainProjectile(pos, radius) {
        return this.constrainPosition(pos, radius);
    }

    getSpawnPoints(count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const r = this.radius * 0.6;
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

    draw(ctx, renderer) {
        ctx.save();

        for (let i = 3; i >= 1; i--) {
            ctx.strokeStyle = `rgba(0, 40, 80, ${0.15 * i})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.center.x, this.center.y, this.radius * (i / 3), 0, Math.PI * 2);
            ctx.stroke();
        }

        const cx = this.center.x;
        const cy = this.center.y;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.strokeStyle = 'rgba(0, 60, 100, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * this.radius, cy + Math.sin(angle) * this.radius);
            ctx.stroke();
        }

        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0,170,255,0.25)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
