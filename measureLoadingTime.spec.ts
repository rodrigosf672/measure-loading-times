import { chromium } from 'playwright';
import fs from 'fs';

async function measureLoadingTime(users: number, iterations: number): Promise<void> {
  const loadingTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: users }, async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      const start: number = Date.now();
      await page.goto('https://google.com');
      const end: number = Date.now();

      const loadingTime: number = end - start;
      loadingTimes.push(loadingTime);

      await browser.close();
    });

    await Promise.all(promises);
  }

  const averageLoadingTime: number = loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length;
  const timestamp: string = new Date().toISOString();

  console.log(`Average loading time for ${users} users over ${iterations} iterations: ${averageLoadingTime} ms`);

  const csvLine: string = `${timestamp},${users},${averageLoadingTime}\n`;
  
  if (!fs.existsSync('loading_times.csv')) {
    fs.writeFileSync('loading_times.csv', 'Timestamp,Users,Avg_Loading_Time\n', 'utf8');
  }

  fs.appendFileSync('loading_times.csv', csvLine, 'utf8');
}

(async () => {
  const iterations: number = 5;
  for (const users of [1, 2, 3, 4, 5]) {
    await measureLoadingTime(users, iterations);
  }
})();
