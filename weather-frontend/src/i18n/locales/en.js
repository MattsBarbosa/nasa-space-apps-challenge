export const en = {
    // App Header
    app: {
        title: "NASA Weather Predictor",
        subtitle: "Weather forecasts based on NASA historical data"
    },

    // Map Selector
    mapSelector: {
        steps: {
            location: {
                title: "Select Location",
                subtitle: {
                    default: "Search for a city or click on the map",
                    hasLocation: "Location already selected - choose another or continue"
                },
                placeholder: {
                    default: "Type a city name...",
                    hasLocation: "Type a new city or continue..."
                }
            },
            date: {
                title: "Select Date",
                subtitle: "Identifying location...",
                suggestions: {
                    title: "💡 Suggestions:",
                    today: "Today",
                    nextWeek: "Next week"
                },
                preview: {
                    title: "Selected Date"
                },
                confirm: "Analyze Forecast",
                errors: {
                    invalidFormat: "Invalid date format",
                    invalidDate: "Invalid date",
                    pastDate: "Date must be today or in the future",
                    tooFarFuture: "Date cannot be more than 1 year in the future"
                }
            },
            submitting: {
                title: "Analyzing Data",
                subtitle: "Processing NASA information..."
            }
        },
        popup: {
            title: "Selected Location",
            coords: "Coordinates"
        },
        overlay: {
            status: {
                locationSelected: "Location selected",
                validDate: "Valid date",
                waitingValidDate: "Waiting for valid date",
                processing: "Processing...",
                ready: "Ready"
            }
        },
        weather: {
            conditions: {
                sunny: "Sunny",
                rainy: "Rainy",
                cloudy: "Cloudy",
                snowy: "Snow",
                windy: "Windy"
            }
        },
        changeStyle: "Change map style",
        mapStyles: "Map Styles",
        styles: {
            openstreetmap: {
                name: "OpenStreetMap",
                description: "Standard map with street details"
            },
            satellite: {
                name: "Satellite",
                description: "High resolution satellite imagery"
            },
            dark: {
                name: "Dark",
                description: "Dark theme for low light"
            },
        }
    },

    // Weather Visualization
    weatherVisualization: {
        title: "Advanced Weather Analysis",
        subtitle: "Based on NASA POWER API historical data",
        location: {
            identifying: "Identifying location...",
            remote: "Remote Area"
        },
        insights: {
            title: "💡 Temporal Insight",
            highRain: "🌧️ High precipitation probability based on regional historical patterns",
            exceptional: "☀️ Exceptionally favorable conditions for outdoor activities",
            predominantWinds: "🌬️ Predominant winds characteristic of this time of year",
            typicalClouds: "☁️ Cloud cover typical for the region and period",
            highTemps: "🌡️ High temperatures expected based on historical data",
            lowTemps: "❄️ Lower temperatures predicted for the period",
            default: "📊 Analysis based on 30 years of NASA meteorological data"
        },
        temperature: {
            title: "Thermal Analysis",
            cold: "Cold",
            mild: "Mild",
            warm: "Hot"
        },
        limitations: {
            title: "⚠️ System Limitations",
            items: [
                "Forecast based on historical data, not real-time",
                "Limited accuracy for extreme weather events",
                "Aggregated data by region, local variations may occur",
                "Low reliability due to inconsistent weather patterns"
            ]
        },
        dataSources: {
            title: "📊 Data Sources"
        },
        emptyState: {
            title: "Weather Data Unavailable",
            description: "Could not process the provided weather data. Check the API data structure.",
            insufficientTitle: "Insufficient Data",
            insufficientDescription: "Could not calculate weather probabilities. Check historical data for the selected region."
        }
    },

    // Alerts
    alerts: {
        error: {
            title: "API Connection Problem",
            solution: "🔧 Solution: Check if your API is running on",
            or: "Or check the connection to the external API."
        },
        success: {
            title: "Weather Data Loaded",
            description: "Complete analysis available for",
            viewButton: "View Detailed Analysis"
        },
        warning: {
            title: "API Offline - Demo Data",
            description: "The main API is unavailable, but sample data is being displayed for demonstration.",
            notice: "⚠️ Warning: The data shown is for demonstration purposes only.",
            checkConnection: "For real data, check the API connection."
        }
    },

    // Loading
    loading: {
        title: "Analyzing Weather Data",
        description: "Processing NASA POWER API information..."
    },

    // Quick Stats
    quickStats: {
        title: "📊 Quick Summary",
        viewDetails: "View Details",
        mainCondition: "Main Condition",
        location: "Location",
        targetDate: "Target Date"
    },

    // Chat
    chat: {
        title: "💬 Weather Assistant",
        status: "Online",
        placeholder: "How will the weather be in São Paulo tomorrow?",
        suggestions: {
            title: "💡 Suggestions:",
            items: [
                "How will the weather be in São Paulo next week?",
                "What's the probability of rain in Rio de Janeiro?",
                "Forecast for Brasília next month"
            ]
        }
    },

    // Locations
    locations: {
        oceans: {
            atlantic: "Atlantic Ocean",
            pacific: "Pacific Ocean",
            indian: "Indian Ocean",
            arctic: "Arctic Ocean",
            antarctic: "Antarctic Ocean"
        },
        regions: {
            sahara: "Sahara Desert",
            gobi: "Gobi Desert",
            antarctica: "Antarctica",
            greenland: "Greenland",
            amazon: "Amazon Rainforest",
            remote: "Remote Area"
        }
    },

    // Weather Conditions
    conditions: {
        sunny: "Sunny",
        rainy: "Rainy",
        cloudy: "Cloudy",
        snowy: "Snow",
        windy: "Windy",
        na: "N/A"
    },

    // Common
    common: {
        today: "Today",
        tomorrow: "Tomorrow",
        nextWeek: "Next week",
        probability: "probability",
        chance: "chance",
        confidence: "Confidence",
        coordinates: "Coordinates",
        cancel: "Cancel",
        continue: "Continue",
        back: "Back",
        close: "Close",
        reset: "Reset"
    },

    // API Status
    apiStatus: {
        checking: "Checking System...",
        refreshing: "Updating...",
        online: "System Online",
        partial: "Partial System",
        offline: "System Offline",
        error: "System Error",
        connected: "Connected",
        never: "Never",
        collapse: "Collapse details",
        expand: "Expand details",
        componentsTitle: "NASA Components Status",
        disableAutoRefresh: "Disable auto refresh",
        enableAutoRefresh: "Enable auto refresh",
        auto: "Auto",
        manual: "Manual",
        refreshStatus: "Refresh status",
        noComponents: "No components available",
        errorDetails: "Error Details",
        lastCheck: "Last check",

        components: {
            connected: "Connected",
            degraded: "Degraded",
            unreachable: "Unavailable",
            unknown: "Unknown",

            nasaPower: {
                description: "Historical weather data"
            },
            earthdata: {
                description: "Scientific data catalog"
            },
            giovanni: {
                description: "Data visualization"
            }
        },

        metrics: {
            averageLatency: "Average Latency",
            availability: "Availability",
            components: "Components"
        }
    },
};