import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Power, PowerOff, Save, Shield } from 'lucide-react';
import Header from '../components/Header';
import { useBookingState } from '../hooks/useBookingState';

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

  const isLocalAdmin = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  }, []);

  useEffect(() => {
    setMessage(settings.closedMessage || '');
  }, [settings.closedMessage]);

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

  if (!isLocalAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
        <Header title="Admin Prenotazioni" showBack minimal />
        <main className="mx-auto max-w-lg px-4 pt-24 pb-12">
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Pagina disponibile solo nell'EXE</h2>
            <p className="text-sm text-gray-500">
              L'attivazione delle prenotazioni può essere gestita solo dalla versione locale aperta dal cliente sul PC dell'evento.
            </p>
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
      </main>
    </div>
  );
}
