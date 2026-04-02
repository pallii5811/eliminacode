import { Clock, CheckCircle2, XCircle, Phone } from 'lucide-react';

const STATUS_CONFIG = {
  waiting: { label: 'In attesa', className: 'badge-waiting', icon: Clock },
  called: { label: 'Chiamato', className: 'badge-called', icon: Phone },
  completed: { label: 'Completato', className: 'badge-completed', icon: CheckCircle2 },
  skipped: { label: 'Saltato', className: 'badge-skipped', icon: XCircle },
};

export default function QueueList({ tickets, onComplete, onSkip, showActions = false }) {
  if (tickets.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-400">Nessun ticket in coda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.waiting;
        const Icon = config.icon;
        const number = String(ticket.ticket_number).padStart(3, '0');

        return (
          <div
            key={ticket.id}
            className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
              ticket.status === 'called'
                ? 'border-green-200 bg-green-50'
                : ticket.status === 'completed'
                ? 'border-gray-100 bg-gray-50 opacity-60'
                : ticket.status === 'skipped'
                ? 'border-red-100 bg-red-50 opacity-60'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="display-number text-lg font-bold text-gray-900">{number}</span>
              <span className={config.className}>
                <Icon size={10} />
                {config.label}
              </span>
            </div>

            {showActions && ticket.status === 'called' && (
              <div className="flex items-center gap-1.5">
                {onComplete && (
                  <button
                    onClick={() => onComplete(ticket.id)}
                    className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-200"
                  >
                    Completato
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={() => onSkip(ticket.id)}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200"
                  >
                    Salta
                  </button>
                )}
              </div>
            )}

            {!showActions && (
              <span className="text-[10px] text-gray-400">
                {new Date(ticket.created_at).toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
