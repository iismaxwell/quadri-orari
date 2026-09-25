import { expect, test, type Page } from '@playwright/test';

const SCHEDE = ['informatica', 'telecomunicazioni', 'biotecnologie-ambientali', 'energia'];
const FILTRI = ['Biennio', 'Triennio', 'Quinquennio'];

const intestazioniAnni = (page: Page) => page.locator('thead th[data-anno]:visible .tabella__anno').allInnerTexts();
const totali = (page: Page) => page.locator('tfoot td:visible').allInnerTexts();

for (const slug of SCHEDE) {
  test(`la scheda ${slug} mostra i totali dei decreti`, async ({ page }) => {
    const risposta = await page.goto(`${slug}/`);
    expect(risposta?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect(await totali(page)).toEqual(['32', '32', '32', '32', '30']);
  });
}

test('il filtro mostra solo le colonne e le righe del periodo', async ({ page }) => {
  await page.goto('informatica/');
  const sistemiReti = page.getByRole('rowheader', { name: 'Sistemi e reti' });
  const geografia = page.getByRole('rowheader', { name: 'Geografia' });

  await page.getByRole('button', { name: 'Biennio' }).click();
  expect(await intestazioniAnni(page)).toEqual(['1ª', '2ª']);
  expect(await totali(page)).toEqual(['32', '32']);
  await expect(sistemiReti).toBeHidden();
  await expect(geografia).toBeVisible();
  await expect(page).toHaveURL(/\?periodo=biennio$/);

  await page.getByRole('button', { name: 'Triennio' }).click();
  expect(await intestazioniAnni(page)).toEqual(['3ª', '4ª', '5ª']);
  expect(await totali(page)).toEqual(['32', '32', '30']);
  await expect(sistemiReti).toBeVisible();
  await expect(geografia).toBeHidden();

  await page.getByRole('button', { name: 'Quinquennio' }).click();
  expect(await intestazioniAnni(page)).toEqual(['1ª', '2ª', '3ª', '4ª', '5ª']);
  await expect(page).not.toHaveURL(/periodo=/);
});

test('il periodo nell’URL sceglie il filtro e segue il link alla proiezione', async ({ page }) => {
  await page.goto('informatica/?periodo=triennio');
  expect(await intestazioniAnni(page)).toEqual(['3ª', '4ª', '5ª']);
  await expect(page.getByRole('button', { name: 'Triennio' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: 'A tutto schermo' })).toHaveAttribute(
    'href',
    /\/quadri-orari\/proiezione\/informatica\/\?periodo=triennio$/,
  );
});

test('l’interruttore mostra le ore annue', async ({ page }) => {
  await page.goto('informatica/');
  const interruttore = page.getByRole('switch', { name: 'Ore annue' });
  await interruttore.click();
  await expect(interruttore).toHaveAttribute('aria-checked', 'true');
  expect(await totali(page)).toEqual(['1056', '1056', '1056', '1056', '990']);
  await expect(page.locator('thead .tabella__unita')).toHaveText('ore all’anno', { useInnerText: true });
  await interruttore.click();
  expect(await totali(page)).toEqual(['32', '32', '32', '32', '30']);
});

test('il dettaglio ore mostra barrette e legenda', async ({ page }) => {
  await page.goto('informatica/');
  const legenda = page.locator('.legenda__voci');
  await expect(legenda).toBeHidden();
  await page.getByRole('switch', { name: 'Dettaglio ore' }).click();
  await expect(legenda).toBeVisible();
  await expect(legenda).toContainText('scelta della scuola');
  // Scienze sperimentali in 1ª: 4 ore del decreto e 2 della scuola.
  const prima = page.getByRole('row', { name: /^Scienze sperimentali/ }).locator('td[data-anno="1"]');
  await expect(prima.locator('.tacca--singola')).toHaveCount(4);
  await expect(prima.locator('.tacca--scuola')).toHaveCount(2);
});

test('la nota del decreto si apre e si chiude', async ({ page }) => {
  await page.goto('informatica/');
  const riga = page.getByRole('row', { name: /^Complementi di matematica/ });
  const nota = riga.getByRole('button', { name: 'Nota' });
  const testo = page.getByText(/assegnata al medesimo insegnante di Matematica/);
  await expect(testo).toBeHidden();
  await nota.click();
  await expect(nota).toHaveAttribute('aria-expanded', 'true');
  await expect(testo).toBeVisible();
  await nota.click();
  await expect(testo).toBeHidden();
});

test.describe('su smartphone (375 px)', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  for (const slug of SCHEDE) {
    test(`${slug}: la pagina non scorre di lato`, async ({ page }) => {
      await page.goto(`${slug}/`);
      for (const note of await page.getByRole('button', { name: 'Nota' }).all()) await note.click();
      await page.getByRole('switch', { name: 'Dettaglio ore' }).click();
      for (const filtro of FILTRI) {
        await page.getByRole('button', { name: filtro }).click();
        const larghezze = await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ]);
        expect(larghezze[0], `filtro ${filtro}`).toBeLessThanOrEqual(larghezze[1]);
      }
    });
  }
});
