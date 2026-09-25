# AGENTS.md

Guida al progetto per chi ci lavora (persone o agenti di coding: Codex, Claude Code, altri).

## Cos'è questo progetto

Mini-sito statico sulla **riforma degli istituti tecnici** per l'IIS "J.C. Maxwell". Ci si arriva
dal QR code della brochure della scuola. La brochure riporta il quadro orario "generico"
ministeriale, con la quota oraria a disposizione della scuola non assegnata. Il sito mostra invece,
per ogni articolazione offerta, **il quadro orario con le scelte già deliberate dalla scuola**.

Il nuovo ordinamento parte con le classi prime del **2026/27**. Le delibere arrivano un anno alla
volta: al momento della prima stesura era deciso solo il quadro delle prime. Aggiornare i dati
man mano che si deliberano le classi successive è l'operazione più frequente in questo repo.

Contenuti: spiegazione della riforma, quadri orari per articolazione, download dei PDF
ministeriali, FAQ e contatti per l'orientamento. I profili in uscita (allegati A-x) **non** si
pubblicano come contenuto: servono solo come fonte.

**Ambito:** la scuola ha sei indirizzi, quattro tecnici e due licei (Liceo scientifico opzione
Scienze applicate e Liceo delle scienze umane opzione Economico-sociale). La riforma riguarda
solo i tecnici, e il sito nasce per loro. Come **ultima fase** si aggiungono anche i quadri orari
dei licei, così il sito diventa lo strumento di orientamento per tutta la scuola. I licei non
hanno area di indirizzo flessibile né quota a disposizione: il modello dei dati deve prevedere un
percorso senza quelle parti fin dall'inizio, senza doverlo rifare.

## Stack e pubblicazione

- **Astro 7**, output completamente statico, TypeScript strict. I dati dei quadri orari stanno in
  content collections validate da schema, non nei template (vedi "Dati dei quadri orari").
- Node ≥ 22.12. **TypeScript resta alla 6** finché `@astrojs/check` non supporta la 7; **Vitest
  resta alla 4** perché la 5 non supporta le versioni dispari di Node (25).
- `site` si imposta con la variabile d'ambiente `SITE_URL` (predefinito
  `https://iismaxwell.github.io`); `base` è fisso.
- **Ore mostrate come settimanali**, con il monte ore annuo visibile a richiesta.
- **Font ospitati dal sito** (pacchetti Fontsource), niente Google Fonts né altre CDN.
- **Pubblicazione:** GitHub Pages (`https://iismaxwell.github.io/quadri-orari/`) e deploy
  automatico, tramite GitHub Action, verso `www.jcmaxwell.it/quadri-orari/`. Le credenziali
  dell'hosting stanno nei secrets dell'organizzazione `iismaxwell`, mai nel repo.

## Comandi

```bash
npm ci                  # installa le dipendenze
npm run verifica-dati   # controlla i dati dei quadri orari; stampa una riga per percorso
npm test                # test unitari (Vitest): tests/**/*.test.ts
npx astro check         # controllo dei tipi
npm run build           # esegue prima verifica-dati, poi genera dist/
npm run dev             # server di sviluppo
npx playwright test     # test end-to-end (tests/e2e/*.spec.ts) sul dist/ già costruito
SITE_URL=https://www.jcmaxwell.it npm run build   # build per jcmaxwell.it
```

I test end-to-end usano il suffisso `.spec.ts`, che Vitest ignora, e girano su `astro preview`
(porta 4322, avviato da Playwright). La prima volta serve `npx playwright install chromium`. La CI
li esegue dopo la build.

## Vincoli che non si vedono dal codice

- **`/quadri-orari/` è stampato nel QR code della brochure.** Non si cambia. In Astro il `base`
  è `/quadri-orari/` sia su GitHub Pages sia su jcmaxwell.it; tra i due ambienti cambia solo
  `site`. Nessun link interno deve essere assoluto rispetto alla radice del dominio.
- Il sito sta su `jcmaxwell.it`, il dominio **secondario** della scuola, dove si possono creare
  sotto-cartelle. Il sito principale `jcmaxwell.edu.it` ha un tema bloccato e non c'entra.
- L'output di build deve funzionare come file statici caricati in una sotto-cartella di un hosting
  condiviso: niente SSR, niente adapter, niente dipendenze da funzioni lato server.

## Dominio: come si leggono i quadri orari

Fonti in `originali/`. Sono decreti firmati digitalmente dal Ministero: sono la verità di
riferimento e si pubblicano come download così come sono. Solo il nome del file può cambiare
(meglio senza spazi).

| Documento | Contenuto |
|---|---|
| DM 29 del 19 febbraio 2026 | Decreto che ridefinisce indirizzi, articolazioni, quadri orari e risultati di apprendimento degli istituti tecnici; gli allegati B, A-4, A-8, A-9 (sotto) e C-4/C-8/C-9 ne fanno parte. Si applica alle classi prime dall'a.s. 2026/2027 (art. 9, comma 1): chi è già iscritto prosegue col percorso iniziato. |
| Allegato B | Area di istruzione generale nazionale, uguale per tutti gli indirizzi |
| Allegato C-4 | Chimica, materiali e biotecnologie: area di indirizzo flessibile |
| Allegato C-8 | Informatica e telecomunicazioni: area di indirizzo flessibile |
| Allegato C-9 | Meccanica, meccatronica ed energia: area di indirizzo flessibile |
| Allegati A-4, A-8, A-9 | Profilo e risultati di apprendimento (solo fonte) |

**Articolazioni offerte dalla scuola**, le uniche da pubblicare: *Informatica* e
*Telecomunicazioni* (C-8), *Biotecnologie ambientali* (C-4), *Energia* (C-9). Gli allegati
contengono anche articolazioni che la scuola non offre (Chimica e materiali, Biotecnologie
sanitarie, Meccanica e meccatronica): vanno ignorate.

Regole utili, tutte verificabili sui PDF:

- Il quadro di una classe è **area generale (All. B) + area di indirizzo flessibile (All. C-x)**.
- Le ore nei decreti sono **annue**; le settimanali si ottengono dividendo per **33**. Si
  memorizzano le annue, come nei decreti, così ogni numero resta confrontabile con il PDF; le
  settimanali si calcolano.
- Totali annui, uguali per ogni articolazione: 1056 / 1056 / 1056 / 1056 / 990, cioè 32 / 32 /
  32 / 32 / 30 ore settimanali. Area generale: 627 / 594 / 495 / 495 / 462. Area di indirizzo:
  429 / 462 / 561 / 561 / 528.
- Ogni allegato C riporta una riga **"Quota del curricolo a disposizione della scuola"** (66 / 66 /
  99 / 99 / 231 ore annue). Sono le "ore libere" della brochure: le scelte della scuola consistono
  nell'assegnarle alle discipline. Una classe non ancora deliberata va mostrata con quella quota
  **da definire**, non con numeri ipotetici.
- Le articolazioni dello stesso indirizzo hanno lo **stesso primo biennio**: il quadro delle prime
  di Informatica e di Telecomunicazioni coincide. Si separano dal terzo anno.
- **"Di cui in compresenza"** è un sottoinsieme delle ore di indirizzo (ore con l'insegnante
  tecnico-pratico), non ore in più: non va sommato ai totali.
- Oltre al monte ore per anno, i decreti danno un **monte ore d'ambito** per primo biennio,
  secondo biennio e quinto anno. I dati del sito devono rispettare sia i totali annui sia quelli
  d'ambito. Non è ancora chiarito se la scuola possa spostare ore tra discipline o tra anni
  dentro lo stesso ambito: se una delibera si discosta dal decreto per una singola disciplina,
  chiedi a chi mantiene il progetto invece di "correggere" il dato.
- Note fisse da riportare: *Scienze sperimentali* è una disciplina unica che comprende Scienze
  della Terra, Biologia, Chimica e Fisica. *Complementi di matematica* (solo C-8) è affidata al
  docente di Matematica e ha una valutazione unica con Matematica.

Per rileggere un PDF: `pdftotext -layout "originali/<file>.pdf" -` (pacchetto poppler).

## Dati dei quadri orari

Quello che dice il decreto e quello che decide la scuola stanno in file separati. Tutte le ore sono
**annue**, come nei decreti: 1 ora settimanale = 33 ore annue.

| Dove | Cosa |
|---|---|
| `src/content/ordinamenti/*.yaml` | Trascrizione di una tabella di un decreto. `area: generale` (All. B, una sola per tutti i tecnici), `indirizzo` (All. C-x, una per articolazione) o `liceo`. Le delibere non la toccano. |
| `src/content/percorsi/*.yaml` | Un file per ogni indirizzo mostrato sul sito, con le sole scelte della scuola. Lo slug è il nome del file. |
| `src/dati/schema.ts` | Forma dei dati (Zod). La usano `src/content.config.ts`, lo script e i test. |
| `src/dati/verifiche.ts` | Le invarianti: funzioni pure che restituiscono l'elenco degli errori. |
| `src/dati/quadro.ts` | `componiQuadro`: il quadro completo di un percorso per l'interfaccia, in sola lettura. |
| `src/dati/astro.ts` | `getQuadro(slug)` e `getPercorsi()` per le pagine. Verificano i dati prima di restituirli. |
| `src/dati/carica.ts` | Lettura dei file YAML da Node, per lo script e i test. |
| `scripts/verifica-dati.ts` | Lo script di `npm run verifica-dati`. |
| `tests/dati/` | Test delle invarianti, con un caso negativo per ciascuna. |

**Ordinamenti.** Le ore di ogni disciplina sono un elenco di cinque numeri, dalla 1ª alla 5ª come
le colonne del PDF; 0 vale "cella vuota". Si ricopiano dal PDF anche le righe di totale, quota a
disposizione e compresenza, e i monte ore d'ambito: sono una partita doppia, e la verifica si
accorge se un numero ricopiato male non torna con i totali. Le note riportano il testo integrale
del decreto. Una disciplina presente in più allegati usa sempre lo stesso id (per esempio
`scienze-sperimentali`).

**Percorsi tecnici.** Richiamano `areaGenerale` e `areaIndirizzo` e hanno un blocco per ognuna
delle cinque classi:

```yaml
anni:
  1:
    stato: deliberato              # oppure da-definire
    quota: { scienze-sperimentali: 66 }                       # ore della quota a disposizione
    compresenze: { scienze-sperimentali: 66, … }              # facoltativo
    ripartizioni:                                             # facoltativo
      scienze-sperimentali: [{ nome: Fisica, ore: 66 }, …]
```

**Percorsi dei licei.** Richiamano un solo ordinamento (`quadro`), senza ambiti, quota a
disposizione, compresenze né stato di delibera. Per ogni classe possono avere un `potenziamento`
(ore che la scuola aggiunge a discipline dell'ordinamento, alzando il totale della classe) e
delle `ripartizioni`. Lo schema non prevede ancora ore spostate tra discipline con la quota di
autonomia, né discipline che non sono nell'ordinamento: se la scuola ne usa, lo schema va esteso.

**Regole decise per i dati**, verificate alla build:
- una classe `deliberato` ha tutta la quota a disposizione assegnata; una classe `da-definire` non
  ne ha nessuna ora;
- la quota va solo a discipline dell'area di indirizzo;
- le compresenze riguardano solo l'area di indirizzo. Per ogni classe si inseriscono tutte
  insieme, e la loro somma è il totale "di cui in compresenza" del decreto. Per ogni disciplina
  non superano le sue ore, quota compresa;
- ogni parte di una ripartizione è un numero intero di ore settimanali, e la somma delle parti
  è pari alle ore della disciplina, quota compresa;
- le articolazioni dello stesso indirizzo hanno lo stesso primo biennio, decreto e delibere.

**Per registrare una delibera** si modifica solo il file del percorso: `stato: deliberato` e le
ore assegnate, convertite in annue. Poi `npm run verifica-dati`, e si aggiorna la sezione qui
sotto.

## Pagine di contenuto

Testi del sito che non sono quadri orari (riforma in breve, FAQ, contatti…) stanno nella content
collection `pagine`, un file Markdown per pagina in `src/content/pagine/`, schema in
`content.config.ts`: `titolo`, `descrizione`, `ordine` e `bozza` (booleano). Una pagina resta
`bozza: true` finché Marco non ne ha rivisto il testo. Ogni affermazione sulla riforma deve venire
dai decreti in `originali/`; quello che non si può verificare così si segna nel testo come
`[DA COMPLETARE: …]`.

## Delibere della scuola

I dati deliberati stanno nei file di `src/content/percorsi/`. Qui si tiene il riepilogo di ciò che
la scuola ha deciso e di ciò che manca.

- **Nei dati:** tutte e quattro le articolazioni offerte (Informatica, Telecomunicazioni,
  Biotecnologie ambientali, Energia).
- **Classi prime (2026/27), tutte le articolazioni offerte:** le 2 ore settimanali della quota a
  disposizione (66 annue) vanno tutte a **Scienze sperimentali**, che passa da 4 a 6 ore
  settimanali (da 132 a 198 annue).
- **Ripartizione interna di Scienze sperimentali nelle prime:** deliberata (ore di Scienze della
  Terra, Biologia, Chimica e Fisica), numeri non ancora ricevuti.
- **Compresenze delle prime:** non ancora ricevute. Il decreto fissa solo il totale (165 ore annue,
  5 settimanali, per l'area di indirizzo della prima); la ripartizione tra le discipline la decide
  la scuola.
- **Classi dalla seconda alla quinta:** non deliberate.
- **Licei:** quadri orari non ancora ricevuti. Serve anche sapere se la scuola usa quote di
  autonomia o potenziamenti rispetto all'ordinamento nazionale.

Nei dati, le ore assegnate dalla quota a disposizione vanno tenute **distinte** da quelle previste
dal decreto per la disciplina, anche se in tabella si mostrano sommate. Solo così si può
verificare il monte ore d'ambito e ricostruire in ogni momento il quadro ministeriale "generico"
della brochure.

## Requisiti di presentazione dei quadri orari

Gran parte di chi visita il sito arriva scansionando il QR code della brochure, quindi **da
smartphone**. Tutto deve funzionare prima di tutto su schermo stretto e con il tocco: niente
informazioni raggiungibili solo con l'hover.

- **A colpo d'occhio, una tabella semplice:** discipline e ore settimanali per anno. Nient'altro
  che la appesantisca.
- **Le compresenze fanno parte della tabella**, ma con una resa grafica più elegante di un numero
  tra parentesi: le ore di una disciplina come barrette, una per ora settimanale, con quelle in
  compresenza, quelle scelte dalla scuola e la quota da definire distinte e spiegate in legenda.
  Un lettore deve capire subito che sono comprese nelle ore, non aggiunte. Per tenere pulita la
  tabella, barrette e legenda compaiono con l'interruttore **"Dettaglio ore"**, spento di default.
- **Informazioni su richiesta**, nascoste finché l'utente non le apre:
  - la ripartizione di *Scienze sperimentali* tra Scienze della Terra, Biologia, Chimica e Fisica,
    con le ore di ciascuna dove la scuola le ha deliberate;
  - il monte ore annuo al posto delle ore settimanali;
  - le note dei decreti, come quella su *Complementi di matematica*.

  Un dato non ancora comunicato dalla scuola (compresenze, ripartizione) non si mostra affatto:
  il pulsante "Vedi le materie" e le barrette di compresenza compaiono da soli quando il dato
  entra nel file del percorso.
- Le classi non ancora deliberate mostrano la quota a disposizione come **da definire**, in modo
  chiaramente distinto dalle ore assegnate.
- **Filtro per periodo:** controlli **Biennio / Triennio / Quinquennio** (default Quinquennio).
  Servono in modalità proiezione e sono utili anche su smartphone, dove biennio o triennio
  riducono le colonne. Il periodo scelto va nell'URL (`?periodo=biennio`).
- **Contrasto AA** per testo e controlli, anche con i colori d'accento degli indirizzi (vedi i
  commenti in `src/styles/token.css`).
- **Identità visiva:** logo e icone sono fissi, il resto (palette, tipografia) è aperto — Marco ha
  scelto di non vincolare il design alla brochure esistente, per lasciare libertà creativa a
  Claude Design. Ogni indirizzo ha la sua icona, già usata dalla scuola, in
  `src/assets/icone-indirizzi/` (convenzioni nel README della cartella). Il logo della scuola, in
  tre varianti, è in `src/assets/loghi/`; il favicon già pronto (da favicon.io) è in
  `src/assets/favicon/` — entrambi con il proprio README.
- Il brief completo per chi progetta la grafica, con i dati di esempio, è
  `docs/brief-design.md`. Se cambiano i requisiti qui sopra, va aggiornato anche il brief.
- Il **design scelto** è in `docs/design/`, con un README che elenca come è stato tradotto nel
  sito e dove se ne discosta. Per ora copre quadro orario e scheda di indirizzo.

### Dove sta l'interfaccia

| Dove | Cosa |
|---|---|
| `src/styles/token.css` | Design token: colori, font, spazi, accento per indirizzo (`data-accento`). |
| `src/styles/base.css` | Stili di base comuni a tutte le pagine. |
| `src/layouts/Base.astro` | Header con il logo, footer, font. |
| `src/components/Icona.astro` | Icona di un indirizzo, inline con `currentColor`. |
| `src/dati/vista.ts` | `vistaQuadro`: dal quadro di `componiQuadro` a ciò che la tabella mostra (celle "non attive", barrette, ripartizioni). Funzione pura, testata in `tests/dati/vista.test.ts`. |
| `src/dati/filtri.ts` | I tre periodi del filtro. Senza dipendenze, perché lo usa anche lo script del browser. |
| `src/components/QuadroOrario.astro` | La tabella, con controlli e legenda. Tutto l'HTML è generato alla build, in entrambe le unità e per tutti gli anni; `src/scripts/quadro-orario.ts` cambia solo attributi. |
| `src/pages/[slug].astro` | Scheda di indirizzo, una per percorso (`/quadri-orari/informatica/`…). |

### Modalità proiezione

Dalla scheda di ogni indirizzo, un pulsante apre il quadro orario **a tutto schermo come una
slide**. Si usa durante gli open day, proiettato sui televisori delle aule per i genitori.

- Pensata per un televisore 16:9 guardato da qualche metro: testo grande, nessuno scorrimento.
  Il quadro deve stare tutto in una schermata anche con 5 anni visibili.
- Controlli a schermo per Biennio / Triennio / Quinquennio. I televisori delle aule sono **interattivi**
  (touch), quindi i controlli devono essere grandi e comodi da toccare stando in piedi davanti
  allo schermo. Da tastiera si usano le frecce e i tasti pagina, così funzionano anche i
  telecomandi per presentazioni. I controlli si nascondono quando non servono.
- I PC delle aule sono sempre connessi: non serve una versione offline.
- Usa la Fullscreen API. Dove non c'è (Safari su iPhone non la supporta per elementi che non
  siano video), la stessa vista deve comunque occupare tutta la finestra.
- Ogni vista di proiezione ha un **URL proprio**, che si può aprire e salvare nei preferiti sul
  PC dell'aula.

## Invarianti da far verificare alla build

Un errore in un quadro orario finisce davanti alle famiglie. Lo schema dei dati o uno script di
controllo eseguito prima della build devono far fallire la build se:

- la somma delle ore di una classe non coincide con i totali qui sopra;
- le ore di un ambito sul biennio (o sul quinto anno) non coincidono con il monte ore d'ambito del
  decreto;
- un'ora della quota a disposizione risulta assegnata in una classe non ancora deliberata;
- un'ora annua non è multiplo di 33, cioè le ore settimanali non sono intere.

Le invarianti stanno in `src/dati/verifiche.ts` e girano con `npm run verifica-dati`, che `npm run
build` esegue prima di tutto. Insieme a queste si verificano anche le regole elencate in "Dati dei
quadri orari" e l'esistenza dei file richiamati (PDF in `originali/`, icone). Ogni invariante ha un
test con dati volutamente sbagliati in `tests/dati/verifiche.test.ts`. Chi aggiunge un'invariante
aggiunge anche il suo caso negativo.
