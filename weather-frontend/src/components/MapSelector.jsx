import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, Calendar, Search, Loader, Navigation, Clock, AlertTriangle, Waves, Layers } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.jsx';
import WeatherChat from './WeatherChat'; // Ajuste o caminho conforme sua estrutura
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapSelector = forwardRef(({ onLocationSubmit, loading, onReset, weatherCondition }, ref) => {
    const { t, currentLanguage } = useTranslation();

    const [mapStyle, setMapStyle] = useState('openstreetmap');
    const [showStyleSelector, setShowStyleSelector] = useState(false);
    const [isChatInputFocused, setIsChatInputFocused] = useState(false);
    const [chatWeatherData, setChatWeatherData] = useState(null);
    const [isUpdatingFromChat, setIsUpdatingFromChat] = useState(false);

    const [position, setPosition] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [step, setStep] = useState('location');
    const [locationName, setLocationName] = useState('');
    const [dateError, setDateError] = useState('');
    const [isValidDate, setIsValidDate] = useState(false);
    const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

    const searchTimeoutRef = useRef(null);
    const dateInputRef = useRef(null);

    const mapStyles = {
        openstreetmap: {
            name: t('mapSelector.styles.openstreetmap.name', 'OpenStreetMap'),
            description: t('mapSelector.styles.openstreetmap.description', 'Mapa padrão com detalhes de ruas'),
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            emoji: '🗺️'
        },
        satellite: {
            name: t('mapSelector.styles.satellite.name', 'Satélite'),
            description: t('mapSelector.styles.satellite.description', 'Imagens de satélite em alta resolução'),
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
            emoji: '🛰️',
            maxZoom: 19
        },
        dark: {
            name: t('mapSelector.styles.dark.name', 'Escuro'),
            description: t('mapSelector.styles.dark.description', 'Tema escuro para baixa luminosidade'),
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            emoji: '🌙',
            subdomains: 'abcd',
            maxZoom: 20
        },
    };

    const getCurrentMapStyle = () => mapStyles[mapStyle] || mapStyles.openstreetmap;

    const weatherThemes = {
        sunny: {
            filter: 'hue-rotate(45deg) saturate(1.2) brightness(1.1)',
            overlay: 'linear-gradient(45deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
            tileOpacity: 0.9
        },
        rainy: {
            filter: 'hue-rotate(200deg) saturate(1.3) brightness(0.8)',
            overlay: 'linear-gradient(45deg, rgba(33, 150, 243, 0.15), rgba(63, 81, 181, 0.1))',
            tileOpacity: 0.8
        },
        cloudy: {
            filter: 'grayscale(0.3) brightness(0.9) contrast(0.9)',
            overlay: 'linear-gradient(45deg, rgba(96, 125, 139, 0.1), rgba(120, 144, 156, 0.1))',
            tileOpacity: 0.85
        },
        snowy: {
            filter: 'hue-rotate(180deg) saturate(0.7) brightness(1.2)',
            overlay: 'linear-gradient(45deg, rgba(224, 247, 250, 0.2), rgba(178, 235, 242, 0.15))',
            tileOpacity: 0.9
        },
        windy: {
            filter: 'hue-rotate(120deg) saturate(1.1) brightness(0.95)',
            overlay: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))',
            tileOpacity: 0.9
        }
    };

    const getCurrentTheme = () => {
        return weatherCondition && weatherThemes[weatherCondition]
            ? weatherThemes[weatherCondition]
            : null;
    };

    // Handlers para o chat
    const handleChatInputFocus = () => {
        setIsChatInputFocused(true);
    };

    const handleChatInputBlur = () => {
        // Pequeno delay para permitir cliques em outros elementos
        setTimeout(() => {
            setIsChatInputFocused(false);
        }, 150);
    };

    const handleWeatherDataFromChat = async (weatherData) => {
    console.log('Dados recebidos do chat:', weatherData);
    setChatWeatherData(weatherData);
    
    // Se tiver coordenadas, usar diretamente
    if (weatherData.coordinates && weatherData.coordinates.lat && weatherData.coordinates.lon) {
        setIsUpdatingFromChat(true);
        
        const { lat, lon } = weatherData.coordinates;
        
        console.log('Movendo pin para:', lat, lon);
        
        // Atualizar posição do pin no mapa
        setPosition([lat, lon]);
        setSelectedLocation({ lat, lon });
        
        // Definir nome da localização
        let locationName = weatherData.location;
        
        if (!locationName || locationName === 'Local não identificado') {
            locationName = await reverseGeocode(lat, lon);
        }
        
        setLocationName(locationName);
        setSearchQuery(locationName);
        setSearchResults([]);
        
        // Se tem data, configurar também
        if (weatherData.date) {
            setSelectedDate(weatherData.date);
            validateDate(weatherData.date);
            setStep('date');
        } else {
            setStep('date');
        }
        
        setIsUpdatingFromChat(false);
        
        console.log('Pin movido com sucesso para:', lat, lon);
        
        // Opcional: Focar no input de data após definir localização
        setTimeout(() => {
            if (dateInputRef.current && weatherData.date) {
                dateInputRef.current.focus();
            }
        }, 500);
    } 
    // Se não tiver coordenadas mas tiver localização, tentar geocodificar
    else if (weatherData.location && weatherData.location !== 'Local não identificado') {
        console.log('Tentando geocodificar localização:', weatherData.location);
        setIsUpdatingFromChat(true);
        
        try {
            // Tentar geocodificar a localização
            const acceptLanguage = currentLanguage === 'en' ? 'en,en-US' : 'pt-BR,pt,en';
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(weatherData.location)}&limit=1&addressdetails=1&accept-language=${acceptLanguage}`
            );
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                
                console.log('Geocodificação bem-sucedida:', lat, lon);
                
                // Atualizar posição do pin no mapa
                setPosition([lat, lon]);
                setSelectedLocation({ lat, lon });
                setLocationName(weatherData.location);
                setSearchQuery(weatherData.location);
                setSearchResults([]);
                
                // Se tem data, configurar também
                if (weatherData.date) {
                    setSelectedDate(weatherData.date);
                    validateDate(weatherData.date);
                    setStep('date');
                } else {
                    setStep('date');
                }
                
                console.log('Pin movido via geocodificação para:', lat, lon);
            } else {
                console.log('Geocodificação falhou para:', weatherData.location);
            }
        } catch (error) {
            console.error('Erro na geocodificação:', error);
        } finally {
            setIsUpdatingFromChat(false);
        }
    } else {
        console.log('Nem coordenadas nem localização válida encontradas:', weatherData);
        setIsUpdatingFromChat(false);
    }
};

    useEffect(() => {
        const mapContainer = document.querySelector('.map-selector__map-container');
        if (mapContainer) {
            const theme = getCurrentTheme();

            if (theme) {
                mapContainer.style.filter = theme.filter;

                let overlay = mapContainer.querySelector('.weather-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'weather-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                        z-index: 1000;
                        transition: all 0.5s ease;
                        border-radius: inherit;
                    `;
                    mapContainer.appendChild(overlay);
                }

                overlay.style.background = theme.overlay;
                overlay.style.opacity = '1';
                mapContainer.className = `map-selector__map-container weather-theme-${weatherCondition}`;

            } else {
                mapContainer.style.filter = '';
                mapContainer.className = 'map-selector__map-container';

                const overlay = mapContainer.querySelector('.weather-overlay');
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 500);
                }
            }
        }
    }, [weatherCondition]);

    const MapStyleSelector = () => (
        <div className="map-style-selector">
            <button
                className="map-style-selector__trigger"
                onClick={() => setShowStyleSelector(!showStyleSelector)}
                title={t('mapSelector.changeStyle', 'Alterar estilo do mapa')}
            >
                <Layers size={16} />
                <span className="map-style-selector__current">
                    {getCurrentMapStyle().emoji}
                </span>
            </button>

            {showStyleSelector && (
                <div className="map-style-selector__panel">
                    <div className="map-style-selector__header">
                        <span className="map-style-selector__title">
                            🗺️ {t('mapSelector.mapStyles', 'Estilos de Mapa')}
                        </span>
                        <button
                            className="map-style-selector__close"
                            onClick={() => setShowStyleSelector(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="map-style-selector__grid">
                        {Object.entries(mapStyles).map(([key, style]) => (
                            <button
                                key={key}
                                className={`map-style-selector__option ${mapStyle === key ? 'map-style-selector__option--active' : ''
                                    }`}
                                onClick={() => {
                                    setMapStyle(key);
                                    setShowStyleSelector(false);
                                }}
                            >
                                <div className="map-style-selector__option-preview">
                                    <span className="map-style-selector__option-emoji">
                                        {style.emoji}
                                    </span>
                                </div>
                                <div className="map-style-selector__option-info">
                                    <div className="map-style-selector__option-name">
                                        {style.name}
                                    </div>
                                    <div className="map-style-selector__option-desc">
                                        {style.description}
                                    </div>
                                </div>
                                {mapStyle === key && (
                                    <div className="map-style-selector__option-check">✓</div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const reverseGeocode = async (lat, lon) => {
        setIsGeocodingLocation(true);

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
            setIsGeocodingLocation(false);
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

    const resetFlow = () => {
        setStep('location');
        setSelectedLocation(null);
        setSelectedDate('');
        setSearchQuery('');
        setLocationName('');
        setPosition(null);
        setSearchResults([]);
        setDateError('');
        setIsValidDate(false);
        setIsGeocodingLocation(false);
        setChatWeatherData(null);
        setIsUpdatingFromChat(false);
    };

    const resetFormOnly = () => {
        setStep('location');
        setSelectedDate('');
        setSearchQuery('');
        setDateError('');
        setIsValidDate(false);
        setIsGeocodingLocation(false);
        setSearchResults([]);

        if (!selectedLocation) {
            setSearchQuery('');
            setLocationName('');
        } else {
            setSearchQuery(locationName);
        }
    };

    useImperativeHandle(ref, () => ({
        resetFlow,
        resetFormOnly
    }));

    const validateDate = (dateString) => {
        if (!dateString) {
            setDateError('');
            setIsValidDate(false);
            return false;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            setDateError(t('mapSelector.steps.date.errors.invalidFormat'));
            setIsValidDate(false);
            return false;
        }

        const [year, month, day] = dateString.split('-');
        const selectedDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() + 30, today.getMonth(), today.getDate());

        if (isNaN(selectedDateObj.getTime())) {
            setDateError(t('mapSelector.steps.date.errors.invalidDate'));
            setIsValidDate(false);
            return false;
        }

        if (selectedDateObj < todayLocal) {
            setDateError(t('mapSelector.steps.date.errors.pastDate'));
            setIsValidDate(false);
            return false;
        }

        if (selectedDateObj > maxDate) {
            setDateError(t('mapSelector.steps.date.errors.tooFarFuture'));
            setIsValidDate(false);
            return false;
        }

        setDateError('');
        setIsValidDate(true);
        return true;
    };

    const searchLocation = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const acceptLanguage = currentLanguage === 'en' ? 'en,en-US' : 'pt-BR,pt,en';

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=${acceptLanguage}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Erro na busca:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchLocation(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, currentLanguage]);

    const handleLocationSelect = async (location) => {
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        let name;

        if (location.display_name) {
            name = formatLocationName(location, lat, lon);
        } else {
            name = await reverseGeocode(lat, lon);
        }

        setPosition([lat, lon]);
        setSelectedLocation({ lat, lon });
        setLocationName(name);
        setSearchQuery(name);
        setSearchResults([]);

        setStep('date');

        setTimeout(() => {
            if (dateInputRef.current) {
                dateInputRef.current.focus();
            }
        }, 100);
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        validateDate(date);
    };

    const handleDateConfirm = () => {
        if (!selectedDate || !isValidDate || !selectedLocation) {
            return;
        }

        handleSubmit(selectedLocation.lat, selectedLocation.lon, selectedDate);
    };

    const handleSubmit = async (lat, lon, date) => {
        if (!lat || !lon || !date) return;

        if (!validateDate(date)) {
            return;
        }

        setStep('submitting');

        try {
            await onLocationSubmit({
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                date
            });
        } catch (error) {
            console.error('Erro ao submeter:', error);
            setStep('date');
        }
    };

    const MapEvents = () => {
        useMapEvents({
            click: async (e) => {
                if (step === 'location') {
                    const { lat, lng } = e.latlng;

                    const tempName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setPosition([lat, lng]);
                    setSelectedLocation({ lat, lon: lng });
                    setLocationName(tempName);
                    setSearchQuery(tempName);
                    setSearchResults([]);

                    const locationName = await reverseGeocode(lat, lng);
                    setLocationName(locationName);
                    setSearchQuery(locationName);

                    setStep('date');

                    setTimeout(() => {
                        if (dateInputRef.current) {
                            dateInputRef.current.focus();
                        }
                    }, 100);
                }
            }
        });
        return null;
    };

    const getMinDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getMaxDate = () => {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() + 30, today.getMonth(), today.getDate());
        const year = maxDate.getFullYear();
        const month = String(maxDate.getMonth() + 1).padStart(2, '0');
        const day = String(maxDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getSixMonthsDate = () => {
        const today = new Date();
        const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
        const year = sixMonths.getFullYear();
        const month = String(sixMonths.getMonth() + 1).padStart(2, '0');
        const day = String(sixMonths.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTwoYearsDate = () => {
        const today = new Date();
        const twoYears = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
        const year = twoYears.getFullYear();
        const month = String(twoYears.getMonth() + 1).padStart(2, '0');
        const day = String(twoYears.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getStepStatus = (stepName) => {
        switch (stepName) {
            case 'location':
                return step === 'location' ? 'active' : selectedLocation ? 'completed' : 'pending';
            case 'date':
                return step === 'date' ? 'active' : (selectedDate && isValidDate) ? 'completed' : 'pending';
            case 'submitting':
                return step === 'submitting' ? 'active' : 'pending';
            default:
                return 'pending';
        }
    };

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

    const getLocationIcon = () => {
        if (isGeocodingLocation) {
            return <Loader className="map-selector__location-loading" size={14} />;
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
            return '📍';
        }
    };

    const handleNewSearch = () => {
        if (selectedLocation) {
            setStep('date');
            setSelectedDate('');
            setDateError('');
            setIsValidDate(false);

            setTimeout(() => {
                if (dateInputRef.current) {
                    dateInputRef.current.focus();
                }
            }, 100);
        } else {
            setStep('location');
        }
    };

    return (
        <div className="map-selector">
            <div className="map-selector__header">
                {/* Chat Input sempre visível no topo */}
                <div className="map-selector__chat">
                    <WeatherChat 
                        onWeatherDataReceived={handleWeatherDataFromChat}
                        className="map-selector__weather-chat"
                        onInputFocus={handleChatInputFocus}
                        onInputBlur={handleChatInputBlur}
                        isInputFocused={isChatInputFocused}
                    />
                </div>
                
                {/* Form só aparece quando chat input não está focado */}
                <div 
                    className={`map-selector__header-form ${
                        isChatInputFocused ? 'map-selector__header-form--hidden' : ''
                    }`}
                >
                    {step === 'location' && (
                        <div className="map-selector__step">
                            <div className="map-selector__step-header">
                                <div className="map-selector__step-indicator">
                                    <div className="map-selector__step-number">1</div>
                                </div>
                                <div className="map-selector__step-info">
                                    <div className="map-selector__step-title">
                                        {t('mapSelector.steps.location.title')}
                                    </div>
                                    <div className="map-selector__step-subtitle">
                                        {selectedLocation ?
                                            t('mapSelector.steps.location.subtitle.hasLocation') :
                                            t('mapSelector.steps.location.subtitle.default')
                                        }
                                    </div>
                                </div>
                                {selectedLocation && (
                                    <button
                                        className="map-selector__step-continue"
                                        onClick={handleNewSearch}
                                        title={t('common.continue')}
                                    >
                                        →
                                    </button>
                                )}
                            </div>

                            <div className="autocomplete-container">
                                <div className="autocomplete-input-wrapper">
                                    <input
                                        type="text"
                                        className="map-selector__input"
                                        placeholder={selectedLocation ?
                                            t('mapSelector.steps.location.placeholder.hasLocation') :
                                            t('mapSelector.steps.location.placeholder.default')
                                        }
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    {isSearching && (
                                        <div className="autocomplete-spinner"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'date' && (
                        <div className="map-selector__step">
                            <div className="map-selector__step-header">
                                <div className="map-selector__step-indicator map-selector__step-indicator--active">
                                    <div className="map-selector__step-number">2</div>
                                </div>
                                <div className="map-selector__step-info">
                                    <div className="map-selector__step-title">
                                        {t('mapSelector.steps.date.title')}
                                    </div>
                                    <div className="map-selector__step-subtitle">
                                        <span className="map-selector__location-text">
                                            {isGeocodingLocation ?
                                                t('weatherVisualization.location.identifying') :
                                                (locationName.length > 35 ? locationName.substring(0, 35) + '...' : locationName)
                                            }
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="map-selector__step-back"
                                    onClick={() => setStep('location')}
                                    title={t('common.back')}
                                >
                                    ←
                                </button>
                            </div>

                            <div className="map-selector__date-section">
                                <div className="map-selector__date-input-wrapper">
                                    <Calendar className="map-selector__date-icon" />
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        className={`map-selector__input map-selector__input--date ${dateError ? 'map-selector__input--error' : isValidDate ? 'map-selector__input--success' : ''}`}
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        required
                                    />
                                </div>

                                {dateError && (
                                    <div className="map-selector__date-error">
                                        <AlertTriangle size={14} />
                                        <span>{dateError}</span>
                                    </div>
                                )}

                                {!selectedDate && (
                                    <div className="map-selector__date-suggestions">
                                        <div className="map-selector__date-suggestions-title">
                                            {t('mapSelector.steps.date.suggestions.title')}
                                        </div>
                                        <div className="map-selector__date-suggestions-grid">
                                            <button
                                                className="map-selector__date-suggestion"
                                                onClick={() => {
                                                    const sixMonths = getSixMonthsDate();
                                                    setSelectedDate(sixMonths);
                                                    validateDate(sixMonths);
                                                }}
                                            >
                                                <span className="map-selector__date-suggestion-label">
                                                    {t('mapSelector.steps.date.suggestions.sixMonths', 'Em 6 meses')}
                                                </span>
                                                <span className="map-selector__date-suggestion-date">
                                                    {new Date(getSixMonthsDate()).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-BR')}
                                                </span>
                                            </button>
                                            <button
                                                className="map-selector__date-suggestion"
                                                onClick={() => {
                                                    const twoYears = getTwoYearsDate();
                                                    setSelectedDate(twoYears);
                                                    validateDate(twoYears);
                                                }}
                                            >
                                                <span className="map-selector__date-suggestion-label">
                                                    {t('mapSelector.steps.date.suggestions.twoYears', 'Em 2 anos')}
                                                </span>
                                                <span className="map-selector__date-suggestion-date">
                                                    {new Date(getTwoYearsDate()).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-BR')}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedDate && isValidDate && (
                                    <div className="map-selector__date-preview">
                                        <div className="map-selector__date-preview-content">
                                            <div className="map-selector__date-preview-icon">📅</div>
                                            <div className="map-selector__date-preview-info">
                                                <div className="map-selector__date-preview-title">
                                                    {t('mapSelector.steps.date.preview.title')}
                                                </div>
                                                <div className="map-selector__date-preview-date">
                                                    {formatDateForDisplay(selectedDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDate && isValidDate && (
                                    <button
                                        className="map-selector__date-confirm"
                                        onClick={handleDateConfirm}
                                        disabled={loading}
                                    >
                                        <Search size={16} />
                                        <span>{t('mapSelector.steps.date.confirm')}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'submitting' && (
                        <div className="map-selector__step">
                            <div className="map-selector__step-header">
                                <div className="map-selector__step-indicator map-selector__step-indicator--loading">
                                    <Loader className="map-selector__step-spinner" />
                                </div>
                                <div className="map-selector__step-info">
                                    <div className="map-selector__step-title">
                                        {t('mapSelector.steps.submitting.title')}
                                    </div>
                                    <div className="map-selector__step-subtitle">
                                        {t('mapSelector.steps.submitting.subtitle')}
                                    </div>
                                </div>
                                <button
                                    className="map-selector__step-back"
                                    onClick={resetFormOnly}
                                    title={t('common.cancel')}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="map-selector__loading-bar">
                                <div className="map-selector__loading-fill"></div>
                            </div>
                        </div>
                    )}

                    <div className="map-selector__progress">
                        <div className="map-selector__progress-steps">
                            <div className={`map-selector__progress-step ${getStepStatus('location')}`}>
                                <MapPin size={12} />
                            </div>
                            <div className="map-selector__progress-line"></div>
                            <div className={`map-selector__progress-step ${getStepStatus('date')}`}>
                                <Calendar size={12} />
                            </div>
                            <div className="map-selector__progress-line"></div>
                            <div className={`map-selector__progress-step ${getStepStatus('submitting')}`}>
                                <Search size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {searchResults.length > 0 && step === 'location' && (
                <div id="autocomplete-portal">
                    <ul className="autocomplete-results-list">
                        {searchResults.map((result, index) => (
                            <li
                                key={index}
                                onClick={() => handleLocationSelect(result)}
                            >
                                <MapPin className="result-icon" size={16} />
                                <div className="result-text">
                                    <div className="result-main">
                                        {result.display_name.split(',')[0]}
                                    </div>
                                    <div className="result-secondary">
                                        {result.display_name}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="map-selector__map-container">
                {isUpdatingFromChat && (
                    <div className="map-selector__updating-overlay">
                        <div className="map-selector__updating-content">
                            <Loader className="map-selector__updating-spinner" size={24} />
                            <span>Atualizando localização...</span>
                        </div>
                    </div>
                )}
                
                {/* <MapStyleSelector /> */}
                <MapContainer
                    center={position || [-14.2350, -51.9253]}
                    zoom={position ? 12 : 4}
                    className="map-selector__map"
                    key={`${position ? `${position[0]}-${position[1]}` : 'default'}-${mapStyle}-${isUpdatingFromChat ? 'updating' : 'static'}`}
                    minZoom={2}
                    maxZoom={getCurrentMapStyle().maxZoom || 18}
                    maxBounds={[[-90, -180], [90, 180]]}
                    maxBoundsViscosity={1.0}
                    worldCopyJump={false}
                    zoomControl={true}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    touchZoom={true}
                    boxZoom={true}
                    keyboard={true}
                    dragging={true}
                    preferCanvas={false}
                    zoomSnap={1}
                    zoomDelta={1}
                    wheelPxPerZoomLevel={60}
                >
                    <TileLayer
                        url={getCurrentMapStyle().url}
                        attribution={getCurrentMapStyle().attribution}
                        minZoom={2}
                        maxZoom={getCurrentMapStyle().maxZoom || 18}
                        noWrap={true}
                        bounds={[[-90, -180], [90, 180]]}
                        keepBuffer={2}
                        maxNativeZoom={getCurrentMapStyle().maxZoom || 18}
                        tileSize={256}
                        zoomOffset={0}
                        updateWhenIdle={false}
                        updateWhenZooming={true}
                        crossOrigin={false}
                        opacity={getCurrentTheme()?.tileOpacity || 1}
                        subdomains={getCurrentMapStyle().subdomains || 'abc'}
                    />

                    <MapEvents />
                    {position && (
                        <Marker 
                            position={position}
                            className={isUpdatingFromChat ? 'marker-updating' : ''}
                        >
                            <Popup>
                                <div className="map-selector__popup">
                                    <div className="map-selector__popup-title">
                                        {getLocationIcon()} {t('mapSelector.popup.title')}
                                    </div>
                                    <div className="map-selector__popup-name">
                                        {locationName}
                                    </div>
                                    <div className="map-selector__popup-coords">
                                        {position[0].toFixed(4)}, {position[1].toFixed(4)}
                                    </div>
                                    {chatWeatherData && (
                                        <div className="map-selector__popup-source">
                                            🤖 Localização do Chat
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>

                {weatherCondition && (
                    <div className="map-selector__weather-indicator">
                        <div className={`map-selector__weather-badge weather-badge-${weatherCondition}`}>
                            <span className="map-selector__weather-emoji">
                                {weatherCondition === 'sunny' && '☀️'}
                                {weatherCondition === 'rainy' && '🌧️'}
                                {weatherCondition === 'cloudy' && '☁️'}
                                {weatherCondition === 'snowy' && '❄️'}
                                {weatherCondition === 'windy' && '🌬️'}
                            </span>
                            <span className="map-selector__weather-label">
                                {t(`mapSelector.weather.conditions.${weatherCondition}`)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {selectedLocation && (
                <div className="map-selector__overlay">
                    <div className="map-selector__overlay-content">
                        <div className="map-selector__overlay-info">
                            <div className="map-selector__overlay-name">
                                <span className="map-selector__overlay-icon">
                                    {getLocationIcon()}
                                </span>
                                <span>{locationName}</span>
                            </div>
                            <div className="map-selector__overlay-coords">
                                📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                            </div>
                            {selectedDate && isValidDate && (
                                <div className="map-selector__overlay-date">
                                    📅 {formatDateForDisplay(selectedDate)}
                                </div>
                            )}
                            <div className="map-selector__overlay-status">
                                <div className="map-selector__overlay-dot"></div>
                                <span>
                                    {step === 'location' ? t('mapSelector.overlay.status.locationSelected') :
                                        step === 'date' ? (isValidDate ? t('mapSelector.overlay.status.validDate') : t('mapSelector.overlay.status.waitingValidDate')) :
                                            step === 'submitting' ? t('mapSelector.overlay.status.processing') : t('mapSelector.overlay.status.ready')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

MapSelector.displayName = 'MapSelector';

export default MapSelector;