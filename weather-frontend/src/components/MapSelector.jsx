import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Calendar, Search, MapPin, Crosshair, Globe } from 'lucide-react';
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
        duration: 1.5, // Animação suave de 1.5 segundos
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);

  return null;
};

// Componente principal do seletor de localização com mapa
const MapLocationSelector = ({ onLocationSubmit, loading }) => {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: -26.5356,
    lon: -48.3915,
    name: 'Blumenau, SC'
  });

  const [date, setDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [mapCenter, setMapCenter] = useState([-26.5356, -48.3915]);
  const [mapZoom, setMapZoom] = useState(10);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef(null);

  // Locais pré-definidos
  const presetLocations = [
    { name: 'Blumenau, SC', lat: -26.5356, lon: -48.3915, zoom: 12 },
    { name: 'São Paulo, SP', lat: -23.5505, lon: -46.6333, zoom: 10 },
    { name: 'São Joaquim, SC', lat: -28.1, lon: -49.47, zoom: 12 },
    { name: 'Rio de Janeiro, RJ', lat: -22.9068, lon: -43.1729, zoom: 11 },
    { name: 'Nova York, EUA', lat: 40.7128, lon: -74.0061, zoom: 11 },
    { name: 'Londres, UK', lat: 51.5074, lon: -0.1278, zoom: 11 },
    { name: 'Tóquio, Japão', lat: 35.6762, lon: 139.6503, zoom: 11 },
    { name: 'Sydney, Austrália', lat: -33.8688, lon: 151.2093, zoom: 11 }
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
      // Usar BigDataCloud API (sem CORS, sem limite, sem API key necessária)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );

      if (response.ok) {
        const data = await response.json();

        // Criar nome baseado nos dados disponíveis
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

    // Fallback: retornar apenas as coordenadas
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

     // Atualizar centro do mapa para seguir o pin
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
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Selecionar Localização</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Controles do Mapa */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Clique no mapa ou escolha um local:</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                {isLoadingLocation ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                ) : (
                  <Crosshair size={16} />
                )}
                <span>Minha Localização</span>
              </button>
            </div>
          </div>

          {/* Mapa */}
          <div className="relative h-[450px] rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              ref={mapRef}
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-10"
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
                    <div className="text-center">
                      <strong>{selectedLocation.name}</strong><br />
                      {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4) : selectedLocation.lat}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : selectedLocation.lon}°
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Overlay com informações da localização selecionada */}
            <div className="absolute top-2 left-2 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-md z-20 max-w-xs">
              <div className="flex items-start space-x-2">
                <Globe size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {selectedLocation.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {typeof selectedLocation.lat === 'number' ? selectedLocation.lat.toFixed(4) : selectedLocation.lat}°, {typeof selectedLocation.lon === 'number' ? selectedLocation.lon.toFixed(4) : selectedLocation.lon}°
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locais Pré-definidos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Locais Populares
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {presetLocations.map((location) => (
              <button
                key={location.name}
                type="button"
                onClick={() => handlePresetSelect(location)}
                className={`p-2 text-left text-sm border rounded-lg transition-all hover:shadow-md ${
                  selectedLocation.name === location.name
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <MapPin size={12} />
                  <span className="truncate">{location.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Coordenadas Manuais (opcional) */}
        <details className="border border-gray-200 rounded-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
            Inserir coordenadas manualmente
          </summary>
          <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="-26.5356"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="-48.3915"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </details>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar size={16} className="inline mr-1" />
            Data para Previsão
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Search size={20} />
          )}
          <span>{loading ? 'Analisando...' : 'Obter Previsão'}</span>
        </button>
      </form>
    </div>
  );
};

export default MapLocationSelector;
