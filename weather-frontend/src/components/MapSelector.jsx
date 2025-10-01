import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Calendar, Search, MapPin, Crosshair, Globe, Navigation, Satellite, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente que captura cliques no mapa
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            onLocationSelect({ lat: lat.toFixed(6), lon: lng.toFixed(6) });
        },
    });
    return null;
};

// Componente que move o mapa para seguir o pin
const MapController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);

    return null;
};

// Componente principal do seletor de localização com mapa
const MapLocationSelector = ({ onLocationSubmit, loading }) => {
    const [selectedLocation, setSelectedLocation] = useState({
        lat: -26.9189,
        lon: -49.0658,
        name: 'Blumenau, SC'
    });

    const [date, setDate] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    const [mapCenter, setMapCenter] = useState([-26.9189, -49.0658]);
    const [mapZoom, setMapZoom] = useState(10);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [showManualCoords, setShowManualCoords] = useState(false);
    const mapRef = useRef(null);

    // Locais pré-definidos com emojis
    const presetLocations = [
        { name: 'Blumenau, SC', lat: -26.9189, lon: -49.0658, zoom: 12, emoji: '🌲', climate: 'Subtropical' },
        { name: 'São Paulo, SP', lat: -23.5505, lon: -46.6333, zoom: 10, emoji: '🏙️', climate: 'Urbano' },
        { name: 'São Joaquim, SC', lat: -28.1, lon: -49.47, zoom: 12, emoji: '❄️', climate: 'Frio' },
        { name: 'Rio de Janeiro, RJ', lat: -22.9068, lon: -43.1729, zoom: 11, emoji: '🏖️', climate: 'Tropical' },
        { name: 'Nova York, EUA', lat: 40.7128, lon: -74.0061, zoom: 11, emoji: '🗽', climate: 'Continental' },
        { name: 'Londres, UK', lat: 51.5074, lon: -0.1278, zoom: 11, emoji: '🌧️', climate: 'Oceânico' },
        { name: 'Tóquio, Japão', lat: 35.6762, lon: 139.6503, zoom: 11, emoji: '🗾', climate: 'Temperado' },
        { name: 'Sydney, Austrália', lat: -33.8688, lon: 151.2093, zoom: 11, emoji: '🦘', climate: 'Mediterrâneo' }
    ];

    // Função para buscar localização atual do usuário
    const getCurrentLocation = () => {
        setIsLoadingLocation(true);

        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador');
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = {
                    lat: parseFloat(latitude.toFixed(6)),
                    lon: parseFloat(longitude.toFixed(6)),
                    name: 'Sua localização atual'
                };

                setSelectedLocation(newLocation);
                setMapCenter([latitude, longitude]);
                setMapZoom(13);
                setIsLoadingLocation(false);
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
                setIsLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    // Função para buscar nome do local baseado nas coordenadas
    const reverseGeocode = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
            );

            if (response.ok) {
                const data = await response.json();

                let locationName = '';

                if (data.city) {
                    locationName = data.city;
                } else if (data.locality) {
                    locationName = data.locality;
                } else if (data.principalSubdivision) {
                    locationName = data.principalSubdivision;
                }

                if (data.principalSubdivision && locationName && locationName !== data.principalSubdivision) {
                    locationName += `, ${data.principalSubdivision}`;
                }

                if (data.countryName && locationName) {
                    locationName += `, ${data.countryName}`;
                }

                return locationName || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
            }
        } catch (error) {
            console.error('Erro no geocoding reverso:', error);
        }

        return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
    };

    // Handler para clique no mapa
    const handleMapClick = async ({ lat, lon }) => {
        const locationName = await reverseGeocode(lat, lon);
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        setSelectedLocation({
            lat: latNum,
            lon: lonNum,
            name: locationName
        });

        setMapCenter([latNum, lonNum]);
    };

    // Handler para seleção de preset
    const handlePresetSelect = (location) => {
        setSelectedLocation(location);
        setMapCenter([location.lat, location.lon]);
        setMapZoom(location.zoom || 11);
    };

    // Handler para submit do formulário
    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedLocation.lat && selectedLocation.lon && date) {
            onLocationSubmit({
                lat: parseFloat(selectedLocation.lat),
                lon: parseFloat(selectedLocation.lon),
                date
            });
        }
    };

    return (
        <div className="map-selector">
            {/* Header */}
            <div className="map-selector__header">
                <div className="map-selector__header-icon">
                    <Satellite className="map-selector__header-icon-svg" />
                </div>
                <div className="map-selector__header-content">
                    <h2 className="map-selector__title">
                        Seletor de Localização
                    </h2>
                    <p className="map-selector__subtitle">
                        Clique no mapa ou escolha um local para análise meteorológica
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="map-selector__form">
                {/* Controles do Mapa */}
                <div className="map-selector__section">
                    <div className="map-selector__section-header">
                        <h3 className="map-selector__section-title">
                            <Globe className="map-selector__section-icon" />
                            <span>Mapa Interativo</span>
                        </h3>

                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isLoadingLocation}
                            className="map-selector__location-btn"
                        >
                            {isLoadingLocation ? (
                                <div className="map-selector__location-btn-spinner" />
                            ) : (
                                <Navigation className="map-selector__location-btn-icon" />
                            )}
                            <span>Minha Localização</span>
                        </button>
                    </div>

                    {/* Mapa */}
                    <div className="map-selector__map-container">
                        <MapContainer
                            ref={mapRef}
                            center={mapCenter}
                            zoom={mapZoom}
                            style={{ height: '100%', width: '100%' }}
                            className="map-selector__map"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapClickHandler onLocationSelect={handleMapClick} />
                            <MapController center={mapCenter} zoom={mapZoom} />

                            {selectedLocation.lat && selectedLocation.lon && (
                                <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
                                    <Popup>
                                        <div className="map-selector__popup">
                                            <div className="map-selector__popup-title">
                                                {selectedLocation.name}
                                            </div>
                                            <div className="map-selector__popup-coords">
                                                {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4) : selectedLocation.lat}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : selectedLocation.lon}°
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </MapContainer>

                        {/* Overlay com informações da localização selecionada */}
                        <div className="map-selector__overlay">
                            <div className="map-selector__overlay-content">
                                <MapPin className="map-selector__overlay-icon" />
                                <div className="map-selector__overlay-info">
                                    <p className="map-selector__overlay-name">
                                        {selectedLocation.name}
                                    </p>
                                    <p className="map-selector__overlay-coords">
                                        {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4) : selectedLocation.lat}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : selectedLocation.lon}°
                                    </p>
                                    <div className="map-selector__overlay-status">
                                        <div className="map-selector__overlay-dot"></div>
                                        <span>Local selecionado</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dica de uso */}
                        <div className="map-selector__hint">
                            <div className="map-selector__hint-content">
                                <Crosshair className="map-selector__hint-icon" />
                                <span>Clique para selecionar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Locais Pré-definidos */}
                <div className="map-selector__section">
                    <label className="map-selector__section-title">
                        <div className="map-selector__section-dot"></div>
                        <span>Locais Populares</span>
                    </label>

                    <div className="map-selector__presets">
                        {presetLocations.map((location, index) => (
                            <button
                                key={location.name}
                                type="button"
                                onClick={() => handlePresetSelect(location)}
                                className={`map-selector__preset ${selectedLocation.name === location.name
                                        ? 'map-selector__preset--active'
                                        : ''
                                    }`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="map-selector__preset-emoji">
                                    {location.emoji}
                                </div>
                                <div className="map-selector__preset-name">
                                    {location.name}
                                </div>
                                <div className="map-selector__preset-climate">
                                    {location.climate}
                                </div>
                                <div className="map-selector__preset-coords">
                                    {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coordenadas Manuais */}
                <div className="map-selector__section">
                    <button
                        type="button"
                        onClick={() => setShowManualCoords(!showManualCoords)}
                        className="map-selector__toggle"
                    >
                        <div className="map-selector__toggle-content">
                            <div className="map-selector__section-dot map-selector__section-dot--purple"></div>
                            <span>Coordenadas Personalizadas</span>
                        </div>
                        <ChevronDown className={`map-selector__toggle-icon ${showManualCoords ? 'map-selector__toggle-icon--rotated' : ''}`} />
                    </button>

                    {showManualCoords && (
                        <div className="map-selector__manual-coords">
                            <div className="map-selector__coords-grid">
                                <div className="map-selector__input-group">
                                    <label className="map-selector__input-label">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={selectedLocation.lat}
                                        onChange={(e) => {
                                            const newLat = parseFloat(e.target.value);
                                            if (!isNaN(newLat)) {
                                                setSelectedLocation(prev => ({ ...prev, lat: newLat }));
                                                setMapCenter([newLat, selectedLocation.lon]);
                                            }
                                        }}
                                        placeholder="-26.9189"
                                        className="map-selector__input"
                                    />
                                </div>

                                <div className="map-selector__input-group">
                                    <label className="map-selector__input-label">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={selectedLocation.lon}
                                        onChange={(e) => {
                                            const newLon = parseFloat(e.target.value);
                                            if (!isNaN(newLon)) {
                                                setSelectedLocation(prev => ({ ...prev, lon: newLon }));
                                                setMapCenter([selectedLocation.lat, newLon]);
                                            }
                                        }}
                                        placeholder="-49.0658"
                                        className="map-selector__input"
                                    />
                                </div>
                            </div>

                            <div className="map-selector__coords-hint">
                                💡 As coordenadas são atualizadas automaticamente quando você clica no mapa
                            </div>
                        </div>
                    )}
                </div>

                {/* Data */}
                <div className="map-selector__section">
                    <label className="map-selector__section-title">
                        <Calendar className="map-selector__section-icon" />
                        <span>Data para Previsão</span>
                    </label>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="map-selector__input"
                        required
                    />

                    <div className="map-selector__date-hint">
                        📅 Selecione uma data entre hoje e 2 anos no futuro
                    </div>
                </div>

                {/* Botão Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="map-selector__submit-btn"
                >
                    <div className="map-selector__submit-btn-shine"></div>

                    <div className="map-selector__submit-btn-content">
                        {loading ? (
                            <>
                                <div className="map-selector__submit-btn-spinner"></div>
                                <span>Analisando dados meteorológicos...</span>
                            </>
                        ) : (
                            <>
                                <Search className="map-selector__submit-btn-icon" />
                                <span>Obter Previsão Meteorológica</span>
                            </>
                        )}
                    </div>
                </button>

                {/* Informações adicionais */}
                <div className="map-selector__section">
                    <div className="map-selector__features">
                        <div className="map-selector__feature">
                            <div className="map-selector__feature-emoji">🎯</div>
                            <div className="map-selector__feature-title">Precisão GPS</div>
                            <div className="map-selector__feature-desc">Localização exata</div>
                        </div>

                        <div className="map-selector__feature">
                            <div className="map-selector__feature-emoji">🛰️</div>
                            <div className="map-selector__feature-title">Dados NASA</div>
                            <div className="map-selector__feature-desc">Fonte confiável</div>
                        </div>

                        <div className="map-selector__feature">
                            <div className="map-selector__feature-emoji">⚡</div>
                            <div className="map-selector__feature-title">Análise Rápida</div>
                            <div className="map-selector__feature-desc">Resultados em segundos</div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Decoração de fundo */}
            <div className="map-selector__decoration map-selector__decoration--map">
                🗺️
            </div>
            <div className="map-selector__decoration map-selector__decoration--pin">
                📍
            </div>
        </div>
    );
};

export default MapLocationSelector;