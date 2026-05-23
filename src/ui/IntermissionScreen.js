export class IntermissionScreen {
    constructor() {
        this.timer = 0;
        this.duration = 4;
        this.results = null;
        this.done = false;
    }

    init(tanks, roundNumber) {
        this.timer = 0;
        this.done = false;
        this.roundNumber = roundNumber;
        this.results = [...tanks].sort((a, b) => b.kills - a.kills).map(t => ({
            name: t.name,
            color: t.color,
            kills: t.kills,
            deaths: t.deaths,
            cash: t.cash,
            isBot: t.playerIndex < 0
        }));
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.duration) this.done = true;
    }

    draw(renderer) {
        const w = renderer.width;
        const h = renderer.height;
        const t = this.timer / this.duration;

        renderer.drawGlowText(`ROUND ${this.roundNumber} COMPLETE`, w / 2, h * 0.22, '#ffcc00', 18, 'center', 16);

        const nextText = (this.roundNumber % 3 === 0)
            ? 'SHOP OPENS NEXT'
            : `ROUND ${this.roundNumber + 1} STARTING`;
        renderer.drawText(nextText, w / 2, h * 0.22 + 40, '#446644', 8, 'center');

        if (!this.results) return;

        const startY = h * 0.38;
        const rowH = 48;
        const headers = ['RANK', 'NAME', 'KILLS', 'DEATHS', 'CASH'];
        const cols = [w * 0.1, w * 0.22, w * 0.52, w * 0.65, w * 0.78];

        headers.forEach((hdr, i) => renderer.drawText(hdr, cols[i], startY, '#334444', 7, 'left'));

        this.results.forEach((r, i) => {
            const y = startY + 30 + i * rowH;
            const alpha = Math.min(1, (this.timer - i * 0.15) * 4);
            if (alpha <= 0) return;

            const ctx = renderer.context;
            ctx.save();
            ctx.globalAlpha = alpha;

            if (i === 0) {
                ctx.fillStyle = 'rgba(255,200,0,0.06)';
                ctx.fillRect(w * 0.08, y - 16, w * 0.84, rowH - 4);
            }

            renderer.drawGlowText(`#${i + 1}`, cols[0], y, i === 0 ? '#ffcc00' : '#446655', 8, 'left', i === 0 ? 6 : 0);
            renderer.drawGlowText(r.name, cols[1], y, r.color, 8, 'left', 4);
            renderer.drawText(String(r.kills), cols[2], y, '#00ff88', 8, 'left');
            renderer.drawText(String(r.deaths), cols[3], y, '#ff4444', 8, 'left');
            renderer.drawText(`$${r.cash}`, cols[4], y, '#44aa44', 8, 'left');

            ctx.restore();
        });

        const barW = (renderer.width - 200) * (1 - t);
        renderer.fillRect(100, h - 30, renderer.width - 200, 6, '#111111');
        renderer.fillRect(100, h - 30, barW, 6, '#225522');
        renderer.drawText('Continuing...', w / 2, h - 14, '#333333', 6, 'center');
    }
}
