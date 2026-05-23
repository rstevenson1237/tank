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

    playPlasma() {
        this.#tone(300, 'sawtooth', 0.2, 0.4);
        this.#tone(500, 'sine', 0.15, 0.2, 0.05);
    }

    playShrapnel() { this.#tone(900, 'triangle', 0.15, 0.35); }

    playMissile() {
        this.#tone(200, 'sawtooth', 0.3, 0.4);
        this.#tone(180, 'sawtooth', 0.3, 0.3, 0.1);
    }

    playMortar() {
        this.#tone(100, 'sawtooth', 0.3, 0.5);
        this.#tone(80, 'sine', 0.4, 0.4, 0.05);
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
            vector_laser: () => this.playLaser(),
            plasma_bolt: () => this.playPlasma(),
            reflective_shrapnel: () => this.playShrapnel(),
            seeker_missile: () => this.playMissile(),
            heavy_mortar: () => this.playMortar(),
            the_nuke: () => this.playNuke()
        };
        return map[weaponId] || (() => this.playLaser());
    }
}
