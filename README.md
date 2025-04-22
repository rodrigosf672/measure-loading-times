# Playwright Loading Time Measurement of Google.com Page with concurrent 1-5 Users (Simulation)

## Overview
This script measures the loading time of a webpage using Playwright. It simulates multiple users accessing a specified URL concurrently and calculates the average loading time over multiple iterations.

## Prerequisites
- Node.js (latest LTS recommended)
- Playwright package installed

## Installation
1. Install dependencies:
   ```sh
   npm install playwright
   ```

## Usage
1. Run the script:
   ```sh
   ts-node measureLoadingTime.spec.ts
   ```
2. The script will:
   - Launch multiple browser instances concurrently.
   - Measure the time taken to load `https://google.com`.
   - Repeat the process for different user counts.
   - Output the average loading time for each test case.

## Configuration
- Modify the `users` parameter to change the number of concurrent browser instances.
- Adjust the `iterations` parameter to control the number of test repetitions.
- Change the `page.goto` URL to test a different webpage.

## Example Output
```
Average loading time for 1 user(s) over 5 iterations: 120 ms
Average loading time for 2 user(s) over 5 iterations: 140 ms
...
```

## Notes
- Ensure network conditions are stable for accurate results.
- Running many concurrent users may consume significant system resources.
- The script defaults to testing `https://google.com`, but this can be modified as needed.
- Results can be analyzed to track performance trends over time.
- Data collected can be visualized using a Shiny Dashboard.

## Disclaimer
- This project uses `https://google.com` solely as a stable test case for personal learning and educational purposes.
- It makes a low and limited number of automated requests, and does not involve scraping, user interaction automation, or high-frequency traffic.
- This project is provided as-is for educational use. If you choose to modify or adapt it, you are solely responsible for ensuring that your usage complies with all applicable laws and remains respectful of any target site's terms of service, rate limits, and infrastructure.



