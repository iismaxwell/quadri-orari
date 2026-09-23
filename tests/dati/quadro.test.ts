import { describe, expect, it } from 'vitest';
import { componiQuadro, type Quadro } from '../../src/dati/quadro';
import { COMPRESENZE_PRIMA_FITTIZIE, RIPARTIZIONE_PRIMA_FITTIZIA, datiConLiceo, datiReali, informatica } from './fixture';

const settimanali = (valori: Array<{ settimanali: number }>) => valori.map((v) => v.settimanali);

function riga(q: Quadro, id: string) {
  const r = q.aree.flatMap((a) => a.righe).find((x) => x.id === id);
  if (!r) throw new Error(`manca la riga ${id}`);
  return r;
}

async function quadroInformatica(modifica?: (p: ReturnType<typeof informatica>) => void) {
  const d = await datiReali();
  modifica?.(informatica(d));
  return componiQuadro('informatica', informatica(d), d.ordinamenti);
}

describe('quadro di Informatica', () => {
  it('ha i totali settimanali dei decreti', async () => {
    const q = await quadroInformatica();
    expect(settimanali(q.totali)).toEqual([32, 32, 32, 32, 30]);
    expect(q.totali.map((t) => t.annue)).toEqual([1056, 1056, 1056, 1056, 990]);
    expect(q.aree.map((a) => a.area)).toEqual(['generale', 'indirizzo']);
    expect(settimanali(q.aree[0].totali)).toEqual([19, 18, 15, 15, 14]);
    expect(settimanali(q.aree[1].totali)).toEqual([13, 14, 17, 17, 16]);
  });

  it('mostra la 1ª deliberata e le altre da definire', async () => {
    const q = await quadroInformatica();
    expect(q.anni.map((a) => a.daDefinire)).toEqual([false, true, true, true, true]);
  });

  it('tiene distinte le ore del decreto e quelle della quota', async () => {
    const q = await quadroInformatica();
    const [prima, seconda, terza] = riga(q, 'scienze-sperimentali').celle;
    expect(prima?.totale.settimanali).toBe(6);
    expect(prima?.decreto.settimanali).toBe(4);
    expect(prima?.scuola.settimanali).toBe(2);
    expect(seconda?.totale.settimanali).toBe(5);
    expect(seconda?.scuola.settimanali).toBe(0);
    expect(terza).toBeNull();
  });

  it('mostra la quota non assegnata come da definire', async () => {
    const q = await quadroInformatica();
    const quota = q.aree[1].quota!;
    expect(settimanali(quota.map((x) => x.totale))).toEqual([2, 2, 3, 3, 7]);
    expect(settimanali(quota.map((x) => x.assegnata))).toEqual([2, 0, 0, 0, 0]);
    expect(settimanali(quota.map((x) => x.daDefinire))).toEqual([0, 2, 3, 3, 7]);
    expect(q.aree[0].quota).toBeNull();
  });

  it('riporta le celle vuote come null', async () => {
    const q = await quadroInformatica();
    expect(riga(q, 'geografia').celle.map((c) => c?.totale.settimanali ?? null)).toEqual([1, null, null, null, null]);
    expect(riga(q, 'informatica').celle.map((c) => c?.totale.settimanali ?? null)).toEqual([null, null, 6, 6, 5]);
  });

  it('riporta ambiti e note dei decreti', async () => {
    const q = await quadroInformatica();
    expect(riga(q, 'lingua-inglese').ambito).toEqual({ id: 'linguistico', nome: 'Linguistico' });
    const [nota] = riga(q, 'complementi-matematica').note;
    expect(nota.testo).toContain('unica valutazione');
    expect(riga(q, 'informatica').note).toEqual([]);
  });

  it('riporta il totale delle compresenze del decreto', async () => {
    const q = await quadroInformatica();
    expect(settimanali(q.aree[1].compresenza!)).toEqual([5, 5, 8, 9, 9]);
    expect(q.aree[0].compresenza).toBeNull();
  });

  it('lascia a null compresenze e ripartizioni non ancora deliberate', async () => {
    const q = await quadroInformatica();
    const prima = riga(q, 'scienze-sperimentali').celle[0];
    expect(prima?.compresenza).toBeNull();
    expect(prima?.ripartizione).toBeNull();
  });
});

describe('quadro con compresenze e ripartizione (dati fittizi)', () => {
  it('distingue "zero compresenze" da "non ancora indicate"', async () => {
    const q = await quadroInformatica((p) => {
      p.anni[1].compresenze = { ...COMPRESENZE_PRIMA_FITTIZIE };
    });
    expect(riga(q, 'scienze-sperimentali').celle[0]?.compresenza?.settimanali).toBe(2);
    expect(riga(q, 'tecnologie-rappresentazione-grafica').celle[0]?.compresenza?.settimanali).toBe(1);
    expect(riga(q, 'informatica-reti').celle[0]?.compresenza?.settimanali).toBe(2);
    expect(riga(q, 'scienze-sperimentali').celle[1]?.compresenza).toBeNull();
    expect(riga(q, 'matematica').celle[0]?.compresenza).toBeNull();
  });

  it('riporta la ripartizione in ore settimanali', async () => {
    const q = await quadroInformatica((p) => {
      p.anni[1].ripartizioni = { 'scienze-sperimentali': [...RIPARTIZIONE_PRIMA_FITTIZIA] };
    });
    const r = riga(q, 'scienze-sperimentali').celle[0]?.ripartizione;
    expect(r?.map((x) => [x.nome, x.ore.settimanali])).toEqual([
      ['Fisica', 2],
      ['Chimica', 2],
      ['Biologia', 1],
      ['Scienze della Terra', 1],
    ]);
  });
});

describe('quadro di un liceo (dati fittizi)', () => {
  it('ha un solo quadro, senza quota né compresenze, con il potenziamento sommato', async () => {
    const d = await datiConLiceo();
    const q = componiQuadro('liceo-prova', d.percorsi['liceo-prova'], d.ordinamenti);
    expect(q.aree.map((a) => a.area)).toEqual(['liceo']);
    expect(q.aree[0].quota).toBeNull();
    expect(q.aree[0].compresenza).toBeNull();
    expect(q.anni.every((a) => !a.daDefinire)).toBe(true);
    expect(settimanali(q.totali)).toEqual([4, 3, 3, 3, 3]);
    const inglese = riga(q, 'lingua-inglese').celle[0];
    expect([inglese?.decreto.settimanali, inglese?.scuola.settimanali]).toEqual([2, 1]);
  });
});

describe('riferimenti', () => {
  it('lancia un errore invece di ignorare un ordinamento inesistente', async () => {
    const d = await datiReali();
    informatica(d).areaIndirizzo = 'inesistente';
    expect(() => componiQuadro('informatica', informatica(d), d.ordinamenti)).toThrow('inesistente');
  });

  it('lancia un errore invece di ignorare una quota su una disciplina inesistente', async () => {
    const d = await datiReali();
    informatica(d).anni[1].quota = { robotica: 66 };
    expect(() => componiQuadro('informatica', informatica(d), d.ordinamenti)).toThrow('robotica');
  });
});
