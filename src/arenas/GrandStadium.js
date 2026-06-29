import { Arena } from './Arena.js';
import { Vector2 } from '../math/Vector2.js';

export class GrandStadium extends Arena {
    constructor(cx, cy, r) {
        super(cx, cy);
        this.halfW = r * 1.65;
        this.halfH = r * 0.93;
        this.radius = Math.sqrt(this.halfW * this.halfW + this.halfH * this.halfH);
        this.id = 'grand_stadium';
        this.label = 'Grand Stadium';
    }

    constrainPosition(pos, radius) {
        return Arena.constrainToRectangle(pos, radius, this.center.x, this.center.y, this.halfW, this.halfH);
    }

    constrainProjectile(pos, radius) {
        return this.constrainPosition(pos, radius);
    }

    constrainBoundary(pos, radius) {
        return Arena.constrainToRectangle(pos, radius, this.center.x, this.center.y, this.halfW, this.halfH);
    }

    getSpawnPoints(count) {
        const points = [];
        const r = Math.min(this.halfW, this.halfH) * 0.65;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            points.push(new Vector2(
                this.center.x + Math.cos(angle) * r,
                this.center.y + Math.sin(angle) * r
            ));
        }
        return points;
    }

    isInsideBounds(pos) {
        return Math.abs(pos.x - this.center.x) < this.halfW &&
               Math.abs(pos.y - this.center.y) < this.halfH;
    }

    draw(ctx) {
        const cx = this.center.x, cy = this.center.y;
        const x = cx - this.halfW, y = cy - this.halfH;
        const w = this.halfW * 2, h = this.halfH * 2;

        ctx.save();

        // Subtle grid
        ctx.strokeStyle = 'rgba(0, 60, 100, 0.12)';
        ctx.lineWidth = 1;
        const cols = 8, rows = 5;
        for (let i = 1; i < cols; i++) {
            const gx = x + (w / cols) * i;
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx, y + h);
            ctx.stroke();
        }
        for (let i = 1; i < rows; i++) {
            const gy = y + (h / rows) * i;
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.lineTo(x + w, gy);
            ctx.stroke();
        }

        // Outer glow border
        ctx.strokeStyle = 'rgba(0,170,255,0.25)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
        ctx.strokeRect(x, y, w, h);

        // Main border
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 20;
        ctx.strokeRect(x, y, w, h);

        ctx.restore();
    }
}
