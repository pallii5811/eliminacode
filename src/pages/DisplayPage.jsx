import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Maximize, Volume2, VolumeX, Wifi, Play, Home } from 'lucide-react';
import { useQueueState } from '../hooks/useQueueState';
import { useVoice } from '../hooks/useVoice';
import { useClock } from '../hooks/useClock';
import { isDemo } from '../lib/supabase';

export default function DisplayPage() {
  const { confessionals, tickets, loading, getWaitingCount, getCurrentTicket, getWaitingTickets, callNext, resetAll } = useQueueState();
  const { announceWithChime } = useVoice();
  const { formatted: clockTime, dateFormatted } = useClock();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioActivated, setAudioActivated] = useState(false);
  const [flashingConfId, setFlashingConfId] = useState(null);
  const prevNumbersRef = useRef({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [kioskConfIndex, setKioskConfIndex] = useState(0);
  const callingRef = useRef(false);

  // Bluetooth keyboard/clicker: Space = call next, R = reset, 1/2/3 = select confessional
  useEffect(() => {
    if (!audioActivated) return;
    const onKey = async (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (callingRef.current || confessionals.length === 0) return;
        const conf = confessionals[kioskConfIndex] || confessionals[0];
        if (!conf) return;
        callingRef.current = true;
        try {
          const result = await callNext(conf.id);
          if (result && soundEnabled) {
            announceWithChime(result.ticket_number, conf.name);
          }
        } finally {
          callingRef.current = false;
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        await resetAll();
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < confessionals.length) setKioskConfIndex(idx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audioActivated, confessionals, kioskConfIndex, callNext, resetAll, soundEnabled, announceWithChime]);

  const activateAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0;
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
    } catch {}
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    setAudioActivated(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    confessionals.forEach(conf => {
      const prev = prevNumbersRef.current[conf.id];
      if (prev !== undefined && prev !== conf.current_number && conf.current_number > 0) {
        setFlashingConfId(conf.id);
        if (soundEnabled && audioActivated) {
          announceWithChime(conf.current_number, conf.name);
        }
        setTimeout(() => setFlashingConfId(null), 2000);
      }
      prevNumbersRef.current[conf.id] = conf.current_number;
    });
  }, [confessionals, soundEnabled, audioActivated, announceWithChime]);

  if (loading) {
    return (
      <div className="display-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sacred-400/30 border-t-sacred-400" />
          <p className="text-sm text-white/50">Caricamento display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="display-bg relative flex min-h-screen flex-col select-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Torna alla Home"
          >
            <Home size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white sm:text-lg">EliminaCode</h1>
            <p className="text-[10px] text-white/40 capitalize">{dateFormatted}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="rounded-full bg-gold-500/20 px-3 py-1 text-[10px] font-bold text-gold-400">
              DEMO
            </span>
          )}

          <span className="flex items-center gap-1.5 text-xs text-white/40">
            {isDemo ? <Wifi size={12} className="text-green-400" /> : <Wifi size={12} />}
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Maximize size={18} />
          </button>

          <span className="display-number text-lg font-bold text-white/60 sm:text-2xl">
            {clockTime}
          </span>
        </div>
      </header>

      {/* Main Display */}
      <main className="flex flex-1 items-center justify-center px-6 pb-8 sm:px-10">
        <div className={`grid w-full max-w-6xl gap-6 ${
          confessionals.length === 1 ? 'grid-cols-1 max-w-lg' :
          confessionals.length === 2 ? 'grid-cols-2 max-w-3xl' :
          'grid-cols-1 sm:grid-cols-3'
        }`}>
          {confessionals.map(conf => {
            const currentTicket = getCurrentTicket(conf.id);
            const waitCount = getWaitingCount(conf.id);
            const waiting = getWaitingTickets(conf.id);
            const nextTicket = waiting.length > 0 ? waiting[0] : null;
            const isFlashing = flashingConfId === conf.id;
            const displayNum = conf.current_number > 0
              ? String(conf.current_number).padStart(3, '0')
              : '---';

            return (
              <div
                key={conf.id}
                className={`confessional-display-card rounded-3xl p-6 sm:p-10 text-center transition-all duration-500 ${
                  isFlashing ? 'flash' : ''
                }`}
              >
                {/* Confessional Label */}
                <div className="mb-4 sm:mb-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-sacred-400" />
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                      {conf.name}
                    </span>
                  </span>
                </div>

                {/* Big Number */}
                <div
                  key={`${conf.id}-${conf.current_number}`}
                  className={`my-6 sm:my-10 ${conf.current_number > 0 ? 'animate-number-pop' : ''}`}
                >
                  <span
                    className={`display-number text-7xl sm:text-8xl lg:text-9xl font-black ${
                      conf.current_number > 0
                        ? 'text-gold-400 display-number-glow'
                        : 'text-white/20'
                    }`}
                  >
                    {displayNum}
                  </span>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  {conf.current_number > 0 ? (
                    <p className="text-sm font-medium text-green-400">
                      Ora in servizio
                    </p>
                  ) : (
                    <p className="text-sm text-white/30">
                      In attesa di chiamata
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-4">
                    <span className="text-xs text-white/40">
                      In coda: <strong className="text-white/70">{waitCount}</strong>
                    </span>
                    {nextTicket && (
                      <span className="text-xs text-white/40">
                        Prossimo: <strong className="text-white/70">
                          {String(nextTicket.ticket_number).padStart(3, '0')}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prossimo Gruppo Banner */}
        {(() => {
          const currentNum = confessionals.reduce((max, c) => Math.max(max, c.current_number || 0), 0);
          if (currentNum <= 0) return null;
          const groupStart = currentNum + 1;
          const groupEnd = currentNum + 12;
          return (
            <div className="mt-6 w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-4 sm:px-10 sm:py-5 text-center shadow-lg shadow-amber-500/20">
              <p className="text-sm font-bold text-amber-900/70 uppercase tracking-wider mb-1">
                Prossimo Gruppo
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                da n° <span className="text-amber-900">{String(groupStart).padStart(3, '0')}</span>
                {' '}a n° <span className="text-amber-900">{String(groupEnd).padStart(3, '0')}</span>
                <span className="ml-2 text-lg sm:text-xl font-bold text-amber-900/80">si preparino</span>
              </p>
            </div>
          );
        })()}
      </main>

      {/* Audio Activation Overlay */}
      {!audioActivated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={activateAudio}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white/10 px-12 py-10 text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/20 ring-2 ring-gold-400/50">
              <Play size={36} className="text-gold-400 ml-1" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Attiva Display</p>
              <p className="text-xs text-white/50 mt-1">Tocca per abilitare audio e annunci vocali</p>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Bar */}
      <footer className="px-6 py-3 sm:px-10">
        {audioActivated ? (
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] text-white/30">
              <span>🔵</span>
              <span>Clicker Bluetooth:</span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/50">SPAZIO</kbd>
              <span>= Chiama prossimo</span>
              {confessionals.length > 1 && (
                <>
                  <span>·</span>
                  {confessionals.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setKioskConfIndex(i)}
                      className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
                        kioskConfIndex === i
                          ? 'bg-gold-500/30 text-gold-400'
                          : 'bg-white/10 text-white/40 hover:bg-white/20'
                      }`}
                    >
                      {c.code || c.name}
                    </button>
                  ))}
                </>
              )}
            </span>
          </div>
        ) : (
          <p className="text-center text-[10px] text-white/20">
            Inquadra il QR code o visita il link per prendere il tuo numero
          </p>
        )}
      </footer>
    </div>
  );
}
