/**
 * Verifica i dati dei quadri orari: forma (schema), conti (invarianti di AGENTS.md) e file
 * richiamati. Esce con 1 al primo problema, così `npm run build` si ferma.
 * Stampa una riga per ogni percorso verificato.
 */
import { caricaDati, verificaFile } from '../src/dati/carica';
import { componiQuadro, type Quadro } from '../src/dati/quadro';
import { verificaDati } from '../src/dati/verifiche';

function riassunto(q: Quadro): string {
  const ore = q.totali.map((t) => t.settimanali).join('/');
  if (q.tipo === 'liceo') return `${ore} ore settimanali`;
  const deliberate = q.anni.filter((a) => !a.daDefinire).map((a) => `${a.anno}ª`);
  const daDefinire = q.anni.filter((a) => a.daDefinire).map((a) => `${a.anno}ª`);
  const parti = [
    deliberate.length > 0 ? `deliberate: ${deliberate.join(', ')}` : 'nessuna classe deliberata',
    daDefinire.length > 0 ? `da definire: ${daDefinire.join(', ')}` : 'tutte le classi deliberate',
  ];
  return `${ore} ore settimanali; ${parti.join('; ')}`;
}

const { dati, errori } = await caricaDati();
if (errori.length === 0) errori.push(...verificaDati(dati), ...verificaFile(dati));

if (errori.length > 0) {
  console.error(`✗ Dati dei quadri orari non validi (${errori.length} ${errori.length === 1 ? 'problema' : 'problemi'}):`);
  for (const e of errori) console.error(`  - ${e}`);
  process.exit(1);
}

const percorsi = Object.entries(dati.percorsi).sort(([, a], [, b]) => a.ordine - b.ordine);
for (const [slug, p] of percorsi) {
  console.log(`✓ ${slug} — ${riassunto(componiQuadro(slug, p, dati.ordinamenti))}`);
}
// Questa riga non deve contenere slug: le fasi successive contano le righe dei percorsi con grep.
const tabelle = Object.keys(dati.ordinamenti).length;
console.log(
  `Dati verificati: ${percorsi.length} ${percorsi.length === 1 ? 'percorso' : 'percorsi'}, ` +
    `${tabelle} ${tabelle === 1 ? 'tabella' : 'tabelle'} dei decreti.`,
);
