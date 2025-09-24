import React, { useState } from 'react';
import { MapPin, Calendar, Search, Globe } from 'lucide-react';

const LocationSelector = ({ onLocationSubmit, loading }) => {
    const [lat, setLat] = useState('-26.9189');
    const [lon, setLon] = useState('-49.0658');
    const [date, setDate] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 dias
    );

    const presetLocations = [
        { name: 'Blumenau, SC', lat: -26.9189, lon: -49.0658, emoji: '🌲' },
        { name: 'São Paulo, SP', lat: -23.5505, lon: -46.6333, emoji: '🏙️' },
        { name: 'São Joaquim, SC', lat: -28.1, lon: -49.47, emoji: '❄️' },
        { name: 'Nova York, EUA', lat: 40.7128, lon: -74.0061, emoji: '🗽' },
        { name: 'Londres, UK', lat: 51.5074, lon: -0.1278, emoji: '🌧️' }
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
        <div className="location-selector">
            <div className="location-selector__header">
                <div className="location-selector__header-icon">
                    <Globe className="location-selector__header-icon-svg" />
                </div>
                <div className="location-selector__header-content">
                    <h2 className="location-selector__title">
                        Selecionar Localização
                    </h2>
                    <p className="location-selector__subtitle">
                        Escolha um local para obter a previsão
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="location-selector__form">
                {/* Presets de Localização */}
                <div className="location-selector__section">
                    <label className="location-selector__section-title">
                        <MapPin className="location-selector__section-icon" />
                        <span>Locais Pré-definidos</span>
                    </label>

                    <div className="location-selector__presets">
                        {presetLocations.map((location, index) => (
                            <button
                                key={location.name}
                                type="button"
                                onClick={() => handlePresetSelect(location)}
                                className="location-selector__preset"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="location-selector__preset-emoji">
                                    {location.emoji}
                                </div>
                                <div className="location-selector__preset-name">
                                    {location.name}
                                </div>
                                <div className="location-selector__preset-coords">
                                    {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coordenadas Manuais */}
                <div className="location-selector__section">
                    <h3 className="location-selector__section-title">
                        <div className="location-selector__section-dot"></div>
                        <span>Coordenadas Personalizadas</span>
                    </h3>

                    <div className="location-selector__coords-grid">
                        <div className="location-selector__input-group">
                            <label className="location-selector__input-label">
                                Latitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder="-26.9189"
                                className="location-selector__input"
                                required
                            />
                        </div>

                        <div className="location-selector__input-group">
                            <label className="location-selector__input-label">
                                Longitude
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                                placeholder="-49.0658"
                                className="location-selector__input"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Data */}
                <div className="location-selector__section">
                    <label className="location-selector__section-title">
                        <Calendar className="location-selector__section-icon" />
                        <span>Data para Previsão</span>
                    </label>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="location-selector__input"
                        required
                    />

                    <div className="location-selector__date-hint">
                        Selecione uma data entre hoje e 2 anos no futuro
                    </div>
                </div>

                {/* Botão Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="location-selector__submit-btn"
                >
                    <div className="location-selector__submit-btn-shine"></div>

                    <div className="location-selector__submit-btn-content">
                        {loading ? (
                            <>
                                <div className="location-selector__submit-btn-spinner"></div>
                                <span>Analisando clima...</span>
                            </>
                        ) : (
                            <>
                                <Search className="location-selector__submit-btn-icon" />
                                <span>Obter Previsão do Tempo</span>
                            </>
                        )}
                    </div>
                </button>

                {/* Informações adicionais */}
                <div className="location-selector__section">
                    <div className="location-selector__info">
                        <div className="location-selector__info-content">
                            <div className="location-selector__info-dot"></div>
                            <div className="location-selector__info-text">
                                <p className="location-selector__info-tip">
                                    <strong>💡 Dica:</strong>
                                    Clique em um dos locais pré-definidos para preenchimento automático.
                                </p>
                                <p className="location-selector__info-coords">
                                    <strong>🌍 Coordenadas:</strong>
                                    Use valores decimais (ex: -26.9189 para latitude sul).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Decoração de fundo */}
            <div className="location-selector__decoration location-selector__decoration--weather">
                ��️
            </div>
            <div className="location-selector__decoration location-selector__decoration--cloud">
                ☁️
            </div>
        </div>
    );
};

export default LocationSelector;