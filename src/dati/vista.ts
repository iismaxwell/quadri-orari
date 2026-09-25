/**
 * Quello che il componente del quadro orario deve disegnare, ricavato da `componiQuadro`.
 *
 * Qui stanno le decisioni di presentazione che dipendono dai dati (quale cella è "non attiva",
 * quante tacche di compresenza, quando compare la ripartizione), così si verificano con i test
 * unitari senza passare dal browser. Il componente Astro si limita a trasformarle in HTML.
 */
import { ANNI, type Anno } from './schema';
import type { Area, Cella, Quadro, Riga } from './quadro';

/**
 * Un'ora settimanale nella barretta del "Dettaglio ore". Le ore della scuola e quelle in
 * compresenza sono sottoinsiemi delle ore della disciplina, mai ore in più.
 */
export type Tacca = 'singola' | 'compresenza' | 'scuola' | 'da-definire';

export interface NumeroOre {
  settimanali: number;
  annue: number;
}

export type CellaVista =
  | (NumeroOre & {
      tipo: 'ore';
      tacche: Tacca[];
      /** Ore settimanali in compresenza; `null` finché la scuola non le ha indicate. */
      compresenza: number | null;
      /** Ore settimanali assegnate dalla scuola (quota o potenziamento). */
      scuola: number;
    })
  | (NumeroOre & { tipo: 'da-definire'; tacche: Tacca[] })
  /** Quota a disposizione già assegnata: `a` sono le discipline che l'hanno ricevuta. */
  | { tipo: 'assegnata'; a: string[] }
  /** Nessuna ora in quella classe, nell'area generale o in un liceo. */
  | { tipo: 'vuota' }
  /** Disciplina di indirizzo che in quella classe non si insegna. */
  | { tipo: 'non-attiva' };

export type CellaRipartizione =
  | { tipo: 'ore'; materie: Array<NumeroOre & { nome: string }> }
  | { tipo: 'da-definire' }
  | { tipo: 'vuota' };

export interface RigaVista {
  id: string;
  nome: string;
  /** Cinque celle, dalla 1ª alla 5ª. */
  celle: CellaVista[];
  /** Classi in cui la riga ha qualcosa da mostrare: decidono se compare con un filtro. */
  anni: Anno[];
  /** Testi integrali delle note del decreto. */
  note: string[];
  /** Ripartizione interna (Scienze sperimentali). `null` se nessuna classe ne ha una deliberata. */
  ripartizione: { materie: string[]; celle: CellaRipartizione[] } | null;
}

export interface AreaVista {
  id: Area['area'];
  /** `null` quando il quadro ha un'area sola (licei). */
  titolo: string | null;
  /** Etichetta della riga di totale. */
  titoloTotale: string;
  righe: RigaVista[];
  totali: NumeroOre[];
}

export interface QuadroVista {
  slug: string;
  nome: string;
  /** Riga sotto il nome, per esempio "Istituto tecnico · Informatica e telecomunicazioni". */
  sottotitolo: string;
  icona: string;
  anni: Array<{ anno: Anno; etichetta: string; didascalia: string | null }>;
  aree: AreaVista[];
  totali: NumeroOre[];
  /** Voci della legenda del "Dettaglio ore" che hanno senso per questi dati. */
  legenda: { compresenza: boolean; scuola: boolean; daDefinire: boolean };
}

const ORDINALI = ['1ª', '2ª', '3ª', '4ª', '5ª'] as const;

const TITOLI_AREA: Record<Area['area'], string | null> = {
  generale: 'Area generale',
  indirizzo: 'Area di indirizzo',
  liceo: null,
};

const TITOLI_TOTALE: Record<Area['area'], string> = {
  generale: 'Totale area generale',
  indirizzo: 'Totale area di indirizzo',
  liceo: 'Totale',
};

/** Id della riga "Quota a disposizione della scuola" in `AreaVista.righe`: la usa anche F7, che non la mostra. */
export const ID_RIGA_QUOTA = 'quota-a-disposizione';

const RIGA_QUOTA = { id: ID_RIGA_QUOTA, nome: 'Quota a disposizione della scuola' };

function numero(o: { settimanali: number; annue: number }): NumeroOre {
  return { settimanali: o.settimanali, annue: o.annue };
}

function ripeti(n: number, t: Tacca): Tacca[] {
  return Array.from({ length: Math.max(0, n) }, () => t);
}

function cellaOre(c: Cella): CellaVista {
  const totale = c.totale.settimanali;
  const scuola = c.scuola.settimanali;
  const compresenza = c.compresenza?.settimanali ?? null;
  // Se le compresenze toccassero anche ore della scuola, le tacche della scuola hanno la
  // precedenza: il numero esatto resta comunque nel testo per i lettori di schermo.
  const inCompresenza = Math.min(compresenza ?? 0, totale - scuola);
  return {
    tipo: 'ore',
    ...numero(c.totale),
    tacche: [
      ...ripeti(totale - scuola - inCompresenza, 'singola'),
      ...ripeti(inCompresenza, 'compresenza'),
      ...ripeti(scuola, 'scuola'),
    ],
    compresenza,
    scuola,
  };
}

function rigaVista(r: Riga, area: Area, daDefinire: boolean[]): RigaVista {
  const materie = [
    ...new Set(r.celle.flatMap((c) => c?.ripartizione?.map((p) => p.nome) ?? [])),
  ];
  return {
    id: r.id,
    nome: r.nome,
    celle: r.celle.map((c) => {
      if (c) return cellaOre(c);
      return { tipo: area.area === 'indirizzo' ? 'non-attiva' : 'vuota' };
    }),
    anni: ANNI.filter((anno) => r.celle[anno - 1] !== null),
    note: r.note.map((n) => n.testo),
    ripartizione:
      materie.length === 0
        ? null
        : {
            materie,
            celle: r.celle.map((c, i): CellaRipartizione => {
              if (c?.ripartizione) {
                return {
                  tipo: 'ore',
                  materie: c.ripartizione.map((p) => ({ nome: p.nome, ...numero(p.ore) })),
                };
              }
              return c && daDefinire[i] ? { tipo: 'da-definire' } : { tipo: 'vuota' };
            }),
          },
  };
}

/** La riga della quota a disposizione: "da definire" o già assegnata, classe per classe. */
function rigaQuota(area: Area): RigaVista | null {
  const quota = area.quota;
  if (!quota || quota.every((q) => q.totale.annue === 0)) return null;
  const celle = quota.map((q, i): CellaVista => {
    if (q.daDefinire.annue > 0) {
      return { tipo: 'da-definire', ...numero(q.daDefinire), tacche: ripeti(q.daDefinire.settimanali, 'da-definire') };
    }
    if (q.assegnata.annue > 0) {
      const a = area.righe.filter((r) => (r.celle[i]?.scuola.annue ?? 0) > 0).map((r) => r.nome);
      return { tipo: 'assegnata', a };
    }
    return { tipo: 'vuota' };
  });
  return {
    ...RIGA_QUOTA,
    celle,
    anni: ANNI.filter((anno) => quota[anno - 1].totale.annue > 0),
    note: [],
    ripartizione: null,
  };
}

export function vistaQuadro(q: Quadro): QuadroVista {
  const daDefinire = q.anni.map((a) => a.daDefinire);
  const aree: AreaVista[] = q.aree.map((area) => {
    const quota = rigaQuota(area);
    return {
      id: area.area,
      titolo: TITOLI_AREA[area.area],
      titoloTotale: TITOLI_TOTALE[area.area],
      righe: [...area.righe.map((r) => rigaVista(r, area, daDefinire)), ...(quota ? [quota] : [])],
      totali: area.totali.map(numero),
    };
  });
  const celle = aree.flatMap((a) => a.righe.flatMap((r) => r.celle));

  return {
    slug: q.slug,
    nome: q.nome,
    sottotitolo: q.tipo === 'tecnico' ? `Istituto tecnico · ${q.indirizzo}` : q.indirizzo,
    icona: q.icona,
    anni: q.anni.map((a) => ({
      anno: a.anno,
      etichetta: ORDINALI[a.anno - 1],
      didascalia: q.tipo === 'liceo' ? null : a.daDefinire ? 'quota da definire' : 'deliberata',
    })),
    aree,
    totali: q.totali.map(numero),
    legenda: {
      compresenza: celle.some((c) => c.tipo === 'ore' && (c.compresenza ?? 0) > 0),
      scuola: celle.some((c) => c.tipo === 'ore' && c.scuola > 0),
      daDefinire: celle.some((c) => c.tipo === 'da-definire'),
    },
  };
}

/** Il numero di materie in parole, per il testo che accompagna la ripartizione. */
export function inParole(n: number): string {
  return ['zero', 'una', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto'][n] ?? String(n);
}
