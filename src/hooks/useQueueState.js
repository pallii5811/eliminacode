import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/supabase';

export function useQueueState() {
  const [confessionals, setConfessionals] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [confs, allTickets] = await Promise.all([
        api.getConfessionals(),
        api.getAllTickets(),
      ]);
      if (mountedRef.current) {
        setConfessionals(confs);
        setTickets(allTickets);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const unsubscribe = api.subscribe(() => refresh());

    // Polling fallback ogni 5s in caso il WebSocket cada
    const pollInterval = setInterval(() => refresh(), 5000);

    const midnightReset = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);
      const ms = midnight - now;
      return setTimeout(() => {
        refresh();
        midnightReset();
      }, ms);
    };
    const resetTimer = midnightReset();

    return () => {
      mountedRef.current = false;
      unsubscribe();
      clearInterval(pollInterval);
      clearTimeout(resetTimer);
    };
  }, [refresh]);

  const callNext = useCallback(async (confessionalId) => {
    try {
      const result = await api.callNext(confessionalId);
      if (result) {
        setLastEvent({ type: 'called', ticket: result, timestamp: Date.now() });
      }
      await refresh();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [refresh]);

  const takeTicket = useCallback(async (confessionalId) => {
    try {
      const ticket = await api.takeTicket(confessionalId);
      await refresh();
      return ticket;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [refresh]);

  const completeTicket = useCallback(async (ticketId) => {
    try {
      await api.completeTicket(ticketId);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }, [refresh]);

  const skipTicket = useCallback(async (ticketId) => {
    try {
      await api.skipTicket(ticketId);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }, [refresh]);

  const recallCurrent = useCallback(async (confessionalId) => {
    try {
      const result = await api.recallCurrent(confessionalId);
      if (result) {
        setLastEvent({ type: 'recalled', ticket: result, timestamp: Date.now() });
      }
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const resetAll = useCallback(async () => {
    try {
      await api.resetAll();
      setLastEvent(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }, [refresh]);

  const getWaitingCount = useCallback((confessionalId) =>
    tickets.filter(t => t.confessional_id === confessionalId && t.status === 'waiting').length,
  [tickets]);

  const getCurrentTicket = useCallback((confessionalId) =>
    tickets.find(t => t.confessional_id === confessionalId && t.status === 'called'),
  [tickets]);

  const getWaitingTickets = useCallback((confessionalId) =>
    tickets
      .filter(t => t.confessional_id === confessionalId && t.status === 'waiting')
      .sort((a, b) => a.ticket_number - b.ticket_number),
  [tickets]);

  const getTicketPosition = useCallback((ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'waiting') return null;
    const waiting = tickets
      .filter(t => t.confessional_id === ticket.confessional_id && t.status === 'waiting')
      .sort((a, b) => a.ticket_number - b.ticket_number);
    const pos = waiting.findIndex(t => t.id === ticketId);
    return pos >= 0 ? pos + 1 : null;
  }, [tickets]);

  const getEstimatedWait = useCallback((confessionalId, position) => {
    const AVG_MINUTES = 5;
    return position ? position * AVG_MINUTES : 0;
  }, []);

  return {
    confessionals,
    tickets,
    loading,
    error,
    lastEvent,
    callNext,
    takeTicket,
    completeTicket,
    skipTicket,
    recallCurrent,
    resetAll,
    refresh,
    getWaitingCount,
    getCurrentTicket,
    getWaitingTickets,
    getTicketPosition,
    getEstimatedWait,
  };
}
