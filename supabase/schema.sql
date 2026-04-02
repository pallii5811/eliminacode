-- ============================================
-- CodaSacra — Schema Database Supabase
-- Sistema elimina-code digitale per confessionali
-- ============================================

-- Tabella confessionali
CREATE TABLE IF NOT EXISTS confessionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  current_number INTEGER DEFAULT 0,
  operator_pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confessional_id UUID REFERENCES confessionals(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'completed', 'skipped')),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_tickets_conf_status ON tickets(confessional_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_conf_date ON tickets(confessional_id, created_at);

-- Abilita Realtime sulle tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE confessionals;

-- Funzione atomica per prendere un ticket (anti-duplicato)
CREATE OR REPLACE FUNCTION take_ticket(conf_id UUID)
RETURNS JSON AS $$
DECLARE
  next_num INTEGER;
  new_ticket tickets%ROWTYPE;
BEGIN
  -- Lock per evitare race condition
  PERFORM pg_advisory_xact_lock(hashtext(conf_id::text || CURRENT_DATE::text));

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

-- Funzione per reset giornaliero automatico
CREATE OR REPLACE FUNCTION daily_reset()
RETURNS void AS $$
BEGIN
  UPDATE confessionals SET current_number = 0;
END;
$$ LANGUAGE plpgsql;

-- Inserisci confessionali di default
INSERT INTO confessionals (name, code) VALUES
  ('Confessionale A', 'A'),
  ('Confessionale B', 'B'),
  ('Confessionale C', 'C')
ON CONFLICT (code) DO NOTHING;

-- Row Level Security
ALTER TABLE confessionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: lettura pubblica
CREATE POLICY "public_read_confessionals" ON confessionals FOR SELECT USING (true);
CREATE POLICY "public_read_tickets" ON tickets FOR SELECT USING (true);

-- Policy: inserimento ticket
CREATE POLICY "public_insert_tickets" ON tickets FOR INSERT WITH CHECK (true);

-- Policy: aggiornamento
CREATE POLICY "public_update_tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "public_update_confessionals" ON confessionals FOR UPDATE USING (true);

-- Policy: cancellazione ticket (per reset)
CREATE POLICY "public_delete_tickets" ON tickets FOR DELETE USING (true);
