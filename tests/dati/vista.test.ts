import { describe, expect, it } from 'vitest';
import { componiQuadro } from '../../src/dati/quadro';
import { isFiltro } from '../../src/dati/filtri';
import { vistaQuadro, type QuadroVista } from '../../src/dati/vista';
import { COMPRESENZE_PRIMA_FITTIZIE, RIPARTIZIONE_PRIMA_FITTIZIA, datiConLiceo, datiReali, informatica } from './fixture';

function riga(v: QuadroVista, id: string) {
  const r = v.aree.flatMap((a) => a.righe).find((x) => x.id === id);
  if (!r) throw new Error(`manca la riga ${id}`);
  return r;
}

async function vistaInformatica(modifica?: (p: ReturnType<typeof informatica>) => void) {
  const d = await datiReali();
  modifica?.(informatica(d));
  return vistaQuadro(componiQuadro('informatica', informatica(d), d.ordinamenti));
}

describe('vista del quadro di Informatica, dati reali', () => {
  it('ha due aree con i totali dei decreti', async () => {
    const v = await vistaInformatica();
    expect(v.aree.map((a) => a.titolo)).toEqual(['Area generale', 'Area di indirizzo']);
    expect(v.totali.map((t) => t.settimanali)).toEqual([32, 32, 32, 32, 30]);
    expect(v.sottotitolo).toBe('Istituto tecnico · Informatica e telecomunicazioni');
    expect(v.anni.map((a) => a.didascalia)).toEqual([
      'deliberata',
      'quota da definire',
      'quota da definire',
      'quota da definire',
      'quota da definire',
    ]);
  });

  it('distingue le celle vuote dell’area generale da quelle non attive dell’indirizzo', async () => {
    const v = await vistaInformatica();
    expect(riga(v, 'geografia').celle.map((c) => c.tipo)).toEqual(['ore', 'vuota', 'vuota', 'vuota', 'vuota']);
    expect(riga(v, 'sistemi-reti').celle.map((c) => c.tipo)).toEqual([
      'non-attiva',
      'non-attiva',
      'ore',
      'ore',
      'ore',
    ]);
    expect(riga(v, 'sistemi-reti').anni).toEqual([3, 4, 5]);
  });

  it('mostra le ore della scuola come tacche distinte', async () => {
    const v = await vistaInformatica();
    const prima = riga(v, 'scienze-sperimentali').celle[0];
    expect(prima).toMatchObject({ tipo: 'ore', settimanali: 6, annue: 198, scuola: 2, compresenza: null });
    if (prima.tipo !== 'ore') throw new Error('attesa una cella con ore');
    expect(prima.tacche).toEqual(['singola', 'singola', 'singola', 'singola', 'scuola', 'scuola']);
  });

  it('mette la quota assegnata in 1ª e quella da definire negli altri anni', async () => {
    const v = await vistaInformatica();
    const quota = riga(v, 'quota-a-disposizione');
    expect(quota.celle[0]).toEqual({ tipo: 'assegnata', a: ['Scienze sperimentali'] });
    expect(quota.celle.slice(1).map((c) => (c.tipo === 'da-definire' ? c.settimanali : null))).toEqual([2, 3, 3, 7]);
    expect(quota.anni).toEqual([1, 2, 3, 4, 5]);
  });

  it('non mostra compresenze né ripartizioni che la scuola non ha ancora comunicato', async () => {
    const v = await vistaInformatica();
    expect(v.legenda).toEqual({ compresenza: false, scuola: true, daDefinire: true });
    expect(riga(v, 'scienze-sperimentali').ripartizione).toBeNull();
  });

  it('riporta le note del decreto', async () => {
    const v = await vistaInformatica();
    expect(riga(v, 'complementi-matematica').note[0]).toMatch(/medesimo insegnante di Matematica/);
  });
});

describe('vista con dati FITTIZI', () => {
  it('mostra le compresenze come tacche comprese nelle ore', async () => {
    const v = await vistaInformatica((p) => {
      p.anni[1].compresenze = { ...COMPRESENZE_PRIMA_FITTIZIE };
    });
    const scienze = riga(v, 'scienze-sperimentali').celle[0];
    if (scienze.tipo !== 'ore') throw new Error('attesa una cella con ore');
    expect(scienze.tacche).toEqual(['singola', 'singola', 'compresenza', 'compresenza', 'scuola', 'scuola']);
    const grafica = riga(v, 'tecnologie-rappresentazione-grafica').celle[0];
    if (grafica.tipo !== 'ore') throw new Error('attesa una cella con ore');
    expect(grafica.tacche).toEqual(['singola', 'singola', 'compresenza']);
    expect(v.legenda.compresenza).toBe(true);
  });

  it('mostra la ripartizione di Scienze sperimentali, "da definire" negli anni non deliberati', async () => {
    const v = await vistaInformatica((p) => {
      p.anni[1].ripartizioni = { 'scienze-sperimentali': structuredClone(RIPARTIZIONE_PRIMA_FITTIZIA) };
    });
    const r = riga(v, 'scienze-sperimentali').ripartizione;
    expect(r?.materie).toEqual(['Fisica', 'Chimica', 'Biologia', 'Scienze della Terra']);
    expect(r?.celle.map((c) => c.tipo)).toEqual(['ore', 'da-definire', 'vuota', 'vuota', 'vuota']);
    const prima = r?.celle[0];
    expect(prima?.tipo === 'ore' && prima.materie.map((m) => m.settimanali)).toEqual([2, 2, 1, 1]);
  });

  it('dà a un liceo un’area sola, senza didascalie di delibera né quota', async () => {
    const d = await datiConLiceo();
    const v = vistaQuadro(componiQuadro('liceo-prova', d.percorsi['liceo-prova'], d.ordinamenti));
    expect(v.aree.map((a) => a.titolo)).toEqual([null]);
    expect(v.anni.every((a) => a.didascalia === null)).toBe(true);
    expect(v.aree[0].righe.map((r) => r.id)).toEqual(['lingua-inglese', 'fisica']);
    expect(v.legenda.daDefinire).toBe(false);
  });
});

describe('filtri', () => {
  it('riconosce solo i tre periodi', () => {
    expect(['biennio', 'triennio', 'quinquennio'].every(isFiltro)).toBe(true);
    expect(isFiltro('tutti')).toBe(false);
    expect(isFiltro('toString')).toBe(false);
    expect(isFiltro(null)).toBe(false);
  });
});
