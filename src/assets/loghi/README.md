# Logo della scuola

Tre varianti dello stesso logo, ricevute da Marco (file originali "Logo Maxwell 1060.png",
"Logo Maxwell esteso 800.png", "Logo Maxwell esteso white 800.png", rinominati per coerenza con
`icone-indirizzi/`):

| File | Contenuto | Uso |
|---|---|---|
| `logo-badge.png` | Solo il marchio circolare (1060×1060, sfondo trasparente) | Icona, spazi stretti |
| `logo-esteso.png` | Marchio + scritta "Istituto di Istruzione Superiore J.C. Maxwell" in grigio scuro (800×240, sfondo trasparente) | Header su sfondo chiaro |
| `logo-esteso-bianco.png` | Come sopra ma con la scritta in bianco (marchio invariato) | Header su sfondo scuro o colorato |

Colori misurati nei file (utili come riferimento, non sostituiscono i design token che arriveranno
dalla proposta scelta):
- Rosso del marchio: `#ee3335`, uguale nelle tre varianti.
- Testo della versione scura: `#231f20`.
- Testo della versione chiara: bianco, con canale alpha variabile (antialiasing).

A differenza delle icone degli indirizzi, questi PNG **non** sono pensati per `currentColor`: le
varianti chiara/scura vanno scelte in base allo sfondo, non ricolorate via CSS.

Sono raster (PNG), non vettoriali: `logo-badge.png` a 1060px basta per un favicon o un'icona
piccola, ma non va ingrandito oltre le sue dimensioni originali per un header più grande.
