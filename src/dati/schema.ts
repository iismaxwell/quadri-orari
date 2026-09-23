/**
 * Forma dei dati dei quadri orari.
 *
 * Lo schema controlla solo la forma. I conti (totali, monte ore d'ambito, multipli di 33,
 * quota, compresenze) li fa `verifiche.ts`, che dà messaggi con il contesto del decreto.
 *
 * Il modulo non importa nulla da `astro:content`, così lo usano allo stesso modo
 * `src/content.config.ts`, lo script `verifica-dati` e i test.
 */
import { z } from 'astro/zod';

export const ANNI = [1, 2, 3, 4, 5] as const;
export type Anno = (typeof ANNI)[number];

/** Nei decreti un'ora settimanale vale 33 ore annue. */
export const SETTIMANE = 33;

export const PERIODI = {
  primoBiennio: [1, 2],
  secondoBiennio: [3, 4],
  quintoAnno: [5],
} as const satisfies Record<string, readonly Anno[]>;
export type Periodo = keyof typeof PERIODI;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'deve essere uno slug: minuscole, cifre e trattini');

/** Ore annue, come nei decreti. Che siano multiple di 33 lo controlla `verifiche.ts`. */
const ore = z.number().int().nonnegative();

/** Ore annue per la 1ª, 2ª, 3ª, 4ª e 5ª classe, nell'ordine delle colonne dei decreti. */
const orePerAnno = z.tuple([ore, ore, ore, ore, ore]);

/** Monte ore d'ambito: un periodo assente vale 0, come la cella vuota del decreto. */
const monteOre = z
  .object({
    primoBiennio: ore.optional(),
    secondoBiennio: ore.optional(),
    quintoAnno: ore.optional(),
  })
  .strict();

const ambito = z
  .object({
    id: slug,
    nome: z.string().min(1),
    monteOre,
  })
  .strict();

const disciplina = z
  .object({
    id: slug,
    nome: z.string().min(1),
    /** Obbligatorio nelle aree dei tecnici, assente nei licei. */
    ambito: slug.optional(),
    ore: orePerAnno,
    /** Id delle note dello stesso ordinamento. */
    note: z.array(slug).optional(),
  })
  .strict();

const nota = z
  .object({
    id: slug,
    /** Testo integrale del decreto. */
    testo: z.string().min(1),
  })
  .strict();

const righeSpeciali = z
  .object({
    ore: orePerAnno,
    monteOre,
  })
  .strict();

const baseOrdinamento = {
  /** Sigla dell'allegato al decreto, per esempio "B" o "C-8". */
  allegato: z.string().min(1),
  titolo: z.string().min(1),
  /** Nome del PDF in `originali/` da cui sono ricopiati i numeri. */
  fonte: z.string().min(1),
  discipline: z.array(disciplina).min(1),
  /** Riga "Totale" del decreto, ricopiata per controllare le somme. */
  totali: orePerAnno,
  note: z.array(nota).default([]),
};

const ordinamentoGenerale = z
  .object({
    area: z.literal('generale'),
    ...baseOrdinamento,
    ambiti: z.array(ambito).min(1),
    monteOreTotale: monteOre,
  })
  .strict();

const ordinamentoIndirizzo = z
  .object({
    area: z.literal('indirizzo'),
    ...baseOrdinamento,
    settore: z.string().min(1),
    indirizzo: z.string().min(1),
    articolazione: z.string().min(1),
    ambiti: z.array(ambito).min(1),
    /** Riga "Quota del curricolo a disposizione della scuola". */
    quota: righeSpeciali,
    /** Riga "di cui in compresenza": sottoinsieme delle ore dell'area, non ore in più. */
    compresenza: righeSpeciali,
    monteOreTotale: monteOre,
  })
  .strict();

/** Quadro di un liceo: niente ambiti, quota a disposizione né compresenze. */
const ordinamentoLiceo = z
  .object({
    area: z.literal('liceo'),
    ...baseOrdinamento,
  })
  .strict();

/** Un file di `src/content/ordinamenti/`: la trascrizione di una tabella di un decreto. */
export const ordinamentoSchema = z.discriminatedUnion('area', [
  ordinamentoGenerale,
  ordinamentoIndirizzo,
  ordinamentoLiceo,
]);

/** Disciplina (id) → ore annue. */
const assegnazioni = z.record(slug, ore);

/** Disciplina (id) → ore annue di ciascun insegnamento, per esempio le quattro di Scienze sperimentali. */
const ripartizioni = z.record(
  slug,
  z
    .array(
      z
        .object({
          nome: z.string().min(1),
          ore,
        })
        .strict(),
    )
    .min(2),
);

const annoTecnico = z
  .object({
    stato: z.enum(['deliberato', 'da-definire']),
    /** Ore della quota a disposizione assegnate dalla scuola, in aggiunta a quelle del decreto. */
    quota: assegnazioni.optional(),
    /** Ore in compresenza per disciplina, comprese nelle ore della disciplina. */
    compresenze: assegnazioni.optional(),
    ripartizioni: ripartizioni.optional(),
  })
  .strict();

const annoLiceo = z
  .object({
    /** Ore che la scuola aggiunge a discipline dell'ordinamento. */
    potenziamento: assegnazioni.optional(),
    ripartizioni: ripartizioni.optional(),
  })
  .strict();

const basePercorso = {
  /** Nome mostrato: l'articolazione per i tecnici, l'opzione per i licei. */
  nome: z.string().min(1),
  indirizzo: z.string().min(1),
  /** Nome del file in `src/assets/icone-indirizzi/`, senza `.svg`. */
  icona: slug,
  /** Posizione negli elenchi del sito. */
  ordine: z.number().int(),
};

const percorsoTecnico = z
  .object({
    tipo: z.literal('tecnico'),
    ...basePercorso,
    /** Id dell'ordinamento con `area: generale`. */
    areaGenerale: slug,
    /** Id dell'ordinamento con `area: indirizzo`. */
    areaIndirizzo: slug,
    /** Le scelte della scuola, classe per classe. Tutte e cinque le classi sono obbligatorie. */
    anni: z
      .object({
        1: annoTecnico,
        2: annoTecnico,
        3: annoTecnico,
        4: annoTecnico,
        5: annoTecnico,
      })
      .strict(),
  })
  .strict();

const percorsoLiceo = z
  .object({
    tipo: z.literal('liceo'),
    ...basePercorso,
    /** Id dell'ordinamento con `area: liceo`. */
    quadro: slug,
    /** Solo le classi in cui la scuola aggiunge qualcosa all'ordinamento. */
    anni: z
      .object({
        1: annoLiceo,
        2: annoLiceo,
        3: annoLiceo,
        4: annoLiceo,
        5: annoLiceo,
      })
      .partial()
      .strict()
      .optional(),
  })
  .strict();

/** Un file di `src/content/percorsi/`: un indirizzo mostrato sul sito, con le scelte della scuola. */
export const percorsoSchema = z.discriminatedUnion('tipo', [percorsoTecnico, percorsoLiceo]);

export type Ordinamento = z.infer<typeof ordinamentoSchema>;
export type OrdinamentoGenerale = z.infer<typeof ordinamentoGenerale>;
export type OrdinamentoIndirizzo = z.infer<typeof ordinamentoIndirizzo>;
export type OrdinamentoLiceo = z.infer<typeof ordinamentoLiceo>;
export type Disciplina = z.infer<typeof disciplina>;
export type Nota = z.infer<typeof nota>;
export type Percorso = z.infer<typeof percorsoSchema>;
export type PercorsoTecnico = z.infer<typeof percorsoTecnico>;
export type PercorsoLiceo = z.infer<typeof percorsoLiceo>;
export type AnnoTecnico = z.infer<typeof annoTecnico>;
export type AnnoLiceo = z.infer<typeof annoLiceo>;

/** Tutti i dati, indicizzati per id (il nome del file senza estensione). */
export interface Dati {
  ordinamenti: Record<string, Ordinamento>;
  percorsi: Record<string, Percorso>;
}
