import { QRCodeSVG } from 'qrcode.react';

const PRODUCTION_URL = 'https://www.confessatiora.it/ticket';

export default function HomePage() {
  const ticketUrl = PRODUCTION_URL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
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
