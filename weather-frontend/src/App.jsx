import React, { useState, useEffect, useRef } from "react";
import MapSelector from "./components/MapSelector.jsx";
import WeatherChat from './components/WeatherChat.jsx';
import WeatherVisualization from "./components/WeatherVisualization.jsx";
import LanguageSelector from "./components/LanguageSelector.jsx";
import ReactMarkdown from "react-markdown";
import ApiStatus from "./components/ApiStatus.jsx";
import weatherApi from "./services/weatherApi";
import { Cloud, Satellite, AlertTriangle, MapPin, Send, X, Eye } from "lucide-react";
import { LanguageProvider, useTranslation } from "./i18n/useTranslation.jsx";

const AppContent = () => {
    const { t } = useTranslation();

    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chatError, setChatError] = useState(null);
    const [chatResponse, setChatResponse] = useState(null);
    const [showWeatherVisualization, setShowWeatherVisualization] = useState(false);
    const [dominantWeatherCondition, setDominantWeatherCondition] = useState(null);

    const [sessionId] = useState(
        () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );

    const mapSelectorRef = useRef(null);

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: t('chat.initialMessage', "Olá! 👋 Sou seu assistente meteorológico da NASA. Pergunte-me sobre as probabilidades climáticas para qualquer local e data futura, ou use o mapa acima para explorar previsões visuais."),
        },
    ]);

    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages, chatLoading]);

    const extractDominantCondition = (data) => {
        if (!data || !data.predictions) return null;

        const eventMapping = {
            'Preciptation': 'rainy',
            'Cloud': 'cloudy',
            'Wind': 'windy',
            'SunRadiation': 'sunny',
            'Snow': 'snowy'
        };

        let maxProbability = 0;
        let dominantCondition = 'sunny';

        const conditions = {
            sunny: 0,
            rainy: 0,
            cloudy: 0,
            snowy: 0,
            windy: 0
        };

        data.predictions.forEach(prediction => {
            const condition = eventMapping[prediction.event];
            let probability = 0;

            switch (prediction.event) {
                case 'Preciptation':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    conditions.rainy = Math.round(probability);
                    break;
                case 'Cloud':
                    probability = (prediction.data.moderate || 0) + (prediction.data.strong || 0);
                    conditions.cloudy = Math.round(probability);
                    break;
                case 'Wind':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    conditions.windy = Math.round(probability);
                    break;
                case 'SunRadiation':
                    probability = prediction.data.intense || 0;
                    conditions.sunny = Math.round(probability);
                    break;
                case 'Snow':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    conditions.snowy = Math.round(probability);
                    break;
            }

            if (condition && probability > maxProbability) {
                maxProbability = probability;
                dominantCondition = condition;
            }
        });

        if (conditions.snowy > 0) {
            return 'snowy';
        } else if (conditions.rainy > 60) {
            return 'rainy';
        } else if (conditions.cloudy > 80) {
            return 'cloudy';
        } else if (conditions.windy > 90) {
            return 'windy';
        } else if (conditions.sunny > 90) {
            return 'sunny';
        }

        return dominantCondition;
    };

    useEffect(() => {
        if (weatherData) {
            const condition = extractDominantCondition(weatherData);
            setDominantWeatherCondition(condition);

            setShowWeatherVisualization(true);

            setTimeout(() => {
                if (mapSelectorRef.current && mapSelectorRef.current.resetFormOnly) {
                    mapSelectorRef.current.resetFormOnly();
                }
                setLoading(false);
            }, 100);
        }
    }, [weatherData]);

    useEffect(() => {
        if (!weatherData) {
            setDominantWeatherCondition(null);
        }
    }, [weatherData]);

    const getDominantCondition = (data) => {
        if (!data || !data.predictions) return t('conditions.na');

        const eventMapping = {
            'Wind': t('conditions.windy'),
            'Preciptation': t('conditions.rainy'),
            'Cloud': t('conditions.cloudy'),
            'SunRadiation': t('conditions.sunny'),
            'Snow': t('conditions.snowy')
        };

        let maxProbability = 0;
        let dominantCondition = t('conditions.na');

        data.predictions.forEach(prediction => {
            const conditionName = eventMapping[prediction.event];
            if (!conditionName) return;

            let probability = 0;

            switch (prediction.event) {
                case 'Preciptation':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    break;
                case 'Cloud':
                    probability = (prediction.data.moderate || 0) + (prediction.data.strong || 0);
                    break;
                case 'Wind':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    break;
                case 'SunRadiation':
                    probability = prediction.data.intense || 0;
                    break;
                case 'Snow':
                    probability = Object.entries(prediction.data)
                        .filter(([key]) => key !== 'none')
                        .reduce((sum, [, value]) => sum + value, 0);
                    break;
            }

            if (probability > maxProbability) {
                maxProbability = probability;
                dominantCondition = conditionName;
            }
        });

        return dominantCondition;
    };

    const handleLocationSubmit = async ({ lat, lon, date }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await weatherApi.predict(lat, lon, date);

            if (result.success) {
                setWeatherData(result.data);
                setError(null);
            } else {
                setError(result.error);
                if (result.mockData) {
                    setWeatherData(result.mockData);
                }
            }
        } catch (err) {
            setError("Erro inesperado: " + err.message);
            console.error("Erro ao buscar dados meteorológicos:", err);
        }
    };

    const handleChatWeatherData = (chatWeatherData) => {
        const convertedData = {
            request: {
                latitude: chatWeatherData.coordinates.lat,
                longitude: chatWeatherData.coordinates.lon,
                date: chatWeatherData.date,
                location_name: chatWeatherData.location
            },
            analysis: {
                temperature: {
                    value: chatWeatherData.temperature,
                    unit: "°C",
                    confidence: "high"
                },
                probabilities: {
                    sunny: chatWeatherData.probabilities.sun || 0,
                    cloudy: chatWeatherData.probabilities.clouds || 0,
                    rainy: chatWeatherData.probabilities.rain || 0
                }
            },
            metadata: {
                data_source: "NASA Historical Analysis via Chat",
                processing_time: "AI Generated",
                confidence_level: "Based on historical patterns"
            }
        };

        setWeatherData(convertedData);
        setError(null);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const userInput = chatInput.trim();
        if (!userInput || chatLoading) return;

        const newUserMessage = { role: "user", content: userInput };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        setChatInput("");
        setChatLoading(true);
        setChatError(null);

        try {
            const API_URL = "https://nasa-weather-predictor.webdevinkel.workers.dev";

            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    message: userInput,
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ message: `Erro na API: ${response.statusText}` }));
                throw new Error(errorData.message);
            }

            const data = await response.json();

            const assistantMessage = { role: "assistant", content: data.response };
            setMessages((prevMessages) => [...prevMessages, assistantMessage]);

            if (data.weatherData) {
                setWeatherData(data.weatherData);
            }

        } catch (err) {
            setChatError(err.message);
            const errorMessage = {
                role: "assistant",
                content: `**Desculpe, ocorreu um erro:**\n\n*${err.message}*\n\n💡 **Dica:** Tente usar o mapa acima para explorar previsões meteorológicas visuais enquanto trabalho para resolver este problema.`,
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleCloseWeatherVisualization = () => {
        setShowWeatherVisualization(false);

        if (mapSelectorRef.current && mapSelectorRef.current.resetFormOnly) {
            mapSelectorRef.current.resetFormOnly();
        }

        setWeatherData(null);
        setError(null);
        setLoading(false);
    };

    const handleManualReset = () => {
        setLoading(false);
        setWeatherData(null);
        setError(null);
        setShowWeatherVisualization(false);
        setDominantWeatherCondition(null);

        if (mapSelectorRef.current && mapSelectorRef.current.resetFlow) {
            mapSelectorRef.current.resetFlow();
        }
    };

    return (
        <div className="app">
            <ApiStatus />

            <div className="app__language-select">
                <LanguageSelector />
            </div>

            {/* Weather Visualization Modal */}
            {showWeatherVisualization && weatherData && (
                <WeatherVisualization
                    weatherData={weatherData}
                    onClose={handleCloseWeatherVisualization}
                />
            )}

            {/* Header */}
            <header className="app__header">
                <div className="app__container">
                    <div className="app__header-content">
                        <div className="app__header-info">
                            <h1 className="app__header-title">
                                <Satellite className="app__header-icon" />
                                {t('app.title')}
                            </h1>
                            <p className="app__header-subtitle">
                                {t('app.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="app__main">
                <div className="app__container">
                    {/* Map Selector */}
                    <div className="app__section app__section--map">
                        <MapSelector
                            ref={mapSelectorRef}
                            onLocationSubmit={handleLocationSubmit}
                            loading={loading}
                            onReset={handleManualReset}
                            weatherCondition={dominantWeatherCondition}
                        />
                    </div>

                    {/* Error Alert */}
                    {error && !weatherData && (
                        <div className="app__alert app__alert--error">
                            <div className="app__alert-content">
                                <AlertTriangle className="app__alert-icon" />
                                <div className="app__alert-text">
                                    <h3 className="app__alert-title">
                                        <span>{t('alerts.error.title')}</span>
                                        <div className="app__alert-indicator"></div>
                                    </h3>
                                    <p className="app__alert-description">{error}</p>
                                    <div className="app__alert-solution">
                                        <p className="app__alert-solution-text">
                                            {t('alerts.error.solution')}
                                            <code className="app__alert-code">
                                                http://localhost:8787
                                            </code>
                                            <br />
                                            <small>{t('alerts.error.or')}</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {weatherData && !error && !showWeatherVisualization && (
                        <div className="app__alert app__alert--success">
                            <div className="app__alert-content">
                                <Cloud className="app__alert-icon" />
                                <div className="app__alert-text">
                                    <h3 className="app__alert-title">
                                        <span>{t('alerts.success.title')}</span>
                                    </h3>
                                    <p className="app__alert-description">
                                        {t('alerts.success.description')} {weatherData.metadata?.location ?
                                            `${weatherData.metadata.location.latitude.toFixed(4)}°, ${weatherData.metadata.location.longitude.toFixed(4)}°` :
                                            'a localização selecionada'
                                        }
                                    </p>
                                    <button
                                        className="app__alert-view-button"
                                        onClick={() => setShowWeatherVisualization(true)}
                                    >
                                        <Eye size={16} />
                                        {t('alerts.success.viewButton')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning Alert */}
                    {weatherData && error && !showWeatherVisualization && (
                        <div className="app__alert app__alert--warning">
                            <div className="app__alert-content">
                                <AlertTriangle className="app__alert-icon" />
                                <div className="app__alert-text">
                                    <h3 className="app__alert-title">
                                        <span>{t('alerts.warning.title')}</span>
                                        <div className="app__alert-indicator"></div>
                                    </h3>
                                    <p className="app__alert-description">
                                        {t('alerts.warning.description')}
                                    </p>
                                    <div className="app__alert-solution">
                                        <p className="app__alert-solution-text">
                                            {t('alerts.warning.notice')}
                                            <br />
                                            <small>{t('alerts.warning.checkConnection')}</small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="app__loading-state">
                            <div className="app__loading-content">
                                <div className="app__loading-spinner-wrapper">
                                    <div className="app__loading-spinner"></div>
                                    <Satellite className="app__loading-satellite" />
                                </div>

                                <h3 className="app__loading-title">
                                    {t('loading.title')}
                                </h3>

                                <p className="app__loading-description">
                                    {t('loading.description')}
                                </p>

                                <div className="app__loading-dots">
                                    <div className="app__loading-dot"></div>
                                    <div className="app__loading-dot app__loading-dot--delay-1"></div>
                                    <div className="app__loading-dot app__loading-dot--delay-2"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Weather Chat */}
            {/* <WeatherChat onWeatherDataReceived={handleChatWeatherData} /> */}

            {/* Footer */}
            <footer className="app__footer">
                <div className="app__container">
                </div>
            </footer>
        </div>
    );
};

function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;