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

- **Astro**, output completamente statico. I dati dei quadri orari stanno in content collections
  validate da schema, non nei template.
- **Ore mostrate come settimanali**, con il monte ore annuo visibile a richiesta.
- **Pubblicazione:** GitHub Pages (`https://iismaxwell.github.io/quadri-orari/`) e deploy
  automatico, tramite GitHub Action, verso `www.jcmaxwell.it/quadri-orari/`. Le credenziali
  dell'hosting stanno nei secrets dell'organizzazione `iismaxwell`, mai nel repo.

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

| Allegato | Contenuto |
|---|---|
| B | Area di istruzione generale nazionale, uguale per tutti gli indirizzi |
| C-4 | Chimica, materiali e biotecnologie: area di indirizzo flessibile |
| C-8 | Informatica e telecomunicazioni: area di indirizzo flessibile |
| C-9 | Meccanica, meccatronica ed energia: area di indirizzo flessibile |
| A-4, A-8, A-9 | Profilo e risultati di apprendimento (solo fonte) |

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

## Delibere della scuola

Qui sta lo stato di ciò che la scuola ha deciso, finché i dati non vivono nelle content collection.
Quando ci saranno, questa sezione dirà solo quali classi sono deliberate e dove stanno i dati.

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
  tra parentesi. Per esempio, le ore di una disciplina come segmenti, con quelle in compresenza
  distinte visivamente e spiegate in legenda. Un lettore deve capire subito che sono comprese
  nelle ore, non aggiunte.
- **Informazioni su richiesta**, nascoste finché l'utente non le apre:
  - la ripartizione di *Scienze sperimentali* tra Scienze della Terra, Biologia, Chimica e Fisica,
    con le ore di ciascuna dove la scuola le ha deliberate;
  - il monte ore annuo al posto delle ore settimanali;
  - le note dei decreti, come quella su *Complementi di matematica*.
- Le classi non ancora deliberate mostrano la quota a disposizione come **da definire**, in modo
  chiaramente distinto dalle ore assegnate.
- **Filtro per periodo:** controlli "biennio" / "triennio" / "tutti e 5 gli anni". Servono in
  modalità proiezione e sono utili anche su smartphone, dove biennio o triennio riducono le
  colonne.
- **Identità visiva:** quella della brochure. Ogni indirizzo ha la sua icona, già usata dalla
  scuola, in `src/assets/icone-indirizzi/` (convenzioni nel README della cartella).
- Il brief completo per chi progetta la grafica, con i dati di esempio, è
  `docs/brief-design.md`. Se cambiano i requisiti qui sopra, va aggiornato anche il brief.

### Modalità proiezione

Dalla scheda di ogni indirizzo, un pulsante apre il quadro orario **a tutto schermo come una
slide**. Si usa durante gli open day, proiettato sui televisori delle aule per i genitori.

- Pensata per un televisore 16:9 guardato da qualche metro: testo grande, nessuno scorrimento.
  Il quadro deve stare tutto in una schermata anche con 5 anni visibili.
- Controlli a schermo per biennio / triennio / tutti. Da tastiera si usano le frecce e i tasti
  pagina, così funzionano anche i telecomandi per presentazioni. I controlli si nascondono quando
  non servono.
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
