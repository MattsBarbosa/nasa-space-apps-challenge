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
            <ApiStatus />
            {/* <WeatherVisualization /> */}

            {/* Header */}
            <header className="app__header">
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