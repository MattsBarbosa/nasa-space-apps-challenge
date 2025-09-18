import React from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, AlertTriangle } from 'lucide-react';

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

  // Configuração dos ícones e cores (mesmo de antes)
  const conditionConfig = {
    sunny: { icon: Sun, color: '#FCD34D', bgColor: '#FEF3C7', label: 'Ensolarado' },
    rainy: { icon: CloudRain, color: '#3B82F6', bgColor: '#DBEAFE', label: 'Chuvoso' },
    cloudy: { icon: Cloud, color: '#6B7280', bgColor: '#F3F4F6', label: 'Nublado' },
    snowy: { icon: Snowflake, color: '#E5E7EB', bgColor: '#F9FAFB', label: 'Neve' },
    windy: { icon: Wind, color: '#10B981', bgColor: '#D1FAE5', label: 'Ventoso' }
  };

  // Componente de barra de progresso circular
  const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = '#3B82F6' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-800">{value}%</span>
          <span className="text-xs text-gray-500">probabilidade</span>
        </div>
      </div>
    );
  };

  // Componente de card de condição
  const ConditionCard = ({ condition, value, isMain = false }) => {
    const config = conditionConfig[condition];
    const Icon = config.icon;

    return (
      <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
        isMain ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: config.bgColor }}
            >
              <Icon size={24} color={config.color} />
            </div>
            <div>
              <p className="font-medium text-gray-800">{config.label}</p>
              <p className="text-sm text-gray-500">{value}% de chance</p>
            </div>
          </div>

          {/* Barra de progresso horizontal */}
          <div className="w-20">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${value}%`,
                  backgroundColor: config.color,
                  maxWidth: '100%'
                }}
              />
            </div>
            <p className="text-right text-xs text-gray-400 mt-1">{value}%</p>
          </div>
        </div>

        {isMain && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Dominante
          </div>
        )}
      </div>
    );
  };

  // Componente de alerta para valores baixos
  const LowConfidenceAlert = ({ confidence }) => {
    if (confidence >= 60) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-yellow-600" size={20} />
          <div>
            <h4 className="font-medium text-yellow-800">Confiança Baixa</h4>
            <p className="text-sm text-yellow-700">
              Confiança de apenas {confidence}%. Recomendamos consultar previsões meteorológicas atuais.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Tratamento de dados inválidos
  const hasValidData = Object.values(safeConditions).some(val => val > 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Previsão Meteorológica
        </h2>

        {/* Informações de localização e data */}
        {(location || futureDate) && (
          <div className="text-center mb-6 p-4 bg-blue-50 rounded-lg">
            {location && (
              <p className="text-lg font-medium text-blue-800">
                📍 {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
              </p>
            )}
            {futureDate && (
              <p className="text-blue-600">
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

        <LowConfidenceAlert confidence={confidence} />

        {/* Insights temporais */}
        {temporalInsight && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800">💡 Insight Temporal</h4>
            <p className="text-blue-700">{temporalInsight}</p>
          </div>
        )}

        {/* Visualização principal - Gráfico circular */}
        <div className="flex justify-center items-center mb-8">
          <div className="text-center">
            <CircularProgress
              value={probability}
              size={140}
              color={probability < 30 ? '#10B981' :
                     probability < 70 ? '#F59E0B' : '#EF4444'}
            />
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Condição Principal: <span className="text-blue-600 capitalize">{dominantCondition}</span>
            </p>
            <p className="text-sm text-gray-500">
              Confiança: {confidence}%
            </p>
          </div>
        </div>

        {/* Cards de condições detalhadas */}
        {hasValidData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(safeConditions).map(([condition, value]) => (
              <ConditionCard
                key={condition}
                condition={condition}
                value={value}
                isMain={condition === weatherData.dominantCondition}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Dados Insuficientes
            </h3>
            <p className="text-gray-500">
              Não foi possível calcular as probabilidades. Verifique os dados históricos.
            </p>
          </div>
        )}

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Comparação de Condições</h3>
            <div className="space-y-3">
              {Object.entries(safeConditions)
                .sort(([,a], [,b]) => b - a)
                .map(([condition, value]) => {
                  const config = conditionConfig[condition];
                  const Icon = config.icon;

                  return (
                    <div key={condition} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 w-24">
                        <Icon size={16} color={config.color} />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {config.label}
                        </span>
                      </div>

                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                        <div
                          className="h-3 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(value, 2)}%`,
                            backgroundColor: config.color
                          }}
                        />
                        <span className="absolute right-2 top-0 text-xs font-medium text-gray-600 leading-3">
                          {value}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Limitações da API */}
          {limitations.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">⚠️ Limitações</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {limitations.map((limitation, index) => (
                  <li key={index}>• {limitation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Debug info */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-gray-700">
                Dados Técnicos (Debug)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify({
                  original: weatherData,
                  processed: safeConditions,
                  hasValidData
                }, null, 2)}
              </pre>
            </details>
          </div>
      </div>
    </div>
  );
};

export default WeatherVisualization;
