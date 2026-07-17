const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Wait for Connect Wallet button
  await page.waitForSelector('#connect-wallet-button');
  
  // Click it
  await page.click('#connect-wallet-button');
  
  // Wait for modal
  await page.waitForSelector('.space-y-3');
  
  // Get HTML of the list
  const html = await page.$eval('.space-y-3', el => el.innerHTML);
  console.log("MODAL HTML:");
  console.log(html);
  
  await browser.close();
})();
