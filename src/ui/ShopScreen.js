const ROW_H = 44;
const START_Y = 188;
const DONE_H = 55;

export class ShopScreen {
    constructor(economySystem) {
        this.economy = economySystem;
        this.playerSelections = [];
        this.playerReady = [];
        this.allReady = false;
        this.#scrollOffsets = [];
    }

    #scrollOffsets;

    init(humanTanks) {
        this.tanks = humanTanks;
        this.playerSelections = humanTanks.map(() => 0);
        this.playerReady = humanTanks.map(() => false);
        this.#scrollOffsets = humanTanks.map(() => 0);
        this.allReady = false;
        this.itemLists = humanTanks.map(t => this.economy.getAvailableItems(t));
    }

    #visibleCount(canvasH) {
        return Math.max(4, Math.floor((canvasH - START_Y - DONE_H) / ROW_H));
    }

    #clampScroll(playerIndex, canvasH) {
        const items = this.itemLists[playerIndex];
        const vis = this.#visibleCount(canvasH);
        const max = Math.max(0, items.length - vis);
        this.#scrollOffsets[playerIndex] = Math.max(0, Math.min(max, this.#scrollOffsets[playerIndex]));
    }

    handleInput(playerIndex, input, hullConfigs, canvasH = 720) {
        if (playerIndex >= this.tanks.length) return;
        if (this.playerReady[playerIndex]) return;

        const items = this.itemLists[playerIndex];
        const sel = this.playerSelections[playerIndex];
        const vis = this.#visibleCount(canvasH);

        if (input.weaponPrev || input.rotateLeftJP) {
            const newSel = Math.max(0, sel - 1);
            this.playerSelections[playerIndex] = newSel;
            if (newSel < this.#scrollOffsets[playerIndex]) {
                this.#scrollOffsets[playerIndex] = newSel;
            }
        } else if (input.weaponNext || input.rotateRightJP) {
            const newSel = Math.min(items.length, sel + 1);
            this.playerSelections[playerIndex] = newSel;
            // Scroll down when selection goes below the visible window.
            // The DONE button lives at index items.length; keep it visible.
            const lastVisible = this.#scrollOffsets[playerIndex] + vis - 1;
            if (newSel > lastVisible && newSel < items.length) {
                this.#scrollOffsets[playerIndex]++;
            }
        }

        this.#clampScroll(playerIndex, canvasH);

        if (input.fire) {
            if (sel >= items.length) {
                this.playerReady[playerIndex] = true;
                if (this.playerReady.every(r => r)) this.allReady = true;
            } else {
                const item = items[sel];
                if (item && !item.owned && this.economy.canAfford(this.tanks[playerIndex], item.id)) {
                    this.economy.applyPurchase(this.tanks[playerIndex], item.id, hullConfigs);
                    this.itemLists[playerIndex] = this.economy.getAvailableItems(this.tanks[playerIndex]);
                    this.#clampScroll(playerIndex, canvasH);
                    if (this.playerSelections[playerIndex] > this.itemLists[playerIndex].length) {
                        this.playerSelections[playerIndex] = this.itemLists[playerIndex].length;
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
            this.#drawPlayerColumn(renderer, tank, pi, colW, t, h);
        });
    }

    #drawPlayerColumn(renderer, tank, pi, colW, t, canvasH) {
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
            ctx.lineTo(x, canvasH);
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
        const vis = this.#visibleCount(canvasH);
        const scroll = this.#scrollOffsets[pi];
        const visibleItems = items.slice(scroll, scroll + vis);

        // Scroll indicator
        if (items.length > vis) {
            const scrollText = `${scroll + 1}–${Math.min(scroll + vis, items.length)} of ${items.length}`;
            renderer.drawText(scrollText, x + colW - pad, START_Y - 14, '#334433', 5, 'right');
            if (scroll > 0) renderer.drawText('▲', x + colW / 2, START_Y - 14, '#446644', 6, 'center');
            if (scroll + vis < items.length) renderer.drawText('▼', x + colW / 2, START_Y + vis * ROW_H + 8, '#446644', 6, 'center');
        }

        visibleItems.forEach((item, visI) => {
            const actualIdx = visI + scroll;
            const iy = START_Y + visI * ROW_H;
            const isSel = actualIdx === sel && !ready;
            const owned = item.owned;

            let textColor = '#556655';
            if (owned) textColor = '#334433';
            else if (!item.affordable) textColor = '#553333';
            else textColor = '#669966';
            if (isSel) textColor = '#00ff88';

            if (isSel) {
                ctx.save();
                ctx.fillStyle = 'rgba(0,255,136,0.08)';
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 4;
                ctx.fillRect(x + pad - 4, iy - 14, colW - pad * 2 + 8, ROW_H - 4);
                ctx.strokeRect(x + pad - 4, iy - 14, colW - pad * 2 + 8, ROW_H - 4);
                ctx.restore();
            }

            renderer.drawText(item.label, x + pad, iy, textColor, 7, 'left');
            const priceColor = !item.affordable ? '#882222' : '#44aa44';
            renderer.drawText(owned ? 'OWNED' : `$${item.cost}`, x + colW - pad, iy, owned ? '#335533' : priceColor, 7, 'right');
            renderer.drawText(item.description, x + pad, iy + 14, '#334433', 5, 'left');
        });

        const doneY = START_Y + Math.min(visibleItems.length, vis) * ROW_H + (items.length > vis ? 16 : 0);
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
