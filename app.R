library(shiny)
library(ggplot2)
library(readr)
library(dplyr)
library(plotly)
library(DT)
library(scales)

# Read CSV data
load_data <- function() {
  if (file.exists("loading_times.csv")) {
    df <- read_csv("loading_times.csv", col_names = FALSE, show_col_types = FALSE)
    colnames(df) <- c("Timestamp", "Users", "Avg_Loading_Time")

    # Convert Timestamp to date format
    df$Timestamp <- as.POSIXct(df$Timestamp, format="%Y-%m-%dT%H:%M:%OSZ", tz="UTC")
    
    # Add Observation column
    df <- df %>%
      group_by(Users) %>%
      mutate(Observation = row_number()) %>%
      ungroup()
      
    return(df)
  } else {
    return(data.frame(Timestamp = as.POSIXct(character()), Users = integer(), Avg_Loading_Time = double(), Observation = integer()))
  }
}

# Define UI
ui <- fluidPage(
    titlePanel("Google.com Loading Times"),
    
    sidebarLayout(
        sidebarPanel(
            checkboxGroupInput("userFilter", "Select Number of Users:", choices = NULL)
        ),
        mainPanel(
            tabsetPanel(
                tabPanel("Plot", plotlyOutput("loadingTimePlot")),
                tabPanel("Summary", DTOutput("summaryTable"))
            )
        )
    )
)

# Define server logic
server <- function(input, output, session) {
    data <- reactive({
        df <- load_data()

        # Ensure userFilter is not empty before filtering
        if (is.null(input$userFilter) || length(input$userFilter) == 0) {
            return(df)  # Return all data if no selection is made
        }

        filtered_df <- df %>% filter(Users %in% input$userFilter)
        return(filtered_df)
    })

    observe({
        updateCheckboxGroupInput(session, "userFilter", choices = unique(load_data()$Users))
    })

    output$loadingTimePlot <- renderPlotly({
        df <- data()
        
        # Check if data is empty
        if (nrow(df) == 0) {
            p <- ggplot() + 
                annotate("text", x = 0.5, y = 0.5, label = "No data available", size = 6) +
                xlim(0, 1) + ylim(0, 1) +
                labs(title = "I Chart of Average Loading Times") +
                theme_minimal() +
                theme(axis.text = element_blank(), axis.ticks = element_blank())
            return(ggplotly(p))
        }
        
        p <- ggplot(df, aes(x = Observation, y = Avg_Loading_Time, color = as.factor(Users), 
                            text = paste("Observation:", Observation, 
                                         "<br>Date/Time in UTC:", Timestamp, 
                                         "<br>Average Loading Time:", round(Avg_Loading_Time), 
                                         "<br>Number of Users:", Users))) +
            geom_line(aes(group = Users), size = 0.3) + 
            geom_point() +
            scale_x_continuous(breaks = scales::pretty_breaks(n = 10), labels = scales::number_format(accuracy = 1)) +
            labs(x = "Observation", y = "Average Loading Time (ms)", color = "Number of Users", title = "I Chart of Average Loading Times") +
            theme_minimal()

        ggplotly(p, tooltip = "text")
    })

    output$summaryTable <- renderDT({
        df <- data()
        
        # Check if data is empty
        if (nrow(df) == 0) {
            empty_df <- data.frame(
                Users = integer(),
                MinimumAverageLoadingTime = integer(),
                MaximumAverageLoadingTime = integer(),
                MeanAllAverageLoadingTimes = integer()
            )
            return(datatable(empty_df, options = list(dom = 't')))
        }

        summary_df <- df %>%
            group_by(Users) %>%
            summarise(
                MinimumAverageLoadingTime = round(min(Avg_Loading_Time)),
                MaximumAverageLoadingTime = round(max(Avg_Loading_Time)),
                MeanAllAverageLoadingTimes = round(mean(Avg_Loading_Time)),
                .groups = 'drop'
            )

        datatable(summary_df)
    })
}

# Run the application 
shinyApp(ui = ui, server = server)