import { createClient } from '@supabase/supabase-js';
import { demoStore } from './demoStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemo = !supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseUrl === 'your-supabase-url';

let supabase = null;
if (!isDemo) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

const todayFilter = () => new Date().toISOString().split('T')[0];

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

  async takeTicket(confessionalId) {
    if (isDemo) return demoStore.takeTicket(confessionalId);
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

  subscribe(callback) {
    if (isDemo) return demoStore.subscribe(callback);

    const channel = supabase
      .channel('codasacra-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessionals' }, callback)
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
