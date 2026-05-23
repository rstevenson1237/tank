import { Arena } from './Arena.js';
import { Vector2 } from '../math/Vector2.js';

export class GeometricCross extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;
        this.id = 'geometric_cross';
        this.label = 'Geometric Cross';

        const w = radius * 0.28;
        this.walls = [
            { ax: cx - radius * 0.55, ay: cy - w, bx: cx - w, by: cy - w },
            { ax: cx - radius * 0.55, ay: cy + w, bx: cx - w, by: cy + w },
            { ax: cx + w, ay: cy - w, bx: cx + radius * 0.55, by: cy - w },
            { ax: cx + w, ay: cy + w, bx: cx + radius * 0.55, by: cy + w },
            { ax: cx - w, ay: cy - radius * 0.55, bx: cx - w, by: cy - w },
            { ax: cx + w, ay: cy - radius * 0.55, bx: cx + w, by: cy - w },
            { ax: cx - w, ay: cy + w, bx: cx - w, by: cy + radius * 0.55 },
            { ax: cx + w, ay: cy + w, bx: cx + w, by: cy + radius * 0.55 },
        ];
    }

    constrainPosition(pos, radius) {
        let result = Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
        let p = result.position;

        for (const wall of this.walls) {
            const closest = Arena.segmentClosestPoint(wall.ax, wall.ay, wall.bx, wall.by, p.x, p.y);
            const dx = p.x - closest.x;
            const dy = p.y - closest.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                const len = dist > 0 ? dist : 0.001;
                const nx = dx / len;
                const ny = dy / len;
                p = new Vector2(closest.x + nx * radius, closest.y + ny * radius);
                if (!result.hit) {
                    result = { position: p, hit: true, normal: new Vector2(nx, ny) };
                } else {
                    result.position = p;
                    result.normal = new Vector2(nx, ny);
                }
            }
        }
        return result.hit ? result : { position: p, hit: false, normal: null };
    }

    constrainProjectile(pos, radius) {
        return this.constrainPosition(pos, radius);
    }

    getSpawnPoints(count) {
        const points = [];
        const offsets = [
            new Vector2(-this.radius * 0.55, -this.radius * 0.55),
            new Vector2(this.radius * 0.55, -this.radius * 0.55),
            new Vector2(-this.radius * 0.55, this.radius * 0.55),
            new Vector2(this.radius * 0.55, this.radius * 0.55),
            new Vector2(0, -this.radius * 0.65),
            new Vector2(0, this.radius * 0.65),
            new Vector2(-this.radius * 0.65, 0),
            new Vector2(this.radius * 0.65, 0),
            new Vector2(0, 0)
        ];
        for (let i = 0; i < count; i++) {
            const o = offsets[i % offsets.length];
            points.push(this.center.add(o));
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

        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 14;
        for (const wall of this.walls) {
            ctx.beginPath();
            ctx.moveTo(wall.ax, wall.ay);
            ctx.lineTo(wall.bx, wall.by);
            ctx.stroke();
        }

        ctx.restore();
    }
}
