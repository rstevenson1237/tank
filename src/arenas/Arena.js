import { Vector2 } from '../math/Vector2.js';

export class Arena {
    constructor(cx, cy) {
        this.center = new Vector2(cx, cy);
    }

    constrainPosition(pos, radius) {
        throw new Error('Abstract');
    }

    constrainProjectile(pos, radius) {
        return this.constrainPosition(pos, radius);
    }

    // Outer boundary check only — used by wall-phasing projectiles that ignore
    // internal geometry but still respect the arena edge. All subclasses set
    // this.radius in their constructors.
    constrainBoundary(pos, radius) {
        return Arena.constrainToCircle(pos, radius, this.center.x, this.center.y, this.radius, true);
    }

    getSpawnPoints(count) {
        throw new Error('Abstract');
    }

    draw(ctx, renderer) {
        throw new Error('Abstract');
    }

    isInsideBounds(pos) {
        throw new Error('Abstract');
    }

    static segmentClosestPoint(ax, ay, bx, by, px, py) {
        const abx = bx - ax, aby = by - ay;
        const abLen2 = abx * abx + aby * aby;
        if (abLen2 === 0) return { x: ax, y: ay };
        const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / abLen2));
        return { x: ax + abx * t, y: ay + aby * t };
    }

    static constrainToRectangle(pos, radius, cx, cy, halfW, halfH) {
        const minX = cx - halfW + radius;
        const maxX = cx + halfW - radius;
        const minY = cy - halfH + radius;
        const maxY = cy + halfH - radius;
        let x = pos.x, y = pos.y, hit = false, nx = 0, ny = 0;
        if (x < minX) { x = minX; nx = 1; hit = true; }
        else if (x > maxX) { x = maxX; nx = -1; hit = true; }
        if (y < minY) { y = minY; ny = 1; hit = true; }
        else if (y > maxY) { y = maxY; ny = -1; hit = true; }
        if (!hit) return { position: pos, hit: false, normal: null };
        return { position: new Vector2(x, y), hit: true, normal: new Vector2(nx, ny) };
    }

    static constrainToCircle(pos, radius, cx, cy, cr, inward = true) {
        const dx = pos.x - cx;
        const dy = pos.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const limit = inward ? cr - radius : cr + radius;
        const violated = inward ? dist + radius > cr : dist < cr + radius;
        if (!violated) return { position: pos, hit: false, normal: null };

        const nx = dist > 0 ? dx / dist : 1;
        const ny = dist > 0 ? dy / dist : 0;
        const newPos = inward
            ? new Vector2(cx + nx * (cr - radius), cy + ny * (cr - radius))
            : new Vector2(cx + nx * (cr + radius), cy + ny * (cr + radius));
        // Normal always points away from obstacle toward the entity being constrained
        const normal = inward ? new Vector2(-nx, -ny) : new Vector2(nx, ny);
        return { position: newPos, hit: true, normal };
    }
}
