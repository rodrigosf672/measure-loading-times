import { chromium } from 'playwright';
import fs from 'fs';

async function measureLoadingTime(users, iterations) {
  const loadingTimes = [];

  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: users }, async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      const start = Date.now();
      await page.goto('https://google.com');
      const end = Date.now();

      const loadingTime = end - start;
      loadingTimes.push(end - start);

      await browser.close();
    });

    await Promise.all(promises);
  }

  const averageLoadingTime = loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length;
  const timestamp = new Date().toISOString();

  console.log(`Average loading time for ${users} users over ${iterations} iterations: ${averageLoadingTime} ms`);

  const csvLine = `${timestamp},${users},${averageLoadingTime}\n`;
  fs.appendFileSync('loading_times.csv', csvLine);
}

(async () => {
  const iterations = 5;
  for (const users of [10, 20, 30, 40, 50]) {
    await measureLoadingTime(users, iterations);
  }
})();