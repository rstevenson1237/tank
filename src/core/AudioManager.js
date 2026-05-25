export class AudioManager {
    #ctx = null;
    #master = null;
    #muted = false;

    init() {
        if (this.#ctx) return;
        this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.#master = this.#ctx.createGain();
        this.#master.gain.value = 0.4;
        this.#master.connect(this.#ctx.destination);
    }

    get ready() { return this.#ctx !== null; }

    #tone(freq, type, duration, vol = 0.5, delay = 0) {
        if (!this.#ctx || this.#muted) return;
        const osc = this.#ctx.createOscillator();
        const gain = this.#ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, this.#ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.#master);
        osc.start(this.#ctx.currentTime + delay);
        osc.stop(this.#ctx.currentTime + delay + duration + 0.05);
    }

    #noise(duration, vol = 0.3) {
        if (!this.#ctx || this.#muted) return;
        const bufSize = this.#ctx.sampleRate * duration;
        const buf = this.#ctx.createBuffer(1, bufSize, this.#ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.#ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.#ctx.createGain();
        const filter = this.#ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(vol, this.#ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.#master);
        src.start();
        src.stop(this.#ctx.currentTime + duration + 0.05);
    }

    playLaser() { this.#tone(1200, 'square', 0.1, 0.3); }

    playPulse() { this.#tone(1000, 'square', 0.07, 0.25); }

    playScatter() {
        this.#tone(800, 'sawtooth', 0.08, 0.3);
        this.#tone(700, 'sawtooth', 0.08, 0.25, 0.03);
        this.#tone(900, 'sawtooth', 0.08, 0.2, 0.06);
    }

    playPlasma() {
        this.#tone(300, 'sawtooth', 0.2, 0.4);
        this.#tone(500, 'sine', 0.15, 0.2, 0.05);
    }

    playPlasmaBurst() {
        this.#tone(280, 'sawtooth', 0.22, 0.4);
        this.#tone(520, 'sine', 0.18, 0.25, 0.04);
        this.#noise(0.15, 0.2);
    }

    playShrapnel() { this.#tone(900, 'triangle', 0.15, 0.35); }

    playRicochet() {
        this.#tone(1100, 'triangle', 0.10, 0.3);
        this.#tone(950, 'triangle', 0.10, 0.2, 0.05);
    }

    playPhaseLance() {
        this.#tone(2200, 'sine', 0.05, 0.2);
        this.#tone(1800, 'sine', 0.12, 0.25, 0.02);
    }

    playMissile() {
        this.#tone(200, 'sawtooth', 0.3, 0.4);
        this.#tone(180, 'sawtooth', 0.3, 0.3, 0.1);
    }

    playVortex() {
        this.#tone(180, 'sawtooth', 0.35, 0.4);
        this.#tone(220, 'sine', 0.25, 0.3, 0.08);
        this.#tone(160, 'sawtooth', 0.3, 0.3, 0.15);
    }

    playInferno() {
        this.#tone(160, 'sawtooth', 0.4, 0.45);
        this.#noise(0.2, 0.25);
        this.#tone(140, 'sawtooth', 0.35, 0.35, 0.1);
    }

    playMortar() {
        this.#tone(100, 'sawtooth', 0.3, 0.5);
        this.#tone(80, 'sine', 0.4, 0.4, 0.05);
    }

    playMineDeploy() {
        this.#tone(400, 'triangle', 0.15, 0.3);
        this.#tone(300, 'triangle', 0.2, 0.25, 0.1);
    }

    playOvercharge() {
        this.#tone(60, 'sawtooth', 0.5, 0.55);
        this.#tone(50, 'sine', 0.6, 0.45, 0.05);
        this.#noise(0.3, 0.35);
    }

    playExplosion() { this.#noise(0.4, 0.6); }

    playBigExplosion() {
        this.#noise(0.8, 0.8);
        this.#tone(60, 'sine', 0.6, 0.5);
    }

    playNuke() {
        this.#noise(1.2, 1.0);
        this.#tone(40, 'sine', 1.0, 0.8);
        this.#tone(30, 'sine', 1.2, 0.6, 0.1);
    }

    playShieldHit() {
        this.#tone(600, 'triangle', 0.1, 0.3);
        this.#tone(400, 'triangle', 0.12, 0.2, 0.04);
    }

    playEnergyWarning() { this.#tone(220, 'square', 0.15, 0.4); }

    playPurchase() {
        this.#tone(440, 'sine', 0.1, 0.3);
        this.#tone(554, 'sine', 0.1, 0.3, 0.1);
        this.#tone(659, 'sine', 0.15, 0.3, 0.2);
    }

    playDeath() {
        this.#noise(0.5, 0.5);
        this.#tone(120, 'sawtooth', 0.4, 0.4);
    }

    playRoundStart() {
        this.#tone(220, 'square', 0.15, 0.4);
        this.#tone(330, 'square', 0.15, 0.4, 0.2);
        this.#tone(440, 'square', 0.25, 0.5, 0.4);
    }

    playWeaponCycle() { this.#tone(800, 'triangle', 0.06, 0.2); }

    setMasterVolume(v) {
        if (this.#master) this.#master.gain.value = Math.max(0, Math.min(1, v));
    }

    toggleMute() {
        this.#muted = !this.#muted;
        return this.#muted;
    }

    getWeaponSound(weaponId) {
        const map = {
            vector_laser:       () => this.playLaser(),
            pulse_cannon:       () => this.playPulse(),
            scatter_shot:       () => this.playScatter(),
            plasma_bolt:        () => this.playPlasma(),
            plasma_burst:       () => this.playPlasmaBurst(),
            ricochet_cannon:    () => this.playRicochet(),
            reflective_shrapnel:() => this.playShrapnel(),
            phase_lance:        () => this.playPhaseLance(),
            seeker_missile:     () => this.playMissile(),
            vortex_torpedo:     () => this.playVortex(),
            inferno_missile:    () => this.playInferno(),
            heavy_mortar:       () => this.playMortar(),
            mine_layer:         () => this.playMineDeploy(),
            overcharge_bolt:    () => this.playOvercharge(),
            the_nuke:           () => this.playNuke()
        };
        return map[weaponId] || (() => this.playLaser());
    }
}
