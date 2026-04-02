import { Link } from 'react-router-dom';
import { Monitor, Settings, Ticket, BookOpen, Smartphone, Wifi, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../components/Header';
import { isDemo } from '../lib/supabase';

const MODULES = [
  {
    path: '/ticket',
    title: 'Prendi Numero',
    description: 'Per i fedeli — prendi il tuo numero e monitora la coda in tempo reale',
    icon: Ticket,
    color: 'from-gold-500 to-gold-600',
    shadow: 'shadow-gold-500/20',
    badge: 'Fedeli',
  },
  {
    path: '/operatore',
    title: 'Pannello Operatore',
    description: 'Per il sacerdote — chiama il prossimo numero, gestisci la coda',
    icon: Settings,
    color: 'from-sacred-600 to-sacred-700',
    shadow: 'shadow-sacred-600/20',
    badge: 'Operatore',
  },
  {
    path: '/display',
    title: 'Display Pubblico',
    description: 'Per TV/proiettore — mostra il numero corrente con annuncio vocale',
    icon: Monitor,
    color: 'from-gray-800 to-gray-900',
    shadow: 'shadow-gray-800/20',
    badge: 'Display',
  },
];

const FEATURES = [
  { icon: Smartphone, title: 'PWA Installabile', desc: 'Funziona come un\'app nativa' },
  { icon: Wifi, title: 'Tempo Reale', desc: 'Aggiornamenti istantanei via WebSocket' },
  { icon: Shield, title: 'GDPR Safe', desc: 'Nessun dato personale raccolto' },
];

export default function HomePage() {
  const ticketUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/ticket`
    : '/ticket';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-gold-50/30">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pt-24 pb-12 sm:pt-28">
        {/* Hero */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sacred-600 text-white shadow-lg shadow-sacred-600/30">
            <span className="text-3xl">✝</span>
          </div>
          <h1 className="mb-3 text-3xl font-black text-gray-900 sm:text-4xl">
            CodaSacra
          </h1>
          <p className="mx-auto max-w-md text-base text-gray-500">
            Sistema elimina-code digitale per confessionali.
            <br />
            Gestisci le code in tempo reale, senza carta.
          </p>

          {isDemo && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-xs font-bold text-gold-700">
                DEMO MODE — Funziona senza backend
              </span>
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="mb-16 grid gap-4 sm:grid-cols-3">
          {MODULES.map((mod, i) => (
            <Link
              key={mod.path}
              to={mod.path}
              className="group card-hover animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-lg ${mod.shadow} transition-transform group-hover:scale-110`}>
                <mod.icon size={22} />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{mod.title}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  {mod.badge}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {mod.description}
              </p>
            </Link>
          ))}
        </div>

        {/* QR Code Section */}
        <div className="mb-16 card text-center animate-fade-in">
          <h2 className="mb-2 text-lg font-bold text-gray-900">QR Code — Pagina Ticket</h2>
          <p className="mb-6 text-sm text-gray-500">
            Stampa o proietta questo QR code per permettere ai fedeli di prendere il numero dal telefono
          </p>
          <div className="inline-flex rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <QRCodeSVG
              value={ticketUrl}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#4c1d95"
            />
          </div>
          <p className="mt-4 rounded-lg bg-gray-50 px-4 py-2 font-mono text-xs text-gray-500 break-all">
            {ticketUrl}
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sacred-100">
                <f.icon size={16} className="text-sacred-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{f.title}</h4>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup Link */}
        <div className="mt-12 text-center">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-sacred-600 transition-colors"
          >
            <BookOpen size={14} />
            Guida Setup Supabase + Deploy Vercel
          </Link>
        </div>
      </main>
    </div>
  );
}
