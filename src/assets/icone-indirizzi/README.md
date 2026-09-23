# Icone degli indirizzi

Icone SVG degli indirizzi, le stesse del linguaggio visivo della scuola e della brochure. Si
usano nel sito accanto al nome dell'indirizzo o dell'articolazione.

Un file per indirizzo, con lo slug dell'indirizzo come nome:

| File | Indirizzo | Articolazioni pubblicate |
|---|---|---|
| `informatica-telecomunicazioni.svg` | Informatica e telecomunicazioni | Informatica, Telecomunicazioni |
| `chimica-materiali-biotecnologie.svg` | Chimica, materiali e biotecnologie | Biotecnologie ambientali |
| `meccanica-meccatronica-energia.svg` | Meccanica, meccatronica ed energia | Energia |

Se un giorno servirà un'icona per singola articolazione, avrà come nome lo slug dell'articolazione
(es. `telecomunicazioni.svg`); dove manca, si usa l'icona dell'indirizzo.

Sono file sorgente dell'identità visiva: non vanno ridisegnati né ricolorati a mano. Se il design
del sito richiede un colore diverso, lo si ottiene da CSS (`currentColor`), non modificando il file.
