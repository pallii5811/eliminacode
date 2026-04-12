import { createClient } from '@supabase/supabase-js';
import { demoStore } from './demoStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemo = !supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseUrl === 'your-supabase-url';
export const DEFAULT_BOOKING_SETTINGS = {
  enabled: true,
  closedMessage: 'Le prenotazioni non sono ancora attive. Riprova più tardi.',
  available: true,
};

let supabase = null;
if (!isDemo) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

const todayFilter = () => new Date().toISOString().split('T')[0];

function normalizeBookingSettings(value, available = true) {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : DEFAULT_BOOKING_SETTINGS.enabled,
    closedMessage: typeof value?.closedMessage === 'string' && value.closedMessage.trim()
      ? value.closedMessage.trim()
      : DEFAULT_BOOKING_SETTINGS.closedMessage,
    available,
  };
}

function isMissingSettingsTable(error) {
  const text = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  return error?.code === 'PGRST205' || error?.code === '42P01' || /app_settings/i.test(text);
}

export const api = {
  async getConfessionals() {
    if (isDemo) return demoStore.getConfessionals();
    const { data, error } = await supabase
      .from('confessionals')
      .select('*')
      .eq('is_active', true)
      .order('code');
    if (error) throw error;
    return data || [];
  },

  async getTickets(confessionalId) {
    if (isDemo) return demoStore.getTickets(confessionalId);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('confessional_id', confessionalId)
      .gte('created_at', todayFilter())
      .order('ticket_number');
    if (error) throw error;
    return data || [];
  },

  async getAllTickets() {
    if (isDemo) return demoStore.getAllTickets();
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', todayFilter())
      .order('ticket_number');
    if (error) throw error;
    return data || [];
  },

  async getBookingSettings() {
    if (isDemo) return demoStore.getBookingSettings();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'booking')
      .maybeSingle();

    if (error) {
      if (isMissingSettingsTable(error)) {
        return normalizeBookingSettings(undefined, false);
      }
      throw error;
    }

    return normalizeBookingSettings(data?.value, true);
  },

  async updateBookingSettings(updates) {
    if (isDemo) return demoStore.updateBookingSettings(updates);

    const current = await api.getBookingSettings();
    const nextValue = {
      enabled: typeof updates.enabled === 'boolean' ? updates.enabled : current.enabled,
      closedMessage: typeof updates.closedMessage === 'string' && updates.closedMessage.trim()
        ? updates.closedMessage.trim()
        : current.closedMessage,
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'booking',
        value: nextValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      if (isMissingSettingsTable(error)) {
        throw new Error('Manca la tabella app_settings su Supabase. Esegui lo SQL di configurazione prima di usare la pagina admin.');
      }
      throw error;
    }

    return normalizeBookingSettings(nextValue, true);
  },

  async takeTicket(confessionalId) {
    if (isDemo) return demoStore.takeTicket(confessionalId);

    const bookingSettings = await api.getBookingSettings();
    if (!bookingSettings.enabled) {
      throw new Error(bookingSettings.closedMessage);
    }

    const { data, error } = await supabase.rpc('take_ticket', { conf_id: confessionalId });
    if (error) throw error;
    return data;
  },

  async callNext(confessionalId) {
    if (isDemo) return demoStore.callNext(confessionalId);

    const currentCalled = await supabase
      .from('tickets')
      .select('id')
      .eq('confessional_id', confessionalId)
      .eq('status', 'called')
      .gte('created_at', todayFilter())
      .maybeSingle();

    if (currentCalled.data) {
      await supabase.from('tickets').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', currentCalled.data.id);
    }

    const { data: waiting } = await supabase
      .from('tickets')
      .select('*')
      .eq('confessional_id', confessionalId)
      .eq('status', 'waiting')
      .gte('created_at', todayFilter())
      .order('ticket_number')
      .limit(1);

    if (!waiting || waiting.length === 0) return null;

    const ticket = waiting[0];
    await supabase.from('tickets').update({
      status: 'called',
      called_at: new Date().toISOString(),
    }).eq('id', ticket.id);

    await supabase.from('confessionals').update({
      current_number: ticket.ticket_number,
    }).eq('id', confessionalId);

    const { data: conf } = await supabase
      .from('confessionals')
      .select('*')
      .eq('id', confessionalId)
      .single();

    return { ...ticket, status: 'called', confessional: conf };
  },

  async completeTicket(ticketId) {
    if (isDemo) return demoStore.completeTicket(ticketId);
    const { error } = await supabase.from('tickets').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', ticketId);
    if (error) throw error;
  },

  async skipTicket(ticketId) {
    if (isDemo) return demoStore.skipTicket(ticketId);
    const { error } = await supabase.from('tickets').update({
      status: 'skipped',
    }).eq('id', ticketId);
    if (error) throw error;
  },

  async recallCurrent(confessionalId) {
    if (isDemo) return demoStore.recallCurrent(confessionalId);
    const { data } = await supabase
      .from('tickets')
      .select('*, confessional:confessionals(*)')
      .eq('confessional_id', confessionalId)
      .eq('status', 'called')
      .gte('created_at', todayFilter())
      .maybeSingle();
    return data || null;
  },

  async verifyPin(confessionalId, pin) {
    if (isDemo) return demoStore.verifyPin(confessionalId, pin);
    const { data } = await supabase
      .from('confessionals')
      .select('id')
      .eq('id', confessionalId)
      .eq('operator_pin', pin)
      .maybeSingle();
    return !!data;
  },

  async resetAll() {
    if (isDemo) return demoStore.resetAll();
    await supabase.from('tickets').delete().gte('created_at', todayFilter());
    const { data: confs } = await supabase.from('confessionals').select('id');
    for (const conf of (confs || [])) {
      await supabase.from('confessionals').update({ current_number: 0 }).eq('id', conf.id);
    }
  },

  async getStats() {
    if (isDemo) return demoStore.getStats();
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', todayFilter());

    const all = tickets || [];
    const total = all.length;
    const waiting = all.filter(t => t.status === 'waiting').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const skipped = all.filter(t => t.status === 'skipped').length;
    const called = all.filter(t => t.status === 'called').length;

    const done = all.filter(t => t.status === 'completed' && t.called_at && t.completed_at);
    let avgServiceTime = 0;
    if (done.length > 0) {
      const totalTime = done.reduce((s, t) =>
        s + (new Date(t.completed_at) - new Date(t.called_at)), 0);
      avgServiceTime = Math.round(totalTime / done.length / 1000 / 60);
    }

    return { total, waiting, completed, skipped, called, avgServiceTime };
  },

  async setCurrentNumber(confessionalId, number) {
    if (isDemo) {
      demoStore.confessionals = demoStore.confessionals.map(c =>
        c.id === confessionalId ? { ...c, current_number: number } : c
      );
      demoStore.notify();
      return;
    }
    const { error } = await supabase
      .from('confessionals')
      .update({ current_number: number })
      .eq('id', confessionalId);
    if (error) throw error;
  },

  async setNextTicketStart(confessionalId, startNumber) {
    if (isDemo) {
      const max = Math.max(...demoStore.tickets.map(t => t.ticket_number), 0);
      for (let i = max + 1; i < startNumber; i++) {
        demoStore.tickets.push({
          id: `dummy-${i}`,
          confessional_id: confessionalId,
          ticket_number: i,
          status: 'skipped',
          created_at: new Date().toISOString(),
        });
      }
      demoStore.notify();
      return;
    }
    // Inserisci ticket "skipped" per riempire il gap fino a startNumber-1
    const { data: existing } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('confessional_id', confessionalId)
      .gte('created_at', todayFilter())
      .order('ticket_number', { ascending: false })
      .limit(1);
    
    const currentMax = existing?.[0]?.ticket_number || 0;
    
    for (let i = currentMax + 1; i < startNumber; i++) {
      await supabase.from('tickets').insert({
        confessional_id: confessionalId,
        ticket_number: i,
        status: 'skipped',
      });
    }
  },

  async createMissingTickets(confessionalId, start, end) {
    if (isDemo) {
      for (let i = start; i <= end; i++) {
        demoStore.tickets.push({
          id: `fill-${i}`,
          confessional_id: confessionalId,
          ticket_number: i,
          status: 'waiting',
          created_at: new Date().toISOString(),
        });
      }
      demoStore.notify();
      return;
    }
    // Crea ticket in batch (inserimenti multipli)
    const tickets = [];
    for (let i = start; i <= end; i++) {
      tickets.push({
        confessional_id: confessionalId,
        ticket_number: i,
        status: 'waiting',
      });
    }
    // Inserisci a gruppi di 50 per non sovraccaricare
    for (let i = 0; i < tickets.length; i += 50) {
      const batch = tickets.slice(i, i + 50);
      const { error } = await supabase.from('tickets').insert(batch);
      if (error) throw error;
    }
  },

  subscribe(callback) {
    if (isDemo) return demoStore.subscribe(callback);

    const channel = supabase
      .channel('eliminacode-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessionals' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, callback)
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
