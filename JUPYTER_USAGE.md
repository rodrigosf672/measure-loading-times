# Jupyter Notebooks Usage Guide

This guide explains how to use the Jupyter notebooks and Voila dashboard for analyzing Google.com loading times.

## Prerequisites

Make sure you have installed all Python dependencies:

```bash
pip install -r requirements.txt
```

## 1. Exploratory Data Analysis Notebook

The `loading_times_analysis.ipynb` notebook provides comprehensive analysis of the loading times data.

### Running the Analysis Notebook

```bash
jupyter notebook loading_times_analysis.ipynb
```

Or to run all cells and view the output:

```bash
jupyter nbconvert --to notebook --execute loading_times_analysis.ipynb --output loading_times_analysis_executed.ipynb
```

### What the Analysis Notebook Includes

1. **Data Loading and Exploration**: Basic statistics and data quality checks
2. **Time-based Features**: Extraction of hour, day of week, month, etc.
3. **Average Loading Times by Users**: Detailed statistics for 1-5 concurrent users
4. **Loading Times by Hour**: Analysis of performance throughout the day
5. **Loading Times by Day of Week**: Weekly patterns
6. **Loading Times by Month**: Seasonal trends
7. **Time Series Analysis**: Trends over time
8. **Summary Insights**: Key findings and correlations

### Key Questions Answered

- **Are there times of the day with higher/lower loading times?**
  - See sections 4 (By Hour of Day) and visualization heatmaps
  
- **Are there times of the year with higher/lower loading times?**
  - See sections 6 (By Month) and 8 (Daily Aggregated Analysis)
  
- **What are the average loading times?**
  - See section 3 (Average Loading Times by Number of Users)

## 2. Interactive Dashboard with Voila

The `dashboard.ipynb` provides an interactive web-based dashboard.

### Running the Dashboard

**Option 1: Using Voila (Recommended for non-technical users)**

```bash
voila dashboard.ipynb
```

This will open a clean, interactive dashboard in your web browser at `http://localhost:8866`

**Option 2: Using Jupyter Notebook**

```bash
jupyter notebook dashboard.ipynb
```

Then run all cells to see the interactive widgets.

### Dashboard Features

1. **User Filter**: Select which user counts (1-5) to include in the analysis
2. **View Type Dropdown**: Choose different visualizations:
   - Time Series: Loading times over time
   - By Hour: Performance by hour of day
   - By Day of Week: Performance by day
   - By Month: Performance by month
   - Distribution: Box plots and violin plots
3. **Show Statistics**: Toggle to show/hide summary statistics

### Using the Dashboard

1. Start the dashboard using one of the methods above
2. Use the "Users" selector to filter data by concurrent user count
3. Choose a view type from the dropdown to see different analyses
4. Check/uncheck "Show Statistics" to toggle the statistics summary
5. All visualizations update automatically when you change selections

## 3. Generating Reports

### Export Analysis as HTML

```bash
jupyter nbconvert --to html loading_times_analysis.ipynb
```

### Export Analysis as PDF (requires pandoc and LaTeX)

```bash
jupyter nbconvert --to pdf loading_times_analysis.ipynb
```

### Share Dashboard as Static HTML

```bash
voila --template=lab --show_tracebacks=True dashboard.ipynb --VoilaConfiguration.file_whitelist="['.*']" --no-browser --port=8866 &
# Then access and save the page from browser
```

## 4. Customization

### Modify Analysis

Edit the notebook cells to:
- Add new visualizations
- Change plot styles and colors
- Add additional statistical analyses
- Filter data by date ranges

### Modify Dashboard

Edit `dashboard.ipynb` to:
- Add new widget controls
- Change visualization types
- Modify color schemes
- Add new analysis views

## Tips

1. **Large Datasets**: The notebooks are optimized for the current dataset size (~27,000 rows). For much larger datasets, consider sampling or aggregation.

2. **Performance**: If visualizations are slow, try:
   - Filtering to smaller date ranges
   - Reducing the number of selected users
   - Using simpler plot types

3. **Saving Figures**: In the analysis notebook, figures can be saved using:
   ```python
   plt.savefig('my_figure.png', dpi=300, bbox_inches='tight')
   ```

4. **Voila Themes**: Customize the dashboard appearance:
   ```bash
   voila dashboard.ipynb --theme=dark
   ```

## Troubleshooting

**Issue**: Plots not displaying
- **Solution**: Make sure matplotlib and seaborn are installed correctly

**Issue**: Dashboard widgets not interactive
- **Solution**: Ensure ipywidgets is installed and enabled: `jupyter nbextension enable --py widgetsnbextension`

**Issue**: Voila not starting
- **Solution**: Check that voila is installed: `pip install voila>=0.5.6`

**Issue**: Import errors
- **Solution**: Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`
