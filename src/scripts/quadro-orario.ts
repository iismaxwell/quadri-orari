/**
 * Comportamento del componente QuadroOrario. Cambia solo attributi: cosa si vede lo decide il CSS.
 *
 * Il periodo scelto finisce nell'URL (`?periodo=biennio`), così una vista si può salvare nei
 * preferiti, e segue i link marcati con `data-segue-periodo` (il pulsante "A tutto schermo").
 */
import { FILTRI, FILTRO_PREDEFINITO, isFiltro, type Filtro } from '../dati/filtri';

const PARAMETRO = 'periodo';

function conPeriodo(href: string, filtro: Filtro): string {
  const url = new URL(href, location.href);
  if (filtro === FILTRO_PREDEFINITO) url.searchParams.delete(PARAMETRO);
  else url.searchParams.set(PARAMETRO, filtro);
  return url.href;
}

function applicaFiltro(quadro: HTMLElement, filtro: Filtro): void {
  quadro.dataset.periodo = filtro;
  for (const b of quadro.querySelectorAll<HTMLButtonElement>('[data-filtro]')) {
    b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro));
  }
  // Le celle che occupano tutta la riga (le note) devono coprire solo le colonne visibili.
  for (const c of quadro.querySelectorAll<HTMLTableCellElement>('[data-colspan]')) {
    c.colSpan = FILTRI[filtro].length + 1;
  }
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-segue-periodo]')) {
    a.href = conPeriodo(a.href, filtro);
  }
}

const INTERRUTTORI: Record<string, { attributo: 'unita' | 'dettaglio'; acceso: string; spento: string }> = {
  unita: { attributo: 'unita', acceso: 'annue', spento: 'settimanali' },
  dettaglio: { attributo: 'dettaglio', acceso: 'si', spento: 'no' },
};

function avvia(quadro: HTMLElement): void {
  const richiesto = new URL(location.href).searchParams.get(PARAMETRO);
  applicaFiltro(quadro, isFiltro(richiesto) ? richiesto : FILTRO_PREDEFINITO);

  quadro.addEventListener('click', (evento) => {
    const bersaglio = evento.target instanceof Element ? evento.target : null;

    const filtro = bersaglio?.closest<HTMLButtonElement>('[data-filtro]')?.dataset.filtro;
    if (isFiltro(filtro)) {
      applicaFiltro(quadro, filtro);
      history.replaceState(history.state, '', conPeriodo(location.href, filtro));
      return;
    }

    const interruttore = bersaglio?.closest<HTMLButtonElement>('[data-interruttore]');
    const regola = interruttore && INTERRUTTORI[interruttore.dataset.interruttore ?? ''];
    if (interruttore && regola) {
      const acceso = interruttore.getAttribute('aria-checked') !== 'true';
      interruttore.setAttribute('aria-checked', String(acceso));
      quadro.dataset[regola.attributo] = acceso ? regola.acceso : regola.spento;
      return;
    }

    const espandi = bersaglio?.closest<HTMLButtonElement>('[data-espandi]');
    if (espandi) {
      const aperto = espandi.getAttribute('aria-expanded') !== 'true';
      espandi.setAttribute('aria-expanded', String(aperto));
      for (const id of (espandi.getAttribute('aria-controls') ?? '').split(/\s+/).filter(Boolean)) {
        const riga = document.getElementById(id);
        if (riga) riga.hidden = !aperto;
      }
      const etichetta = aperto ? espandi.dataset.aperto : espandi.dataset.chiuso;
      if (etichetta) espandi.textContent = etichetta;
    }
  });
}

export function avviaQuadri(): void {
  for (const quadro of document.querySelectorAll<HTMLElement>('[data-quadro]')) avvia(quadro);
}
