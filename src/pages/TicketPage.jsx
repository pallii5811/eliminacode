import { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket as TicketIcon, ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import ConfessionalSelector from '../components/ConfessionalSelector';
import TicketCard from '../components/TicketCard';
import { useQueueState } from '../hooks/useQueueState';

const MY_TICKET_KEY = 'eliminacode_my_ticket';

function loadMyTicket() {
  try {
    const saved = localStorage.getItem(MY_TICKET_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === new Date().toISOString().split('T')[0]) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveMyTicket(ticket) {
  try {
    localStorage.setItem(MY_TICKET_KEY, JSON.stringify({
      ...ticket,
      date: new Date().toISOString().split('T')[0],
    }));
  } catch {}
}

function clearMyTicket() {
  try {
    localStorage.removeItem(MY_TICKET_KEY);
  } catch {}
}

export default function TicketPage() {
  const {
    confessionals, tickets, loading,
    takeTicket, getWaitingCount, getTicketPosition, getEstimatedWait,
  } = useQueueState();

  const [selectedConf, setSelectedConf] = useState(null);
  const [myTicket, setMyTicket] = useState(null);
  const [taking, setTaking] = useState(false);
  const [wasCalled, setWasCalled] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || confessionals.length === 0) return;
    const saved = loadMyTicket();
    if (saved) {
      setMyTicket(saved);
      const conf = confessionals.find(c => c.id === saved.confessional_id);
      if (conf) setSelectedConf(conf);
    }
    loadedRef.current = true;
  }, [confessionals]);

  useEffect(() => {
    if (!myTicket) return;

    const ticketInSystem = tickets.find(t => t.id === myTicket.id);
    if (!ticketInSystem) return;

    if (ticketInSystem.status === 'called' && !wasCalled) {
      setWasCalled(true);
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } else if (ticketInSystem.status !== 'called' && wasCalled) {
      setWasCalled(false);
    }

    if (ticketInSystem.status === 'completed' || ticketInSystem.status === 'skipped') {
      setTimeout(() => {
        clearMyTicket();
        setMyTicket(null);
        setSelectedConf(null);
        setWasCalled(false);
      }, 5000);
    }
  }, [myTicket, tickets, wasCalled]);

  const handleTakeTicket = useCallback(async () => {
    if (!selectedConf || taking) return;
    setTaking(true);
    try {
      const ticket = await takeTicket(selectedConf.id);
      if (ticket) {
        setMyTicket(ticket);
        saveMyTicket(ticket);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } finally {
      setTaking(false);
    }
  }, [selectedConf, taking, takeTicket]);

  const handleNewTicket = () => {
    clearMyTicket();
    setMyTicket(null);
    setSelectedConf(null);
    setWasCalled(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sacred-200 border-t-sacred-600" />
      </div>
    );
  }

  const currentTicketInSystem = myTicket ? tickets.find(t => t.id === myTicket.id) : null;
  const isCalled = currentTicketInSystem?.status === 'called';
  const isDone = currentTicketInSystem?.status === 'completed' || currentTicketInSystem?.status === 'skipped';
  const position = myTicket ? getTicketPosition(myTicket.id) : null;
  const estimatedWait = selectedConf && position ? getEstimatedWait(selectedConf.id, position) : 0;

  if (myTicket && !isDone) {
    return (
      <div className={`min-h-screen ${isCalled ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50' : 'bg-gradient-to-br from-sacred-50 via-white to-gold-50/30'}`}>
        <Header title="Il tuo ticket" showBack minimal />

        <main className="mx-auto max-w-sm px-4 pt-24 pb-12">
          <TicketCard
            ticket={currentTicketInSystem || myTicket}
            confessional={selectedConf}
            position={position}
            estimatedWait={estimatedWait}
            isCalled={isCalled}
          />

          {!isCalled && position && (
            <div className="mt-6 card text-center animate-fade-in">
              <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Persone prima di te
              </div>
              <div className="text-4xl font-black text-sacred-600">{position - 1}</div>
              {estimatedWait > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Attesa stimata: ~{estimatedWait} minuti
                </p>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={handleNewTicket} className="btn-secondary">
              <RefreshCw size={14} />
              Nuovo Ticket
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
        <Header title="Ticket completato" showBack minimal />
        <main className="mx-auto max-w-sm px-4 pt-24 pb-12 text-center">
          <div className="card animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {currentTicketInSystem?.status === 'completed' ? 'Confessione completata' : 'Ticket saltato'}
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {currentTicketInSystem?.status === 'completed'
                ? 'Grazie per la tua pazienza. Che Dio ti benedica.'
                : 'Il tuo numero è stato saltato. Puoi prenderne uno nuovo.'}
            </p>
            <button onClick={handleNewTicket} className="btn-primary">
              Nuovo Ticket
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
      <Header title="Prendi il tuo numero" showBack minimal />

      <main className="mx-auto max-w-2xl px-4 pt-24 pb-12">
        {!selectedConf ? (
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100">
                <TicketIcon className="h-7 w-7 text-gold-600" />
              </div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">Scegli il Confessionale</h2>
              <p className="text-sm text-gray-500">
                Seleziona il confessionale e prendi il tuo numero
              </p>
            </div>

            <ConfessionalSelector
              confessionals={confessionals}
              selectedId={null}
              onSelect={setSelectedConf}
              waitingCounts={Object.fromEntries(confessionals.map(c => [c.id, getWaitingCount(c.id)]))}
            />
          </div>
        ) : (
          <div className="animate-slide-up">
            <button
              onClick={() => setSelectedConf(null)}
              className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Cambia confessionale
            </button>

            <div className="card text-center">
              <div className="mb-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-sacred-100 px-4 py-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sacred-600 text-xs font-bold text-white">
                    {selectedConf.code}
                  </span>
                  <span className="text-sm font-semibold text-sacred-700">{selectedConf.name}</span>
                </span>
              </div>

              <div className="my-6 rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400 mb-1">Persone in attesa</p>
                <p className="text-3xl font-black text-gray-700">{getWaitingCount(selectedConf.id)}</p>
                {getWaitingCount(selectedConf.id) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Attesa stimata: ~{getWaitingCount(selectedConf.id) * 5} minuti
                  </p>
                )}
              </div>

              <button
                onClick={handleTakeTicket}
                disabled={taking}
                className="btn-gold w-full py-4 text-base"
              >
                {taking ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <TicketIcon size={18} />
                )}
                {taking ? 'Creazione ticket...' : 'Prendi il tuo Numero'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
