# ✝ CodaSacra

**Sistema elimina-code digitale per confessionali** — real-time, multi-confessionale, PWA installabile.

## Funzionalità

- **Display Pubblico** `/display` — per TV/proiettore, numeri giganti con annuncio vocale
- **Pannello Operatore** `/operatore` — per il sacerdote, chiama/salta/completa con PIN
- **Pagina Ticket** `/ticket` — per i fedeli, prendi numero e monitora posizione
- **QR Code** — generato automaticamente per condividere la pagina ticket
- **Demo Mode** — funziona senza backend, perfetto per test e presentazioni

## Tech Stack

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Realtime) |
| Deploy | Vercel |
| PWA | Service Worker + Web App Manifest |
| Voice | Web Speech API |
| Icons | Lucide React |

## Quick Start

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo (Demo Mode)
npm run dev

# Build produzione
npm run build
```

L'app parte automaticamente in **Demo Mode** senza configurare Supabase.

## Configurazione Supabase (Produzione)

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Esegui lo script `supabase/schema.sql` nel SQL Editor
3. Crea `.env` con:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

4. Riavvia il dev server

## Deploy Vercel

1. Push su GitHub
2. Importa il progetto su [vercel.com](https://vercel.com)
3. Aggiungi le variabili d'ambiente
4. Deploy automatico

## Struttura Progetto

```
src/
├── App.jsx              # Router principale
├── main.jsx             # Entry point + SW registration
├── index.css            # Design system + animazioni
├── lib/
│   ├── supabase.js      # API unificata (Supabase/Demo)
│   └── demoStore.js     # Store in-memory per Demo Mode
├── hooks/
│   ├── useQueueState.js # Stato coda real-time
│   ├── useVoice.js      # Sintesi vocale italiana
│   └── useClock.js      # Orologio real-time
├── components/
│   ├── Header.jsx       # Navbar responsive
│   ├── PinLogin.jsx     # Autenticazione operatore
│   ├── ConfessionalSelector.jsx
│   ├── TicketCard.jsx   # Card ticket con stati
│   └── QueueList.jsx    # Lista coda
└── pages/
    ├── HomePage.jsx     # Landing + QR code
    ├── DisplayPage.jsx  # Schermo pubblico
    ├── OperatorPage.jsx # Pannello gestione
    ├── TicketPage.jsx   # Prenotazione fedeli
    └── SetupPage.jsx    # Guida configurazione
```

## App Desktop (EXE per Chiavetta USB)

L'app può essere distribuita come **EXE portabile** su chiavetta USB.

### Generare l'EXE

```bash
npm run build
npx electron-packager . CodaSacra --platform=win32 --arch=x64 --out=release --overwrite --asar
```

### Contenuto della chiavetta

La cartella `release/CodaSacra-win32-x64/` contiene:

| File | Funzione |
|------|----------|
| `CodaSacra.exe` | Launcher principale (scelta modulo) |
| `Avvia Display (TV).bat` | Apre direttamente il display fullscreen |
| `Avvia Operatore.bat` | Apre il pannello operatore |
| `Avvia Ticket.bat` | Apre la pagina per prendere il numero |
| `LEGGIMI.txt` | Istruzioni per l'utente finale |

### Come usare la chiavetta

1. Copia la cartella `CodaSacra-win32-x64` sulla chiavetta USB
2. Inserisci la chiavetta nel PC collegato alla TV/monitor
3. Doppio click su `Avvia Display (TV).bat` → si apre a schermo intero
4. Su un altro PC/tablet: doppio click su `Avvia Operatore.bat`

> **Nota**: in Demo Mode ogni istanza è indipendente (dati locali).
> Per sincronizzazione reale tra più PC, configurare Supabase.

### Modalità kiosk (TV)

Il display si apre automaticamente in **fullscreen/kiosk mode**:
- **ESC** → esce dal fullscreen
- **F11** → toggle fullscreen
- Audio e annuncio vocale attivi dopo click su "Attiva Display"

## PIN Operatore

PIN predefinito: `1234` — modificabile nel database Supabase.

## GDPR

Nessun dato personale viene raccolto. I ticket sono anonimi (solo numero + timestamp).

## Licenza

Proprietario — tutti i diritti riservati.
