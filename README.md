# Playwright Loading Time Measurement

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
   node script.js
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
Average loading time for 10 users over 5 iterations: 120 ms
Average loading time for 20 users over 5 iterations: 140 ms
...
```

## Notes
- Ensure network conditions are stable for accurate results.
- Running many concurrent users may consume significant system resources.
- The script defaults to testing `https://google.com`, but this can be modified as needed.
