/**
 * Filtro per periodo dei controlli sopra la tabella (e, in F7, della proiezione).
 *
 * Modulo senza dipendenze perché lo importa anche lo script che gira nel browser: importare
 * `schema.ts` porterebbe Zod nel JavaScript della pagina.
 */
import type { Anno } from './schema';

export const FILTRI = {
  biennio: [1, 2],
  triennio: [3, 4, 5],
  quinquennio: [1, 2, 3, 4, 5],
} as const satisfies Record<string, readonly Anno[]>;
export type Filtro = keyof typeof FILTRI;

export const FILTRO_PREDEFINITO: Filtro = 'quinquennio';

export const ETICHETTE_FILTRI: Record<Filtro, string> = {
  biennio: 'Biennio',
  triennio: 'Triennio',
  quinquennio: 'Quinquennio',
};

export function isFiltro(valore: unknown): valore is Filtro {
  return typeof valore === 'string' && Object.hasOwn(FILTRI, valore);
}
