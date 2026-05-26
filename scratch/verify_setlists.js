const { chromium } = require('playwright');

async function testLocalSetlists() {
  const baseUrl = 'http://localhost:3100';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const consoleErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[Browser Console ${msg.type()}]: ${text}`);
    if (msg.type() === 'error' && !text.includes('en-US.json') && !text.includes('404')) {
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[Browser PageError]: ${err.stack || err.message}`);
    consoleErrors.push(err.message);
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[Browser API Response]: ${res.status()} ${res.url()}`);
    } else if (res.status() >= 400) {
      console.log(`[Browser Response Error]: ${res.status()} ${res.url()}`);
    }
  });

  console.log('1. Navigating to homepage...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#nav', { state: 'visible', timeout: 5000 });

  console.log('2. Clicking Setlists in navigation...');
  const setlistsNavBtn = page.locator('#nav-links button', { hasText: 'Setlists' });
  await setlistsNavBtn.click();

  console.log('2b. Clicking My Setlists tab for local setlists...');
  const mySetlistsTab = page.locator('.setlist-tabs button', { hasText: 'My Setlists' });
  await mySetlistsTab.click();

  // URL should update to #setlists
  await page.waitForTimeout(500);
  const currentHash = await page.evaluate(() => window.location.hash);
  console.log(`Current Hash: ${currentHash}`);

  console.log('3. Verifying local storage helper banner exists...');
  const banner = page.locator('p', { hasText: 'These setlists are saved in your browser' });
  await banner.waitFor({ state: 'visible', timeout: 5000 });

  console.log('4. Creating a new local setlist...');
  await page.click('button:has-text("New Setlist")');
  await page.fill('input[placeholder="Setlist name..."]', 'My Local Test Setlist');
  await page.click('button:has-text("Create")');

  // Page should route to edit page: #setlist/local_...
  await page.waitForFunction(() => window.location.hash.startsWith('#setlist/local_'));
  const editHash = await page.evaluate(() => window.location.hash);
  console.log(`Navigated to Local Edit View Hash: ${editHash}`);

  console.log('5. Verifying local metadata badge is visible...');
  const localBadge = page.locator('span', { hasText: 'Local Setlist (Saved in Browser)' });
  await localBadge.waitFor({ state: 'visible', timeout: 5000 });

  console.log('6. Going back to songs page to add a song...');
  await page.goto(baseUrl + '/');
  const urlAfterGoto = await page.evaluate(() => window.location.href);
  console.log(`URL after goto: ${urlAfterGoto}`);
  await page.waitForSelector('.song-grid', { state: 'visible', timeout: 5000 });

  console.log('7. Selecting first song...');
  const firstSongCard = page.locator('.song-card').first();
  await firstSongCard.click();
  await page.waitForSelector('.song-view-title', { state: 'visible', timeout: 5000 });

  console.log('8. Clicking Add to Setlist...');
  await page.click('button:has-text("+ Setlist")');
  
  // Select local setlist
  console.log('9. Selecting our local test setlist from list...');
  const localSetlistOption = page.locator('.song-card-title', { hasText: 'My Local Test Setlist' });
  await localSetlistOption.click();

  console.log('10. Verifying success toast...');
  const toast = page.locator('#toast.success');
  await toast.waitFor({ state: 'visible', timeout: 5000 });

  console.log('11. Navigating back to Setlists...');
  await page.goto(baseUrl + '/');
  await page.click('#nav-links button:has-text("Setlists")');
  await page.click('.setlist-tabs button:has-text("My Setlists")');
  await page.waitForTimeout(500);

  console.log('12. Opening the local setlist edit page...');
  const localSetlistCard = page.locator('.song-card-title', { hasText: 'My Local Test Setlist' });
  await localSetlistCard.click();
  await page.waitForSelector('.setlist-song-item', { state: 'visible', timeout: 5000 });

  console.log('13. Verifying song is in the local setlist...');
  const songTitle = await page.locator('.song-card-title').first().innerText();
  console.log(`Song in setlist: ${songTitle}`);

  console.log('14. Clicking Play...');
  await page.click('button:has-text("Open")');
  await page.waitForTimeout(1000);
  const hashAfterPlay = await page.evaluate(() => window.location.hash);
  console.log(`Hash after clicking Open: ${hashAfterPlay}`);
  const urlAfterPlay = await page.evaluate(() => window.location.href);
  console.log(`URL after clicking Open: ${urlAfterPlay}`);
  
  await page.waitForSelector('.setlist-play-container', { state: 'visible', timeout: 5000 });
  console.log('Navigated to Play View successfully (container is visible)');

  console.log('15. Checking current key display in toolbar...');
  await page.waitForSelector('#key-display', { state: 'visible', timeout: 5000 });
  const keyText = await page.locator('#key-display').innerText();
  console.log(`Current key: ${keyText}`);

  console.log('16. Transposing key...');
  await page.click('#key-display');
  // Click a transpose pill
  const keyPill = page.locator('.key-pill').first();
  const targetKey = await keyPill.innerText();
  await keyPill.click();
  console.log(`Selected new key: ${targetKey}`);

  console.log('17. Saving key locally...');
  await page.click('button:has-text("Save (Local)")');
  const saveToast = page.locator('#toast.success');
  await saveToast.waitFor({ state: 'visible', timeout: 5000 });

  console.log('18. Exiting player...');
  await page.click('.btn-exit');
  await page.waitForTimeout(1000);
  const finalHash = await page.evaluate(() => window.location.hash);
  console.log(`Final Hash: ${finalHash}`);

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors detected during run:\n${consoleErrors.join('\n')}`);
  }

  await browser.close();
  console.log('E2E Local Setlists Flow Passed successfully!');
}

testLocalSetlists().catch((err) => {
  console.error(err);
  process.exit(1);
});
