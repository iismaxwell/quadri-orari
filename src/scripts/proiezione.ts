/**
 * Comportamento della pagina di proiezione (F7): filtro per periodo condiviso con il quadro
 * normale, controlli che si nascondono quando mouse e tocco sono fermi, frecce e tasti pagina per
 * cambiare periodo, schermo intero con ripiego quando la Fullscreen API non c'è (Safari su iPhone).
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

export function avviaProiezione(): void {
  const proiezione = document.querySelector<HTMLElement>('[data-proiezione]');
  if (!proiezione) return;

  applicaFiltro(proiezione, filtroDaUrl());

  proiezione.addEventListener('click', (evento) => {
    const bersaglio = evento.target instanceof Element ? evento.target : null;
    const filtro = bersaglio?.closest<HTMLButtonElement>('[data-filtro]')?.dataset.filtro;
    if (isFiltro(filtro)) cambiaFiltro(proiezione, filtro);
  });

  avviaTastiera(proiezione);
  avviaInattivita(proiezione);
  avviaSchermoIntero(proiezione.querySelector('[data-schermo-intero]'));
}
