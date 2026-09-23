# Brief di design — mini-sito "Nuovi istituti tecnici" dell'IIS J.C. Maxwell

## 1. Contesto

L'IIS "J.C. Maxwell" ha una nuova brochure di orientamento. Un QR code sulla brochure porta a
questo mini-sito, che spiega la **riforma degli istituti tecnici** e mostra i **quadri orari**
delle articolazioni che la scuola offre.

La brochure riporta il quadro orario ministeriale "generico", in cui alcune ore sono lasciate
alla scuola ("quota a disposizione"). Il sito mostra invece come la scuola ha usato quelle ore.
Il nuovo ordinamento parte nel 2026/27 e la scuola delibera un anno alla volta: oggi sono decise
solo le **classi prime**, le altre si aggiungeranno negli anni. Il design deve reggere questa
crescita senza essere rifatto.

**Pubblico:** famiglie e ragazzi di terza media che scelgono la scuola superiore, più docenti e
personale in orientamento. Non conoscono il linguaggio dei decreti ministeriali.

**Dispositivo:** si arriva dal QR code, quindi **quasi sempre da smartphone**. Si progetta prima
per uno schermo di circa 375 px e per il tocco, poi si adatta al desktop. Nessuna informazione
deve essere raggiungibile solo con l'hover.

## 2. Identità visiva

Il sito deve sembrare la continuazione della brochure. Materiali allegati:

- la **brochure** (PDF o immagini): da qui colori, tipografia e tono;
- le **icone degli indirizzi** (SVG), una per indirizzo, già usate nella comunicazione della
  scuola: vanno usate così come sono, al massimo ricolorate;
- il **logo** della scuola.

Il tono è istituzionale ma accogliente: deve parlare a un ragazzo di 13 anni e ai suoi genitori,
non a un ispettore ministeriale.

## 3. Pagine

1. **Home.** Cosa cambia con la riforma, in poche frasi e senza burocratese, e la scelta
   dell'articolazione tramite le icone.
2. **Pagina di articolazione**, una per ciascuna: Informatica, Telecomunicazioni, Biotecnologie
   ambientali, Energia. Contiene il quadro orario (sezione 4) e poco altro.
3. **La riforma in breve.** Area generale e area di indirizzo, quota a disposizione della scuola,
   compresenze.
4. **Documenti.** Download dei decreti ministeriali in PDF.
5. **FAQ e contatti per l'orientamento.** Contenuti da definire; serve un layout per domande con
   risposta espandibile e un blocco contatti.

## 4. Il componente centrale: il quadro orario

È la parte su cui chiedo più proposte, perché deve restare semplice pur avendo molti livelli di
informazione.

### Cosa si vede subito

- Righe = discipline, divise in **area generale** e **area di indirizzo**. Colonne = anni dalla
  1ª alla 5ª.
- Valori in **ore settimanali**, con il totale per anno (32 / 32 / 32 / 32 / 30).
- Nient'altro che appesantisca la lettura.

### Compresenze: dentro la tabella, ma eleganti

Alcune ore di laboratorio si fanno con due docenti insieme (compresenza). Queste ore sono **già
comprese** nel totale della disciplina, non si aggiungono. Vanno mostrate nella tabella, ma non
come un numero tra parentesi. Un'idea di partenza, da superare se ne trovi di migliori: le ore
di una disciplina come segmenti o pallini, con quelle in compresenza distinte e spiegate in
legenda. Chi guarda deve capire che le compresenze stanno dentro le ore, non sopra.

### Informazioni su richiesta

Nascoste finché l'utente non le apre con un tocco:

- **Scienze sperimentali** è una disciplina unica che comprende Scienze della Terra, Biologia,
  Chimica e Fisica. La scuola ha deciso le ore di ciascuna, e aprendo la riga si vede questa
  ripartizione come una piccola tabella o una barra.
- **Monte ore annuo** al posto delle ore settimanali: un interruttore, dove 1 ora settimanale =
  33 ore annue.
- **Note dei decreti** sulle singole discipline (es. Complementi di matematica).

### Anni non ancora deliberati

Dalla 2ª alla 5ª le discipline del decreto hanno già le loro ore, ma la **quota a disposizione
della scuola** non è ancora assegnata. Va mostrata come **"da definire"**, in modo chiaramente
diverso dalle ore assegnate: non deve sembrare un errore né un dato mancante.

### Da valutare: le ore scelte dalla scuola

Nelle prime, le 2 ore a disposizione sono andate a Scienze sperimentali (da 4 a 6 ore). Si può
evidenziare con discrezione quali ore sono una scelta della scuola rispetto al quadro
ministeriale, perché per le famiglie è un messaggio forte ("potenziamo le scienze"). Proponilo
solo se non complica la tabella.

### Schermo stretto

Cinque colonne di anni con nomi di disciplina lunghi (es. "Elementi di elettrotecnica ed
elettronica per la meccatronica") non entrano in 375 px. Servono proposte esplicite: selettore
dell'anno con tabella a colonna singola, prima colonna fissa con scorrimento orizzontale, schede
per disciplina o altro. Se una soluzione mostra un anno alla volta, di default si apre la 1ª,
l'unico anno deliberato.

## 5. Vincoli tecnici

- Sito **statico** generato con Astro. Il JavaScript serve al massimo per interruttori e
  aperture; meglio se queste funzionano anche con elementi nativi (`<details>`).
- **Accessibilità:** contrasto AA, la tabella resta una tabella vera per i lettori di schermo,
  nessuna informazione affidata solo al colore (vale anche per le compresenze).
- Colori, font e spaziature forniti come **design token** (variabili CSS), così si applicano al
  codice senza reinterpretazioni.

## 6. Cosa chiedo

1. **Due o tre proposte del quadro orario**, ciascuna su smartphone e desktop, con i dati della
   sezione 7. Ogni proposta deve mostrare: compresenze, Scienze sperimentali aperta e chiusa, anni
   "da definire", interruttore settimanali/annue.
2. Dopo la scelta, **home e pagina di articolazione** nella direzione scelta.
3. I **design token** della direzione scelta.

## 7. Dati per le proposte

Ore **settimanali**, dai decreti ministeriali e dalle delibere della scuola. I numeri sono reali
salvo dove indicato **ESEMPIO FITTIZIO**. Sono dati per il design, non la fonte del sito.

### Area generale, uguale per tutte le articolazioni

| Disciplina | 1ª | 2ª | 3ª | 4ª | 5ª |
|---|---|---|---|---|---|
| Lingua italiana | 4 | 4 | 4 | 4 | 3 |
| Lingua inglese | 3 | 3 | 3 | 3 | 3 |
| Matematica | 4 | 4 | 3 | 3 | 3 |
| Storia | 2 | 2 | 2 | 2 | 2 |
| Geografia | 1 | | | | |
| Diritto ed economia | 2 | 2 | | | |
| Scienze motorie | 2 | 2 | 2 | 2 | 2 |
| Religione cattolica o attività alternative | 1 | 1 | 1 | 1 | 1 |
| **Totale area generale** | **19** | **18** | **15** | **15** | **14** |

### Area di indirizzo — Informatica

| Disciplina | 1ª | 2ª | 3ª | 4ª | 5ª |
|---|---|---|---|---|---|
| Scienze sperimentali | **6** (4 + 2 della scuola) | 5 | | | |
| Tecnologie e tecniche di rappresentazione grafica | 3 | 3 | | | |
| Informatica e reti di comunicazione | 4 | 4 | | | |
| Sistemi e reti | | | 3 | 3 | 2 |
| Tecnologie e progettazione di sistemi informatici e di telecomunicazioni | | | 2 | 2 | 2 |
| Informatica | | | 6 | 6 | 5 |
| Telecomunicazioni | | | 2 | 2 | |
| Complementi di matematica | | | 1 | 1 | |
| Quota a disposizione della scuola | — (assegnata) | 2 da definire | 3 da definire | 3 da definire | 7 da definire |
| **Totale area di indirizzo** | **13** | **14** | **17** | **17** | **16** |
| di cui in compresenza (totale da decreto) | 5 | 5 | 8 | 9 | 9 |

**Telecomunicazioni** ha la stessa tabella, con Telecomunicazioni a 6 / 6 / 5 e Informatica a
2 / 2 nel triennio. Le prime delle due articolazioni sono identiche.

### Area di indirizzo — Biotecnologie ambientali

| Disciplina | 1ª | 2ª | 3ª | 4ª | 5ª |
|---|---|---|---|---|---|
| Scienze sperimentali | **6** (4 + 2 della scuola) | 5 | | | |
| Tecnologie dell'informazione e della comunicazione | 2 | | | | |
| Tecnologie e tecniche di rappresentazione grafica | 2 | 2 | | | |
| Chimica applicata | 3 | 5 | | | |
| Chimica organica e biochimica | | | 4 | 4 | 2 |
| Chimica analitica e strumentale | | | 4 | 4 | 2 |
| Biologia, microbiologia, tecnologie di controllo ambientale | | | 4 | 4 | 3 |
| Fisica ambientale | | | 2 | 2 | 2 |
| Quota a disposizione della scuola | — (assegnata) | 2 da definire | 3 da definire | 3 da definire | 7 da definire |
| **Totale area di indirizzo** | **13** | **14** | **17** | **17** | **16** |

### Area di indirizzo — Energia

| Disciplina | 1ª | 2ª | 3ª | 4ª | 5ª |
|---|---|---|---|---|---|
| Scienze sperimentali | **6** (4 + 2 della scuola) | 5 | | | |
| Tecnologie dell'informazione e della comunicazione | 3 | | | | |
| Tecnologie e tecniche di rappresentazione grafica | | 3 | | | |
| Fondamenti di meccanica ed elementi di disegno | 2 | 2 | | | |
| Elementi di elettrotecnica ed elettronica per la meccatronica | | 2 | | | |
| Tecnologie dei materiali | 2 | | | | |
| Impianti, macchine e sistemi automatici per l'energia | | | 6 | 6 | 5 |
| Gestione dei progetti, disegno e manutenzione di impianti | | | 4 | 4 | 4 |
| Meccanica applicata alle macchine | | | 2 | 2 | |
| Tecnologie dei materiali e tecniche di produzione | | | 2 | 2 | |
| Quota a disposizione della scuola | — (assegnata) | 2 da definire | 3 da definire | 3 da definire | 7 da definire |
| **Totale area di indirizzo** | **13** | **14** | **17** | **17** | **16** |

### ESEMPIO FITTIZIO — compresenze e Scienze sperimentali nelle prime

I numeri reali non sono ancora disponibili. Per le proposte usa questi, che rispettano i totali
ma **non sono la delibera della scuola**:

- Compresenze nella 1ª di Informatica (5 in tutto): Scienze sperimentali 2 su 6, Tecnologie e
  tecniche di rappresentazione grafica 1 su 3, Informatica e reti di comunicazione 2 su 4.
- Ripartizione di Scienze sperimentali in 1ª (6 in tutto): Fisica 2, Chimica 2, Biologia 1,
  Scienze della Terra 1.
