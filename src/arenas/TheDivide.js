import { Vector2 } from '../math/Vector2.js';
import { Arena } from './Arena.js';

export class TheDivide extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;

        // Horizontal wall bisecting the arena, leaving a center gap and two side gaps
        this.walls = [
            { ax: cx - radius * 0.80, ay: cy, bx: cx - radius * 0.16, by: cy },
            { ax: cx + radius * 0.16, ay: cy, bx: cx + radius * 0.80, by: cy },
        ];
    }

    constrainPosition(pos, radius) {
        let result = Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
        let p = result.hit ? result.position : pos;

        for (const wall of this.walls) {
            const closest = Arena.segmentClosestPoint(wall.ax, wall.ay, wall.bx, wall.by, p.x, p.y);
            const dx = p.x - closest.x, dy = p.y - closest.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                const len = dist > 0 ? dist : 0.001;
                const nx = dx / len, ny = dy / len;
                p = new Vector2(closest.x + nx * radius, closest.y + ny * radius);
                result = { position: p, hit: true, normal: new Vector2(nx, ny) };
            }
        }

        return result.hit ? { ...result, position: p } : { position: p, hit: false, normal: null };
    }

    getSpawnPoints(count) {
        const pts = [];
        for (let i = 0; i < count; i++) {
            // Alternate upper / lower half so players start on opposite sides
            const sign = i % 2 === 0 ? -1 : 1;
            const a = (Math.floor(i / 2) / Math.ceil(count / 2)) * Math.PI * 0.7 - Math.PI * 0.35;
            pts.push(new Vector2(
                this.center.x + Math.sin(a) * this.radius * 0.55,
                this.center.y + sign * this.radius * 0.48
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

        for (const wall of this.walls) {
            ctx.save();
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(wall.ax, wall.ay);
            ctx.lineTo(wall.bx, wall.by);
            ctx.stroke();
            ctx.restore();
        }
    }
}
