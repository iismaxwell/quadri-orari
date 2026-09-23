import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ordinamentoSchema, percorsoSchema } from './dati/schema';

// Gli schemi stanno in src/dati/schema.ts perché li usano anche lo script verifica-dati e i test.
export const collections = {
  /** Trascrizione delle tabelle dei decreti: una per file. */
  ordinamenti: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/ordinamenti' }),
    schema: ordinamentoSchema,
  }),
  /** Un file per ogni indirizzo mostrato sul sito, con le scelte della scuola. */
  percorsi: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/percorsi' }),
    schema: percorsoSchema,
  }),
};
