/**
 * Menggunakan Web Audio API untuk membunyikan lonceng notifikasi
 * saat ada tamu baru masuk atau perubahan status antrean.
 */
export function playNotificationBell() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Nada 1 (Ding - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Nada 2 (Dong - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.28, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.9);
  } catch {
    // Ignore if browser autoplay policy blocks audio before user interaction
  }
}

/**
 * Efek Suara Sinematik Welcome Screen BUTADI (Harmonic Crystal Fanfare & Warm Swell)
 * Mengembalikan true jika AudioContext berhasil berbunyi (tidak diblokir autoplay browser).
 */
export async function playWelcomeSound(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") {
      return false;
    }

    const now = ctx.currentTime;

    // 1. Warm Bass / Pad Swell (C4 + G4 lembut)
    const padFreqs = [261.63, 392.0];
    padFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.15);
    });

    // 2. Crystal Arpeggio Chime (C5 - E5 - G5 - B5 - C6 - E6)
    const notes = [
      { freq: 523.25, delay: 0.05, dur: 0.9, vol: 0.16 },
      { freq: 659.25, delay: 0.16, dur: 0.95, vol: 0.18 },
      { freq: 783.99, delay: 0.27, dur: 1.05, vol: 0.2 },
      { freq: 987.77, delay: 0.39, dur: 1.15, vol: 0.2 },
      { freq: 1046.5, delay: 0.52, dur: 1.4, vol: 0.24 },
      { freq: 1318.51, delay: 0.66, dur: 1.6, vol: 0.18 },
    ];

    notes.forEach(({ freq, delay, dur, vol }) => {
      const start = now + delay;

      // Nada utama
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);

      // Harmonik kilau kristal (2x frekuensi dengan volume lembut)
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = "sine";
      shimmerOsc.frequency.setValueAtTime(freq * 2, start);
      shimmerGain.gain.setValueAtTime(0.001, start);
      shimmerGain.gain.linearRampToValueAtTime(vol * 0.28, start + 0.015);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0005, start + dur * 0.65);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(start);
      shimmerOsc.stop(start + dur * 0.7);
    });

    return true;
  } catch {
    return false;
  }
}
