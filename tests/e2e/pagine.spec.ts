import { expect, test } from '@playwright/test';

const SCHEDE = ['informatica', 'telecomunicazioni', 'biotecnologie-ambientali', 'energia'];
const VOCI_MENU = ['Indirizzi', 'La riforma in breve', 'Documenti', 'Domande frequenti', "Contatti per l'orientamento"];

test('la home elenca i quattro indirizzi tecnici e il menu ha tutte le voci', async ({ page }) => {
  const risposta = await page.goto('./');
  expect(risposta?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Riforma degli istituti tecnici');

  const menu = page.locator('nav.menu a');
  await expect(menu).toHaveText(VOCI_MENU);

  for (const slug of SCHEDE) {
    await expect(page.locator(`.carta[href="/${slug}/"]`)).toBeVisible();
  }
});

test('dalla home si arriva alla scheda di un indirizzo', async ({ page }) => {
  await page.goto('./');
  await page.locator('.carta__nome', { hasText: 'Informatica' }).click();
  await expect(page).toHaveURL(/\/informatica\/$/);
  await expect(page.locator('h1')).toHaveText('Informatica');
});

test('la FAQ apre e chiude una domanda per volta con <details>', async ({ page }) => {
  await page.goto('./faq/');
  const prima = page.locator('details.domanda').first();
  await expect(prima).not.toHaveJSProperty('open', true);
  await prima.locator('summary').click();
  await expect(prima).toHaveJSProperty('open', true);
  await prima.locator('summary').click();
  await expect(prima).toHaveJSProperty('open', false);
});

test('la pagina Documenti linka i quattro PDF pubblicati', async ({ page }) => {
  await page.goto('./documenti/');
  const link = page.getByRole('link', { name: /Allegato B/ });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/\/documenti\/All\.-B-.*\.pdf$/);
  const risposta = await page.request.get(href!);
  expect(risposta.status()).toBe(200);
  expect(risposta.headers()['content-type']).toContain('pdf');
});

test('una pagina bozza mostra l’avviso', async ({ page }) => {
  await page.goto('./contatti/');
  await expect(page.getByText('Bozza — testo in revisione')).toBeVisible();
});

test('una URL inesistente mostra la pagina 404 con il link alla home', async ({ page }) => {
  const risposta = await page.goto('./pagina-inesistente/');
  expect(risposta?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Pagina non trovata');
  await expect(page.getByRole('link', { name: /Torna alla scelta dell'indirizzo/ })).toHaveAttribute('href', '/');
});

test('la tendina del menu porta a un altro indirizzo senza passare dalla home', async ({ page }) => {
  await page.goto('./informatica/');
  const pulsante = page.getByRole('button', { name: 'Scegli un indirizzo' });
  const tendina = page.locator('#tendina-indirizzi');
  await expect(tendina).toBeHidden();

  await pulsante.click();
  await expect(pulsante).toHaveAttribute('aria-expanded', 'true');
  await expect(tendina.getByRole('link')).toHaveText([
    'Informatica',
    'Telecomunicazioni',
    'Biotecnologie ambientali',
    'Energia',
    'Tutti gli indirizzi',
  ]);
  await expect(tendina.locator('a[aria-current="page"]')).toHaveText('Informatica');

  await page.keyboard.press('Escape');
  await expect(tendina).toBeHidden();
  await expect(pulsante).toBeFocused();

  await pulsante.click();
  await tendina.getByRole('link', { name: 'Energia' }).click();
  await expect(page).toHaveURL(/\/energia\/$/);
});

test('la tendina del menu su smartphone sta nello schermo', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Scegli un indirizzo' }).click();
  const riquadro = await page.locator('#tendina-indirizzi').boundingBox();
  expect(riquadro!.x).toBeGreaterThanOrEqual(0);
  expect(riquadro!.x + riquadro!.width).toBeLessThanOrEqual(375);
});
