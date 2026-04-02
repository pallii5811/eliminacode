import { useCallback, useRef } from 'react';

export function useVoice() {
  const synthRef = useRef(window.speechSynthesis);

  const speak = useCallback((text, lang = 'it-IT') => {
    if (!synthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const italianVoice = voices.find(v => v.lang.startsWith('it'));
    if (italianVoice) {
      utterance.voice = italianVoice;
    }

    synthRef.current.speak(utterance);
  }, []);

  const announceNumber = useCallback((number, confessionalName) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const numStr = String(number).padStart(3, '0');
    const text = `Numero ${numStr}, ${confessionalName}`;

    speak(text);
    setTimeout(() => speak(text), 4500);
  }, [speak]);

  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    } catch {}
  }, []);

  const announceWithChime = useCallback((number, confessionalName) => {
    playChime();
    setTimeout(() => announceNumber(number, confessionalName), 600);
  }, [playChime, announceNumber]);

  return { speak, announceNumber, playChime, announceWithChime };
}
