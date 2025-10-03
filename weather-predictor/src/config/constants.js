export const NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

// Parâmetros corrigidos 
export const NASA_PARAMETERS = [
    'T2M', // TEmperatura média
    'PRECTOTCORR',  // Precipitação total corrigida
    'WS10M',        // Velocidade vento 10m
    'CLOUD_AMT',   // Cobertura de nuvens
    'ALLSKY_SFC_SW_DWN'  // Radiação solar
]

export const WEATHER_THRESHOLDS = {
    rain: { light: 0.1, moderate: 2.5, heavy: 10.0 },
    temperature: { cold: 10, mild: 20, warm: 30 },
    humidity: { low: 40, moderate: 70, high: 85 },
    wind: { calm: 2, moderate: 6, strong: 10 },
    snow: { trace: 0.1, light: 1.0, moderate: 5.0 } // Mantido para cálculos
}

export const API_LIMITS = {
    MAX_YEARS_BACK: 15,        // Reduzido para melhor performance
    MAX_FUTURE_YEARS: 2,
    NASA_LAT_MIN: -60,         // Limites da NASA POWER
    NASA_LAT_MAX: 60,
    NASA_LON_MIN: -180,
    NASA_LON_MAX: 180
}
