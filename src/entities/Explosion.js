export class Explosion {
    constructor(x, y, radius, duration = 0.4) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.age = 0;
        this.alive = true;
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.duration) this.alive = false;
    }

    draw(ctx) {
        const t = this.age / this.duration;
        const alpha = 1 - t;
        const r = this.radius * (0.3 + t * 0.7);

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;

        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffaa00');
        grad.addColorStop(0.7, '#ff4400');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
