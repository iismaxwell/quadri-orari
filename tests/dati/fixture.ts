/**
 * Dati di supporto ai test. I dati reali si leggono da src/content con `caricaDati`; qui ci sono
 * solo i dati FITTIZI che servono a esercitare casi non ancora presenti nel sito (licei,
 * compresenze, ripartizioni). Non sono delibere della scuola né quadri ministeriali.
 */
import { caricaDati } from '../../src/dati/carica';
import type { Dati, Ordinamento, Percorso, PercorsoTecnico } from '../../src/dati/schema';

let reali: Dati | undefined;

/** Una copia dei dati reali, modificabile dal singolo test. */
export async function datiReali(): Promise<Dati> {
  if (!reali) {
    const { dati, errori } = await caricaDati();
    if (errori.length > 0) throw new Error(errori.join('\n'));
    reali = dati;
  }
  return structuredClone(reali);
}

export function informatica(dati: Dati): PercorsoTecnico {
  const p = dati.percorsi.informatica;
  if (p.tipo !== 'tecnico') throw new Error('informatica dovrebbe essere un tecnico');
  return p;
}

/** Liceo FITTIZIO: due discipline, 2 + 1 ore settimanali in ogni classe. */
export const ORDINAMENTO_LICEO_FITTIZIO: Ordinamento = {
  area: 'liceo',
  allegato: 'prova',
  titolo: 'Quadro orario di prova',
  fonte: 'All. B - Quadro orario AREA ISTRUZIONE GENERALE NAZIONALE-signed.pdf',
  discipline: [
    { id: 'lingua-inglese', nome: 'Lingua inglese', ore: [66, 66, 66, 66, 66] },
    { id: 'fisica', nome: 'Fisica', ore: [33, 33, 33, 33, 33] },
  ],
  totali: [99, 99, 99, 99, 99],
  note: [],
};

/** Percorso liceo FITTIZIO con un'ora di potenziamento di Inglese in 1ª. */
export const PERCORSO_LICEO_FITTIZIO: Percorso = {
  tipo: 'liceo',
  nome: 'Liceo di prova',
  indirizzo: 'Liceo di prova',
  icona: 'liceo-scienze-applicate',
  ordine: 99,
  quadro: 'liceo-prova',
  anni: { 1: { potenziamento: { 'lingua-inglese': 33 } } },
};

export async function datiConLiceo(): Promise<Dati> {
  const dati = await datiReali();
  dati.ordinamenti['liceo-prova'] = structuredClone(ORDINAMENTO_LICEO_FITTIZIO);
  dati.percorsi['liceo-prova'] = structuredClone(PERCORSO_LICEO_FITTIZIO);
  return dati;
}

/** Compresenze FITTIZIE della 1ª (le stesse di docs/brief-design.md): 2 + 1 + 2 = 5 ore settimanali. */
export const COMPRESENZE_PRIMA_FITTIZIE = {
  'scienze-sperimentali': 66,
  'tecnologie-rappresentazione-grafica': 33,
  'informatica-reti': 66,
};

/** Ripartizione FITTIZIA di Scienze sperimentali in 1ª (6 ore settimanali). */
export const RIPARTIZIONE_PRIMA_FITTIZIA = [
  { nome: 'Fisica', ore: 66 },
  { nome: 'Chimica', ore: 66 },
  { nome: 'Biologia', ore: 33 },
  { nome: 'Scienze della Terra', ore: 33 },
];
