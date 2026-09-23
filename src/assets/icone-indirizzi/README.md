# Icone degli indirizzi

Icone SVG dei sei indirizzi della scuola, le stesse del linguaggio visivo della scuola e della
brochure. Un file per indirizzo o articolazione, con il suo slug come nome:

| File | Percorso | Riforma dei tecnici |
|---|---|---|
| `informatica.svg` | Tecnico, Informatica e telecomunicazioni: articolazione Informatica | sì |
| `telecomunicazioni.svg` | Tecnico, Informatica e telecomunicazioni: articolazione Telecomunicazioni | sì |
| `biotecnologie-ambientali.svg` | Tecnico, Chimica, materiali e biotecnologie: articolazione Biotecnologie ambientali | sì |
| `energia.svg` | Tecnico, Meccanica, meccatronica ed energia: articolazione Energia | sì |
| `liceo-scienze-applicate.svg` | Liceo scientifico, opzione Scienze applicate | no |
| `liceo-economico-sociale.svg` | Liceo delle scienze umane, opzione Economico-sociale | no |

Caratteristiche utili per usarle:

- Sono monocromatiche: i tracciati non hanno un colore esplicito, quindi con `fill: currentColor`
  prendono il colore del testo. Fanno eccezione `biotecnologie-ambientali.svg` e
  `liceo-economico-sociale.svg`, che hanno alcuni dettagli con `fill:white` esplicito: su fondo
  scuro vanno verificate.
- I `viewBox` hanno proporzioni diverse (da 448×512 a 627×384). Per allinearle vanno messe in un
  contenitore di dimensione fissa con `object-fit`/`preserveAspectRatio`, non ridimensionate una
  per una.
- Sono file sorgente dell'identità visiva della scuola: non si ridisegnano. Colori e dimensioni si
  gestiscono da CSS.
