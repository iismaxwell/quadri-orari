# Favicon

Set standard generato da un tool online (favicon.io) a partire da `../loghi/logo-badge.png`:
`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
`android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest`. Nomi di file
lasciati come generati: sono convenzioni riconosciute dai browser, non vanno cambiati.

`site.webmanifest`: `name` e `short_name` sono già compilati. **Da rivedere in F6**, quando si
integrano questi file nel sito: i percorsi delle icone sono assoluti (`/android-chrome-*.png`) e
non tengono conto di `base: '/quadri-orari/'`; `theme_color` e `background_color` sono ancora i
default del generatore (bianco), da allineare ai design token scelti in F5.
