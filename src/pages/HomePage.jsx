import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket as TicketIcon, X, Clock } from 'lucide-react';

const PRODUCTION_URL = 'https://www.confessatiora.it/ticket';

export default function HomePage() {
  const ticketUrl = PRODUCTION_URL;
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('info_popup_dismissed');
    if (!dismissed) setShowPopup(true);
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('info_popup_dismissed', '1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={dismissPopup}>
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismissPopup}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Informazione</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Le prenotazioni per la confessione saranno attive <strong>solo il 12 Aprile a partire dalle ore 8:00</strong>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Potrai prenotare il tuo numero direttamente da questo sito quando il servizio sarà aperto.
            </p>
            <button
              onClick={dismissPopup}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl text-center animate-fade-in">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sacred-600 text-white shadow-lg shadow-sacred-600/30">
            <span className="text-3xl">✝</span>
          </div>
          <h1 className="mb-3 text-4xl font-black text-gray-900 sm:text-5xl">
            ConfessatiOra
          </h1>
          <p className="mx-auto max-w-xl text-base text-gray-500 sm:text-lg">
            Sistema elimina-code digitale per confessionali.
            Gestisci le code in tempo reale, senza carta.
          </p>
          <div className="mt-6">
            <a
              href={ticketUrl}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:scale-[1.02]"
            >
              <TicketIcon size={22} />
              Prenotati Ora
            </a>
          </div>
          <div className="mt-10 card mx-auto max-w-2xl text-center">
            <h2 className="mb-2 text-lg font-bold text-gray-900">QR Code — Pagina Ticket</h2>
            <p className="mb-6 text-sm text-gray-500">
              Scansiona il QR code oppure apri direttamente il link per prenotare il ticket.
            </p>
            <div className="inline-flex rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <QRCodeSVG
                value={ticketUrl}
                size={220}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#4c1d95"
              />
            </div>
            <a
              href={ticketUrl}
              className="mt-6 block break-all text-xl font-black text-sacred-700 underline decoration-sacred-300 underline-offset-4 sm:text-3xl"
            >
              {ticketUrl}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
