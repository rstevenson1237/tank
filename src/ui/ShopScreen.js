export class ShopScreen {
    constructor(economySystem) {
        this.economy = economySystem;
        this.playerSelections = [];
        this.playerReady = [];
        this.allReady = false;
    }

    init(humanTanks) {
        this.tanks = humanTanks;
        this.playerSelections = humanTanks.map(() => 0);
        this.playerReady = humanTanks.map(() => false);
        this.allReady = false;
        this.itemLists = humanTanks.map(t => this.economy.getAvailableItems(t));
    }

    handleInput(playerIndex, input, hullConfigs) {
        if (playerIndex >= this.tanks.length) return;
        if (this.playerReady[playerIndex]) return;

        const items = this.itemLists[playerIndex];
        const sel = this.playerSelections[playerIndex];

        if (input.weaponPrev || input.rotateLeftJP) {
            this.playerSelections[playerIndex] = Math.max(0, sel - 1);
        } else if (input.weaponNext || input.rotateRightJP) {
            this.playerSelections[playerIndex] = Math.min(items.length, sel + 1);
        }

        if (input.fire) {
            if (sel >= items.length) {
                this.playerReady[playerIndex] = true;
                if (this.playerReady.every(r => r)) this.allReady = true;
            } else {
                const item = items[sel];
                if (item && !item.owned && this.economy.canAfford(this.tanks[playerIndex], item.id)) {
                    this.economy.applyPurchase(this.tanks[playerIndex], item.id, hullConfigs);
                    this.itemLists[playerIndex] = this.economy.getAvailableItems(this.tanks[playerIndex]);
                    if (this.playerSelections[playerIndex] >= this.itemLists[playerIndex].length) {
                        this.playerSelections[playerIndex] = Math.max(0, this.itemLists[playerIndex].length - 1);
                    }
                }
            }
        }
    }

    draw(renderer, t) {
        if (!this.tanks) return;
        const w = renderer.width;
        const h = renderer.height;

        renderer.drawGlowText('UPGRADE SHOP', w / 2, 45, '#ffcc00', 16, 'center', 14);
        renderer.drawText('Cycle: Q/E or arrows   Buy: SPACE/ENTER/SHIFT', w / 2, 72, '#445544', 6, 'center');

        const colW = w / this.tanks.length;
        this.tanks.forEach((tank, pi) => {
            this.#drawPlayerColumn(renderer, tank, pi, colW, t);
        });
    }

    #drawPlayerColumn(renderer, tank, pi, colW, t) {
        const ctx = renderer.context;
        const x = pi * colW;
        const pad = 18;
        const ready = this.playerReady[pi];

        ctx.save();
        ctx.strokeStyle = tank.color + '33';
        ctx.lineWidth = 1;
        if (pi > 0) {
            ctx.beginPath();
            ctx.moveTo(x, 90);
            ctx.lineTo(x, renderer.height);
            ctx.stroke();
        }
        ctx.restore();

        renderer.drawGlowText(tank.name, x + pad, 105, tank.color, 10, 'left', 8);
        renderer.drawGlowText(`$${tank.cash}`, x + colW - pad, 105, '#44ff44', 10, 'right', 6);

        const statsY = 125;
        const stats = tank.getEffectiveStats();
        renderer.drawText(`SH ${Math.round(tank.shields)}/${Math.round(stats.maxShields)}`, x + pad, statsY, '#0088cc', 6, 'left');
        renderer.drawText(`EN ${Math.round(tank.energy)}/${Math.round(stats.maxEnergy)}`, x + pad, statsY + 16, '#008844', 6, 'left');
        renderer.drawText(`HULL: ${tank.hullConfig.label}`, x + pad, statsY + 32, '#886600', 6, 'left');

        const items = this.itemLists[pi] || [];
        const sel = this.playerSelections[pi];
        const startY = 188;
        const rowH = 44;

        const ctx2 = renderer.context;

        items.forEach((item, i) => {
            const iy = startY + i * rowH;
            const isSel = i === sel && !ready;
            const owned = item.owned;
            const canBuy = item.affordable && !owned;

            let textColor = '#556655';
            if (owned) textColor = '#334433';
            else if (!item.affordable) textColor = '#553333';
            else textColor = '#669966';
            if (isSel) textColor = '#00ff88';

            if (isSel) {
                ctx2.save();
                ctx2.fillStyle = 'rgba(0,255,136,0.08)';
                ctx2.strokeStyle = '#00ff88';
                ctx2.lineWidth = 1;
                ctx2.shadowColor = '#00ff88';
                ctx2.shadowBlur = 4;
                ctx2.fillRect(x + pad - 4, iy - 14, colW - pad * 2 + 8, rowH - 4);
                ctx2.strokeRect(x + pad - 4, iy - 14, colW - pad * 2 + 8, rowH - 4);
                ctx2.restore();
            }

            renderer.drawText(item.label, x + pad, iy, textColor, 7, 'left');
            const priceColor = !item.affordable ? '#882222' : '#44aa44';
            renderer.drawText(owned ? 'OWNED' : `$${item.cost}`, x + colW - pad, iy, owned ? '#335533' : priceColor, 7, 'right');
            renderer.drawText(item.description, x + pad, iy + 14, '#334433', 5, 'left');
        });

        const doneY = startY + items.length * rowH;
        const isDoneSel = sel >= items.length && !ready;

        if (ready) {
            const pulse = 0.7 + 0.3 * Math.sin(t * 3);
            renderer.drawGlowText('[ READY ]', x + colW / 2, doneY + 10, `rgba(0,255,136,${pulse})`, 10, 'center', 14);
        } else {
            const doneColor = isDoneSel ? '#ffcc00' : '#445544';
            renderer.drawGlowText('[ DONE SHOPPING ]', x + colW / 2, doneY + 10, doneColor, 8, 'center', isDoneSel ? 8 : 0);
            if (isDoneSel) {
                ctx.save();
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 4;
                ctx.strokeRect(x + pad - 4, doneY - 4, colW - pad * 2 + 8, 30);
                ctx.restore();
            }
        }
    }
}
