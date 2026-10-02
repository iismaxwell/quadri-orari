/**
 * Tendina "Indirizzi" del menu (src/layouts/Base.astro). Il link "Indirizzi" porta alla home e
 * funziona anche senza JavaScript; qui si attiva solo il pulsante accanto, che apre l'elenco.
 * Il pannello sta fuori dal `nav` perché questo, su smartphone, scorre di lato e lo taglierebbe.
 */
export function avviaTendinaIndirizzi(): void {
  const pulsante = document.querySelector<HTMLButtonElement>('[data-tendina-pulsante]');
  const pannello = document.querySelector<HTMLElement>('[data-tendina-pannello]');
  const testata = document.querySelector<HTMLElement>('.testata');
  const gruppo = pulsante?.closest<HTMLElement>('[data-tendina-gruppo]');
  if (!pulsante || !pannello || !testata || !gruppo) return;

  pulsante.hidden = false;

  const posiziona = () => {
    const t = testata.getBoundingClientRect();
    const g = gruppo.getBoundingClientRect();
    pannello.style.setProperty('--y', `${g.bottom - t.top}px`);
    pannello.style.setProperty('--x', `${g.left - t.left}px`);
  };

  const apri = () => {
    posiziona();
    pannello.hidden = false;
    pulsante.setAttribute('aria-expanded', 'true');
  };

  const chiudi = (restituisciFuoco = false) => {
    if (pannello.hidden) return;
    pannello.hidden = true;
    pulsante.setAttribute('aria-expanded', 'false');
    if (restituisciFuoco) pulsante.focus();
  };

  pulsante.addEventListener('click', () => (pannello.hidden ? apri() : chiudi()));

  document.addEventListener('click', (e) => {
    const bersaglio = e.target as Node;
    if (!pannello.contains(bersaglio) && !pulsante.contains(bersaglio)) chiudi();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') chiudi(true);
  });

  testata.addEventListener('focusout', (e) => {
    const verso = e.relatedTarget as Node | null;
    if (verso && !pannello.contains(verso) && !pulsante.contains(verso)) chiudi();
  });

  window.addEventListener('resize', () => chiudi());
}
