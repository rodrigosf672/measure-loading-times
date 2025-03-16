library(shiny)
library(ggplot2)
library(readr)
library(dplyr)
library(plotly)
library(DT)

# Read CSV data
load_data <- function() {
  if (file.exists("loading_times.csv")) {
    df <- read_csv("loading_times.csv", col_names = FALSE, show_col_types = FALSE)
    colnames(df) <- c("Timestamp", "Users", "Avg_Loading_Time")

    # Add Observation column
    df$Observation <- seq_len(nrow(df))
    return(df)
  } else {
    return(data.frame(Timestamp = as.POSIXct(character()), Users = integer(), Avg_Loading_Time = double(), Observation = integer()))
  }
}

# Define UI
ui <- fluidPage(
    titlePanel("Loading Times"),
    
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

        df %>% filter(Users %in% input$userFilter)
    })

    observe({
        updateCheckboxGroupInput(session, "userFilter", choices = unique(load_data()$Users))
    })

    output$loadingTimePlot <- renderPlotly({
        df <- data()

        p <- ggplot(df, aes(x = Observation, y = Avg_Loading_Time, color = as.factor(Users))) +
            geom_line() +
            geom_point() +
            labs(x = "Observation", y = "Average Loading Time (ms)", color = "Number of Users", title = "I Chart of Average Loading Times") +
            theme_minimal()

        ggplotly(p)
    })

    output$summaryTable <- renderDT({
        df <- data()

        summary_df <- df %>%
            group_by(Users) %>%
            summarise(
                Min_Loading_Time = min(Avg_Loading_Time),
                Max_Loading_Time = max(Avg_Loading_Time),
                Avg_Loading_Time = mean(Avg_Loading_Time)
            )

        datatable(summary_df)
    })
}

# Run the application 
shinyApp(ui = ui, server = server)