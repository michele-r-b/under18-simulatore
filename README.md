# 🏐 Simulatore Fasi Finali Under 18 Femminile - FIPAV Bergamo

WebApp per simulare le fasi finali del campionato Under 18 Femminile FIPAV Bergamo 2025/2026.

## 📋 Funzionalità

### 1. **Recupero Dati**
- Caricamento automatico delle classifiche dai 4 gironi (A, B, C, D)
- Connessione API con sistema MatchShare FIPAV Bergamo
- Supporto per endpoint multipli (ranks2 e fm_classifica)

### 2. **Modifica e Simulazione**
- Modifica manuale dei dati di classifica per ogni squadra:
  - **PuntiCampionato**: Punti
  - **GareGiocate**: Partite giocate
  - **GareVinte**: Partite vinte
  - **GarePerse**: Partite perse
  - **SetVinti**: Set vinti
  - **SetPersi**: Set persi
  - **QuozienteSet**: Quoziente set (calcolato automaticamente)
  - **PuntiFatti**: Punti fatti
  - **PuntiSubiti**: Punti subiti
  - **QuozientePunti**: Quoziente punti (calcolato automaticamente)
- Visualizzazione evidenziata delle prime 2 squadre per girone (qualificate)

### 3. **Classifica Avulsa e Tabellone**
- Calcolo automatico della classifica avulsa secondo i criteri:
  1. Punti
  2. Quoziente set
  3. Quoziente punti
  4. Differenza punti
  5. Ordine alfabetico
- Generazione tabellone playoff con:
  - **Quarti di Finale** (7-8 marzo 2026): accoppiamenti 1°-8°, 2°-7°, 3°-6°, 4°-5° della C.A.
  - **Semifinali** (14-15 marzo 2026): vincente QF1 vs QF4, vincente QF2 vs QF3
  - **Finale 1°-2° posto** (22 marzo 2026)
  - **Finale 3°-4° posto** (21-22 marzo 2026)
- Rilevamento automatico conflitti (squadre stesso girone ai quarti)

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js (versione 20.19.0 o superiore)
- npm o yarn

### Installazione
```bash
# Clona o scarica il progetto
cd under18-simulator

# Installa le dipendenze
npm install
```

### Avvio in Sviluppo
```bash
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:5173`

### Build di Produzione
```bash
npm run build
```
I file pronti per il deploy saranno nella cartella `dist/`

### Anteprima Build
```bash
npm run preview
```

## 🔧 Configurazione

### Proxy API
Il file `vite.config.ts` include un proxy per bypassare eventuali problemi CORS:

```typescript
server: {
  proxy: {
    '/matchshare': {
      target: 'https://srv6.matchshare.it',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/matchshare/, ''),
    },
  },
}
```

### Endpoint API
L'app prova automaticamente due endpoint per ogni girone:
1. `/matchshare/stats_test/rest_api/ranks2?client_name=fipavbergamo&season_id={sid}`
2. `/matchshare/stats_test/rest_api/fm_classifica?sid={sid}&client_name=fipavbergamo`

I SID (Season ID) dei gironi:
- Girone A: 315
- Girone B: 316
- Girone C: 317
- Girone D: 318

## 📱 Utilizzo

### Passo 1: Caricamento Dati
1. Clicca su "📥 Carica Classifiche"
2. Attendi il caricamento dei dati da tutti e 4 i gironi
3. Verifica il messaggio di conferma

### Passo 2: Modifica Dati
1. Modifica i valori nelle tabelle per simulare diversi scenari
2. I quozienti QuozienteSet e QuozientePunti vengono ricalcolati automaticamente
3. Le prime 2 squadre di ogni girone sono evidenziate in verde

### Passo 3: Genera Tabellone
1. Clicca su "🔄 Calcola Classifica Avulsa e Tabellone"
2. Visualizza la classifica avulsa delle 8 squadre qualificate
3. Consulta il tabellone playoff completo
4. Verifica eventuali conflitti (squadre stesso girone ai quarti)

## 🎨 Design

- **Interfaccia moderna** con gradiente viola
- **Responsive design** per desktop, tablet e mobile
- **Codifica colori** per i gironi (A=blu, B=viola, C=verde, D=arancione)
- **Evidenziazione** squadre qualificate
- **Animazioni fluide** per transizioni

## 📊 Regolamento Implementato

### Prima Fase
- 34 squadre in 4 gironi (A-B con 9 squadre, C-D con 8 squadre)
- Gare di andata e ritorno

### Fasi Finali
- Accedono le prime 2 squadre di ogni girone
- **Quarti**: accoppiamenti secondo classifica avulsa, evitando squadre dello stesso girone
- **Semifinali**: incrocio QF1-QF4 e QF2-QF3
- **Finali**: 1°-2° posto e 3°-4° posto
- Finale 3°-4° in casa della meglio classificata in C.A.

## 🛠️ Tecnologie

- **React 19** con TypeScript
- **Vite 7** per build veloce
- **CSS3** con animazioni e gradients
- **Fetch API** per comunicazione con backend

## 📝 Note Tecniche

### Gestione Errori
- Tentativo automatico su endpoint multipli
- Messaggi di errore chiari e informativi
- Logging dettagliato nella console

### Calcoli
- Quozienti calcolati con 3 decimali di precisione
- Gestione divisione per zero nei quozienti
- Ordinamento multi-criterio per classifica

### Performance
- Ottimizzazione rendering con React
- Sticky headers nelle tabelle
- Responsive grid per match cards

## 🐛 Troubleshooting

### Problema: Errore nel caricamento dati
**Soluzione**: Verifica la connessione internet e che l'API MatchShare sia raggiungibile

### Problema: Dati non aggiornati
**Soluzione**: Ricarica la pagina e clicca nuovamente su "Carica Classifiche"

### Problema: Conflitti nei quarti
**Soluzione**: Questo è normale se due squadre dello stesso girone sono nelle prime 8 posizioni. Il sistema segnala il conflitto per permettere aggiustamenti manuali

## 📄 Licenza

Progetto realizzato per FIPAV Bergamo - Campionato Under 18 Femminile 2025/2026

## 🤝 Contributi

Per segnalazioni, richieste o miglioramenti, contatta l'amministrazione FIPAV Bergamo.

---

**Versione**: 1.0.0  
**Ultimo Aggiornamento**: Novembre 2024
