import React, { useState } from 'react';
import LocationSelector from './components/LocationSelector.jsx';
import WeatherVisualization from './components/WeatherVisualization.jsx';
import ApiStatus from './components/ApiStatus.jsx';
import weatherApi from './services/weatherApi';
import { Cloud } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <ApiStatus />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Cloud className="text-blue-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                NASA Weather Predictor
              </h1>
              <p className="text-gray-600">
                Previsões baseadas em dados históricos da NASA + condições atuais
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LocationSelector onLocationSubmit={handleLocationSubmit} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800">Erro na API</h3>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              {weatherData ? 'Exibindo dados de exemplo para desenvolvimento.' : 'Verifique se sua API está rodando em http://localhost:8787'}
            </p>
          </div>
        )}

        {weatherData && (
          <WeatherVisualization weatherData={weatherData} />
        )}

        {!weatherData && !loading && (
          <div className="text-center py-12">
            <Cloud className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Selecione uma localização
            </h3>
            <p className="text-gray-500">
              Escolha as coordenadas e data para obter a previsão meteorológica.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
