import { describe, expect, it } from 'vitest';
import { caricaDati, verificaFile } from '../../src/dati/carica';
import { percorsoSchema, type OrdinamentoGenerale, type OrdinamentoIndirizzo } from '../../src/dati/schema';
import { verificaDati } from '../../src/dati/verifiche';
import {
  COMPRESENZE_PRIMA_FITTIZIE,
  RIPARTIZIONE_PRIMA_FITTIZIA,
  datiConLiceo,
  datiReali,
  informatica,
} from './fixture';

const generale = (d: Awaited<ReturnType<typeof datiReali>>) =>
  d.ordinamenti['area-generale'] as OrdinamentoGenerale;
const c8 = (d: Awaited<ReturnType<typeof datiReali>>) => d.ordinamenti['c8-informatica'] as OrdinamentoIndirizzo;
const disciplina = (o: OrdinamentoGenerale | OrdinamentoIndirizzo, id: string) => {
  const d = o.discipline.find((x) => x.id === id);
  if (!d) throw new Error(`manca ${id}`);
  return d;
};

/** Verifica che tra gli errori ce ne sia almeno uno che contiene ciascun frammento. */
function atteso(errori: string[], ...frammenti: string[]) {
  expect(errori.length, 'i dati sbagliati devono essere rifiutati').toBeGreaterThan(0);
  for (const f of frammenti) {
    expect(errori.some((e) => e.includes(f)), `nessun errore contiene "${f}":\n${errori.join('\n')}`).toBe(true);
  }
}

describe('dati reali', () => {
  it('rispettano lo schema', async () => {
    const { errori } = await caricaDati();
    expect(errori).toEqual([]);
  });

  it('superano tutte le verifiche', async () => {
    const dati = await datiReali();
    expect(verificaDati(dati)).toEqual([]);
    expect(verificaFile(dati)).toEqual([]);
  });
});

describe('totali annui', () => {
  it('rifiuta una disciplina che non somma al totale del decreto', async () => {
    const d = await datiReali();
    disciplina(generale(d), 'matematica').ore[0] = 165;
    atteso(verificaDati(d), 'ordinamenti/area-generale: 1ª: le discipline sommano a 660 ore annue');
  });

  it('rifiuta un errore ricopiato in modo coerente anche nei totali del file', async () => {
    const d = await datiReali();
    const g = generale(d);
    disciplina(g, 'matematica').ore[0] = 165;
    g.totali[0] = 660;
    g.ambiti.find((a) => a.id === 'matematico')!.monteOre.primoBiennio = 297;
    g.monteOreTotale.primoBiennio = 1254;
    const errori = verificaDati(d);
    atteso(errori, "1ª: l'area generale ha 660 ore annue, attese 627", '1ª: il quadro somma a 1089 ore annue');
    expect(errori.some((e) => e.startsWith('ordinamenti/'))).toBe(false);
  });
});

describe("monte ore d'ambito", () => {
  it('rifiuta ore spostate tra ambiti diversi anche se il totale annuo torna', async () => {
    const d = await datiReali();
    disciplina(c8(d), 'informatica-reti').ore[0] = 99;
    disciplina(c8(d), 'tecnologie-rappresentazione-grafica').ore[0] = 132;
    const errori = verificaDati(d);
    atteso(
      errori,
      'ambito "Tecnologie di base", primo biennio: le discipline sommano a 231 ore',
      'ambito "Elementi di base dell’indirizzo", primo biennio: le discipline sommano a 231 ore',
    );
    expect(errori.some((e) => e.includes('le discipline sommano a') && e.includes('ª:'))).toBe(false);
  });

  it('rifiuta una riga di quota che non somma al monte ore del periodo', async () => {
    const d = await datiReali();
    c8(d).quota.monteOre.quintoAnno = 198;
    atteso(verificaDati(d), 'riga "quota a disposizione", quinto anno: le classi sommano a 231 ore, ma il decreto dà 198');
  });
});

describe('quota a disposizione', () => {
  it('rifiuta ore di quota assegnate in una classe non deliberata', async () => {
    const d = await datiReali();
    informatica(d).anni[2].quota = { 'scienze-sperimentali': 66 };
    atteso(verificaDati(d), 'percorsi/informatica: 2ª: la classe non è deliberata ma risultano assegnate 66 ore annue');
  });

  it('rifiuta una classe deliberata con la quota assegnata solo in parte', async () => {
    const d = await datiReali();
    informatica(d).anni[1].quota = { 'scienze-sperimentali': 33 };
    atteso(verificaDati(d), '1ª: la classe è deliberata ma la quota assegnata è di 33 ore annue (1 settimanale)');
  });

  it("rifiuta la quota assegnata a una disciplina dell'area generale", async () => {
    const d = await datiReali();
    informatica(d).anni[1].quota = { 'lingua-inglese': 66 };
    atteso(verificaDati(d), 'quota assegnata a "Lingua inglese": la quota a disposizione si assegna solo');
  });

  it('rifiuta la quota assegnata a una disciplina inesistente', async () => {
    const d = await datiReali();
    informatica(d).anni[1].quota = { robotica: 66 };
    atteso(verificaDati(d), 'quota assegnata a una disciplina inesistente: "robotica"');
  });

  it('accetta una nuova classe deliberata con tutta la quota assegnata', async () => {
    const d = await datiReali();
    informatica(d).anni[2] = { stato: 'deliberato', quota: { 'scienze-sperimentali': 66 } };
    expect(verificaDati(d)).toEqual([]);
  });
});

describe('ore settimanali intere (multipli di 33)', () => {
  it('rifiuta un numero di ore annue non multiplo di 33 in un decreto', async () => {
    const d = await datiReali();
    disciplina(generale(d), 'storia').ore[2] = 70;
    atteso(verificaDati(d), 'ordinamenti/area-generale: Storia, 3ª: 70 ore annue non è un multiplo di 33');
  });

  it('rifiuta ore di quota non multiple di 33', async () => {
    const d = await datiReali();
    informatica(d).anni[1].quota = { 'scienze-sperimentali': 50 };
    atteso(verificaDati(d), 'quota assegnata a "Scienze sperimentali": 50 ore annue non è un multiplo di 33');
  });

  it('rifiuta una ripartizione in ore non multiple di 33', async () => {
    const d = await datiReali();
    informatica(d).anni[1].ripartizioni = {
      'scienze-sperimentali': [
        { nome: 'Fisica', ore: 100 },
        { nome: 'Chimica', ore: 98 },
      ],
    };
    atteso(verificaDati(d), 'Fisica ha 100 ore annue, non un multiplo di 33');
  });
});

describe('compresenze', () => {
  it('accetta compresenze che sommano al totale del decreto', async () => {
    const d = await datiReali();
    informatica(d).anni[1].compresenze = { ...COMPRESENZE_PRIMA_FITTIZIE };
    expect(verificaDati(d)).toEqual([]);
  });

  it('rifiuta compresenze maggiori delle ore della disciplina', async () => {
    const d = await datiReali();
    informatica(d).anni[1].compresenze = {
      'scienze-sperimentali': 33,
      'tecnologie-rappresentazione-grafica': 132,
    };
    atteso(
      verificaDati(d),
      '"Tecnologie e tecniche di rappresentazione grafica" ha 132 ore annue (4 settimanali) in compresenza ma solo 99',
    );
  });

  it('conta le ore di quota tra quelle della disciplina', async () => {
    const d = await datiReali();
    // 5 ore in compresenza su 6 di Scienze sperimentali (4 del decreto + 2 della quota).
    informatica(d).anni[1].compresenze = { 'scienze-sperimentali': 165 };
    expect(verificaDati(d)).toEqual([]);
  });

  it('rifiuta compresenze che non sommano al totale del decreto', async () => {
    const d = await datiReali();
    informatica(d).anni[1].compresenze = { 'scienze-sperimentali': 66 };
    atteso(verificaDati(d), '1ª: le compresenze sommano a 66 ore annue (2 settimanali), ma il decreto ne prevede 165');
  });

  it("rifiuta compresenze nell'area generale", async () => {
    const d = await datiReali();
    informatica(d).anni[1].compresenze = { ...COMPRESENZE_PRIMA_FITTIZIE, matematica: 33 };
    atteso(verificaDati(d), 'compresenze assegnate a "Matematica": le compresenze riguardano solo');
  });
});

describe('ripartizioni', () => {
  it('accetta una ripartizione che somma alle ore della disciplina, quota compresa', async () => {
    const d = await datiReali();
    informatica(d).anni[1].ripartizioni = { 'scienze-sperimentali': [...RIPARTIZIONE_PRIMA_FITTIZIA] };
    expect(verificaDati(d)).toEqual([]);
  });

  it('rifiuta una ripartizione che non somma alle ore della disciplina', async () => {
    const d = await datiReali();
    informatica(d).anni[1].ripartizioni = {
      'scienze-sperimentali': [
        { nome: 'Fisica', ore: 66 },
        { nome: 'Chimica', ore: 66 },
      ],
    };
    atteso(verificaDati(d), 'le parti sommano a 132 ore annue (4 settimanali), ma la disciplina ne ha 198 ore annue (6 settimanali)');
  });

  it('rifiuta la ripartizione di una disciplina assente in quella classe', async () => {
    const d = await datiReali();
    informatica(d).anni[3].ripartizioni = { 'scienze-sperimentali': [...RIPARTIZIONE_PRIMA_FITTIZIA] };
    atteso(verificaDati(d), '3ª: ripartizione di "Scienze sperimentali", che in questa classe non ha ore');
  });
});

describe('riferimenti e articolazioni', () => {
  it('rifiuta un ordinamento inesistente', async () => {
    const d = await datiReali();
    informatica(d).areaIndirizzo = 'c8-inesistente';
    atteso(verificaDati(d), 'areaIndirizzo: ordinamento "c8-inesistente" inesistente');
  });

  it("rifiuta un ordinamento dell'area sbagliata", async () => {
    const d = await datiReali();
    informatica(d).areaIndirizzo = 'area-generale';
    atteso(verificaDati(d), `areaIndirizzo: l'ordinamento "area-generale" ha area "generale", serve "indirizzo"`);
  });

  it('rifiuta una disciplina senza ambito in un tecnico', async () => {
    const d = await datiReali();
    delete disciplina(c8(d), 'informatica').ambito;
    atteso(verificaDati(d), "ordinamenti/c8-informatica: Informatica: manca l'ambito");
  });

  it('accetta due articolazioni dello stesso indirizzo con lo stesso primo biennio', async () => {
    const d = await datiReali();
    d.percorsi['informatica-bis'] = structuredClone(informatica(d));
    expect(verificaDati(d)).toEqual([]);
  });

  it('rifiuta due articolazioni dello stesso indirizzo con primi bienni diversi', async () => {
    const d = await datiReali();
    const bis = structuredClone(informatica(d));
    bis.anni[1].quota = { 'tecnologie-rappresentazione-grafica': 66 };
    d.percorsi['informatica-bis'] = bis;
    atteso(
      verificaDati(d),
      'percorsi/informatica-bis: stesso indirizzo di "informatica" (Informatica e telecomunicazioni)',
      'in 1ª differiscono: scienze-sperimentali, tecnologie-rappresentazione-grafica',
    );
  });

  it("rifiuta un'icona che non esiste", async () => {
    const d = await datiReali();
    informatica(d).icona = 'inesistente';
    expect(verificaFile(d)).toEqual([
      'percorsi/informatica: icona "inesistente.svg" non trovata in src/assets/icone-indirizzi/',
    ]);
  });
});

describe('licei (dati fittizi)', () => {
  it('accettano un quadro senza ambiti né quota, con un potenziamento', async () => {
    expect(verificaDati(await datiConLiceo())).toEqual([]);
  });

  it('rifiutano un potenziamento non multiplo di 33', async () => {
    const d = await datiConLiceo();
    const p = d.percorsi['liceo-prova'];
    if (p.tipo !== 'liceo') throw new Error();
    p.anni = { 1: { potenziamento: { fisica: 20 } } };
    atteso(verificaDati(d), 'potenziamento a "Fisica": 20 ore annue non è un multiplo di 33');
  });

  it('rifiutano discipline con ambito', async () => {
    const d = await datiConLiceo();
    d.ordinamenti['liceo-prova'].discipline[0].ambito = 'linguistico';
    atteso(verificaDati(d), 'nei licei le discipline non hanno ambito');
  });
});

describe('schema', () => {
  it('rifiuta uno stato di delibera sconosciuto', () => {
    const esito = percorsoSchema.safeParse({
      tipo: 'tecnico',
      nome: 'X',
      indirizzo: 'X',
      icona: 'x',
      ordine: 1,
      areaGenerale: 'area-generale',
      areaIndirizzo: 'c8-informatica',
      anni: { 1: { stato: 'forse' }, 2: { stato: 'da-definire' }, 3: { stato: 'da-definire' }, 4: { stato: 'da-definire' }, 5: { stato: 'da-definire' } },
    });
    expect(esito.success).toBe(false);
  });

  it('rifiuta un tecnico senza tutte e cinque le classi', () => {
    const esito = percorsoSchema.safeParse({
      tipo: 'tecnico',
      nome: 'X',
      indirizzo: 'X',
      icona: 'x',
      ordine: 1,
      areaGenerale: 'area-generale',
      areaIndirizzo: 'c8-informatica',
      anni: { 1: { stato: 'deliberato' } },
    });
    expect(esito.success).toBe(false);
  });

  it('rifiuta campi sconosciuti, per esempio un refuso', () => {
    const esito = percorsoSchema.safeParse({
      tipo: 'liceo',
      nome: 'X',
      indirizzo: 'X',
      icona: 'x',
      ordine: 1,
      quadro: 'x',
      anni: { 1: { potenziamenti: { fisica: 33 } } },
    });
    expect(esito.success).toBe(false);
  });
});
