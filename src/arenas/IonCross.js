import { Vector2 } from '../math/Vector2.js';
import { Arena } from './Arena.js';

export class IonCross extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;

        const w   = radius * 0.16; // corridor half-width (narrower than GeometricCross's 0.28)
        const arm = radius * 0.50; // arm reach from center

        // 8 wall segments forming 4 arms — same structure as GeometricCross, shorter proportions
        this.walls = [
            { ax: cx - arm, ay: cy - w, bx: cx - w, by: cy - w },
            { ax: cx - arm, ay: cy + w, bx: cx - w, by: cy + w },
            { ax: cx + w,   ay: cy - w, bx: cx + arm, by: cy - w },
            { ax: cx + w,   ay: cy + w, bx: cx + arm, by: cy + w },
            { ax: cx - w,   ay: cy - arm, bx: cx - w, by: cy - w },
            { ax: cx + w,   ay: cy - arm, bx: cx + w, by: cy - w },
            { ax: cx - w,   ay: cy + w,  bx: cx - w, by: cy + arm },
            { ax: cx + w,   ay: cy + w,  bx: cx + w, by: cy + arm },
        ];

        // Small pillar at each arm tip — adds a decision point at corridor ends
        const pr = radius * 0.055;
        this.pillars = [
            { x: cx - arm, y: cy, r: pr },
            { x: cx + arm, y: cy, r: pr },
            { x: cx, y: cy - arm, r: pr },
            { x: cx, y: cy + arm, r: pr },
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

        for (const pillar of this.pillars) {
            const r2 = Arena.constrainToCircle(p, radius, pillar.x, pillar.y, pillar.r, false);
            if (r2.hit) { p = r2.position; result = r2; }
        }

        return result.hit ? { ...result, position: p } : { position: p, hit: false, normal: null };
    }

    getSpawnPoints(count) {
        const pts = [];
        for (let i = 0; i < count; i++) {
            // Start at 45° so initial positions land in the quadrant pockets between arms
            const a = (i / count) * Math.PI * 2 - Math.PI / 4;
            pts.push(new Vector2(
                this.center.x + Math.cos(a) * this.radius * 0.55,
                this.center.y + Math.sin(a) * this.radius * 0.55
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
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(wall.ax, wall.ay);
            ctx.lineTo(wall.bx, wall.by);
            ctx.stroke();
            ctx.restore();
        }

        for (const p of this.pillars) {
            ctx.save();
            ctx.fillStyle = 'rgba(80,0,140,0.30)';
            ctx.strokeStyle = '#cc44ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }
}
