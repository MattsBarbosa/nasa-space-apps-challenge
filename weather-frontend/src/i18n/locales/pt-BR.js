export const ptBR = {
    // App Header
    app: {
        title: "NASA Weather Predictor",
        subtitle: "Previsões meteorológicas baseadas em dados históricos da NASA"
    },

    // Map Selector
    mapSelector: {
        steps: {
            location: {
                title: "Selecione o Local",
                subtitle: {
                    default: "Busque uma cidade ou clique no mapa",
                    hasLocation: "Local já selecionado - escolha outro ou continue"
                },
                placeholder: {
                    default: "Digite uma cidade...",
                    hasLocation: "Digite uma nova cidade ou continue..."
                }
            },
            date: {
                title: "Selecione a Data",
                subtitle: "Identificando localização...",
                suggestions: {
                    title: "💡 Sugestões:",
                    today: "Hoje",
                    nextWeek: "Próxima semana"
                },
                preview: {
                    title: "Data Selecionada"
                },
                confirm: "Analisar Previsão",
                errors: {
                    invalidFormat: "Formato de data inválido",
                    invalidDate: "Data inválida",
                    pastDate: "A data deve ser hoje ou no futuro",
                    tooFarFuture: "A data não pode ser superior a 1 ano no futuro"
                }
            },
            submitting: {
                title: "Analisando Dados",
                subtitle: "Processando informações da NASA..."
            }
        },
        popup: {
            title: "Local Selecionado",
            coords: "Coordenadas"
        },
        overlay: {
            status: {
                locationSelected: "Local selecionado",
                validDate: "Data válida",
                waitingValidDate: "Aguardando data válida",
                processing: "Processando...",
                ready: "Pronto"
            }
        },
        weather: {
            conditions: {
                sunny: "Ensolarado",
                rainy: "Chuvoso",
                cloudy: "Nublado",
                snowy: "Neve",
                windy: "Ventoso"
            }
        },
        changeStyle: "Alterar estilo do mapa",
        mapStyles: "Estilos de Mapa",
        styles: {
            openstreetmap: {
                name: "OpenStreetMap",
                description: "Mapa padrão com detalhes de ruas"
            },
            satellite: {
                name: "Satélite",
                description: "Imagens de satélite em alta resolução"
            },
            dark: {
                name: "Escuro",
                description: "Tema escuro para baixa luminosidade"
            },
        }
    },

    // Weather Visualization
    weatherVisualization: {
        title: "Análise Meteorológica Avançada",
        subtitle: "Baseado em dados históricos da NASA POWER API",
        location: {
            identifying: "Identificando localização...",
            remote: "Área Remota"
        },
        insights: {
            title: "💡 Insight Temporal",
            highRain: "🌧️ Alta probabilidade de precipitação baseada em padrões históricos da região",
            exceptional: "☀️ Condições excepcionalmente favoráveis para atividades ao ar livre",
            predominantWinds: "🌬️ Ventos predominantes característicos desta época do ano",
            typicalClouds: "☁️ Cobertura de nuvens típica para a região e período",
            highTemps: "🌡️ Temperaturas elevadas esperadas baseadas em dados históricos",
            lowTemps: "❄️ Temperaturas mais baixas previstas para o período",
            default: "📊 Análise baseada em 30 anos de dados meteorológicos da NASA"
        },
        temperature: {
            title: "Análise Térmica",
            cold: "Frio",
            mild: "Ameno",
            warm: "Quente"
        },
        limitations: {
            title: "⚠️ Limitações do Sistema",
            items: [
                "Previsão baseada em dados históricos, não em tempo real",
                "Precisão limitada para eventos meteorológicos extremos",
                "Dados agregados por região, variações locais podem ocorrer",
                "Baixa confiabilidade devido a padrões meteorológicos inconsistentes"
            ]
        },
        dataSources: {
            title: "📊 Fontes de Dados"
        },
        emptyState: {
            title: "Dados Meteorológicos Indisponíveis",
            description: "Não foi possível processar os dados meteorológicos fornecidos. Verifique a estrutura dos dados da API.",
            insufficientTitle: "Dados Insuficientes",
            insufficientDescription: "Não foi possível calcular as probabilidades meteorológicas. Verifique os dados históricos da região selecionada."
        }
    },

    // Alerts
    alerts: {
        error: {
            title: "Problema na Conexão com API",
            solution: "🔧 Solução: Verifique se sua API está rodando em",
            or: "Ou verifique a conexão com a API externa."
        },
        success: {
            title: "Dados Meteorológicos Carregados",
            description: "Análise completa disponível para",
            viewButton: "Ver Análise Detalhada"
        },
        warning: {
            title: "API Offline - Dados de Demonstração",
            description: "A API principal está indisponível, mas dados de exemplo estão sendo exibidos para demonstração.",
            notice: "⚠️ Aviso: Os dados mostrados são apenas para fins de demonstração.",
            checkConnection: "Para dados reais, verifique a conexão com a API."
        }
    },

    // Loading
    loading: {
        title: "Analisando Dados Meteorológicos",
        description: "Processando informações da NASA POWER API..."
    },

    // Quick Stats
    quickStats: {
        title: "📊 Resumo Rápido",
        viewDetails: "Ver Detalhes",
        mainCondition: "Condição Principal",
        location: "Localização",
        targetDate: "Data Alvo"
    },

    // Chat
    chat: {
        title: "💬 Assistente Meteorológico",
        status: "Online",
        placeholder: "Como estará o tempo em São Paulo amanhã?",
        suggestions: {
            title: "💡 Sugestões:",
            items: [
                "Como estará o tempo em São Paulo na próxima semana?",
                "Qual a probabilidade de chuva no Rio de Janeiro?",
                "Previsão para Brasília no próximo mês"
            ]
        }
    },

    // Locations
    locations: {
        oceans: {
            atlantic: "Oceano Atlântico",
            pacific: "Oceano Pacífico",
            indian: "Oceano Índico",
            arctic: "Oceano Ártico",
            antarctic: "Oceano Antártico"
        },
        regions: {
            sahara: "Deserto do Saara",
            gobi: "Deserto de Gobi",
            antarctica: "Antártida",
            greenland: "Groenlândia",
            amazon: "Floresta Amazônica",
            remote: "Área Remota"
        }
    },

    // Weather Conditions
    conditions: {
        sunny: "Ensolarado",
        rainy: "Chuvoso",
        cloudy: "Nublado",
        snowy: "Neve",
        windy: "Ventoso",
        na: "N/A"
    },

    // Common
    common: {
        today: "Hoje",
        tomorrow: "Amanhã",
        nextWeek: "Próxima semana",
        probability: "probabilidade",
        chance: "chance",
        confidence: "Confiança",
        coordinates: "Coordenadas",
        cancel: "Cancelar",
        continue: "Continuar",
        back: "Voltar",
        close: "Fechar",
        reset: "Resetar"
    },

    // API Status
    apiStatus: {
        checking: "Verificando Sistema...",
        refreshing: "Atualizando...",
        online: "Sistema Online",
        partial: "Sistema Parcial",
        offline: "Sistema Offline",
        error: "Erro no Sistema",
        connected: "Conectado",
        never: "Nunca",
        collapse: "Recolher detalhes",
        expand: "Expandir detalhes",
        componentsTitle: "Status dos Componentes NASA",
        disableAutoRefresh: "Desativar atualização automática",
        enableAutoRefresh: "Ativar atualização automática",
        auto: "Auto",
        manual: "Manual",
        refreshStatus: "Atualizar status",
        noComponents: "Nenhum componente disponível",
        errorDetails: "Detalhes do Erro",
        lastCheck: "Última verificação",

        components: {
            connected: "Conectado",
            degraded: "Degradado",
            unreachable: "Indisponível",
            unknown: "Desconhecido",

            nasaPower: {
                description: "Dados meteorológicos históricos"
            },
            earthdata: {
                description: "Catálogo de dados científicos"
            },
            giovanni: {
                description: "Visualização de dados"
            }
        },

        metrics: {
            averageLatency: "Latência Média",
            availability: "Disponibilidade",
            components: "Componentes"
        }
    },
};