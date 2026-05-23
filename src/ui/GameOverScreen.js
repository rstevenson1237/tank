export class GameOverScreen {
    constructor() {
        this.results = null;
        this.timer = 0;
        this.waitingForInput = false;
    }

    init(tanks, sessionScores) {
        this.timer = 0;
        this.waitingForInput = false;
        const allTanks = [...tanks];
        allTanks.sort((a, b) => (b.kills || 0) - (a.kills || 0));
        this.results = allTanks.map((t, i) => ({
            rank: i + 1,
            name: t.name,
            color: t.color,
            kills: t.kills || 0,
            deaths: t.deaths || 0,
            cash: t.cash || 0,
            winner: i === 0
        }));
        this.winner = this.results[0];
    }

    update(dt) {
        this.timer += dt;
        if (this.timer > 2.5) this.waitingForInput = true;
    }

    draw(renderer, t) {
        const w = renderer.width;
        const h = renderer.height;

        const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);

        if (this.winner) {
            renderer.drawGlowText('GAME OVER', w / 2, h * 0.14, '#ff2200', 28, 'center', 20);
            renderer.drawGlowText(`WINNER: ${this.winner.name}`, w / 2, h * 0.14 + 52,
                `${this.winner.color}`, 16, 'center', 14);
        }

        if (!this.results) return;

        const startY = h * 0.36;
        const rowH = 50;
        const cols = [w * 0.1, w * 0.22, w * 0.52, w * 0.65, w * 0.78];
        const headers = ['RANK', 'NAME', 'KILLS', 'DEATHS', 'CASH'];
        headers.forEach((hdr, i) => renderer.drawText(hdr, cols[i], startY, '#334444', 7, 'left'));

        this.results.forEach((r, i) => {
            const y = startY + 30 + i * rowH;
            const alpha = Math.min(1, (this.timer - i * 0.2) * 3);
            if (alpha <= 0) return;

            const ctx = renderer.context;
            ctx.save();
            ctx.globalAlpha = alpha;

            if (r.winner) {
                ctx.fillStyle = 'rgba(255,200,0,0.08)';
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 6;
                ctx.fillRect(w * 0.08, y - 18, w * 0.84, rowH - 2);
                ctx.strokeRect(w * 0.08, y - 18, w * 0.84, rowH - 2);
            }

            const rankColors = ['#ffcc00', '#aaaaaa', '#cc8844'];
            const rankColor = rankColors[i] || '#446655';
            renderer.drawGlowText(`#${r.rank}`, cols[0], y, rankColor, 9, 'left', r.winner ? 8 : 0);
            renderer.drawGlowText(r.name, cols[1], y, r.color, 9, 'left', r.winner ? 8 : 4);
            renderer.drawText(String(r.kills), cols[2], y, '#00ff88', 9, 'left');
            renderer.drawText(String(r.deaths), cols[3], y, '#ff4444', 9, 'left');
            renderer.drawText(`$${r.cash}`, cols[4], y, '#44aa44', 9, 'left');

            ctx.restore();
        });

        if (this.waitingForInput) {
            renderer.drawGlowText('PRESS FIRE TO PLAY AGAIN', w / 2, h - 40,
                `rgba(0,255,136,${pulse})`, 10, 'center', 10);
        }
    }
}
