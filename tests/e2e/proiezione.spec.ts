import { expect, test, type Page } from '@playwright/test';

const SCHEDE = ['informatica', 'telecomunicazioni', 'biotecnologie-ambientali', 'energia'];

test.use({ viewport: { width: 1920, height: 1080 } });

const altezze = (page: Page) => page.evaluate(() => [document.documentElement.scrollHeight, window.innerHeight]);

for (const slug of SCHEDE) {
  test(`${slug}: il quadro sta in una schermata, con tutti e 5 gli anni`, async ({ page }) => {
    const risposta = await page.goto(`proiezione/${slug}/`);
    expect(risposta?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('row').first().getByRole('columnheader')).toHaveCount(6); // disciplina + 5 anni
    const [contenuto, finestra] = await altezze(page);
    expect(contenuto, 'l’altezza della pagina non deve superare quella della finestra').toBeLessThanOrEqual(finestra);
  });
}

test('le frecce e i tasti pagina cambiano il periodo e aggiornano l’URL', async ({ page }) => {
  await page.goto('proiezione/informatica/');
  await expect(page).not.toHaveURL(/periodo=/);
  await expect(page.getByRole('button', { name: 'Tutti e 5' })).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\?periodo=triennio$/);
  await expect(page.getByRole('button', { name: 'Triennio' })).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('PageUp');
  await expect(page).toHaveURL(/\?periodo=biennio$/);
  await expect(page.getByRole('button', { name: 'Biennio' })).toHaveAttribute('aria-pressed', 'true');

  // Al minimo del periodo, la freccia non fa scendere oltre.
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\?periodo=biennio$/);

  await page.keyboard.press('PageDown');
  await expect(page).toHaveURL(/\?periodo=triennio$/);

  await page.keyboard.press('ArrowRight');
  await expect(page).not.toHaveURL(/periodo=/);
  await expect(page.getByRole('button', { name: 'Tutti e 5' })).toHaveAttribute('aria-pressed', 'true');

  // Al massimo del periodo, la freccia non sale oltre.
  await page.keyboard.press('ArrowRight');
  await expect(page).not.toHaveURL(/periodo=/);
});

test('il pulsante del periodo aggiorna anche il link "Esci"', async ({ page }) => {
  await page.goto('proiezione/informatica/');
  await page.getByRole('button', { name: 'Biennio' }).click();
  await expect(page.getByRole('link', { name: 'Esci' })).toHaveAttribute('href', /\/quadri-orari\/informatica\/\?periodo=biennio$/);
});

test('i bersagli dei controlli sono grandi almeno 48 px', async ({ page }) => {
  await page.goto('proiezione/informatica/');
  const bersagli = await page.locator('.filtro button, .proiezione__pulsante').all();
  expect(bersagli.length).toBeGreaterThan(0);
  for (const bersaglio of bersagli) {
    const box = await bersaglio.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});
