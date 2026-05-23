export class HUD {
    draw(renderer, tanks, roundNumber, mode) {
        const ctx = renderer.context;
        const w = renderer.width;
        const h = renderer.height;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, w, 64);
        ctx.restore();

        const humanTanks = tanks.filter(t => t.playerIndex >= 0);
        const colW = w / Math.max(humanTanks.length, 1);

        humanTanks.forEach((tank, i) => {
            const x = i * colW;
            this.#drawPlayerPanel(renderer, tank, x, colW);
        });

        renderer.drawText(`ROUND ${roundNumber}`, w / 2, 32, '#888888', 8, 'center');
        renderer.drawText(mode.toUpperCase().replace('_', ' '), w / 2, 50, '#555555', 6, 'center');
    }

    #drawPlayerPanel(renderer, tank, x, colW) {
        const ctx = renderer.context;
        const pad = 10;
        const px = x + pad;
        const stats = tank.getEffectiveStats();

        ctx.save();
        ctx.strokeStyle = tank.color + '44';
        ctx.lineWidth = 1;
        if (x > 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 64);
            ctx.stroke();
        }
        ctx.restore();

        renderer.drawGlowText(tank.name, px, 12, tank.color, 7, 'left', 6);

        const barW = (colW - pad * 2) * 0.42;
        const barH = 6;

        const shieldRatio = Math.max(0, tank.shields / stats.maxShields);
        this.#drawBar(renderer, px, 26, barW, barH, shieldRatio, '#00aaff', tank.alive);
        renderer.drawText('SH', px + barW + 4, 28, '#005588', 5, 'left');

        const energyRatio = Math.max(0, tank.energy / stats.maxEnergy);
        this.#drawBar(renderer, px, 38, barW, barH, energyRatio, '#00ff88', tank.alive);
        renderer.drawText('EN', px + barW + 4, 40, '#005533', 5, 'left');

        const weapon = tank.activeWeapon;
        const weaponName = weapon ? weapon.label.substring(0, 10) : '---';
        renderer.drawText(weaponName, px, 54, tank.fireCooldown > 0 ? '#883300' : '#886600', 5, 'left');

        const killsX = x + colW - pad;
        renderer.drawGlowText(`${tank.kills}K`, killsX, 14, '#ffcc00', 7, 'right', 4);
        renderer.drawText(`$${tank.cash}`, killsX, 30, '#44aa44', 6, 'right');

        if (!tank.alive) {
            renderer.drawText('DEAD', px + barW * 0.5 + 10, 38, '#ff2200', 7, 'center');
        }
    }

    #drawBar(renderer, x, y, w, h, ratio, color, active) {
        const ctx = renderer.context;
        ctx.save();

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        const fillW = Math.max(0, w * ratio);
        if (fillW > 0 && active) {
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = ratio > 0.3 ? 6 : 2;
            ctx.fillRect(x + 0.5, y + 0.5, fillW - 1, h - 1);
        }
        ctx.restore();
    }

    drawRadarArrows(renderer, tanks, arena) {
        const ctx = renderer.context;
        const w = renderer.width;
        const h = renderer.height;

        for (const tank of tanks) {
            if (!tank.alive || !tank.upgrades.radarScanner) continue;

            const enemies = tanks.filter(e => e.alive && e !== tank && !(tank.team && e.team === tank.team));
            for (const enemy of enemies) {
                const dx = enemy.position.x - tank.position.x;
                const dy = enemy.position.y - tank.position.y;
                const angle = Math.atan2(dy, dx);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < arena.radius * 1.1) continue;

                const margin = 40;
                const arrowX = Math.max(margin, Math.min(w - margin, tank.position.x + Math.cos(angle) * (arena.radius * 0.8)));
                const arrowY = Math.max(margin + 64, Math.min(h - margin, tank.position.y + Math.sin(angle) * (arena.radius * 0.8)));

                ctx.save();
                ctx.translate(arrowX, arrowY);
                ctx.rotate(angle);
                ctx.fillStyle = enemy.color;
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 8;
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-6, -5);
                ctx.lineTo(-6, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
