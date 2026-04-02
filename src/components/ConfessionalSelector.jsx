import { Users, Clock } from 'lucide-react';

export default function ConfessionalSelector({
  confessionals,
  selectedId,
  onSelect,
  waitingCounts = {},
  showWaiting = true,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {confessionals.map((conf) => {
        const isSelected = selectedId === conf.id;
        const waitCount = waitingCounts[conf.id] || 0;

        return (
          <button
            key={conf.id}
            onClick={() => onSelect(conf)}
            className={`confessional-card text-left ${isSelected ? 'selected' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    isSelected
                      ? 'bg-sacred-600 text-white'
                      : 'bg-sacred-100 text-sacred-700'
                  }`}>
                    {conf.code}
                  </span>
                  <h3 className="font-semibold text-gray-900">{conf.name}</h3>
                </div>
              </div>
              <div className={`status-dot ${conf.is_active ? 'status-dot-active' : 'status-dot-inactive'}`} />
            </div>

            {showWaiting && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  <span className="font-medium">{waitCount}</span> in attesa
                </span>
                {waitCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    ~{waitCount * 5} min
                  </span>
                )}
              </div>
            )}

            {conf.current_number > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                Ora servito: <span className="font-bold text-sacred-600">
                  {String(conf.current_number).padStart(3, '0')}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
