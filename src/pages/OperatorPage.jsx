import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PhoneForwarded, SkipForward, CheckCircle2, RotateCcw,
  Volume2, Users, Clock, BarChart3, AlertTriangle, LogOut, RefreshCw
} from 'lucide-react';
import Header from '../components/Header';
import PinLogin from '../components/PinLogin';
import ConfessionalSelector from '../components/ConfessionalSelector';
import QueueList from '../components/QueueList';
import { useQueueState } from '../hooks/useQueueState';
import { useVoice } from '../hooks/useVoice';
import { api } from '../lib/supabase';

const TIMEOUT_MINUTES = 10;

export default function OperatorPage() {
  const {
    confessionals, tickets, loading,
    callNext, completeTicket, skipTicket, recallCurrent, resetAll,
    getWaitingCount, getCurrentTicket, getWaitingTickets,
  } = useQueueState();

  const { announceWithChime } = useVoice();
  const [selectedConf, setSelectedConf] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [calling, setCalling] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!selectedConf && confessionals.length === 1) {
      setSelectedConf(confessionals[0]);
    }
  }, [confessionals, selectedConf]);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      api.getStats().then(setStats).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [tickets]);

  const currentTicket = selectedConf ? getCurrentTicket(selectedConf.id) : null;
  const waitingTickets = selectedConf ? getWaitingTickets(selectedConf.id) : [];
  const waitCount = selectedConf ? getWaitingCount(selectedConf.id) : 0;

  useEffect(() => {
    if (currentTicket?.called_at) {
      const startTime = new Date(currentTicket.called_at).getTime();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimer(elapsed);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [currentTicket?.id, currentTicket?.called_at]);

  const isTimedOut = timer >= TIMEOUT_MINUTES * 60;

  const handleCallNext = useCallback(async () => {
    if (!selectedConf || calling) return;
    setCalling(true);
    try {
      const result = await callNext(selectedConf.id);
      if (result) {
        const confName = result.confessional?.name || selectedConf.name;
        announceWithChime(result.ticket_number, confName);
      }
    } finally {
      setCalling(false);
    }
  }, [selectedConf, calling, callNext, announceWithChime]);

  const handleRecall = useCallback(async () => {
    if (!selectedConf) return;
    const result = await recallCurrent(selectedConf.id);
    if (result) {
      const confName = result.confessional?.name || selectedConf.name;
      announceWithChime(result.ticket_number, confName);
    }
  }, [selectedConf, recallCurrent, announceWithChime]);

  const handleComplete = useCallback(async (ticketId) => {
    const id = ticketId || currentTicket?.id;
    if (!id) return;
    await completeTicket(id);
  }, [currentTicket, completeTicket]);

  const handleSkip = useCallback(async (ticketId) => {
    const id = ticketId || currentTicket?.id;
    if (!id) return;
    await skipTicket(id);
  }, [currentTicket, skipTicket]);

  const handleReset = useCallback(async () => {
    await resetAll();
    setShowResetConfirm(false);
  }, [resetAll]);

  const handlePinVerify = useCallback(async (pin) => {
    const valid = await api.verifyPin(selectedConf.id, pin);
    if (valid) setAuthenticated(true);
    return valid;
  }, [selectedConf]);

  const handleLogout = () => {
    setAuthenticated(false);
    setSelectedConf(null);
  };

  // Bluetooth keyboard / clicker shortcuts
  useEffect(() => {
    if (!authenticated || !selectedConf) return;
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleCallNext();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowResetConfirm(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authenticated, selectedConf, handleCallNext]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sacred-200 border-t-sacred-600" />
      </div>
    );
  }

  if (!selectedConf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
        <Header title="Pannello Operatore" showBack minimal />
        <main className="mx-auto max-w-2xl px-4 pt-20 pb-12">
          <div className="mb-6 text-center animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900">Seleziona Confessionale</h2>
            <p className="text-sm text-gray-500">Scegli il confessionale da gestire</p>
          </div>
          <ConfessionalSelector
            confessionals={confessionals}
            selectedId={null}
            onSelect={setSelectedConf}
            waitingCounts={Object.fromEntries(confessionals.map(c => [c.id, getWaitingCount(c.id)]))}
          />
        </main>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <PinLogin
        confessionalName={selectedConf.name}
        onSuccess={handlePinVerify}
        onBack={() => setSelectedConf(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
      <Header title={selectedConf.name} showBack minimal />

      <main className="mx-auto max-w-2xl px-4 pt-20 pb-12">
        {/* Stats Bar */}
        {stats && (
          <div className="mb-6 grid grid-cols-4 gap-2 animate-fade-in">
            {[
              { label: 'Totale', value: stats.total, color: 'text-gray-700' },
              { label: 'In attesa', value: stats.waiting, color: 'text-gold-600' },
              { label: 'Completati', value: stats.completed, color: 'text-green-600' },
              { label: 'Tempo medio', value: stats.avgServiceTime ? `${stats.avgServiceTime}m` : '-', color: 'text-sacred-600' },
            ].map((s, i) => (
              <div key={i} className="card py-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Ticket */}
        <div className="mb-6 card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ora in servizio</h3>
            {currentTicket && (
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isTimedOut ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'
              }`}>
                <Clock size={12} />
                {formatTimer(timer)}
                {isTimedOut && <AlertTriangle size={12} />}
              </div>
            )}
          </div>

          {currentTicket ? (
            <div className="text-center">
              <span className="display-number text-6xl font-black text-sacred-700">
                {String(currentTicket.ticket_number).padStart(3, '0')}
              </span>

              <div className="mt-4 flex justify-center gap-2">
                <button onClick={handleComplete} className="btn-primary">
                  <CheckCircle2 size={16} />
                  Completato
                </button>
                <button onClick={handleSkip} className="btn-danger">
                  <SkipForward size={16} />
                  Salta
                </button>
                <button onClick={handleRecall} className="btn-secondary">
                  <Volume2 size={16} />
                  Richiama
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-3xl font-bold text-gray-200 display-number">---</p>
              <p className="mt-2 text-sm text-gray-400">Nessun numero in servizio</p>
            </div>
          )}
        </div>

        {/* Call Next Button */}
        <button
          onClick={handleCallNext}
          disabled={calling || waitCount === 0}
          className="btn-gold mb-2 w-full py-5 text-lg"
        >
          {calling ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <PhoneForwarded size={20} />
          )}
          {calling ? 'Chiamata in corso...' : waitCount > 0
            ? `Chiama Prossimo (${waitCount} in attesa)`
            : 'Nessuno in attesa'
          }
        </button>

        {/* Bluetooth keyboard hint */}
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-sacred-50 border border-sacred-100 py-2 px-4">
          <span className="text-base">🔵</span>
          <span className="text-xs text-sacred-600 font-medium">
            Clicker Bluetooth: <kbd className="rounded bg-sacred-100 px-1.5 py-0.5 font-mono text-xs">SPAZIO</kbd> = Chiama prossimo
            &nbsp;·&nbsp;
            <kbd className="rounded bg-sacred-100 px-1.5 py-0.5 font-mono text-xs">R</kbd> = Reset
          </span>
        </div>

        {/* Waiting Queue */}
        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <Users size={14} />
              Coda ({waitCount})
            </h3>
          </div>
          <QueueList
            tickets={[
              ...(currentTicket ? [currentTicket] : []),
              ...waitingTickets,
            ]}
            onComplete={handleComplete}
            onSkip={handleSkip}
            showActions={true}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw size={14} />
            Reset Giornata
          </button>
          <button onClick={handleLogout} className="btn-secondary flex-1">
            <LogOut size={14} />
            Esci
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="card max-w-sm w-full text-center animate-slide-up">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Reset Giornata</h3>
              <p className="mb-6 text-sm text-gray-500">
                Questo cancellerà tutti i ticket di oggi per tutti i confessionali. L'azione è irreversibile.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">
                  Annulla
                </button>
                <button onClick={handleReset} className="btn-danger flex-1">
                  Conferma Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
