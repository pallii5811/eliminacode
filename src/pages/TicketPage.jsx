import { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket as TicketIcon, RefreshCw, BookOpen, X } from 'lucide-react';
import Header from '../components/Header';
import TicketCard from '../components/TicketCard';
import { useQueueState } from '../hooks/useQueueState';
import { useBookingState } from '../hooks/useBookingState';

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
  const { settings, loading: bookingLoading } = useBookingState();

  const [myTicket, setMyTicket] = useState(null);
  const [taking, setTaking] = useState(false);
  const [wasCalled, setWasCalled] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [step, setStep] = useState('landing');
  const loadedRef = useRef(false);

  const selectedConf = confessionals.length > 0 ? confessionals[0] : null;

  useEffect(() => {
    if (loadedRef.current || confessionals.length === 0) return;
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
        setWasCalled(false);
        setStep('landing');
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
    setWasCalled(false);
    setStep('landing');
  };

  if (loading || bookingLoading) {
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

          <div className="mt-6">
            <button
              onClick={() => setShowReminder(true)}
              className="btn-primary w-full justify-center py-4 text-base"
            >
              <BookOpen size={18} />
              RICORDATI
            </button>
          </div>

          <div className="mt-4 text-center">
            <button onClick={handleNewTicket} className="btn-secondary">
              <RefreshCw size={14} />
              Nuovo Ticket
            </button>
          </div>
        </main>

        {showReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowReminder(false)}>
            <div
              className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowReminder(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sacred-100">
                  <BookOpen className="h-5 w-5 text-sacred-600" />
                </div>
                <h2 className="text-lg font-black text-gray-900">Preparati alla Confessione</h2>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-gray-600">
                <p>
                  Confessarsi bene richiede preparazione spirituale interiore e sincerità, strutturandosi in cinque passaggi chiave: <strong>esame di coscienza</strong>, <strong>dolore dei peccati</strong>, <strong>proposito di non peccare più</strong>, <strong>confessione orale</strong> e <strong>penitenza</strong>. È fondamentale per te riflettere sulle tue azioni alla luce dei comandamenti, confessare con chiarezza i tuoi peccati mortali e affidarti con fiducia alla misericordia divina e a un riverente e riconosciuto "Timor di Dio".
                </p>

                <div>
                  <h3 className="mb-1 font-bold text-gray-900">Preparati spiritualmente</h3>
                  <p>Prima di andare in confessione, dedica del tempo alla preghiera e all'esame di coscienza. Chiedi a Dio di illuminare la tua mente e il tuo cuore per poter riconoscere i tuoi peccati con sincerità. Non chiacchierare, guardare il cellulare o altro che disturbi il tuo spirituale silenzio interiore.</p>
                </div>

                <div>
                  <h3 className="mb-1 font-bold text-gray-900">Ecco i passi dettagliati per una buona confessione</h3>
                  <ul className="mt-2 space-y-3">
                    <li><strong>Esame di coscienza:</strong> Raccogliti in preghiera, chiedi aiuto allo Spirito Santo e rifletti sulle tue azioni, parole, pensieri e omissioni dall'ultima confessione. Puoi usare i Dieci Comandamenti, il Vangelo o le relazioni con Dio, il prossimo e te stesso come guida.</li>
                    <li><strong>Dolore dei peccati:</strong> Prova un sincero dispiacere per aver offeso Dio, non per paura della punizione, ma per amore verso di Lui.</li>
                    <li><strong>Proposito di non peccare più:</strong> Prendi la ferma decisione di evitare il peccato e le occasioni che vi portano (occasioni prossime).</li>
                    <li><strong>Confessione dei peccati:</strong> Sii concreto, preciso e sintetico nel dire i tuoi peccati al sacerdote, distinguendo tra peccati veniali e mortali. Inizia col segno della croce e dicendo quanto tempo è passato dall'ultima volta.</li>
                    <li><strong>Penitenza e assoluzione:</strong> Ascolta il sacerdote, accetta la penitenza (segno di riparazione) e recita l'atto di dolore. Dopo l'assoluzione, compi la penitenza il prima possibile.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-1 font-bold text-gray-900">Consigli utili</h3>
                  <p>Non nascondere volontariamente peccati gravi, altrimenti la tua confessione è nulla. Se non ricordi un peccato veniale, non preoccuparti, viene perdonato comunque. La confessione non è un elenco di colpe, ma un dialogo di riconciliazione.</p>
                </div>

                <p className="font-medium text-sacred-700">
                  L'essenziale è il tuo atteggiamento di sincero pentimento e il desiderio di conversione, per ricevere il perdono di Dio e rafforzare il tuo rapporto con Lui.
                </p>
              </div>

              <button
                onClick={() => setShowReminder(false)}
                className="btn-primary mt-6 w-full justify-center py-3"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
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

  if (!settings.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
        <Header title="Prenotazioni chiuse" showBack minimal />
        <main className="mx-auto max-w-lg px-4 pt-24 pb-12">
          <div className="card text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100">
              <TicketIcon className="h-8 w-8 text-gold-600" />
            </div>
            <h2 className="mb-3 text-2xl font-black text-gray-900">Prenotazioni non ancora attive</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500">
              {settings.closedMessage}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
        <Header title="Prendi Numero" showBack minimal />

        <main className="mx-auto max-w-lg px-4 pt-24 pb-12">
          <div className="animate-fade-in">
            <div className="card overflow-hidden">
              <div className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-amber-200/50">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  <TicketIcon size={22} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">Prendi Numero</h2>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">Fedeli</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    Per i fedeli — prendi il tuo numero e monitora la coda in tempo reale
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-gray-500">
                <p><strong className="text-gray-700">1.</strong> Premi il pulsante qui sotto per prenotare il tuo posto in coda.</p>
                <p><strong className="text-gray-700">2.</strong> Riceverai un numero di prenotazione da conservare.</p>
                <p><strong className="text-gray-700">3.</strong> Quando sarà il tuo turno, verrai chiamato sul display.</p>
              </div>

              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-sm font-semibold text-amber-800">
                  ⏰ Prenotazioni disponibili solo il <strong>12 Aprile</strong> dalle <strong>8:00</strong> alle <strong>16:00</strong>
                </p>
              </div>

              <button
                onClick={() => setStep('booking')}
                className="btn-gold w-full mt-6 py-4 text-base"
              >
                <TicketIcon size={18} />
                Prenotati Ora
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
      <Header title="Prendi il tuo numero" showBack minimal />

      <main className="mx-auto max-w-lg px-4 pt-24 pb-12">
        <div className="animate-slide-up">
          <div className="card text-center">
            <div className="my-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 mb-1">Persone in attesa</p>
              <p className="text-3xl font-black text-gray-700">{selectedConf ? getWaitingCount(selectedConf.id) : 0}</p>
              {selectedConf && getWaitingCount(selectedConf.id) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Attesa stimata: ~{getWaitingCount(selectedConf.id) * 5} minuti
                </p>
              )}
            </div>

            <button
              onClick={handleTakeTicket}
              disabled={taking || !selectedConf}
              className="btn-gold w-full py-4 text-base"
            >
              {taking ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <TicketIcon size={18} />
              )}
              {taking ? 'Prenotazione in corso...' : 'Prendi il tuo Numero'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
