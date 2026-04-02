import { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function PinLogin({ confessionalName, onSuccess, onBack }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== '') && index === 3) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
    }
  };

  const handleSubmit = async (pinCode) => {
    setLoading(true);
    try {
      const valid = await onSuccess(pinCode);
      if (!valid) {
        setError('PIN non valido');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sacred-50 via-white to-sacred-50 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="card text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sacred-100">
            <Lock className="h-8 w-8 text-sacred-600" />
          </div>

          <h2 className="mb-1 text-xl font-bold text-gray-900">Accesso Operatore</h2>
          {confessionalName && (
            <p className="mb-6 text-sm text-gray-500">{confessionalName}</p>
          )}

          <div className="mb-6 flex justify-center gap-3">
            {pin.map((digit, i) => (
              <div key={i} className="pin-digit">
                <input
                  ref={el => inputRefs.current[i] = el}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="h-full w-full bg-transparent text-center text-2xl font-bold outline-none"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 animate-slide-up">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <p className="mb-6 text-xs text-gray-400">
            PIN predefinito: <span className="font-mono font-bold">1234</span>
          </p>

          {onBack && (
            <button onClick={onBack} className="btn-secondary w-full">
              Indietro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
