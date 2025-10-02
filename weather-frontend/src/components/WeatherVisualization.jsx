import React from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, AlertTriangle, TrendingUp, Eye, Thermometer } from 'lucide-react';

const WeatherVisualization = ({ weatherData }) => {
    // Tratar valores nulos e estrutura de dados
    const safeConditions = {
        sunny: weatherData?.prediction?.conditions?.sunny || 0,
        rainy: weatherData?.prediction?.conditions?.rainy || 0,
        cloudy: weatherData?.prediction?.conditions?.cloudy || 0,
        snowy: weatherData?.prediction?.conditions?.snowy || 0,
        windy: weatherData?.prediction?.conditions?.windy || 0
    };

    const probability = weatherData?.prediction?.probability || 0;
    const confidence = weatherData?.prediction?.confidence || 0;
    const dominantCondition = weatherData?.prediction?.dominantCondition || 'unknown';
    const location = weatherData?.location;
    const futureDate = weatherData?.futureDate;
    const temporalInsight = weatherData?.prediction?.temporalAnalysis?.insight;
    const limitations = weatherData?.prediction?.limitations || [];

    // Configuração dos ícones e cores para UI de clima
    const conditionConfig = {
        sunny: {
            icon: Sun,
            color: '#FBBF24',
            label: 'Ensolarado',
            emoji: '☀️'
        },
        rainy: {
            icon: CloudRain,
            color: '#3B82F6',
            label: 'Chuvoso',
            emoji: '🌧️'
        },
        cloudy: {
            icon: Cloud,
            color: '#6B7280',
            label: 'Nublado',
            emoji: '☁️'
        },
        snowy: {
            icon: Snowflake,
            color: '#E5E7EB',
            label: 'Neve',
            emoji: '❄️'
        },
        windy: {
            icon: Wind,
            color: '#10B981',
            label: 'Ventoso',
            emoji: '��'
        }
    };

    // Componente de barra de progresso circular moderna
    const CircularProgress = ({ value, size = 160, strokeWidth = 12, condition = 'sunny' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (value / 100) * circumference;
        const config = conditionConfig[condition] || conditionConfig.sunny;

        return (
            <div className="weather-visualization__circular-progress">
                <svg width={size} height={size} className="weather-visualization__circular-progress-svg">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={config.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="weather-visualization__circular-progress-bar"
                        style={{
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                        }}
                    />
                </svg>
                <div className="weather-visualization__circular-progress-content">
                    <div className="weather-visualization__circular-progress-emoji">
                        {config.emoji}
                    </div>
                    <span className="weather-visualization__circular-progress-value">{value}%</span>
                    <span className="weather-visualization__circular-progress-label">probabilidade</span>
                </div>
            </div>
        );
    };

    // Componente de card de condição moderna
    const ConditionCard = ({ condition, value, isMain = false }) => {
        const config = conditionConfig[condition];
        const Icon = config.icon;
        const cardClass = `weather-visualization__condition-card ${isMain ? 'weather-visualization__condition-card--main' : ''}`;

        return (
            <div className={cardClass}>
                <div className="weather-visualization__condition-card-shine"></div>

                <div className="weather-visualization__condition-card-content">
                    <div className="weather-visualization__condition-card-header">
                        <div className="weather-visualization__condition-card-info">
                            <div className="weather-visualization__condition-card-icon-wrapper">
                                <Icon size={24} color={config.color} className="weather-visualization__condition-card-icon" />
                            </div>
                            <div className="weather-visualization__condition-card-text">
                                <p className="weather-visualization__condition-card-title">{config.label}</p>
                                <p className="weather-visualization__condition-card-subtitle">{value}% chance</p>
                            </div>
                        </div>

                        <div className="weather-visualization__condition-card-emoji">
                            {config.emoji}
                        </div>
                    </div>

                    <div className="weather-visualization__condition-card-progress">
                        <div className="weather-visualization__condition-card-progress-bar">
                            <div
                                className="weather-visualization__condition-card-progress-fill"
                                style={{
                                    width: `${value}%`,
                                    background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
                                    boxShadow: `0 0 10px ${config.color}40`
                                }}
                            />
                        </div>
                        <div className="weather-visualization__condition-card-progress-labels">
                            <span>0%</span>
                            <span className="weather-visualization__condition-card-progress-value">{value}%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {isMain && (
                    <div className="weather-visualization__condition-card-badge">
                        ⭐ Dominante
                    </div>
                )}
            </div>
        );
    };

    // Componente de alerta moderno
    const LowConfidenceAlert = ({ confidence }) => {
        if (confidence >= 60) return null;

        return (
            <div className="weather-visualization__alert weather-visualization__alert--warning">
                <div className="weather-visualization__alert-content">
                    <AlertTriangle className="weather-visualization__alert-icon" />
                    <div className="weather-visualization__alert-text">
                        <h4 className="weather-visualization__alert-title">⚠️ Confiança Baixa</h4>
                        <p className="weather-visualization__alert-description">
                            Confiança de apenas <strong>{confidence}%</strong>. Recomendamos consultar
                            previsões meteorológicas atuais para maior precisão.
                        </p>
                        <div className="weather-visualization__alert-indicator">
                            <div className="weather-visualization__alert-dot"></div>
                            <span className="weather-visualization__alert-status">Dados limitados disponíveis</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Tratamento de dados inválidos
    const hasValidData = Object.values(safeConditions).some(val => val > 0);

    return (
        <div className="weather-visualization">
            <div className="weather-visualization__container">
                {/* Header */}
                <div className="weather-visualization__header">
                    <h2 className="weather-visualization__title">
                        Análise Meteorológica
                    </h2>
                    <div className="weather-visualization__subtitle">
                        <TrendingUp className="weather-visualization__subtitle-icon" />
                        <span>Baseado em dados históricos da NASA</span>
                    </div>
                </div>

                {/* Informações de localização e data */}
                {(location || futureDate) && (
                    <div className="weather-visualization__location-info">
                        {location && (
                            <div className="weather-visualization__location">
                                <div className="weather-visualization__location-dot"></div>
                                <p className="weather-visualization__location-text">
                                    📍 {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                                </p>
                            </div>
                        )}
                        {futureDate && (
                            <p className="weather-visualization__date">
                                📅 {new Date(futureDate).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        )}
                    </div>
                )}

                {/* <LowConfidenceAlert confidence={confidence} /> */}

                {/* Insights temporais */}
                {temporalInsight && (
                    <div className="weather-visualization__alert weather-visualization__alert--info">
                        <div className="weather-visualization__alert-content">
                            <Eye className="weather-visualization__alert-icon" />
                            <div className="weather-visualization__alert-text">
                                <h4 className="weather-visualization__alert-title">💡 Insight Temporal</h4>
                                <p className="weather-visualization__alert-description">{temporalInsight}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visualização principal - Gráfico circular */}
                <div className="weather-visualization__main-chart">
                    <div className="weather-visualization__chart-container">
                        <CircularProgress
                            value={probability}
                            size={180}
                            condition={dominantCondition}
                        />
                        <div className="weather-visualization__chart-info">
                            <p className="weather-visualization__chart-label">
                                Condição Principal
                            </p>
                            <p className="weather-visualization__chart-condition">
                                {conditionConfig[dominantCondition]?.label || dominantCondition}
                            </p>
                            <div className="weather-visualization__chart-meta">
                                <div className="weather-visualization__chart-confidence">
                                    <Thermometer className="weather-visualization__chart-confidence-icon" />
                                    <span>Confiança: {confidence}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cards de condições detalhadas */}
                {hasValidData ? (
                    <div className="weather-visualization__conditions-grid">
                        {Object.entries(safeConditions).map(([condition, value], index) => (
                            <div
                                key={condition}
                                className="weather-visualization__condition-item"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <ConditionCard
                                    condition={condition}
                                    value={value}
                                    isMain={condition === dominantCondition}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="weather-visualization__empty-state">
                        <AlertTriangle className="weather-visualization__empty-state-icon" />
                        <h3 className="weather-visualization__empty-state-title">
                            Dados Insuficientes
                        </h3>
                        <p className="weather-visualization__empty-state-description">
                            Não foi possível calcular as probabilidades meteorológicas.<br />
                            Verifique os dados históricos da região selecionada.
                        </p>
                    </div>
                )}

                {/* Comparação de Condições */}
                {/* <div className="weather-visualization__ranking">
                    <h3 className="weather-visualization__ranking-title">
                        <TrendingUp className="weather-visualization__ranking-icon" />
                        <span>Ranking de Probabilidades</span>
                    </h3>

                    <div className="weather-visualization__ranking-list">
                        {Object.entries(safeConditions)
                            .sort(([, a], [, b]) => b - a)
                            .map(([condition, value], index) => {
                                const config = conditionConfig[condition];
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={condition}
                                        className="weather-visualization__ranking-item"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="weather-visualization__ranking-position">
                                            {index + 1}
                                        </div>

                                        <div className="weather-visualization__ranking-info">
                                            <Icon size={20} color={config.color} className="weather-visualization__ranking-item-icon" />
                                            <span className="weather-visualization__ranking-label">
                                                {config.label}
                                            </span>
                                        </div>

                                        <div className="weather-visualization__ranking-progress">
                                            <div
                                                className="weather-visualization__ranking-progress-fill"
                                                style={{
                                                    width: `${Math.max(value, 2)}%`,
                                                    background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
                                                    boxShadow: `0 0 10px ${config.color}40`
                                                }}
                                            />
                                        </div>

                                        <div className="weather-visualization__ranking-value">
                                            {value}%
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div> */}

                {/* Limitações da API */}
                {limitations.length > 0 && (
                    <div className="weather-visualization__alert weather-visualization__alert--warning">
                        <div className="weather-visualization__alert-content">
                            <AlertTriangle className="weather-visualization__alert-icon" />
                            <div className="weather-visualization__alert-text">
                                <h4 className="weather-visualization__alert-title">⚠️ Limitações do Sistema</h4>
                                <ul className="weather-visualization__limitations-list">
                                    {limitations.map((limitation, index) => (
                                        <li key={index} className="weather-visualization__limitations-item">
                                            <div className="weather-visualization__limitations-bullet"></div>
                                            <span>{limitation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug info */}
                {/* <div className="weather-visualization__debug">
                    <details className="weather-visualization__debug-details">
                        <summary className="weather-visualization__debug-summary">
                            <span>🔧 Dados Técnicos (Debug)</span>
                            <div className="weather-visualization__debug-indicator"></div>
                        </summary>
                        <div className="weather-visualization__debug-content">
                            <pre className="weather-visualization__debug-code">
                                {JSON.stringify({
                                    original: weatherData,
                                    processed: safeConditions,
                                    hasValidData,
                                    dominantCondition,
                                    confidence
                                }, null, 2)}
                            </pre>
                        </div>
                    </details>
                </div> */}

            </div>
        </div>
    );
};

export default WeatherVisualization;