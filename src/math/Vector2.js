export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    scale(s) { return new Vector2(this.x * s, this.y * s); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; }
    perp() { return new Vector2(-this.y, this.x); }

    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    lengthSq() { return this.x * this.x + this.y * this.y; }

    normalized() {
        const len = this.length();
        return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
    }

    distanceTo(v) { return this.sub(v).length(); }
    distanceSqTo(v) { return this.sub(v).lengthSq(); }

    lerp(v, t) {
        return new Vector2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t);
    }

    reflect(normal) {
        const d = 2 * this.dot(normal);
        return new Vector2(this.x - d * normal.x, this.y - d * normal.y);
    }

    angle() { return Math.atan2(this.y, this.x); }

    rotatedBy(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        return new Vector2(this.x * c - this.y * s, this.x * s + this.y * c);
    }

    clone() { return new Vector2(this.x, this.y); }

    static fromAngle(radians) {
        return new Vector2(Math.cos(radians), Math.sin(radians));
    }

    static zero() { return new Vector2(0, 0); }

    static random(magnitude = 1) {
        return Vector2.fromAngle(Math.random() * Math.PI * 2).scale(magnitude);
    }
}
