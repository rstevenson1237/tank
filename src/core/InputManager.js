const BINDINGS = [
    {
        thrust: 'KeyW', brake: 'KeyS', rotateLeft: 'KeyA', rotateRight: 'KeyD',
        fire: 'Space', weaponPrev: 'KeyQ', weaponNext: 'KeyE'
    },
    {
        thrust: 'ArrowUp', brake: 'ArrowDown', rotateLeft: 'ArrowLeft', rotateRight: 'ArrowRight',
        fire: 'Enter', weaponPrev: 'Numpad4', weaponNext: 'Numpad6'
    },
    {
        thrust: 'KeyI', brake: 'KeyK', rotateLeft: 'KeyJ', rotateRight: 'KeyL',
        fire: 'ShiftRight', weaponPrev: 'KeyU', weaponNext: 'KeyO'
    }
];

export class InputManager {
    #held = new Set();
    #justPressed = new Set();
    #justReleased = new Set();
    #pending = new Set();

    constructor() {
        window.addEventListener('keydown', e => {
            if (!this.#held.has(e.code)) {
                this.#pending.add(e.code);
            }
            this.#held.add(e.code);
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            this.#held.delete(e.code);
            this.#justReleased.add(e.code);
        });
    }

    update() {
        this.#justPressed = new Set(this.#pending);
        this.#pending.clear();
        this.#justReleased.clear();
    }

    isHeld(code) { return this.#held.has(code); }
    isJustPressed(code) { return this.#justPressed.has(code); }

    getPlayerInput(playerIndex) {
        const b = BINDINGS[playerIndex];
        if (!b) return null;
        return {
            thrust: this.isHeld(b.thrust),
            brake: this.isHeld(b.brake),
            thrustJP: this.isJustPressed(b.thrust),
            brakeJP: this.isJustPressed(b.brake),
            rotateLeft: this.isHeld(b.rotateLeft),
            rotateRight: this.isHeld(b.rotateRight),
            rotateLeftJP: this.isJustPressed(b.rotateLeft),
            rotateRightJP: this.isJustPressed(b.rotateRight),
            fire: this.isJustPressed(b.fire),
            fireHeld: this.isHeld(b.fire),
            weaponPrev: this.isJustPressed(b.weaponPrev),
            weaponNext: this.isJustPressed(b.weaponNext)
        };
    }

    anyKey() { return this.#justPressed.size > 0; }
    anyJustPressed() { return this.#justPressed.size > 0; }
    getJustPressed() { return new Set(this.#justPressed); }
}
