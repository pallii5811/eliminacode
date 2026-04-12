import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Power, PowerOff, Save, Shield, LogIn, Ticket, Settings, Monitor } from 'lucide-react';
import Header from '../components/Header';
import { useBookingState } from '../hooks/useBookingState';
import { api } from '../lib/supabase';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'simona';

const SETTINGS_SQL = `CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lettura pubblica app_settings" ON app_settings;
DROP POLICY IF EXISTS "Inserimento app_settings" ON app_settings;
DROP POLICY IF EXISTS "Aggiornamento app_settings" ON app_settings;

CREATE POLICY "Lettura pubblica app_settings"
ON app_settings FOR SELECT USING (true);

CREATE POLICY "Inserimento app_settings"
ON app_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Aggiornamento app_settings"
ON app_settings FOR UPDATE USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;`;

export default function AdminPage() {
  const { settings, loading, error, updateSettings } = useBookingState();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [displayNumber, setDisplayNumber] = useState('');
  const [confessionals, setConfessionals] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth');
    if (saved === '1') setAuthenticated(true);
  }, []);

  useEffect(() => {
    setMessage(settings.closedMessage || '');
  }, [settings.closedMessage]);

  useEffect(() => {
    if (!authenticated) return;
    api.getConfessionals().then(setConfessionals).catch(() => {});
  }, [authenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setAuthenticated(true);
      sessionStorage.setItem('admin_auth', '1');
      setLoginError('');
    } else {
      setLoginError('Nome utente o password errati.');
    }
  };

  const handleToggle = async (enabled) => {
    setSaving(true);
    setNotice('');
    try {
      await updateSettings({ enabled, closedMessage: message });
      setNotice(enabled ? 'Prenotazioni attivate.' : 'Prenotazioni disattivate.');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    setNotice('');
    try {
      await updateSettings({ closedMessage: message });
      setNotice('Messaggio salvato.');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDisplayNumber = async () => {
    const num = parseInt(displayNumber, 10);
    if (isNaN(num) || num < 0) {
      setNotice('Inserisci un numero valido');
      return;
    }
    setSaving(true);
    setNotice('');
    try {
      const conf = confessionals[0];
      if (!conf) throw new Error('Nessun confessionale trovato');
      await api.setCurrentNumber(conf.id, num);
      setNotice(`Numero display impostato a ${num}`);
      setDisplayNumber('');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
        <Header title="Admin Prenotazioni" showBack minimal />
        <main className="mx-auto max-w-sm px-4 pt-24 pb-12">
          <div className="card animate-fade-in">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sacred-100">
                <Shield className="h-8 w-8 text-sacred-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Accesso Admin</h2>
              <p className="mt-1 text-sm text-gray-500">Inserisci le credenziali per accedere.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nome utente</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-sacred-300 focus:ring-4 focus:ring-sacred-100"
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-sacred-300 focus:ring-4 focus:ring-sacred-100"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {loginError && (
                <p className="text-sm font-medium text-red-600">{loginError}</p>
              )}
              <button type="submit" className="btn-primary w-full justify-center py-3">
                <LogIn size={18} />
                Accedi
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sacred-200 border-t-sacred-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
      <Header title="Admin Prenotazioni" showBack minimal />

      <main className="mx-auto max-w-2xl px-4 pt-24 pb-12">
        <div className="mb-6 text-center animate-fade-in">
          <h2 className="text-2xl font-black text-gray-900">Controllo Prenotazioni</h2>
          <p className="mt-2 text-sm text-gray-500">
            Da qui il cliente decide quando aprire o chiudere la prenotazione dei ticket.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className={`card border ${settings.enabled ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${settings.enabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {settings.enabled ? <Power size={20} /> : <PowerOff size={20} />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Stato attuale</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {settings.enabled ? 'Prenotazioni attive' : 'Prenotazioni chiuse'}
                </h3>
              </div>
            </div>
          </div>

          <div className="card border border-sacred-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sacred-100 text-sacred-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Azione rapida</p>
                <h3 className="text-lg font-bold text-gray-900">Apri o chiudi con un tocco</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 card animate-slide-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleToggle(true)}
              disabled={saving || settings.enabled}
              className="btn-primary justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Power size={18} />
              Attiva Prenotazioni
            </button>

            <button
              onClick={() => handleToggle(false)}
              disabled={saving || !settings.available || !settings.enabled}
              className="btn-secondary justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PowerOff size={18} />
              Disattiva Prenotazioni
            </button>
          </div>
        </div>

        <div className="mb-6 card">
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Messaggio da mostrare quando le prenotazioni sono chiuse
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-sacred-300 focus:ring-4 focus:ring-sacred-100"
            placeholder="Le prenotazioni possono essere effettuate il 12 febbraio alle ore 09:00."
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveMessage}
              disabled={saving || !settings.available}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              Salva Messaggio
            </button>
          </div>
        </div>

        <div className="mb-6 card border border-blue-200 bg-blue-50">
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Imposta numero Display (Confessionale A)
          </label>
          <p className="mb-3 text-xs text-gray-600">
            Inserisci il numero che deve apparire sul display. Es: 24 per mostrare 025 come prossimo.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              value={displayNumber}
              onChange={(e) => setDisplayNumber(e.target.value)}
              placeholder="Es: 24"
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-sacred-300 focus:ring-4 focus:ring-sacred-100"
            />
            <button
              onClick={handleSetDisplayNumber}
              disabled={saving || !displayNumber}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              Imposta
            </button>
          </div>
        </div>

        {(notice || error) && (
          <div className={`mb-6 card border ${error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <div className={`flex items-start gap-3 text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
              {error ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
              <span>{error || notice}</span>
            </div>
          </div>
        )}

        {!settings.available && (
          <div className="card border border-gold-200 bg-gold-50">
            <div className="mb-4 flex items-start gap-3 text-gold-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h3 className="font-bold">Configurazione Supabase mancante</h3>
                <p className="mt-1 text-sm">
                  Per usare il tasto di attivazione/disattivazione devi creare la tabella `app_settings` una sola volta su Supabase.
                </p>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-2xl bg-white/80 p-4 text-xs leading-relaxed text-gray-700">
              {SETTINGS_SQL}
            </pre>
          </div>
        )}

        <div className="mt-10 mb-4 text-center">
          <h3 className="text-xl font-black text-gray-900">Pagine del sistema</h3>
          <p className="mt-1 text-sm text-gray-500">Accedi alle diverse sezioni dell'app</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/ticket" className="card border border-gray-100 hover:border-sacred-200 hover:shadow-lg transition-all group">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <Ticket className="h-7 w-7 text-amber-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">Prendi Numero</h4>
            <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">Fedeli</span>
            <p className="text-sm text-gray-500">Per i fedeli — prendi il tuo numero e monitora la coda in tempo reale</p>
          </Link>

          <Link to="/dashboard" className="card border border-gray-100 hover:border-sacred-200 hover:shadow-lg transition-all group">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sacred-100 group-hover:bg-sacred-200 transition-colors">
              <Settings className="h-7 w-7 text-sacred-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">Dashboard</h4>
            <span className="mb-1 inline-block rounded-full bg-sacred-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sacred-700">Operatore</span>
            <p className="text-sm text-gray-500">Per il sacerdote — chiama il prossimo numero, gestisci la coda</p>
          </Link>

          <Link to="/display" className="card border border-gray-100 hover:border-sacred-200 hover:shadow-lg transition-all group">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <Monitor className="h-7 w-7 text-gray-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">Display Pubblico</h4>
            <span className="mb-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">Display</span>
            <p className="text-sm text-gray-500">Per TV/proiettore — mostra il numero corrente con annuncio vocale</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
