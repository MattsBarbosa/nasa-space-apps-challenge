import React, { useState, useMemo, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, AlertTriangle, TrendingUp, Eye, Thermometer, X, Loader } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.jsx';

const WeatherVisualization = ({ weatherData: rawWeatherData, onClose }) => {
    const { t, currentLanguage } = useTranslation();

    const [isVisible, setIsVisible] = useState(true);
    const [locationName, setLocationName] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            const [year, month, day] = dateString.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            if (isNaN(date.getTime())) {
                return dateString;
            }

            const locale = currentLanguage === 'en' ? 'en-US' : 'pt-BR';

            return date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return dateString;
        }
    };

    const reverseGeocode = async (lat, lon) => {
        setIsLoadingLocation(true);

        try {
            const acceptLanguage = currentLanguage === 'en' ? 'en,en-US' : 'pt-BR,pt,en';

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=${acceptLanguage}`
            );

            if (!response.ok) {
                throw new Error('Erro na geocodificação');
            }

            const data = await response.json();

            if (data && data.display_name) {
                return formatLocationName(data, lat, lon);
            } else {
                return getOceanOrFallbackName(lat, lon);
            }
        } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
            return getOceanOrFallbackName(lat, lon);
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const formatLocationName = (geocodeData, lat, lon) => {
        const address = geocodeData.address || {};

        const locationParts = [
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.district ||
            address.county ||
            address.state_district,

            address.state ||
            address.region,

            address.country
        ].filter(Boolean);

        if (locationParts.length > 0) {
            const mainLocation = locationParts.slice(0, 2).join(', ');
            const country = locationParts[locationParts.length - 1];

            if (locationParts.length === 1) {
                return `${mainLocation}`;
            } else {
                return `${mainLocation}, ${country}`;
            }
        } else {
            return getOceanOrFallbackName(lat, lon);
        }
    };

    const getOceanOrFallbackName = (lat, lon) => {
        const oceanRegions = [
            {
                name: t('locations.oceans.atlantic'),
                condition: (lat, lon) =>
                    (lat >= -60 && lat <= 0 && lon >= -50 && lon <= 20) ||
                    (lat >= 0 && lat <= 70 && lon >= -80 && lon <= 0)
            },
            {
                name: t('locations.oceans.pacific'),
                condition: (lat, lon) =>
                    (lon >= -180 && lon <= -70) ||
                    (lon >= 120 && lon <= 180)
            },
            {
                name: t('locations.oceans.indian'),
                condition: (lat, lon) =>
                    lat >= -60 && lat <= 30 && lon >= 20 && lon <= 120
            },
            {
                name: t('locations.oceans.arctic'),
                condition: (lat, lon) => lat >= 70
            },
            {
                name: t('locations.oceans.antarctic'),
                condition: (lat, lon) => lat <= -60
            }
        ];

        for (const ocean of oceanRegions) {
            if (ocean.condition(lat, lon)) {
                return ocean.name;
            }
        }

        const remoteRegions = [
            {
                name: t('locations.regions.sahara'),
                condition: (lat, lon) =>
                    lat >= 15 && lat <= 30 && lon >= -15 && lon <= 35
            },
            {
                name: t('locations.regions.gobi'),
                condition: (lat, lon) =>
                    lat >= 40 && lat <= 50 && lon >= 90 && lon <= 110
            },
            {
                name: t('locations.regions.antarctica'),
                condition: (lat, lon) => lat <= -70
            },
            {
                name: t('locations.regions.greenland'),
                condition: (lat, lon) =>
                    lat >= 70 && lon >= -50 && lon <= -10
            },
            {
                name: t('locations.regions.amazon'),
                condition: (lat, lon) =>
                    lat >= -10 && lat <= 5 && lon >= -70 && lon <= -50
            }
        ];

        for (const region of remoteRegions) {
            if (region.condition(lat, lon)) {
                return region.name;
            }
        }

        return t('locations.regions.remote');
    };

    const getLocationIcon = () => {
        if (isLoadingLocation) {
            return <Loader className="weather-visualization__location-loading" size={14} />;
        }

        if (locationName.includes(t('locations.oceans.atlantic')) ||
            locationName.includes(t('locations.oceans.pacific')) ||
            locationName.includes(t('locations.oceans.indian')) ||
            locationName.includes(t('locations.oceans.arctic')) ||
            locationName.includes(t('locations.oceans.antarctic'))) {
            return '🌊';
        } else if (locationName.includes(t('locations.regions.sahara')) ||
            locationName.includes(t('locations.regions.gobi'))) {
            return '🏜️';
        } else if (locationName.includes(t('locations.regions.antarctica')) ||
            locationName.includes(t('locations.regions.greenland'))) {
            return '🧊';
        } else if (locationName.includes(t('locations.regions.amazon'))) {
            return '🌳';
        } else if (locationName.includes(t('locations.regions.remote'))) {
            return '🗺️';
        } else {
            return '';
        }
    };

    const weatherData = useMemo(() => {
        if (!rawWeatherData || !rawWeatherData.predictions) {
            return null;
        }

        const eventMapping = {
            'Preciptation': 'rainy',
            'Cloud': 'cloudy',
            'Wind': 'windy',
            'SunRadiation': 'sunny',
            'Snow': 'snowy',
            'Temperature': 'temperature'
        };

        const conditions = {
            sunny: 0,
            rainy: 0,
            cloudy: 0,
            snowy: 0,
            windy: 0
        };

        let dominantCondition = 'sunny';
        let maxProbability = 0;

        rawWeatherData.predictions.forEach(prediction => {
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

            if (condition && condition !== 'temperature' && probability > maxProbability) {
                maxProbability = probability;
                dominantCondition = condition;
            }
        });

        if (conditions.snowy > 0) {
            dominantCondition = 'snowy';
            maxProbability = conditions.snowy;
        } else if (conditions.rainy > 60) {
            dominantCondition = 'rainy';
            maxProbability = conditions.rainy;
        } else if (conditions.cloudy > 80) {
            dominantCondition = 'cloudy';
            maxProbability = conditions.cloudy;
        } else if (conditions.sunny > 90) {
            dominantCondition = 'sunny';
            maxProbability = conditions.sunny;
        }

        const limitations = [];

        if (maxProbability < 50) {
            limitations.push(t('weatherVisualization.limitations.items.3'));
        }

        limitations.push(
            t('weatherVisualization.limitations.items.0'),
            t('weatherVisualization.limitations.items.1'),
            t('weatherVisualization.limitations.items.2')
        );

        const calculateConfidence = () => {
            const validConditions = Object.values(conditions).filter(v => v > 0).length;
            const dataConsistency = validConditions >= 3 ? 85 : validConditions >= 2 ? 70 : 50;
            const probabilityFactor = Math.min(maxProbability * 0.8, 90);
            return Math.round((dataConsistency + probabilityFactor) / 2);
        };

        return {
            prediction: {
                conditions,
                probability: Math.round(maxProbability),
                confidence: calculateConfidence(),
                dominantCondition,
                limitations
            },
            location: {
                lat: rawWeatherData.metadata?.location?.latitude,
                lon: rawWeatherData.metadata?.location?.longitude
            },
            futureDate: rawWeatherData.metadata?.target_date,
            metadata: rawWeatherData.metadata
        };
    }, [rawWeatherData, t]);

    useEffect(() => {
        if (weatherData?.location?.lat && weatherData?.location?.lon) {
            const fetchLocationName = async () => {
                const name = await reverseGeocode(weatherData.location.lat, weatherData.location.lon);
                setLocationName(name);
            };

            fetchLocationName();
        }
    }, [weatherData?.location, currentLanguage]);

    // Função para fechar o modal
    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    const handleCloseFromChild = (e) => {
        e.stopPropagation();
        handleClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!weatherData) {
        return (
            <div className="weather-visualization" onClick={handleBackdropClick}>
                <div className="weather-visualization__container" onClick={(e) => e.stopPropagation()}>
                    <div className="weather-visualization__wrapper">
                        <button onClick={handleCloseFromChild} className="weather-visualization__close-button">
                            <X size={20} />
                        </button>
                        <div className="weather-visualization__empty-state">
                            <AlertTriangle className="weather-visualization__empty-state-icon" />
                            <h3 className="weather-visualization__empty-state-title">
                                {t('weatherVisualization.emptyState.title')}
                            </h3>
                            <p className="weather-visualization__empty-state-description">
                                {t('weatherVisualization.emptyState.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
    const limitations = weatherData?.prediction?.limitations || [];

    const conditionConfig = {
        sunny: {
            icon: Sun,
            color: '#FBBF24',
            label: t('conditions.sunny'),
            emoji: '☀️'
        },
        rainy: {
            icon: CloudRain,
            color: '#3B82F6',
            label: t('conditions.rainy'),
            emoji: '🌧️'
        },
        cloudy: {
            icon: Cloud,
            color: '#6B7280',
            label: t('conditions.cloudy'),
            emoji: '☁️'
        },
        snowy: {
            icon: Snowflake,
            color: '#E5E7EB',
            label: t('conditions.snowy'),
            emoji: '❄️'
        },
        windy: {
            icon: Wind,
            color: '#10B981',
            label: t('conditions.windy'),
            emoji: '🌬️'
        }
    };

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
                    <span className="weather-visualization__circular-progress-label">
                        {t('common.probability')}
                    </span>
                </div>
            </div>
        );
    };

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
                                <p className="weather-visualization__condition-card-subtitle">
                                    {value}% {t('common.chance')}
                                </p>
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
                        ⭐ {currentLanguage === 'en' ? 'Dominant' : 'Dominante'}
                    </div>
                )}
            </div>
        );
    };

    const hasValidData = Object.values(safeConditions).some(val => val > 0);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="weather-visualization" onClick={handleBackdropClick}>
            <div className="weather-visualization__container" onClick={(e) => e.stopPropagation()}>
                <div className="weather-visualization__wrapper">
                    <button onClick={handleCloseFromChild} className="weather-visualization__close-button">
                        <X size={20} />
                    </button>

                    <div className="weather-visualization__header">
                        <h2 className="weather-visualization__title">
                            {t('weatherVisualization.title')}
                        </h2>
                        <div className="weather-visualization__subtitle">
                            <TrendingUp className="weather-visualization__subtitle-icon" />
                            <span>{t('weatherVisualization.subtitle')}</span>
                        </div>
                    </div>

                    {(location || futureDate) && (
                        <div className="weather-visualization__location-info">
                            {location && location.lat && location.lon && (
                                <div className="weather-visualization__location">
                                    <div className="weather-visualization__location-dot"></div>
                                    <div className="weather-visualization__location-content">
                                        {isLoadingLocation ? (
                                            <p className="weather-visualization__location-text">
                                                <Loader className="weather-visualization__location-loading" size={14} />
                                                <span>{t('weatherVisualization.location.identifying')}</span>
                                            </p>
                                        ) : locationName ? (
                                            <p className="weather-visualization__location-text">
                                                <span className="weather-visualization__location-icon">
                                                    {getLocationIcon()}
                                                </span>
                                                <span className="weather-visualization__location-name">{locationName}</span>
                                            </p>
                                        ) : (
                                            <p className="weather-visualization__location-text">
                                                {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {futureDate && (
                                <p className="weather-visualization__date">
                                    📅 {formatDateForDisplay(futureDate)}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="weather-visualization__main-chart">
                        <div className="weather-visualization__chart-container">
                            <CircularProgress
                                value={probability}
                                size={180}
                                condition={dominantCondition}
                            />
                            <div className="weather-visualization__chart-info">
                                <p className="weather-visualization__chart-label">
                                    {currentLanguage === 'en' ? 'Main Condition' : 'Condição Principal'}
                                </p>
                                <p className="weather-visualization__chart-condition">
                                    {conditionConfig[dominantCondition]?.label || dominantCondition}
                                </p>
                                <div className="weather-visualization__chart-meta">
                                    <div className="weather-visualization__chart-confidence">
                                        <Thermometer className="weather-visualization__chart-confidence-icon" />
                                        <span>{t('common.confidence')}: {confidence}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                {t('weatherVisualization.emptyState.insufficientTitle')}
                            </h3>
                            <p className="weather-visualization__empty-state-description">
                                {t('weatherVisualization.emptyState.insufficientDescription')}
                            </p>
                        </div>
                    )}

                    {limitations.length > 0 && (
                        <div className="weather-visualization__alert weather-visualization__alert--warning">
                            <div className="weather-visualization__alert-content">
                                <div className="weather-visualization__alert-text">
                                    <h4 className="weather-visualization__alert-title">
                                        <AlertTriangle className="weather-visualization__alert-icon" />
                                        Informaçôes do Sistema
                                    </h4>
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

                    {weatherData.metadata?.data_sources && (
                        <div className="weather-visualization__data-sources">
                            <h4 className="weather-visualization__data-sources-title">
                                {t('weatherVisualization.dataSources.title')}
                            </h4>
                            <div className="weather-visualization__data-sources-grid">
                                <div className="weather-visualization__data-source">
                                    <strong>
                                        {currentLanguage === 'en' ? 'Primary:' : 'Principal:'}
                                    </strong> {weatherData.metadata.data_sources.primary.name}
                                    <br />
                                    <small>{weatherData.metadata.data_sources.primary.description}</small>
                                </div>
                                {weatherData.metadata.data_sources.validation && (
                                    <div className="weather-visualization__data-source">
                                        <strong>
                                            {currentLanguage === 'en' ? 'Validation:' : 'Validação:'}
                                        </strong> {weatherData.metadata.data_sources.validation.name}
                                        <br />
                                        <small>
                                            {currentLanguage === 'en' ? 'Status:' : 'Status:'} {weatherData.metadata.data_sources.validation.status}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherVisualization;