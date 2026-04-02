import { Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';

export default function TicketCard({
  ticket,
  confessional,
  position,
  estimatedWait,
  isCalled = false,
}) {
  const number = String(ticket.ticket_number).padStart(3, '0');
  const confCode = confessional?.code || '?';
  const confName = confessional?.name || 'Confessionale';

  if (isCalled) {
    return (
      <div className="ticket-appear print-ticket">
        <div className="card called-pulse overflow-hidden border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-green-700">È IL TUO TURNO!</span>
            </div>

            <div className="my-4">
              <span className="display-number text-6xl font-black text-green-700">
                {number}
              </span>
            </div>

            <p className="text-sm font-medium text-green-600">
              Presentati al {confName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-appear print-ticket">
      <div className="card overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <span className="badge-waiting">
            <Clock size={10} />
            In attesa
          </span>
          <span className="text-xs font-medium text-gray-400">
            {confName}
          </span>
        </div>

        <div className="text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Il tuo numero
          </p>
          <div className="my-3">
            <span className="display-number text-5xl font-black text-sacred-700">
              {number}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-3">
          {position && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} />
              <span>Posizione: <strong className="text-gray-700">{position}°</strong></span>
            </div>
          )}
          {estimatedWait > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} />
              <span>~<strong className="text-gray-700">{estimatedWait} min</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
