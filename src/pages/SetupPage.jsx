import { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Globe, Shield, Terminal, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';

const STEPS = [
  {
    title: '1. Crea progetto Supabase',
    icon: Database,
    content: `1. Vai su https://supabase.com e crea un account gratuito
2. Clicca "New Project" e scegli un nome (es. "eliminacode")
3. Scegli una password per il database (salvala!)
4. Regione: seleziona "Central EU (Frankfurt)" per bassa latenza
5. Attendi 2-3 minuti che il progetto sia pronto`,
  },
  {
    title: '2. Crea le tabelle',
    icon: Terminal,
    content: `Vai su SQL Editor nel pannello Supabase e incolla questo codice:

-- Tabella confessionali
CREATE TABLE confessionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  current_number INTEGER DEFAULT 0,
  operator_pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confessional_id UUID REFERENCES confessionals(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','called','completed','skipped')),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX idx_tickets_conf_status ON tickets(confessional_id, status);
CREATE INDEX idx_tickets_created ON tickets(created_at);

-- Abilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE confessionals;

-- Funzione atomica per prendere ticket
CREATE OR REPLACE FUNCTION take_ticket(conf_id UUID)
RETURNS JSON AS $$
DECLARE
  next_num INTEGER;
  new_ticket tickets%ROWTYPE;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO next_num
  FROM tickets
  WHERE confessional_id = conf_id
  AND created_at::date = CURRENT_DATE;

  INSERT INTO tickets (confessional_id, ticket_number, status)
  VALUES (conf_id, next_num, 'waiting')
  RETURNING * INTO new_ticket;

  RETURN row_to_json(new_ticket);
END;
$$ LANGUAGE plpgsql;

-- Inserisci confessionali di default
INSERT INTO confessionals (name, code) VALUES
  ('Confessionale A', 'A'),
  ('Confessionale B', 'B'),
  ('Confessionale C', 'C');

-- Abilita RLS (Row Level Security)
ALTER TABLE confessionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere
CREATE POLICY "Lettura pubblica confessionali" ON confessionals FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica tickets" ON tickets FOR SELECT USING (true);

-- Policy: tutti possono inserire ticket
CREATE POLICY "Inserimento ticket" ON tickets FOR INSERT WITH CHECK (true);

-- Policy: tutti possono aggiornare (in produzione restringi!)
CREATE POLICY "Aggiornamento ticket" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Aggiornamento confessionali" ON confessionals FOR UPDATE USING (true);
CREATE POLICY "Cancellazione ticket" ON tickets FOR DELETE USING (true);

Clicca "Run" per eseguire.`,
  },
  {
    title: '3. Configura le variabili',
    icon: Shield,
    content: `1. In Supabase, vai su Settings > API
2. Copia "Project URL" e "anon public" key
3. Nel tuo progetto, crea un file .env con:

VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Riavvia il dev server (npm run dev)`,
  },
  {
    title: '4. Deploy su Vercel',
    icon: Globe,
    content: `1. Carica il progetto su GitHub (git push)
2. Vai su https://vercel.com e collega il repository
3. In "Environment Variables" aggiungi:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Clicca "Deploy"
5. In 1-2 minuti avrai il link pubblico!

Il file vercel.json è già configurato per il routing SPA.`,
  },
];

function Accordion({ step, isOpen, onToggle }) {
  return (
    <div className="card mb-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sacred-100">
          <step.icon size={16} className="text-sacred-600" />
        </div>
        <span className="flex-1 font-semibold text-gray-900">{step.title}</span>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono leading-relaxed">
            {step.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SetupPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-50 via-white to-sacred-50">
      <Header title="Guida Setup" showBack minimal />

      <main className="mx-auto max-w-2xl px-4 pt-24 pb-12">
        <div className="mb-8 text-center animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900">Setup Completo</h2>
          <p className="text-sm text-gray-500">
            Segui questi 4 passaggi per passare dalla demo alla produzione
          </p>
        </div>

        <div className="animate-slide-up">
          {STEPS.map((step, i) => (
            <Accordion
              key={i}
              step={step}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>

        <div className="mt-8 card bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-800">Nota sulla Demo Mode</h4>
              <p className="mt-1 text-sm text-green-700">
                L'app funziona completamente anche senza Supabase grazie alla Demo Mode.
                I dati vengono salvati nel browser (localStorage).
                Perfetto per test e presentazioni al cliente.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
