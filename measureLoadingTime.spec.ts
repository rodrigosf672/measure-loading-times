import { chromium } from 'playwright';
import fs from 'fs';

async function measureLoadingTime(users: number, iterations: number) {
  const loadingTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: users }, async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      try {
        const start = Date.now();
        await page.goto('https://google.com');
        const end = Date.now();

        const loadingTime = end - start;
        loadingTimes.push(loadingTime);
      } catch (error) {
        console.error('Error loading page:', error);
      } finally {
        await browser.close();
      }
    });

    await Promise.all(promises);
  }

  const averageLoadingTime = loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length;
  const timestamp = new Date().toISOString();

  console.log(`Average loading time for ${users} users over ${iterations} iterations: ${averageLoadingTime} ms`);
}

// Self-invoking async function to run the script
(async () => {
  const iterations = 5;
  for (const users of [10, 20, 30, 40, 50]) {
    await measureLoadingTime(users, iterations);
  }
})();