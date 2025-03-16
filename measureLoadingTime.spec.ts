import { chromium } from 'playwright';

async function measureLoadingTime(users: number, iterations: number) {
  const loadingTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const promises = Array.from({ length: users }, async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      const start = Date.now();
      await page.goto('https://google.com');
      const end = Date.now();

      const loadingTime = end - start;
      loadingTimes.push(loadingTime);

      await browser.close();
    });

    await Promise.all(promises);
  }

  const averageLoadingTime = loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length;
  console.log(`Average loading time for ${users} users over ${iterations} iterations: ${averageLoadingTime} ms`);
}

(async () => {
  const iterations = 5;
  await measureLoadingTime(10, iterations);
  await measureLoadingTime(20, iterations);
  await measureLoadingTime(30, iterations);
  await measureLoadingTime(40, iterations);
  await measureLoadingTime(50, iterations);
})();