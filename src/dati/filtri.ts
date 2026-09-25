/**
 * Filtro per periodo dei controlli sopra la tabella e della modalità proiezione (F7).
 *
 * Modulo senza dipendenze perché lo importano anche gli script che girano nel browser
 * (`scripts/quadro-orario.ts`, `scripts/proiezione.ts`): importare `schema.ts` porterebbe Zod nel
 * JavaScript della pagina.
 */
import type { Anno } from './schema';

export const FILTRI = {
  biennio: [1, 2],
  triennio: [3, 4, 5],
  quinquennio: [1, 2, 3, 4, 5],
} as const satisfies Record<string, readonly Anno[]>;
export type Filtro = keyof typeof FILTRI;
const ORDINE_FILTRI = Object.keys(FILTRI) as Filtro[];

export const FILTRO_PREDEFINITO: Filtro = 'quinquennio';

export const ETICHETTE_FILTRI: Record<Filtro, string> = {
  biennio: 'Biennio',
  triennio: 'Triennio',
  quinquennio: 'Quinquennio',
};

export function isFiltro(valore: unknown): valore is Filtro {
  return typeof valore === 'string' && Object.hasOwn(FILTRI, valore);
}

/** Il filtro successivo/precedente nell'ordine biennio → triennio → quinquennio, senza girare in tondo. */
export function filtroAdiacente(filtro: Filtro, direzione: 1 | -1): Filtro {
  const i = ORDINE_FILTRI.indexOf(filtro) + direzione;
  return ORDINE_FILTRI[Math.min(Math.max(i, 0), ORDINE_FILTRI.length - 1)];
}

const PARAMETRO_PERIODO = 'periodo';

/** La stessa URL con `?periodo=` impostato, o senza se il filtro è quello predefinito. */
export function conPeriodo(href: string, filtro: Filtro): string {
  const url = new URL(href, location.href);
  if (filtro === FILTRO_PREDEFINITO) url.searchParams.delete(PARAMETRO_PERIODO);
  else url.searchParams.set(PARAMETRO_PERIODO, filtro);
  return url.href;
}

/** Il filtro richiesto nell'URL corrente, o quello predefinito se assente o non valido. */
export function filtroDaUrl(): Filtro {
  const richiesto = new URL(location.href).searchParams.get(PARAMETRO_PERIODO);
  return isFiltro(richiesto) ? richiesto : FILTRO_PREDEFINITO;
}
