import { Vector2 } from '../math/Vector2.js';
import { Arena } from './Arena.js';

export class Catacombs extends Arena {
    constructor(cx, cy, radius) {
        super(cx, cy);
        this.radius = radius;

        // 6 alcoves around the ring edge, each formed by two radial wall segments
        this.walls = [];
        for (let i = 0; i < 6; i++) {
            const a  = (i / 6) * Math.PI * 2;
            const rx = Math.cos(a), ry = Math.sin(a); // radial direction
            const px = -Math.sin(a), py = Math.cos(a); // perpendicular

            const inner = radius * 0.44; // mouth of alcove (faces center)
            const outer = radius * 0.72; // back of alcove
            const hw    = radius * 0.10; // half-width of alcove opening

            // Two walls run radially, offset to either side of the alcove center axis
            this.walls.push(
                { ax: cx + rx * inner + px * hw, ay: cy + ry * inner + py * hw,
                  bx: cx + rx * outer + px * hw, by: cy + ry * outer + py * hw },
                { ax: cx + rx * inner - px * hw, ay: cy + ry * inner - py * hw,
                  bx: cx + rx * outer - px * hw, by: cy + ry * outer - py * hw }
            );
        }
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
            if (i === 0) {
                // Center point
                pts.push(new Vector2(this.center.x, this.center.y));
            } else {
                // Inside each alcove
                const a = ((i - 1) % 6) / 6 * Math.PI * 2;
                pts.push(new Vector2(
                    this.center.x + Math.cos(a) * this.radius * 0.58,
                    this.center.y + Math.sin(a) * this.radius * 0.58
                ));
            }
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
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(wall.ax, wall.ay);
            ctx.lineTo(wall.bx, wall.by);
            ctx.stroke();
            ctx.restore();
        }
    }
}
