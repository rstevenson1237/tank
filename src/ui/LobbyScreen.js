const MODES = ['ffa', 'team', 'base_destruction', 'survival'];
const MODE_LABELS = {
    ffa: 'Free-For-All',
    team: 'Team Skirmish',
    base_destruction: 'Base Destruction',
    survival: 'Survival Horde'
};

const ARENA_IDS = ['alpha_ring', 'geometric_cross', 'nebula_gauntlet'];
const ARENA_LABELS = {
    alpha_ring: 'Alpha Ring',
    geometric_cross: 'Geometric Cross',
    nebula_gauntlet: 'Nebula Gauntlet'
};

const ROSTER_IDS = ['easy', 'medium', 'hard', 'mixed', 'mayhem', 'phantom', 'blitzer', 'flanker'];
const ROSTER_LABELS = {
    easy:    'Easy',
    medium:  'Medium',
    hard:    'Hard',
    mixed:   'Mixed',
    mayhem:  'Mayhem',
    phantom: 'Phantom',
    blitzer: 'Blitzer',
    flanker: 'Flanker',
};
const ROSTER_DESCS = {
    easy:    'Slow aim, predictable — good for learning',
    medium:  'Balanced challenge for most players',
    hard:    'Precise aim, shot prediction, relentless',
    mixed:   'Random variety — each bot plays differently',
    mayhem:  'Anything goes — specialists included',
    phantom: 'Stays at extreme range, waits for the perfect shot',
    blitzer: 'All-out assault — never stops, never retreats',
    flanker: 'Gets to your blind side, attacks the angle you ignore',
};

export class LobbyScreen {
    constructor() {
        this.humanCount = 1;
        this.botCount = 3;
        this.botRoster = 'medium';
        this.mode = 'ffa';
        this.arenaId = 'alpha_ring';
        this.menuIndex = 0;
        this.ready = false;
        this.#menuItems = null;
    }

    #menuItems;

    #buildMenu() {
        return [
            {
                label: 'PLAYERS',
                get: () => this.humanCount,
                change: d => { this.humanCount = Math.max(1, Math.min(3, this.humanCount + d)); }
            },
            {
                label: 'BOTS',
                get: () => this.botCount,
                change: d => { this.botCount = Math.max(0, Math.min(6, this.botCount + d)); }
            },
            {
                label: 'BOT AI',
                get:  () => ROSTER_LABELS[this.botRoster],
                desc: () => ROSTER_DESCS[this.botRoster],
                change: d => {
                    const i = ROSTER_IDS.indexOf(this.botRoster);
                    this.botRoster = ROSTER_IDS[(i + d + ROSTER_IDS.length) % ROSTER_IDS.length];
                }
            },
            {
                label: 'MODE',
                get: () => MODE_LABELS[this.mode],
                change: d => {
                    const i = MODES.indexOf(this.mode);
                    this.mode = MODES[(i + d + MODES.length) % MODES.length];
                }
            },
            {
                label: 'ARENA',
                get: () => ARENA_LABELS[this.arenaId],
                change: d => {
                    const i = ARENA_IDS.indexOf(this.arenaId);
                    this.arenaId = ARENA_IDS[(i + d + ARENA_IDS.length) % ARENA_IDS.length];
                }
            },
            {
                label: 'START',
                get: () => '',
                change: () => { this.ready = true; }
            }
        ];
    }

    get config() {
        return {
            humanCount: this.humanCount,
            botCount: this.botCount,
            botRoster: this.botRoster,
            mode: this.mode,
            arenaId: this.arenaId
        };
    }

    handleInput(input) {
        if (!this.#menuItems) this.#menuItems = this.#buildMenu();
        const item = this.#menuItems[this.menuIndex];

        if (input.rotateLeftJP || input.weaponPrev) {
            item.change(-1);
        } else if (input.rotateRightJP || input.weaponNext) {
            item.change(1);
        } else if (input.thrustJP) {
            this.menuIndex = Math.max(0, this.menuIndex - 1);
        } else if (input.brakeJP) {
            this.menuIndex = Math.min(this.#menuItems.length - 1, this.menuIndex + 1);
        } else if (input.fire) {
            if (this.menuIndex === this.#menuItems.length - 1) {
                this.ready = true;
            } else {
                item.change(1);
            }
        }
    }

    draw(renderer, t) {
        if (!this.#menuItems) this.#menuItems = this.#buildMenu();
        const ctx = renderer.context;
        const w = renderer.width;
        const h = renderer.height;

        const pulse = 0.7 + 0.3 * Math.sin(t * 2);

        renderer.drawGlowText('D-ZONE', w / 2, h * 0.18, `rgba(0,255,136,${pulse})`, 52, 'center', 30);
        renderer.drawText('DESTRUCTION ZONE', w / 2, h * 0.18 + 50, '#444444', 9, 'center');
        renderer.drawText('W/S or ↑↓: navigate   A/D or ←→: change   SPACE/ENTER: select', w / 2, h * 0.18 + 72, '#333333', 6, 'center');

        const startY = h * 0.38;
        const lineH = 52;

        this.#menuItems.forEach((item, i) => {
            const y = startY + i * lineH;
            const selected = i === this.menuIndex;
            const color = selected ? '#00ff88' : '#446655';
            const glow  = selected ? 12 : 0;

            renderer.drawGlowText(item.label, w / 2 - 140, y, color, 10, 'left', glow);

            const valStr = String(item.get());
            if (i === this.#menuItems.length - 1) {
                const btnColor = selected ? `rgba(0,255,136,${pulse})` : '#224433';
                renderer.drawGlowText('[ START GAME ]', w / 2 + 20, y, btnColor, 10, 'left', selected ? 18 : 4);
            } else if (valStr) {
                renderer.drawGlowText(`< ${valStr} >`, w / 2 + 20, y, selected ? '#ffcc00' : '#664400', 10, 'left', selected ? 8 : 0);
            }

            if (selected) {
                ctx.save();
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 6;
                ctx.strokeRect(w / 2 - 155, y - 18, 360, 36);
                ctx.restore();

                // Show description for items that have one
                if (item.desc) {
                    renderer.drawText(item.desc(), w / 2 + 20, y + 24, '#446644', 5, 'left');
                }
            }
        });

        renderer.drawText('v1.0 - tribute to Julian Cochran\'s 1992 D-Zone', w / 2, h - 20, '#222222', 5, 'center');
    }
}
