/**
 * Invarianti dei quadri orari (vedi "Invarianti da far verificare alla build" in AGENTS.md).
 *
 * Funzioni pure: ricevono i dati già validati dallo schema e restituiscono l'elenco degli errori,
 * vuoto se è tutto a posto. Le usano lo script `verifica-dati` (prima di ogni build), i test e
 * `getQuadro`, che si rifiuta di restituire un quadro sbagliato.
 */
import { componiQuadro, type Quadro } from './quadro';
import {
  ANNI,
  PERIODI,
  SETTIMANE,
  type Anno,
  type Dati,
  type Ordinamento,
  type OrdinamentoIndirizzo,
  type Percorso,
  type Periodo,
} from './schema';

/**
 * Totali annui dei tecnici, uguali per ogni articolazione (All. B e All. C). Stanno anche nei
 * file degli ordinamenti: qui sono ripetuti come terza fonte, perché un errore corretto in modo
 * coerente in un file e nella sua riga di totale non passi inosservato.
 */
export const TOTALI_TECNICI = {
  generale: [627, 594, 495, 495, 462],
  indirizzo: [429, 462, 561, 561, 528],
  classe: [1056, 1056, 1056, 1056, 990],
} as const;

const NOMI_PERIODI: Record<Periodo, string> = {
  primoBiennio: 'primo biennio',
  secondoBiennio: 'secondo biennio',
  quintoAnno: 'quinto anno',
};

const classe = (anno: Anno) => `${anno}ª`;

function somma(valori: Iterable<number>): number {
  let s = 0;
  for (const v of valori) s += v;
  return s;
}

function duplicati(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

/** Ore annue che non corrispondono a un numero intero di ore settimanali. */
function nonMultiplo(v: number): boolean {
  return v % SETTIMANE !== 0;
}

function settimanali(v: number): string {
  if (nonMultiplo(v)) return `${v} ore annue`;
  const s = v / SETTIMANE;
  return `${v} ore annue (${s} ${s === 1 ? 'settimanale' : 'settimanali'})`;
}

export function verificaOrdinamento(id: string, o: Ordinamento): string[] {
  const errori: string[] = [];
  const errore = (msg: string) => errori.push(`ordinamenti/${id}: ${msg}`);

  const multiplo = (dove: string, v: number) => {
    if (nonMultiplo(v)) errore(`${dove}: ${v} ore annue non è un multiplo di ${SETTIMANE}`);
  };
  const monteOreMultiplo = (dove: string, m: Partial<Record<Periodo, number>>) => {
    for (const [p, v] of Object.entries(m)) multiplo(`${dove}, ${NOMI_PERIODI[p as Periodo]}`, v);
  };

  for (const d of o.discipline) ANNI.forEach((a) => multiplo(`${d.nome}, ${classe(a)}`, d.ore[a - 1]));
  ANNI.forEach((a) => multiplo(`totale, ${classe(a)}`, o.totali[a - 1]));

  for (const dup of duplicati(o.discipline.map((d) => d.id))) errore(`disciplina "${dup}" ripetuta`);
  for (const dup of duplicati(o.note.map((n) => n.id))) errore(`nota "${dup}" ripetuta`);

  for (const d of o.discipline) {
    if (d.ore.every((v) => v === 0)) errore(`${d.nome} non ha ore in nessuna classe`);
  }

  const noteUsate = new Set(o.discipline.flatMap((d) => d.note ?? []));
  const noteDefinite = new Set(o.note.map((n) => n.id));
  for (const d of o.discipline) {
    for (const n of d.note ?? []) if (!noteDefinite.has(n)) errore(`${d.nome}: nota "${n}" inesistente`);
  }
  for (const n of noteDefinite) if (!noteUsate.has(n)) errore(`nota "${n}" non usata da nessuna disciplina`);

  const quota = o.area === 'indirizzo' ? o.quota : null;

  // Somme per classe: discipline più quota a disposizione = riga "Totale" del decreto.
  for (const a of ANNI) {
    const discipline = somma(o.discipline.map((d) => d.ore[a - 1]));
    const q = quota?.ore[a - 1] ?? 0;
    if (discipline + q !== o.totali[a - 1]) {
      const conQuota = quota ? ` più ${q} di quota a disposizione` : '';
      errore(
        `${classe(a)}: le discipline sommano a ${discipline} ore annue${conQuota}, ` +
          `ma il totale del decreto è ${o.totali[a - 1]}`,
      );
    }
  }

  if (o.area === 'liceo') {
    for (const d of o.discipline) {
      if (d.ambito) errore(`${d.nome}: nei licei le discipline non hanno ambito`);
    }
    return errori;
  }

  // Tecnici: ambiti e monte ore d'ambito.
  for (const dup of duplicati(o.ambiti.map((a) => a.id))) errore(`ambito "${dup}" ripetuto`);
  const ambiti = new Set(o.ambiti.map((a) => a.id));
  for (const d of o.discipline) {
    if (!d.ambito) errore(`${d.nome}: manca l'ambito`);
    else if (!ambiti.has(d.ambito)) errore(`${d.nome}: ambito "${d.ambito}" inesistente`);
  }

  const orePeriodo = (valori: readonly number[], p: Periodo) => somma(PERIODI[p].map((a) => valori[a - 1]));

  for (const ambito of o.ambiti) {
    monteOreMultiplo(`monte ore dell'ambito "${ambito.nome}"`, ambito.monteOre);
    const discipline = o.discipline.filter((d) => d.ambito === ambito.id);
    for (const p of Object.keys(PERIODI) as Periodo[]) {
      const effettive = somma(discipline.map((d) => orePeriodo(d.ore, p)));
      const attese = ambito.monteOre[p] ?? 0;
      if (effettive !== attese) {
        errore(
          `ambito "${ambito.nome}", ${NOMI_PERIODI[p]}: le discipline sommano a ${effettive} ore, ` +
            `ma il monte ore d'ambito del decreto è ${attese}`,
        );
      }
    }
  }

  const righe: Array<[string, { ore: readonly number[]; monteOre: Partial<Record<Periodo, number>> }]> = [
    ['totale', { ore: o.totali, monteOre: o.monteOreTotale }],
  ];
  if (o.area === 'indirizzo') {
    righe.push(['quota a disposizione', o.quota], ['di cui in compresenza', o.compresenza]);
  }
  for (const [nome, riga] of righe) {
    if (nome !== 'totale') ANNI.forEach((a) => multiplo(`${nome}, ${classe(a)}`, riga.ore[a - 1]));
    monteOreMultiplo(`monte ore della riga "${nome}"`, riga.monteOre);
    for (const p of Object.keys(PERIODI) as Periodo[]) {
      const effettive = orePeriodo(riga.ore, p);
      const attese = riga.monteOre[p] ?? 0;
      if (effettive !== attese) {
        errore(`riga "${nome}", ${NOMI_PERIODI[p]}: le classi sommano a ${effettive} ore, ma il decreto dà ${attese}`);
      }
    }
  }

  if (o.area === 'indirizzo') {
    for (const a of ANNI) {
      if (o.compresenza.ore[a - 1] > o.totali[a - 1]) {
        errore(`${classe(a)}: le ore in compresenza superano il totale dell'area`);
      }
    }
  }

  return errori;
}

type Assegnazioni = Record<string, number>;
type Ripartizioni = Record<string, Array<{ nome: string; ore: number }>>;

/**
 * Controlli comuni alle ore che la scuola aggiunge o distribuisce: le discipline devono esistere,
 * le ore devono essere positive e multiple di 33.
 */
function controllaAssegnazioni(
  errore: (msg: string) => void,
  cosa: string,
  valori: Assegnazioni | undefined,
  ammesse: Map<string, string>,
  fuoriArea: Map<string, string>,
  motivoFuoriArea: string,
): boolean {
  let ok = true;
  for (const [id, v] of Object.entries(valori ?? {})) {
    const nome = ammesse.get(id);
    if (!nome) {
      ok = false;
      const altra = fuoriArea.get(id);
      errore(altra ? `${cosa} a "${altra}": ${motivoFuoriArea}` : `${cosa} a una disciplina inesistente: "${id}"`);
      continue;
    }
    if (v === 0) errore(`${cosa} a "${nome}": 0 ore, togli la voce`);
    if (nonMultiplo(v)) errore(`${cosa} a "${nome}": ${v} ore annue non è un multiplo di ${SETTIMANE}`);
  }
  return ok;
}

function controllaRipartizioni(
  errore: (msg: string) => void,
  ripartizioni: Ripartizioni | undefined,
  nomi: Map<string, string>,
  oreDisciplina: (id: string) => number,
): boolean {
  let ok = true;
  for (const [id, parti] of Object.entries(ripartizioni ?? {})) {
    const nome = nomi.get(id);
    if (!nome) {
      ok = false;
      errore(`ripartizione di una disciplina inesistente: "${id}"`);
      continue;
    }
    const totale = oreDisciplina(id);
    if (totale === 0) {
      errore(`ripartizione di "${nome}", che in questa classe non ha ore`);
      continue;
    }
    for (const dup of duplicati(parti.map((p) => p.nome))) errore(`ripartizione di "${nome}": "${dup}" ripetuto`);
    for (const p of parti) {
      if (p.ore === 0) errore(`ripartizione di "${nome}": ${p.nome} ha 0 ore, togli la voce`);
      if (nonMultiplo(p.ore)) {
        errore(`ripartizione di "${nome}": ${p.nome} ha ${p.ore} ore annue, non un multiplo di ${SETTIMANE}`);
      }
    }
    const s = somma(parti.map((p) => p.ore));
    if (s !== totale) {
      errore(`ripartizione di "${nome}": le parti sommano a ${settimanali(s)}, ma la disciplina ne ha ${settimanali(totale)}`);
    }
  }
  return ok;
}

function nomiDiscipline(o: Ordinamento): Map<string, string> {
  return new Map(o.discipline.map((d) => [d.id, d.nome]));
}

function oreDecreto(o: Ordinamento, anno: Anno): Map<string, number> {
  return new Map(o.discipline.map((d) => [d.id, d.ore[anno - 1]]));
}

/**
 * Controlla un percorso contro i suoi ordinamenti. Se i riferimenti sono validi compone anche il
 * quadro e ne verifica i totali, cioè proprio i numeri che l'interfaccia mostrerà.
 */
export function verificaPercorso(slug: string, p: Percorso, ordinamenti: Dati['ordinamenti']): string[] {
  const errori: string[] = [];
  const errore = (msg: string) => errori.push(`percorsi/${slug}: ${msg}`);

  const richiama = <A extends Ordinamento['area']>(campo: string, id: string, area: A) => {
    const o = ordinamenti[id];
    if (!o) {
      errore(`${campo}: ordinamento "${id}" inesistente`);
      return undefined;
    }
    if (o.area !== area) {
      errore(`${campo}: l'ordinamento "${id}" ha area "${o.area}", serve "${area}"`);
      return undefined;
    }
    return o as Extract<Ordinamento, { area: A }>;
  };

  let riferimentiValidi = true;
  const segna = (ok: boolean) => {
    if (!ok) riferimentiValidi = false;
  };

  if (p.tipo === 'tecnico') {
    const generale = richiama('areaGenerale', p.areaGenerale, 'generale');
    const indirizzo = richiama('areaIndirizzo', p.areaIndirizzo, 'indirizzo');
    if (!generale || !indirizzo) return errori;

    if (p.indirizzo !== indirizzo.indirizzo) {
      errore(`indirizzo "${p.indirizzo}", ma l'allegato ${indirizzo.allegato} è di "${indirizzo.indirizzo}"`);
    }
    ANNI.forEach((a) => {
      if (generale.totali[a - 1] !== TOTALI_TECNICI.generale[a - 1]) {
        errore(`${classe(a)}: l'area generale ha ${generale.totali[a - 1]} ore annue, attese ${TOTALI_TECNICI.generale[a - 1]}`);
      }
      if (indirizzo.totali[a - 1] !== TOTALI_TECNICI.indirizzo[a - 1]) {
        errore(`${classe(a)}: l'area di indirizzo ha ${indirizzo.totali[a - 1]} ore annue, attese ${TOTALI_TECNICI.indirizzo[a - 1]}`);
      }
    });

    const nomiGenerale = nomiDiscipline(generale);
    const nomiIndirizzo = nomiDiscipline(indirizzo);
    for (const id of nomiIndirizzo.keys()) {
      if (nomiGenerale.has(id)) {
        errore(`la disciplina "${id}" è sia nell'area generale sia in quella di indirizzo`);
        riferimentiValidi = false;
      }
    }
    const tutte = new Map([...nomiGenerale, ...nomiIndirizzo]);

    for (const a of ANNI) {
      const s = p.anni[a];
      const erroreAnno = (msg: string) => errore(`${classe(a)}: ${msg}`);

      segna(
        controllaAssegnazioni(
          erroreAnno,
          'quota assegnata',
          s.quota,
          nomiIndirizzo,
          nomiGenerale,
          'la quota a disposizione si assegna solo a discipline dell’area di indirizzo',
        ),
      );
      const quotaAssegnata = somma(Object.values(s.quota ?? {}));
      const quotaDecreto = indirizzo.quota.ore[a - 1];
      if (s.stato === 'da-definire' && quotaAssegnata > 0) {
        erroreAnno(
          `la classe non è deliberata ma risultano assegnate ${settimanali(quotaAssegnata)} della quota a ` +
            `disposizione; se la delibera c'è, metti "stato: deliberato"`,
        );
      }
      if (s.stato === 'deliberato' && quotaAssegnata !== quotaDecreto) {
        erroreAnno(
          `la classe è deliberata ma la quota assegnata è di ${settimanali(quotaAssegnata)}, ` +
            `mentre il decreto ne mette a disposizione ${settimanali(quotaDecreto)}`,
        );
      }

      const decretoGenerale = oreDecreto(generale, a);
      const decretoIndirizzo = oreDecreto(indirizzo, a);
      const oreDisciplina = (id: string) =>
        (decretoGenerale.get(id) ?? 0) + (decretoIndirizzo.get(id) ?? 0) + (s.quota?.[id] ?? 0);

      if (s.compresenze) {
        segna(
          controllaAssegnazioni(
            erroreAnno,
            'compresenze assegnate',
            s.compresenze,
            nomiIndirizzo,
            nomiGenerale,
            'le compresenze riguardano solo l’area di indirizzo',
          ),
        );
        for (const [id, v] of Object.entries(s.compresenze)) {
          const nome = nomiIndirizzo.get(id);
          if (nome && v > oreDisciplina(id)) {
            erroreAnno(
              `"${nome}" ha ${settimanali(v)} in compresenza ma solo ${settimanali(oreDisciplina(id))} in tutto: ` +
                `le compresenze sono comprese nelle ore della disciplina`,
            );
          }
        }
        const totaleCompresenze = somma(Object.values(s.compresenze));
        const decreto = indirizzo.compresenza.ore[a - 1];
        if (totaleCompresenze !== decreto) {
          erroreAnno(
            `le compresenze sommano a ${settimanali(totaleCompresenze)}, ` +
              `ma il decreto ne prevede ${settimanali(decreto)}`,
          );
        }
      }

      segna(controllaRipartizioni(erroreAnno, s.ripartizioni, tutte, oreDisciplina));
    }
  } else {
    const quadro = richiama('quadro', p.quadro, 'liceo');
    if (!quadro) return errori;
    const nomi = nomiDiscipline(quadro);

    for (const a of ANNI) {
      const s = p.anni?.[a];
      if (!s) continue;
      const erroreAnno = (msg: string) => errore(`${classe(a)}: ${msg}`);
      segna(controllaAssegnazioni(erroreAnno, 'potenziamento', s.potenziamento, nomi, new Map(), ''));
      const decreto = oreDecreto(quadro, a);
      const oreDisciplina = (id: string) => (decreto.get(id) ?? 0) + (s.potenziamento?.[id] ?? 0);
      segna(controllaRipartizioni(erroreAnno, s.ripartizioni, nomi, oreDisciplina));
    }
  }

  if (!riferimentiValidi) return errori;

  // La somma delle ore di ogni classe, calcolata sul quadro che vedrà l'interfaccia.
  const q = componiQuadro(slug, p, ordinamenti);
  for (const a of ANNI) {
    const effettive = q.totali[a - 1].annue;
    const attese = totaleAtteso(p, ordinamenti, a);
    if (effettive !== attese) {
      errore(`${classe(a)}: il quadro somma a ${settimanali(effettive)}, attese ${settimanali(attese)}`);
    }
  }

  return errori;
}

function totaleAtteso(p: Percorso, ordinamenti: Dati['ordinamenti'], anno: Anno): number {
  if (p.tipo === 'tecnico') return TOTALI_TECNICI.classe[anno - 1];
  const quadro = ordinamenti[p.quadro];
  return quadro.totali[anno - 1] + somma(Object.values(p.anni?.[anno]?.potenziamento ?? {}));
}

/**
 * Le articolazioni dello stesso indirizzo condividono il primo biennio: decreto e delibere delle
 * prime due classi devono coincidere. Riceve solo i quadri già verificati.
 */
export function verificaArticolazioni(quadri: Quadro[], dati: Dati): string[] {
  const errori: string[] = [];
  const perIndirizzo = new Map<string, Quadro[]>();
  for (const q of quadri) {
    const p = dati.percorsi[q.slug];
    if (p?.tipo !== 'tecnico') continue;
    const indirizzo = (dati.ordinamenti[p.areaIndirizzo] as OrdinamentoIndirizzo).indirizzo;
    perIndirizzo.set(indirizzo, [...(perIndirizzo.get(indirizzo) ?? []), q]);
  }

  const biennio = (q: Quadro, anno: Anno) => {
    const righe = new Map<string, string>();
    for (const area of q.aree) {
      for (const r of area.righe) {
        const cella = r.celle[anno - 1];
        if (cella) righe.set(r.id, JSON.stringify({ nome: r.nome, cella }));
      }
      if (area.quota) righe.set('(quota a disposizione)', JSON.stringify(area.quota[anno - 1]));
    }
    righe.set('(stato della delibera)', JSON.stringify(q.anni[anno - 1]));
    return righe;
  };

  for (const [indirizzo, gruppo] of perIndirizzo) {
    const [primo, ...altri] = gruppo;
    for (const altro of altri) {
      for (const anno of PERIODI.primoBiennio) {
        const a = biennio(primo, anno);
        const b = biennio(altro, anno);
        const diverse = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
        if (diverse.length > 0) {
          errori.push(
            `percorsi/${altro.slug}: stesso indirizzo di "${primo.slug}" (${indirizzo}), quindi stesso primo ` +
              `biennio, ma in ${classe(anno)} differiscono: ${diverse.join(', ')}`,
          );
        }
      }
    }
  }
  return errori;
}

/** Tutte le verifiche sui dati. Elenco vuoto = dati corretti. */
export function verificaDati(dati: Dati): string[] {
  const errori: string[] = [];
  const ordinamentiValidi = new Set<string>();
  for (const [id, o] of Object.entries(dati.ordinamenti)) {
    const e = verificaOrdinamento(id, o);
    errori.push(...e);
    if (e.length === 0) ordinamentiValidi.add(id);
  }

  const quadri: Quadro[] = [];
  for (const [slug, p] of Object.entries(dati.percorsi)) {
    const e = verificaPercorso(slug, p, dati.ordinamenti);
    errori.push(...e);
    const richiamati = p.tipo === 'tecnico' ? [p.areaGenerale, p.areaIndirizzo] : [p.quadro];
    if (e.length === 0 && richiamati.every((id) => ordinamentiValidi.has(id))) {
      quadri.push(componiQuadro(slug, p, dati.ordinamenti));
    }
  }

  errori.push(...verificaArticolazioni(quadri, dati));
  return errori;
}
