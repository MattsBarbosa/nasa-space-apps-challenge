import React, { useState } from 'react';
import MapSelector from './components/MapSelector.jsx';
import WeatherVisualization from './components/WeatherVisualization.jsx';
import ApiStatus from './components/ApiStatus.jsx';
import weatherApi from './services/weatherApi';
import { Cloud, Satellite, AlertTriangle, MapPin } from 'lucide-react';

function App() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLocationSubmit = async ({ lat, lon, date }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await weatherApi.predict(lat, lon, date);

            if (result.success) {
                setWeatherData(result.data);
            } else {
                setError(result.error);
                // Usar dados mock se API estiver offline
                if (result.mockData) {
                    setWeatherData(result.mockData);
                }
            }
        } catch (err) {
            setError('Erro inesperado: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            {/* Decorações de fundo */}
            <div className="app__decorations">
                <div className="app__decoration app__decoration--cloud-top">☁️</div>
                <div className="app__decoration app__decoration--weather-top">🌤️</div>
                <div className="app__decoration app__decoration--sun-bottom">☀️</div>
                <div className="app__decoration app__decoration--star-bottom">⭐</div>
            </div>

            <ApiStatus />

            {/* Header */}
            <header className="app__header">
                <div className="app__container">
                    <div className="app__header-card">
                        <div className="app__header-content">
                            <div className="app__header-icon">
                                <Satellite className="app__header-icon-svg" />
                            </div>
                            <div className="app__header-info">
                                <h1 className="app__title">
                                    NASA Weather Predictor
                                </h1>
                                <p className="app__description">
                                    Previsões meteorológicas baseadas em dados históricos da NASA
                                    <span className="app__features">
                                        🛰️ Seleção interativa no mapa • 🌍 Dados globais • 📊 Análise avançada
                                    </span>
                                </p>
                            </div>
                            <div className="app__header-stats">
                                <div className="app__stat-card">
                                    <div className="app__stat-icon">🌡️</div>
                                    <div className="app__stat-label">Precisão</div>
                                    <div className="app__stat-value">95%+</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="app__main">
                <div className="app__container">
                    {/* Map Selector */}
                    <div className="app__section app__section--map">
                        <MapSelector onLocationSubmit={handleLocationSubmit} loading={loading} />
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="app__alert app__alert--error">
                            <div className="app__alert-content">
                                <AlertTriangle className="app__alert-icon" />
                                <div className="app__alert-text">
                                    <h3 className="app__alert-title">
                                        <span>Erro na Conexão com API</span>
                                        <div className="app__alert-indicator"></div>
                                    </h3>
                                    <p className="app__alert-description">{error}</p>
                                    <div className="app__alert-solution">
                                        <p className="app__alert-solution-text">
                                            {weatherData ? (
                                                <>
                                                    ✅ <strong>Modo Desenvolvimento:</strong> Exibindo dados de exemplo para testes.
                                                </>
                                            ) : (
                                                <>
                                                    🔧 <strong>Solução:</strong> Verifique se sua API está rodando em
                                                    <code className="app__alert-code">
                                                        http://localhost:8787
                                                    </code>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weather Visualization */}
                    {weatherData && (
                        <div className="app__section app__section--weather">
                            <WeatherVisualization weatherData={weatherData} />
                        </div>
                    )}

                    {/* Empty State */}
                    {!weatherData && !loading && (
                        <div className="app__empty-state">
                            <div className="app__empty-state-content">
                                {/* Ícone principal animado */}
                                <div className="app__empty-state-icon-wrapper">
                                    <Cloud className="app__empty-state-icon" size={80} />
                                    <div className="app__empty-state-pin">
                                        <MapPin className="app__empty-state-pin-icon" />
                                    </div>
                                </div>

                                {/* Título e descrição */}
                                <h3 className="app__empty-state-title">
                                    Selecione uma Localização
                                </h3>

                                <p className="app__empty-state-description">
                                    Use o mapa interativo, sua localização atual ou escolha um local pré-definido
                                    para obter previsões meteorológicas precisas.
                                </p>

                                {/* Features */}
                                <div className="app__features-grid">
                                    <div className="app__feature-card">
                                        <div className="app__feature-emoji">🗺️</div>
                                        <div className="app__feature-title">Mapa Interativo</div>
                                        <div className="app__feature-desc">Clique em qualquer local</div>
                                    </div>

                                    <div className="app__feature-card">
                                        <div className="app__feature-emoji">��</div>
                                        <div className="app__feature-title">Localização Atual</div>
                                        <div className="app__feature-desc">GPS automático</div>
                                    </div>

                                    <div className="app__feature-card">
                                        <div className="app__feature-emoji">⭐</div>
                                        <div className="app__feature-title">Locais Favoritos</div>
                                        <div className="app__feature-desc">Pré-definidos</div>
                                    </div>
                                </div>

                                {/* Call to action */}
                                <div className="app__status-card">
                                    <div className="app__status-content">
                                        <div className="app__status-dot"></div>
                                        <span className="app__status-text">
                                            Sistema pronto para análise meteorológica
                                        </span>
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
                                    Analisando Dados Meteorológicos
                                </h3>

                                <p className="app__loading-description">
                                    Processando informações da NASA...
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

            {/* Footer */}
            <footer className="app__footer">
                <div className="app__container">
                    <div className="app__footer-card">
                        <div className="app__footer-content">
                            <Satellite className="app__footer-icon" />
                            <span>Powered by NASA Weather Data</span>
                            <div className="app__footer-separator"></div>
                            <span>Space Apps Challenge 2024</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;