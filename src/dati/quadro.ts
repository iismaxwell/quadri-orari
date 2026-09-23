/**
 * Il quadro orario completo di un percorso, pronto per l'interfaccia: area generale e area di
 * indirizzo (o il quadro unico di un liceo), ore settimanali e annue, scelte della scuola.
 *
 * Funzione pura e di sola lettura. Non controlla i conti: chi la usa deve prima passare i dati a
 * `verificaDati` (lo fa `getQuadro` in `astro.ts`). Se un riferimento non esiste, lancia un errore
 * invece di ignorarlo.
 */
import {
  ANNI,
  SETTIMANE,
  type Anno,
  type Dati,
  type Nota,
  type Ordinamento,
  type Percorso,
} from './schema';

export interface Ore {
  annue: number;
  settimanali: number;
}

export function ore(annue: number): Ore {
  return { annue, settimanali: annue / SETTIMANE };
}

export interface Cella {
  /** Ore della disciplina in quella classe: decreto più scuola. */
  totale: Ore;
  /** Ore previste dal decreto. */
  decreto: Ore;
  /** Ore aggiunte dalla scuola: quota a disposizione (tecnici) o potenziamento (licei). */
  scuola: Ore;
  /** Ore in compresenza, già comprese nel totale. `null` finché la scuola non le ha indicate. */
  compresenza: Ore | null;
  /** Ore dei singoli insegnamenti (per esempio in Scienze sperimentali), se deliberate. */
  ripartizione: Array<{ nome: string; ore: Ore }> | null;
}

export interface Riga {
  id: string;
  nome: string;
  ambito: { id: string; nome: string } | null;
  note: Nota[];
  /** Cinque celle, dalla 1ª alla 5ª (indice = anno − 1); `null` se la disciplina in quella classe non c'è. */
  celle: Array<Cella | null>;
}

export interface QuotaAnno {
  /** Quota a disposizione prevista dal decreto. */
  totale: Ore;
  /** Parte già assegnata alle discipline (compresa nelle loro celle). */
  assegnata: Ore;
  /** Parte non ancora deliberata: va mostrata come "da definire". */
  daDefinire: Ore;
}

export interface Area {
  area: Ordinamento['area'];
  titolo: string;
  /** Allegato del decreto da cui vengono i numeri, per esempio "C-8". */
  allegato: string;
  fonte: string;
  righe: Riga[];
  /** Quota a disposizione per classe; `null` nelle aree che non ne hanno. */
  quota: QuotaAnno[] | null;
  /** Riga "di cui in compresenza" del decreto; `null` nelle aree che non ne hanno. */
  compresenza: Ore[] | null;
  /** Ore dell'area per classe, compresa la quota da definire. */
  totali: Ore[];
}

export interface Quadro {
  slug: string;
  tipo: Percorso['tipo'];
  nome: string;
  indirizzo: string;
  icona: string;
  /** Per ogni classe, se la scuola deve ancora deliberare come usare la quota. */
  anni: Array<{ anno: Anno; daDefinire: boolean }>;
  aree: Area[];
  /** Ore della classe, tutte le aree comprese. */
  totali: Ore[];
}

type Assegnazioni = Record<string, number>;
type Ripartizioni = Record<string, Array<{ nome: string; ore: number }>>;

/** Le scelte della scuola che riguardano un'area, in una classe. */
interface ScelteArea {
  aggiunte: Assegnazioni;
  /** `null` se le compresenze di quella classe non sono ancora state indicate o l'area non ne ha. */
  compresenze: Assegnazioni | null;
  ripartizioni: Ripartizioni;
}

function trova<A extends Ordinamento['area']>(
  ordinamenti: Dati['ordinamenti'],
  id: string,
  area: A,
): Extract<Ordinamento, { area: A }> {
  const o = ordinamenti[id];
  if (!o) throw new Error(`Ordinamento "${id}" inesistente`);
  if (o.area !== area) throw new Error(`L'ordinamento "${id}" ha area "${o.area}", atteso "${area}"`);
  return o as Extract<Ordinamento, { area: A }>;
}

function somma(valori: Iterable<number>): number {
  let s = 0;
  for (const v of valori) s += v;
  return s;
}

function componiArea(o: Ordinamento, scelte: ScelteArea[]): Area {
  const ids = new Set(o.discipline.map((d) => d.id));
  for (const s of scelte) {
    const usati = [
      ...Object.keys(s.aggiunte),
      ...Object.keys(s.compresenze ?? {}),
      ...Object.keys(s.ripartizioni),
    ];
    for (const id of usati) {
      if (!ids.has(id)) throw new Error(`Disciplina "${id}" inesistente nell'allegato ${o.allegato}`);
    }
  }

  const ambiti = new Map('ambiti' in o ? o.ambiti.map((a) => [a.id, a]) : []);
  const note = new Map(o.note.map((n) => [n.id, n]));

  const righe: Riga[] = o.discipline.map((d) => ({
    id: d.id,
    nome: d.nome,
    ambito: d.ambito ? { id: d.ambito, nome: ambiti.get(d.ambito)?.nome ?? d.ambito } : null,
    note: (d.note ?? []).map((id) => {
      const n = note.get(id);
      if (!n) throw new Error(`Nota "${id}" inesistente nell'allegato ${o.allegato}`);
      return n;
    }),
    celle: ANNI.map((anno) => {
      const s = scelte[anno - 1];
      const decreto = d.ore[anno - 1];
      const scuola = s.aggiunte[d.id] ?? 0;
      if (decreto + scuola === 0) return null;
      const ripartizione = s.ripartizioni[d.id];
      return {
        totale: ore(decreto + scuola),
        decreto: ore(decreto),
        scuola: ore(scuola),
        compresenza: s.compresenze ? ore(s.compresenze[d.id] ?? 0) : null,
        ripartizione: ripartizione ? ripartizione.map((p) => ({ nome: p.nome, ore: ore(p.ore) })) : null,
      };
    }),
  }));

  const quota =
    o.area === 'indirizzo'
      ? ANNI.map((anno) => {
          const totale = o.quota.ore[anno - 1];
          const assegnata = somma(Object.values(scelte[anno - 1].aggiunte));
          return { totale: ore(totale), assegnata: ore(assegnata), daDefinire: ore(totale - assegnata) };
        })
      : null;

  const totali = ANNI.map((anno) => {
    const discipline = somma(righe.map((r) => r.celle[anno - 1]?.totale.annue ?? 0));
    return ore(discipline + (quota?.[anno - 1].daDefinire.annue ?? 0));
  });

  return {
    area: o.area,
    titolo: o.titolo,
    allegato: o.allegato,
    fonte: o.fonte,
    righe,
    quota,
    compresenza: o.area === 'indirizzo' ? o.compresenza.ore.map(ore) : null,
    totali,
  };
}

/** Le ripartizioni che riguardano le discipline di un ordinamento. */
function ripartizioniDi(o: Ordinamento, ripartizioni: Ripartizioni | undefined): Ripartizioni {
  const ids = new Set(o.discipline.map((d) => d.id));
  return Object.fromEntries(Object.entries(ripartizioni ?? {}).filter(([id]) => ids.has(id)));
}

export function componiQuadro(slug: string, percorso: Percorso, ordinamenti: Dati['ordinamenti']): Quadro {
  let aree: Area[];
  let anni: Quadro['anni'];

  if (percorso.tipo === 'tecnico') {
    const generale = trova(ordinamenti, percorso.areaGenerale, 'generale');
    const indirizzo = trova(ordinamenti, percorso.areaIndirizzo, 'indirizzo');
    const idsGenerale = new Set(generale.discipline.map((d) => d.id));
    const idsIndirizzo = new Set(indirizzo.discipline.map((d) => d.id));
    for (const anno of ANNI) {
      const r = percorso.anni[anno].ripartizioni ?? {};
      for (const id of Object.keys(r)) {
        if (!idsGenerale.has(id) && !idsIndirizzo.has(id)) {
          throw new Error(`Ripartizione di una disciplina inesistente: "${id}"`);
        }
      }
    }
    aree = [
      componiArea(
        generale,
        ANNI.map((anno) => ({
          aggiunte: {},
          compresenze: null,
          ripartizioni: ripartizioniDi(generale, percorso.anni[anno].ripartizioni),
        })),
      ),
      componiArea(
        indirizzo,
        ANNI.map((anno) => ({
          aggiunte: percorso.anni[anno].quota ?? {},
          compresenze: percorso.anni[anno].compresenze ?? null,
          ripartizioni: ripartizioniDi(indirizzo, percorso.anni[anno].ripartizioni),
        })),
      ),
    ];
    anni = ANNI.map((anno) => ({ anno, daDefinire: percorso.anni[anno].stato === 'da-definire' }));
  } else {
    const quadro = trova(ordinamenti, percorso.quadro, 'liceo');
    aree = [
      componiArea(
        quadro,
        ANNI.map((anno) => ({
          aggiunte: percorso.anni?.[anno]?.potenziamento ?? {},
          compresenze: null,
          ripartizioni: percorso.anni?.[anno]?.ripartizioni ?? {},
        })),
      ),
    ];
    anni = ANNI.map((anno) => ({ anno, daDefinire: false }));
  }

  return {
    slug,
    tipo: percorso.tipo,
    nome: percorso.nome,
    indirizzo: percorso.indirizzo,
    icona: percorso.icona,
    anni,
    aree,
    totali: ANNI.map((anno) => ore(somma(aree.map((a) => a.totali[anno - 1].annue)))),
  };
}
