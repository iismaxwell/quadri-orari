/**
 * Comportamento della pagina di proiezione (F7): filtro per periodo condiviso con il quadro
 * normale, controlli che si nascondono quando mouse e tocco sono fermi, frecce e tasti pagina per
 * cambiare periodo, schermo intero con ripiego quando la Fullscreen API non c'è (Safari su iPhone),
 * riquadro di dettaglio delle ore aggiunte dalla scuola.
 */
import { conPeriodo, filtroAdiacente, filtroDaUrl, isFiltro, type Filtro } from '../dati/filtri';

const INATTIVITA_MS = 3000;

function applicaFiltro(proiezione: HTMLElement, filtro: Filtro): void {
  proiezione.dataset.periodo = filtro;
  for (const b of proiezione.querySelectorAll<HTMLButtonElement>('[data-filtro]')) {
    b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro));
  }
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-segue-periodo]')) {
    a.href = conPeriodo(a.href, filtro);
  }
}

function cambiaFiltro(proiezione: HTMLElement, filtro: Filtro): void {
  applicaFiltro(proiezione, filtro);
  history.replaceState(history.state, '', conPeriodo(location.href, filtro));
}

function avviaInattivita(proiezione: HTMLElement): void {
  let timer: ReturnType<typeof setTimeout>;
  const sveglia = () => {
    proiezione.dataset.inattivo = 'no';
    clearTimeout(timer);
    timer = setTimeout(() => {
      proiezione.dataset.inattivo = 'si';
    }, INATTIVITA_MS);
  };
  for (const evento of ['mousemove', 'touchstart', 'keydown']) {
    proiezione.addEventListener(evento, sveglia, { passive: true });
  }
  sveglia();
}

function avviaSchermoIntero(pulsante: HTMLButtonElement | null): void {
  if (!pulsante) return;
  if (!document.fullscreenEnabled) {
    pulsante.hidden = true;
    return;
  }
  pulsante.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    pulsante.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  });
}

const TASTI: Record<string, 1 | -1> = {
  ArrowRight: 1,
  PageDown: 1,
  ArrowLeft: -1,
  PageUp: -1,
};

function avviaTastiera(proiezione: HTMLElement): void {
  document.addEventListener('keydown', (evento) => {
    const direzione = TASTI[evento.key];
    if (!direzione) return;
    evento.preventDefault();
    cambiaFiltro(proiezione, filtroAdiacente(proiezione.dataset.periodo as Filtro, direzione));
  });
}

/**
 * Riquadro con il dettaglio di una cella: mouse (sopra), tastiera (fuoco) e tocco (un tocco
 * apre, un altro tocco sullo stesso numero o altrove chiude). Il testo sta nel pulsante, in
 * `[data-info]`, e qui si copia nell'unico riquadro della pagina.
 */
function avviaDettagli(proiezione: HTMLElement): void {
  const riquadro = proiezione.querySelector<HTMLElement>('[data-dettaglio-riquadro]');
  if (!riquadro) return;
  let aperto: HTMLElement | null = null;
  let puntatore = '';

  const chiudi = () => {
    riquadro.hidden = true;
    aperto = null;
  };

  const apri = (pulsante: HTMLElement) => {
    const info = pulsante.querySelector<HTMLElement>('[data-info]');
    if (!info) return;
    riquadro.innerHTML = info.innerHTML;
    riquadro.hidden = false;
    aperto = pulsante;
    const p = pulsante.getBoundingClientRect();
    const r = riquadro.getBoundingClientRect();
    const margine = 12;
    const sotto = p.bottom + margine;
    const y = sotto + r.height <= innerHeight ? sotto : Math.max(margine, p.top - margine - r.height);
    const x = Math.min(Math.max(margine, p.left + p.width / 2 - r.width / 2), innerWidth - r.width - margine);
    riquadro.style.top = `${y}px`;
    riquadro.style.left = `${x}px`;
  };

  const pulsante = (e: Event) =>
    e.target instanceof Element ? e.target.closest<HTMLElement>('[data-dettaglio]') : null;

  proiezione.addEventListener('pointerdown', (e) => {
    puntatore = e.pointerType;
  });
  proiezione.addEventListener('pointerover', (e) => {
    const p = pulsante(e);
    if (p && e.pointerType === 'mouse' && p !== aperto) apri(p);
  });
  proiezione.addEventListener('pointerout', (e) => {
    const p = pulsante(e);
    if (p && e.pointerType === 'mouse' && p === aperto && !p.contains(e.relatedTarget as Node | null)) chiudi();
  });
  proiezione.addEventListener('focusin', (e) => {
    const p = pulsante(e);
    if (p && p.matches(':focus-visible')) apri(p);
  });
  proiezione.addEventListener('focusout', (e) => {
    if (pulsante(e)) chiudi();
  });
  proiezione.addEventListener('click', (e) => {
    const p = pulsante(e);
    if (!p) return chiudi();
    // Col mouse il riquadro è già aperto dal passaggio: il clic non deve richiuderlo.
    if (p === aperto && puntatore !== 'mouse') chiudi();
    else if (p !== aperto) apri(p);
    puntatore = '';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudi();
  });
  // Cambiare periodo nasconde colonne: il riquadro non deve restare su una cella sparita.
  proiezione.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-filtro]')) chiudi();
  });
}

export function avviaProiezione(): void {
  const proiezione = document.querySelector<HTMLElement>('[data-proiezione]');
  if (!proiezione) return;

  applicaFiltro(proiezione, filtroDaUrl());

  proiezione.addEventListener('click', (evento) => {
    const bersaglio = evento.target instanceof Element ? evento.target : null;
    const filtro = bersaglio?.closest<HTMLButtonElement>('[data-filtro]')?.dataset.filtro;
    if (isFiltro(filtro)) cambiaFiltro(proiezione, filtro);
  });

  avviaDettagli(proiezione);
  avviaTastiera(proiezione);
  avviaInattivita(proiezione);
  avviaSchermoIntero(proiezione.querySelector('[data-schermo-intero]'));
}
