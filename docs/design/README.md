# Design scelto: "proposta unificata" del quadro orario

Proposta preparata con Claude Design a partire da `../brief-design.md` e scelta per il sito.
Copre solo il **quadro orario** e la **scheda di indirizzo**, su smartphone e desktop. Home,
pagine di contenuto e modalità proiezione non hanno ancora un design: si costruiscono con gli
stessi token.

| File | Cosa contiene |
|---|---|
| `quadro-orario-proposta-unificata.dc.html` | La proposta, copiata così com'è dal progetto di Claude Design. Si apre nel browser insieme a `support.js` (il runtime di Claude Design, non codice del sito). |
| `assets/` | Logo e icona usati dalla proposta, copiati da `src/assets/`. |

I dati nella proposta sono quelli di esempio del brief, compresi quelli **fittizi** (compresenze e
ripartizione di Scienze sperimentali): non vanno presi come fonte.

## Come è stato tradotto nel sito

- **Design token:** `src/styles/token.css`. Colori, font, spazi e l'accento per indirizzo
  (`data-accento` con lo slug dell'icona).
- **Font:** Instrument Sans (testo), Newsreader (titoli e numeri), DM Mono (ore della
  ripartizione), tutti ospitati dal sito tramite i pacchetti Fontsource, senza Google Fonts.
- **Componente:** `src/components/QuadroOrario.astro`, con i dati preparati da `src/dati/vista.ts`.
  È una `<table>` vera, non una griglia di `div` come nel prototipo.

## Scelte del design, confermate

- Le **barrette** delle ore (ora singola, compresenza, scelta della scuola, quota da definire)
  stanno dietro l'interruttore **"Dettaglio ore"**, spento di default, con la legenda che compare
  insieme. A colpo d'occhio si vedono solo i numeri.
- Il filtro si chiama **Biennio / Triennio / Quinquennio**, con Quinquennio come default.
- Su smartphone la prima colonna resta ferma e la tabella scorre di lato; sotto compare
  "Scorri di lato per vedere tutti gli anni" solo quando le colonne sono cinque.
- Nell'area di indirizzo una cella senza ore è "non attiva"; nell'area generale è un punto.
- La riga "Quota a disposizione della scuola" mostra la quota "assegnata ↑" dove è deliberata e
  le ore in corsivo dove è da definire.

## Differenze rispetto al prototipo

- **Contrasto AA.** Il prototipo usava il colore d'accento anche per link e numeri. Per
  Telecomunicazioni l'arancio è stato scurito da `oklch(0.62 0.19 45)` a `oklch(0.57 0.18 45)`.
  Per Energia il giallo resta su icona e pillola del filtro, mentre testo, bordi e barrette usano
  l'ocra del prototipo (`--accento-forte`). Il testo "non attiva" usa il grigio `--tenue` invece
  del grigio chiaro, che era a 1,9:1.
- **Dati mancanti.** "Vedi le 4 materie" e le barrette di compresenza compaiono solo quando i
  dati sono nei file dei percorsi: fino ad allora non si mostra nulla al loro posto.
- **Aperture per riga.** Nel prototipo "Nota" e "Vedi le materie" aprivano tutto insieme; nel
  sito ogni riga si apre per conto suo. La nota del decreto su Scienze sperimentali ha il suo
  pulsante "Nota" come le altre.
- **"A tutto schermo".** Il prototipo non lo prevedeva. È un link sotto il nome dell'indirizzo,
  visibile da 960 px in su (serve sui PC e sui televisori delle aule, non sullo smartphone).
- **Menu del sito.** Le voci dell'header del prototipo (Indirizzi, La riforma in breve,
  Documenti, FAQ e contatti) sono arrivate con le pagine a cui puntano (F6).
- **`--accento-forte` per ogni indirizzo.** La prima trascrizione in `token.css` lo dichiarava
  come `var(--accento)` solo su `:root`; un custom property ereditato porta con sé il valore già
  risolto dove è stato dichiarato, quindi restava bloccato sul blu di `:root` per tutti gli
  indirizzi che non lo ridichiaravano (tutti tranne Energia, che ha un valore suo). Corretto in F6
  ridichiarandolo in ogni blocco `[data-accento=…]` (vedi il commento in `token.css`).
- L'indirizzo `quadri.jcmaxwell.edu.it` nella barra del browser del prototipo è solo
  un'illustrazione: il sito resta in `/quadri-orari/`.
