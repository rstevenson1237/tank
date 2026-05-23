export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear(color = '#0a0a0c') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    setGlow(color, blur = 18) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
    }

    clearGlow() {
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
    }

    drawGlowCircle(x, y, r, color, blur = 18, lineWidth = 2) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.setGlow(color, blur);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    fillGlowCircle(x, y, r, color, blur = 12) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.setGlow(color, blur);
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawGlowLine(x1, y1, x2, y2, color, lineWidth = 2, blur = 12) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.setGlow(color, blur);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawText(text, x, y, color = '#00ff88', size = 12, align = 'left') {
        this.ctx.save();
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawGlowText(text, x, y, color = '#00ff88', size = 12, align = 'left', blur = 10) {
        this.ctx.save();
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'middle';
        this.setGlow(color, blur);
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    measureText(text, size = 12) {
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        return this.ctx.measureText(text).width;
    }

    drawRect(x, y, w, h, color, lineWidth = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.restore();
    }

    fillRect(x, y, w, h, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.restore();
    }

    save() { this.ctx.save(); }
    restore() { this.ctx.restore(); }
    get context() { return this.ctx; }
}
