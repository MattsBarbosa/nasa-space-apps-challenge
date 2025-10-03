import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom'; // 1. IMPORTE O ReactDOM
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Calendar, Search, MapPin, Crosshair, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- INÍCIO DO WIDGET DE AUTOCOMPLETE COM PORTAL ---

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const NominatimAutocomplete = ({ onPlaceSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const debouncedQuery = useDebounce(query, 500);

    const fetchPlaces = useCallback(async (searchQuery) => {
        if (searchQuery.length < 3) { setResults([]); return; }
        setIsLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery )}&format=json&addressdetails=1&limit=5`;
        try {
            const response = await fetch(url, { headers: { 'Accept-Language': 'pt,en' } });
            setResults(await response.json());
        } catch (error) { console.error('Erro ao buscar locais no Nominatim:', error); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchPlaces(debouncedQuery); }, [debouncedQuery, fetchPlaces]);

    const handleSelect = (place) => {
        onPlaceSelect(place);
        setQuery(place.display_name);
        setResults([]);
        setIsFocused(false);
    };

    // 2. JSX da lista de resultados que será "transportada"
    const resultsList = (
        isFocused && results.length > 0 && (
            <ul className="autocomplete-results-list">
                {results.map((place) => (
                    <li key={place.place_id} onMouseDown={() => handleSelect(place)}>
                        <MapPin size={16} className="result-icon" />
                        <div className="result-text">
                            <span className="result-main">{place.address.city || place.address.town || place.address.village || place.name}</span>
                            <span className="result-secondary">{[place.address.state, place.address.country].filter(Boolean).join(', ')}</span>
                        </div>
                    </li>
                ))}
            </ul>
        )
    );

    return (
        <div className="autocomplete-container">
            <div className="autocomplete-input-wrapper">
                <Search className="autocomplete-icon" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onClick={() => setQuery("")}
                    placeholder="Procure por uma cidade..."
                    className="map-selector__input"
                />
                {isLoading && <div className="autocomplete-spinner" />}
            </div>
            {/* 3. Usando o Portal para renderizar a lista no #autocomplete-portal */}
            {ReactDOM.createPortal(resultsList, document.getElementById('autocomplete-portal'))}
        </div>
    );
};
// --- FIM DO WIDGET DE AUTOCOMPLETE ---


// Fix para ícones do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
} );

// Componente que captura cliques no mapa
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click: (e) => onLocationSelect({ lat: e.latlng.lat, lon: e.latlng.lng }),
    });
    return null;
};

// Componente que move o mapa para seguir o pin
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
        }
    }, [center, zoom, map]);
    return null;
};

// Componente principal do seletor de localização com mapa
const MapLocationSelector = ({ onLocationSubmit, loading }) => {
    const [selectedLocation, setSelectedLocation] = useState({ lat: -26.9189, lon: -49.0658, name: 'Blumenau, SC' });
    const [date, setDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [mapCenter, setMapCenter] = useState([-26.9189, -49.0658]);
    const [mapZoom, setMapZoom] = useState(10);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [showManualCoords, setShowManualCoords] = useState(false);
    const mapRef = useRef(null);

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

    // Função centralizada para atualizar a localização
    const handleLocationUpdate = useCallback(async ({ lat, lon, name = null, zoom = 13 }) => {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const locationName = name || await reverseGeocode(latNum, lonNum);

        setSelectedLocation({ lat: latNum, lon: lonNum, name: locationName });
        setMapCenter([latNum, lonNum]);
        setMapZoom(zoom);
    }, []);

    // ATUALIZADO: Usa Nominatim para geocodificação reversa
    const reverseGeocode = async (lat, lon) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt,en` );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        } catch (error) {
            console.error('Erro no geocoding reverso:', error);
            return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
    };

    const getCurrentLocation = () => {
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                handleLocationUpdate({ lat: position.coords.latitude, lon: position.coords.longitude });
                setIsLoadingLocation(false);
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização.');
                setIsLoadingLocation(false);
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    // ATUALIZADO: Funções de clique e preset usam a função centralizada
    const handleMapClick = ({ lat, lon }) => handleLocationUpdate({ lat, lon });
    const handlePresetSelect = (location) => handleLocationUpdate(location);

    // ATUALIZADO: Função para lidar com a seleção do autocomplete
    const handlePlaceSelect = (place) => {
        if (place) {
            handleLocationUpdate({ lat: place.lat, lon: place.lon, name: place.display_name, zoom: 14 });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedLocation.lat && selectedLocation.lon && date) {
            onLocationSubmit({ lat: selectedLocation.lat, lon: selectedLocation.lon, date });
        }
    };

    return (
        <div className="map-selector">
            <div className="map-selector__header">
                <div className="map-selector__header-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-satellite"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3.707 6.293l2.586 -2.586a1 1 0 0 1 1.414 0l5.586 5.586a1 1 0 0 1 0 1.414l-2.586 2.586a1 1 0 0 1 -1.414 0l-5.586 -5.586a1 1 0 0 1 0 -1.414z" /><path d="M6 10l-3 3l3 3l3 -3" /><path d="M10 6l3 -3l3 3l-3 3" /><path d="M12 12l1.5 1.5" /><path d="M14.5 17a2.5 2.5 0 0 0 2.5 -2.5" /><path d="M15 21a6 6 0 0 0 6 -6" /></svg>
                    <img src="https://placehold.co/60x60" alt="" />
                </div>
                <form onSubmit={(e ) => e.preventDefault()} className="map-selector__header-form">
                    <NominatimAutocomplete onPlaceSelect={handlePlaceSelect} />
                    <label htmlFor="search-d" className="map-selector__label">
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className="map-selector__input" autoComplete="off" required />
                    </label>
                </form>
                <button type="button" onClick={getCurrentLocation} disabled={isLoadingLocation} className="map-selector__header-btn">
                    {isLoadingLocation ? <div className="map-selector__location-btn-spinner" /> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-send"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="map-selector__form">
                <div className="map-selector__section">
                    <div className="map-selector__map-container">
                        <MapContainer ref={mapRef} center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} className="map-selector__map">
                            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapClickHandler onLocationSelect={handleMapClick} />
                            <MapController center={mapCenter} zoom={mapZoom} />
                            {selectedLocation.lat && selectedLocation.lon && (
                                <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
                                    <Popup>
                                        <div className="map-selector__popup">
                                            <div className="map-selector__popup-title">{selectedLocation.name}</div>
                                            <div className="map-selector__popup-coords">{typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4 ) : ''}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : ''}°</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </MapContainer>
                        <div className="map-selector__overlay">
                            <div className="map-selector__overlay-content">
                                <MapPin className="map-selector__overlay-icon" />
                                <div className="map-selector__overlay-info">
                                    <p className="map-selector__overlay-name">{selectedLocation.name}</p>
                                    <p className="map-selector__overlay-coords">{typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4) : ''}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : ''}°</p>
                                    <div className="map-selector__overlay-status"><div className="map-selector__overlay-dot"></div><span>Local selecionado</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="map-selector__preset">
                    <label className="map-selector__section-title"><div className="map-selector__section-dot"></div><span>Locais Populares</span></label>
                    <div className="map-selector__presets">
                        {presetLocations.map((location, index) => (
                            <button key={location.name} type="button" onClick={() => handlePresetSelect(location)} className={`map-selector__preset ${selectedLocation.name === location.name ? 'map-selector__preset--active' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className="map-selector__preset-emoji">{location.emoji}</div>
                                <div className="map-selector__preset-name">{location.name}</div>
                                <div className="map-selector__preset-climate">{location.climate}</div>
                                <div className="map-selector__preset-coords">{location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="map-selector__manual">
                    <button type="button" onClick={() => setShowManualCoords(!showManualCoords)} className="map-selector__toggle">
                        <div className="map-selector__toggle-content"><div className="map-selector__section-dot map-selector__section-dot--purple"></div><span>Coordenadas Personalizadas</span></div>
                        <ChevronDown className={`map-selector__toggle-icon ${showManualCoords ? 'map-selector__toggle-icon--rotated' : ''}`} />
                    </button>
                    {showManualCoords && (
                        <div className="map-selector__manual-coords">
                            <div className="map-selector__coords-grid">
                                <div className="map-selector__input-group">
                                    <label className="map-selector__input-label">Latitude</label>
                                    <input type="number" step="0.000001" value={selectedLocation.lat} onChange={(e) => handleLocationUpdate({ lat: e.target.value, lon: selectedLocation.lon })} placeholder="-26.9189" className="map-selector__input" />
                                </div>
                                <div className="map-selector__input-group">
                                    <label className="map-selector__input-label">Longitude</label>
                                    <input type="number" step="0.000001" value={selectedLocation.lon} onChange={(e) => handleLocationUpdate({ lat: selectedLocation.lat, lon: e.target.value })} placeholder="-49.0658" className="map-selector__input" />
                                </div>
                            </div>
                            <div className="map-selector__coords-hint">💡 As coordenadas são atualizadas automaticamente quando você clica no mapa</div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default MapLocationSelector;
