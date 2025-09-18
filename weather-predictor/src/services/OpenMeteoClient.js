class OpenMeteoClient {
  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1/forecast'
  }

  async getCurrentConditions(lat, lon) {
    try {
      const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        current: [
          'temperature_2m',          // Temperatura atual 2m
          'relative_humidity_2m',    // Umidade relativa 2m
          'surface_pressure',        // Pressão superfície
          'wind_speed_10m',          // Velocidade vento 10m
          'wind_direction_10m',      // Direção vento 10m
          'weather_code',            // Código do tempo
          'cloud_cover'              // Cobertura de nuvens
        ].join(','),
        timezone: 'auto',            // Usar timezone local
        forecast_days: 1             // Apenas dados atuais
      })

      const url = `${this.baseUrl}?${params}`
      console.log('Open-Meteo URL:', url) // Debug

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NASA-Weather-Predictor/2.1'
        }
      })

      if (!response.ok) {
        throw new Error(`Open-Meteo API Error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.current) {
        throw new Error('Dados atuais não disponíveis na resposta da Open-Meteo')
      }

      return {
        success: true,
        data: this.formatCurrentConditions(data.current),
        metadata: {
          source: 'Open-Meteo',
          timezone: data.timezone,
          timestamp: data.current.time
        }
      }

    } catch (error) {
      console.error('Open-Meteo API Error:', error)

      // Fallback para dados simulados
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackConditions(lat, lon)
      }
    }
  }

  formatCurrentConditions(currentData) {
    return {
      temperature: currentData.temperature_2m || 20,
      humidity: currentData.relative_humidity_2m || 70,
      pressure: currentData.surface_pressure || 1013,
      windSpeed: currentData.wind_speed_10m || 3,
      windDirection: currentData.wind_direction_10m || 270,
      cloudCover: currentData.cloud_cover || 50,
      weatherCode: currentData.weather_code || 0,
      weatherDescription: this.getWeatherDescription(currentData.weather_code || 0)
    }
  }

  // Códigos WMO para descrição do tempo
  getWeatherDescription(code) {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
      96: 'Thunderstorm with light hail',
      99: 'Thunderstorm with heavy hail'
    }
    return weatherCodes[code] || 'Unknown'
  }

  getFallbackConditions(lat, lon) {
    // Fallback baseado em localização aproximada
    const isNorthern = lat > 0
    const isTropical = Math.abs(lat) < 23.5
    const isCoastal = Math.abs(lon) < 50 && Math.abs(lat) < 40 // Aproximação

    let temperature = 20
    let humidity = 70

    if (isTropical) {
      temperature = 28
      humidity = 80
    } else if (!isNorthern) { // Hemisfério Sul
      const month = new Date().getMonth() + 1
      if ([6, 7, 8].includes(month)) { // Inverno no HS
        temperature = 15
        humidity = 65
      } else if ([12, 1, 2].includes(month)) { // Verão no HS
        temperature = 30
        humidity = 75
      }
    }

    if (isCoastal) {
      humidity += 10
    }

    return {
      temperature,
      humidity,
      pressure: 1013,
      windSpeed: 3.5,
      windDirection: 270,
      cloudCover: 50,
      weatherCode: 1,
      weatherDescription: 'Estimated conditions'
    }
  }

  // Método para testar conectividade
  async testConnection() {
    try {
      const testResult = await this.getCurrentConditions(-23.5505, -46.6333) // São Paulo
      return {
        healthy: testResult.success,
        message: testResult.success ? 'Open-Meteo API funcionando' : testResult.error,
        sampleData: testResult.success ? testResult.data : null
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Open-Meteo connection failed: ${error.message}`
      }
    }
  }
}

export default OpenMeteoClient
