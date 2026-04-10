const STORAGE_KEY = 'eliminacode_demo';
const DEFAULT_BOOKING_SETTINGS = {
  enabled: true,
  closedMessage: 'Le prenotazioni non sono ancora attive. Riprova più tardi.',
  available: true,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === new Date().toISOString().split('T')[0]) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      date: new Date().toISOString().split('T')[0],
    }));
  } catch {}
}

class DemoStore {
  constructor() {
    const saved = loadState();

    this.confessionals = saved?.confessionals || [
      { id: 'conf-a', name: 'Confessionale A', code: 'A', is_active: true, current_number: 0, operator_pin: '1234', created_at: new Date().toISOString() },
      { id: 'conf-b', name: 'Confessionale B', code: 'B', is_active: true, current_number: 0, operator_pin: '1234', created_at: new Date().toISOString() },
      { id: 'conf-c', name: 'Confessionale C', code: 'C', is_active: true, current_number: 0, operator_pin: '1234', created_at: new Date().toISOString() },
    ];

    this.tickets = saved?.tickets || [];
    this.bookingSettings = saved?.bookingSettings || { ...DEFAULT_BOOKING_SETTINGS };
    this.listeners = new Set();
    this._persist();
  }

  _persist() {
    saveState({ confessionals: this.confessionals, tickets: this.tickets, bookingSettings: this.bookingSettings });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this._persist();
    this.listeners.forEach(cb => {
      try { cb(); } catch {}
    });
  }

  getConfessionals() {
    return [...this.confessionals];
  }

  getTickets(confessionalId) {
    return this.tickets
      .filter(t => !confessionalId || t.confessional_id === confessionalId)
      .sort((a, b) => a.ticket_number - b.ticket_number);
  }

  getAllTickets() {
    return [...this.tickets].sort((a, b) => a.ticket_number - b.ticket_number);
  }

  getBookingSettings() {
    return { ...this.bookingSettings, available: true };
  }

  updateBookingSettings(updates) {
    this.bookingSettings = {
      enabled: typeof updates.enabled === 'boolean' ? updates.enabled : this.bookingSettings.enabled,
      closedMessage: typeof updates.closedMessage === 'string' && updates.closedMessage.trim()
        ? updates.closedMessage.trim()
        : this.bookingSettings.closedMessage,
      available: true,
    };
    this._notify();
    return { ...this.bookingSettings };
  }

  takeTicket(confessionalId) {
    if (!this.bookingSettings.enabled) {
      throw new Error(this.bookingSettings.closedMessage);
    }

    const confTickets = this.tickets.filter(t => t.confessional_id === confessionalId);
    const maxNum = confTickets.length > 0
      ? Math.max(...confTickets.map(t => t.ticket_number))
      : 0;

    const newTicket = {
      id: crypto.randomUUID(),
      confessional_id: confessionalId,
      ticket_number: maxNum + 1,
      status: 'waiting',
      called_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    this.tickets.push(newTicket);
    this._notify();
    return { ...newTicket };
  }

  callNext(confessionalId) {
    const currentCalled = this.tickets.find(
      t => t.confessional_id === confessionalId && t.status === 'called'
    );
    if (currentCalled) {
      currentCalled.status = 'completed';
      currentCalled.completed_at = new Date().toISOString();
    }

    const waiting = this.tickets
      .filter(t => t.confessional_id === confessionalId && t.status === 'waiting')
      .sort((a, b) => a.ticket_number - b.ticket_number);

    if (waiting.length === 0) {
      this._notify();
      return null;
    }

    const ticket = waiting[0];
    ticket.status = 'called';
    ticket.called_at = new Date().toISOString();

    const conf = this.confessionals.find(c => c.id === confessionalId);
    if (conf) conf.current_number = ticket.ticket_number;

    this._notify();
    return { ...ticket, confessional: conf ? { ...conf } : null };
  }

  completeTicket(ticketId) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = 'completed';
      ticket.completed_at = new Date().toISOString();
      this._notify();
    }
  }

  skipTicket(ticketId) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = 'skipped';
      this._notify();
    }
  }

  recallCurrent(confessionalId) {
    const conf = this.confessionals.find(c => c.id === confessionalId);
    const calledTicket = this.tickets.find(
      t => t.confessional_id === confessionalId && t.status === 'called'
    );
    if (conf && calledTicket) {
      this._notify();
      return { ...calledTicket, confessional: { ...conf } };
    }
    return null;
  }

  verifyPin(confessionalId, pin) {
    const conf = this.confessionals.find(c => c.id === confessionalId);
    return conf && conf.operator_pin === pin;
  }

  resetAll() {
    this.tickets = [];
    this.confessionals.forEach(c => { c.current_number = 0; });
    this._notify();
  }

  resetConfessional(confessionalId) {
    this.tickets = this.tickets.filter(t => t.confessional_id !== confessionalId);
    const conf = this.confessionals.find(c => c.id === confessionalId);
    if (conf) conf.current_number = 0;
    this._notify();
  }

  getStats() {
    const total = this.tickets.length;
    const waiting = this.tickets.filter(t => t.status === 'waiting').length;
    const completed = this.tickets.filter(t => t.status === 'completed').length;
    const skipped = this.tickets.filter(t => t.status === 'skipped').length;
    const called = this.tickets.filter(t => t.status === 'called').length;

    const completedTickets = this.tickets.filter(t => t.status === 'completed' && t.called_at && t.completed_at);
    let avgServiceTime = 0;
    if (completedTickets.length > 0) {
      const totalTime = completedTickets.reduce((sum, t) => {
        return sum + (new Date(t.completed_at) - new Date(t.called_at));
      }, 0);
      avgServiceTime = Math.round(totalTime / completedTickets.length / 1000 / 60);
    }

    return { total, waiting, completed, skipped, called, avgServiceTime };
  }
}

export const demoStore = new DemoStore();
