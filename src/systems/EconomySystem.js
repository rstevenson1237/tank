export class EconomySystem {
    constructor(shopConfig, weaponData) {
        this.config = shopConfig;
        this.weaponData = weaponData;
    }

    initTank(tank) {
        tank.cash = this.config.startingCash;
    }

    awardKill(killer, victim) {
        if (killer && killer !== victim) {
            killer.cash += this.config.cashOnKill;
        }
    }

    awardRoundWinner(tank) {
        tank.cash += this.config.cashOnWin;
    }

    getAvailableItems(tank) {
        return this.config.items.map(item => {
            const level = this.#getItemLevel(tank, item);
            return {
                ...item,
                currentLevel: level,
                affordable: tank.cash >= item.cost,
                maxed: level >= item.maxLevel,
                owned: this.#isOwned(tank, item)
            };
        }).filter(item => !item.maxed || item.type === 'hull');
    }

    canAfford(tank, itemId) {
        const item = this.config.items.find(i => i.id === itemId);
        return item && tank.cash >= item.cost;
    }

    applyPurchase(tank, itemId, hullConfigs) {
        const item = this.config.items.find(i => i.id === itemId);
        if (!item || tank.cash < item.cost) return false;

        tank.cash -= item.cost;

        if (item.type === 'upgrade') {
            if (item.upgradeKey === 'radarScanner' || item.upgradeKey === 'autoRepair') {
                tank.upgrades[item.upgradeKey] = true;
            } else {
                tank.upgrades[item.upgradeKey] = Math.min(item.maxLevel, (tank.upgrades[item.upgradeKey] || 0) + 1);
            }
            const stats = tank.getEffectiveStats();
            const effMax = stats.maxShields;
            if (tank.shields > effMax) tank.shields = effMax;
        } else if (item.type === 'weapon') {
            const wc = tank.weaponConfigs.find(w => w.id === item.weaponId);
            if (wc) tank.addWeapon(wc);
        } else if (item.type === 'hull') {
            const hull = hullConfigs.find(h => h.id === item.hullId);
            if (hull) tank.applyHull(hull);
        }

        return true;
    }

    #getItemLevel(tank, item) {
        if (item.type === 'upgrade') {
            const v = tank.upgrades[item.upgradeKey];
            if (typeof v === 'boolean') return v ? 1 : 0;
            return v || 0;
        }
        if (item.type === 'weapon') {
            return tank.weapons.find(w => w.id === item.weaponId) ? 1 : 0;
        }
        if (item.type === 'hull') {
            return tank.hullConfig.id === item.hullId ? 1 : 0;
        }
        return 0;
    }

    #isOwned(tank, item) {
        if (item.type === 'weapon') {
            return !!tank.weapons.find(w => w.id === item.weaponId);
        }
        if (item.type === 'hull') {
            return tank.hullConfig.id === item.hullId;
        }
        if (item.type === 'upgrade') {
            const v = tank.upgrades[item.upgradeKey];
            if (typeof v === 'boolean') return v;
            return (v || 0) >= item.maxLevel;
        }
        return false;
    }
}
