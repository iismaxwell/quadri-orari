/**
 * Plugin rehype per le pagine di contenuto (collection `pagine`): ogni titolo di terzo livello
 * (`###`) e il testo che lo segue, fino al titolo successivo, diventa un `<details>/<summary>`.
 * Serve per le domande delle FAQ; sulle altre pagine, che non hanno titoli di terzo livello, non
 * cambia nulla.
 */
import type { Element, ElementContent, Root } from 'hast';

export function domandeEspandibili() {
  return (tree: Root) => {
    const risultato: ElementContent[] = [];
    let domanda: Element | null = null;
    let risposta: ElementContent[] = [];

    const chiudi = () => {
      if (domanda) {
        risultato.push({
          type: 'element',
          tagName: 'details',
          properties: { className: ['domanda'] },
          children: [
            { type: 'element', tagName: 'summary', properties: {}, children: domanda.children },
            ...risposta,
          ],
        });
      } else {
        risultato.push(...risposta);
      }
      domanda = null;
      risposta = [];
    };

    for (const nodo of tree.children) {
      if (nodo.type === 'element' && nodo.tagName === 'h3') {
        chiudi();
        domanda = nodo;
      } else {
        risposta.push(nodo as ElementContent);
      }
    }
    chiudi();

    tree.children = risultato;
  };
}
