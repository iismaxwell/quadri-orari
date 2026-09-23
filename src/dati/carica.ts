/**
 * Lettura dei dati da Node, fuori da Astro: la usano lo script `verifica-dati` e i test.
 * Legge gli stessi file YAML delle content collection, con lo stesso parser e lo stesso schema.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import { load } from 'js-yaml';
import { ordinamentoSchema, percorsoSchema, type Dati } from './schema';

/** Radice del progetto. */
export const RADICE = fileURLToPath(new URL('../..', import.meta.url));

const CARTELLE = {
  ordinamenti: 'src/content/ordinamenti',
  percorsi: 'src/content/percorsi',
} as const;

const NOME_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.yaml$/;

async function caricaCartella<T>(
  radice: string,
  cartella: string,
  schema: z.ZodType<T>,
  errori: string[],
): Promise<Record<string, T>> {
  const dir = path.join(radice, cartella);
  const file = (await readdir(dir)).filter((f) => !f.startsWith('.')).sort();
  const voci: Record<string, T> = {};
  for (const f of file) {
    const rel = path.posix.join(cartella, f);
    const id = NOME_FILE.exec(f)?.[1];
    if (!id) {
      errori.push(`${rel}: il nome del file deve essere uno slug con estensione .yaml`);
      continue;
    }
    let grezzo: unknown;
    try {
      grezzo = load(await readFile(path.join(dir, f), 'utf8'), { filename: rel });
    } catch (e) {
      errori.push(`${rel}: YAML non valido: ${(e as Error).message}`);
      continue;
    }
    const esito = schema.safeParse(grezzo, { reportInput: false });
    if (!esito.success) {
      for (const issue of esito.error.issues) {
        const dove = issue.path.length > 0 ? issue.path.join('.') : '(file)';
        errori.push(`${rel}: ${dove}: ${issue.message}`);
      }
      continue;
    }
    voci[id] = esito.data;
  }
  return voci;
}

/** Legge e valida con lo schema tutti i file di dati. Gli errori di forma finiscono in `errori`. */
export async function caricaDati(radice: string = RADICE): Promise<{ dati: Dati; errori: string[] }> {
  z.config(z.locales.it());
  const errori: string[] = [];
  const ordinamenti = await caricaCartella(radice, CARTELLE.ordinamenti, ordinamentoSchema, errori);
  const percorsi = await caricaCartella(radice, CARTELLE.percorsi, percorsoSchema, errori);
  return { dati: { ordinamenti, percorsi }, errori };
}

/** Controlla che esistano i file richiamati dai dati: PDF dei decreti e icone. */
export function verificaFile(dati: Dati, radice: string = RADICE): string[] {
  const errori: string[] = [];
  for (const [id, o] of Object.entries(dati.ordinamenti)) {
    if (!existsSync(path.join(radice, 'originali', o.fonte))) {
      errori.push(`ordinamenti/${id}: fonte "${o.fonte}" non trovata in originali/`);
    }
  }
  for (const [slug, p] of Object.entries(dati.percorsi)) {
    if (!existsSync(path.join(radice, 'src/assets/icone-indirizzi', `${p.icona}.svg`))) {
      errori.push(`percorsi/${slug}: icona "${p.icona}.svg" non trovata in src/assets/icone-indirizzi/`);
    }
  }
  return errori;
}
