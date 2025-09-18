import React, { useState } from 'react';
import { MapPin, Calendar, Search } from 'lucide-react';

const LocationSelector = ({ onLocationSubmit, loading }) => {
  const [lat, setLat] = useState('-26.5356');
  const [lon, setLon] = useState('-48.3915');
  const [date, setDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 dias
  );

  const presetLocations = [
    { name: 'Blumenau, SC', lat: -26.5356, lon: -48.3915 },
    { name: 'São Paulo, SP', lat: -23.5505, lon: -46.6333 },
    { name: 'São Joaquim, SC', lat: -28.1, lon: -49.47 },
    { name: 'Nova York, EUA', lat: 40.7128, lon: -74.0061 },
    { name: 'Londres, UK', lat: 51.5074, lon: -0.1278 }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lat && lon && date) {
      onLocationSubmit({ lat: parseFloat(lat), lon: parseFloat(lon), date });
    }
  };

  const handlePresetSelect = (location) => {
    setLat(location.lat.toString());
    setLon(location.lon.toString());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Selecionar Localização</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Presets de Localização */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locais Pré-definidos
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {presetLocations.map((location) => (
              <button
                key={location.name}
                type="button"
                onClick={() => handlePresetSelect(location)}
                className="p-2 text-left text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>

        {/* Coordenadas Manuais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-26.5356"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="-48.3915"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

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

export default LocationSelector;
