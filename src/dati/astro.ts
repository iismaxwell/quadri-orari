/**
 * Accesso ai quadri orari e alle pagine di contenuto dalle pagine Astro. È l'unico modulo di
 * `src/dati/` che dipende da `astro:content`; tutto il resto è codice puro, usato anche dallo
 * script e dai test.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { componiQuadro, type Quadro } from './quadro';
import type { Dati, Percorso } from './schema';
import { verificaDati } from './verifiche';

async function datiVerificati(): Promise<Dati> {
  const [ordinamenti, percorsi] = await Promise.all([getCollection('ordinamenti'), getCollection('percorsi')]);
  const dati: Dati = {
    ordinamenti: Object.fromEntries(ordinamenti.map((e) => [e.id, e.data])),
    percorsi: Object.fromEntries(percorsi.map((e) => [e.id, e.data])),
  };
  const errori = verificaDati(dati);
  if (errori.length > 0) {
    throw new Error(`Dati dei quadri orari non validi:\n${errori.map((e) => `  - ${e}`).join('\n')}`);
  }
  return dati;
}

/** I percorsi nell'ordine in cui il sito li elenca. */
export async function getPercorsi(): Promise<Array<{ slug: string; percorso: Percorso }>> {
  const dati = await datiVerificati();
  return Object.entries(dati.percorsi)
    .map(([slug, percorso]) => ({ slug, percorso }))
    .sort((a, b) => a.percorso.ordine - b.percorso.ordine);
}

/** Il quadro orario completo di un percorso. Lancia un errore se i dati non superano le verifiche. */
export async function getQuadro(slug: string): Promise<Quadro> {
  const dati = await datiVerificati();
  const percorso = dati.percorsi[slug];
  if (!percorso) throw new Error(`Percorso "${slug}" inesistente`);
  return componiQuadro(slug, percorso, dati.ordinamenti);
}

/** Le pagine di contenuto (riforma in breve, FAQ, contatti…), nell'ordine in cui il sito le elenca. */
export async function getPagine(): Promise<CollectionEntry<'pagine'>[]> {
  const pagine = await getCollection('pagine');
  return pagine.sort((a, b) => a.data.ordine - b.data.ordine);
}
