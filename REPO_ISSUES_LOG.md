# Repository Evaluation - Top 3 Issues

## Project Purpose Understanding

This project is specifically designed to measure **Google.com loading times with 1-5 concurrent users** on an hourly basis, collecting time-series data for trend analysis via a Shiny dashboard. The "1-5 users" specification is intentional and core to the project's educational purpose in load testing simulation.

---

## Issue #1: No Error Handling or Resilience in Automated Workflow

### Description
Since this runs hourly via GitHub Actions without supervision, failures in browser operations, network issues, or file I/O could cause silent data gaps that go unnoticed for extended periods. The automated nature makes reliability critical.

### Current Problems
- **Browser launch failures**: No try-catch blocks around `chromium.launch()` - if Playwright fails to initialize, the entire hourly run is lost
- **Network timeouts**: No timeout configuration or retry logic for `page.goto()` calls
- **File system issues**: CSV append operations have no error handling - disk full or permission issues would fail silently
- **GitHub Actions workflow**: Uses `continue-on-error: true` which masks all failures
- **No health monitoring**: No way to detect when hourly data collection stops working
- **CSV corruption**: If a write is interrupted, the file could become malformed with no recovery mechanism

### Areas for Improvement to Consider
- Think about wrapping critical operations in try-catch blocks with appropriate error logging
- Consider adding retry logic for transient failures (network issues, browser startup)
- Reflect on implementing a notification system when data collection fails repeatedly
- Ponder how to validate CSV integrity before appending new data
- Consider adding GitHub Actions workflow status checks or alerts
- Think about implementing graceful degradation - partial data is better than no data

---

## Issue #2: No Data Quality Validation or Anomaly Detection

### Description
The measurement script collects and stores data without any validation that the measurements are reasonable or that the data collection process is working correctly. Outliers, corrupted measurements, or systematic issues could pollute the dataset.

### Current Problems
- **No sanity checks**: Values are stored regardless of whether they make sense (e.g., 0ms or 999999ms)
- **No outlier detection**: A single failed measurement can skew the average significantly
- **No baseline validation**: Can't detect when Google.com returns errors vs. actual page load
- **Dashboard shows raw data**: No flagging of suspicious data points in visualizations
- **No verification of concurrent behavior**: No way to confirm browsers actually ran concurrently
- **Silent CSV format drift**: Changes to output format could break the dashboard silently

### Areas for Improvement to Consider
- Think about validating that loading times fall within reasonable bounds (e.g., 100ms - 30000ms)
- Consider checking HTTP response status codes before recording timing data
- Reflect on implementing statistical outlier detection in the dashboard
- Ponder adding metadata to CSV (status codes, errors encountered, browser version)
- Consider validation that concurrent user measurements show expected scaling patterns
- Think about versioning the CSV schema to detect format mismatches

---

## Issue #3: Unbounded Data Growth Without Management Strategy

### Description
The CSV file grows indefinitely with hourly data collection (24 entries per day, ~8,760 per year). With no rotation, archival, or cleanup strategy, this creates long-term maintainability and performance issues.

### Current Problems
- **Infinite growth**: CSV file will continuously grow in the repository
- **Git bloat**: Every commit adds more CSV data to git history, increasing clone size
- **Dashboard performance**: R Shiny loads entire CSV into memory - will slow down over time
- **No archival strategy**: Old data has no lifecycle management (compress, archive, delete)
- **Repository size**: Large CSV files make repository operations slower
- **No data retention policy**: Unclear how long data should be kept

### Areas for Improvement to Consider
- Think about implementing data rotation (e.g., archive data older than 90 days)
- Consider storing historical data outside the git repository (database, cloud storage)
- Reflect on whether the dashboard needs all historical data or just recent trends
- Ponder using compressed formats or databases instead of CSV for storage
- Consider implementing data aggregation (daily/weekly summaries from hourly measurements)
- Think about adding a cleanup job to the GitHub Actions workflow
- Reflect on git best practices - should measurement data be in version control at all?

---

## Additional Observations

### Minor Issues Worth Noting
1. **Browser resource limits**: Launching 5 concurrent browser instances could overwhelm GitHub Actions runners
2. **Measurement timing accuracy**: The script's own overhead isn't isolated from page load time
3. **Dashboard dependency management**: R package versions aren't locked, could break over time
4. **No documentation on interpreting results**: README doesn't explain what "good" vs "bad" load times mean
5. **GitHub Actions timeout**: No maximum runtime set - hung browser could run for hours

### Strengths of Current Implementation
- **Focused purpose**: Clearly scoped to measure Google.com with 1-5 concurrent users
- **Simple, maintainable**: Easy to understand and modify
- **Automated collection**: Hourly GitHub Actions workflow runs without manual intervention
- **Good separation**: Measurement (TypeScript) and visualization (R) are cleanly separated
- **Educational value**: Demonstrates load testing concepts effectively
- **Proper gitignore**: Excludes build artifacts and dependencies appropriately

---

## Reflection Questions

As you consider these issues for future improvements, think about:
- **Reliability**: If this runs unattended for months, what could go wrong and how would you know?
- **Data quality**: How can you distinguish between real performance changes and measurement errors?
- **Long-term sustainability**: What happens when the CSV has 50,000 rows? 500,000 rows?
- **Evolution**: If you wanted to extend this to measure your own application, what would need to change?
- **Observability**: How would you diagnose why a particular measurement showed unusual values?

Remember: These observations focus on the reliability and maintainability of **this specific use case** (hourly automated measurements of Google.com). The project's focused scope is a strength - don't add complexity unless it solves real problems you're experiencing.
