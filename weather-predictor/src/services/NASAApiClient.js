import { NASA_POWER_BASE_URL, NASA_PARAMETERS } from '../config/constants.js'

class NASAApiClient {
  async fetchHistoricalData(lat, lon, yearsBack = 30) {
    try {
      const endYear = new Date().getFullYear()
      const startYear = endYear - yearsBack

      // Validar coordenadas primeiro
      if (lat < -60 || lat > 60) {
        throw new Error(`Latitude ${lat} fora do range da NASA POWER (-60 a 60)`)
      }

      if (lon < -180 || lon > 180) {
        throw new Error(`Longitude ${lon} fora do range válido (-180 a 180)`)
      }

      // Parâmetros corrigidos - remover SNOW que causa 422 em algumas regiões
      const validParameters = [
        // 'PRECTOTCORR',  // Precipitação total corrigida
        // 'T2M_MAX',      // Temperatura máxima 2m
        // 'T2M_MIN',      // Temperatura mínima 2m
        // 'RH2M',         // Umidade relativa 2m
        'WS10M',        // Velocidade vento 10m
        // 'PS'            // Pressão superfície
        // Removido 'SNOW' - não disponível para todas as regiões
      ]

      const params = new URLSearchParams({
        parameters: validParameters.join(','),
        community: 'SB',  // Sustainable Buildings (mais estável que outros)
        longitude: parseFloat(lon).toFixed(4),  // Limitar precisão
        latitude: parseFloat(lat).toFixed(4),   // Limitar precisão
        start: `${startYear}0101`,
        end: `${endYear}1231`,
        format: 'JSON'
      })

      const url = `${NASA_POWER_BASE_URL}?${params}`
      console.log('NASA API URL:', url) // Debug

      const response = await fetch(url, {
        cf: {
          cacheTtl: 3600,
          cacheEverything: true
        },
        headers: {
          'User-Agent': 'NASA-Weather-Predictor/2.0',
          'Accept': 'application/json'
        }
      })

      // console.log('NASA API Response Status:', response.status) // Debug

      if (!response.ok) {
        const errorText = await response.text()
        console.error('NASA API Error Response:', errorText)

        // Tratar erros específicos
        if (response.status === 422) {
          throw new Error(`Parâmetros inválidos para NASA API. Verifique coordenadas: lat=${lat}, lon=${lon}`)
        }

        if (response.status === 429) {
          throw new Error('Rate limit excedido na NASA API. Tente novamente em alguns minutos.')
        }

        throw new Error(`NASA API Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log('NASA API Response Keys:', Object.keys(data)) // Debug

      if (!data.properties?.parameter) {
        console.error('Invalid NASA API Response Structure:', data)
        throw new Error('Estrutura de resposta inválida da NASA API')
      }

      // Verificar se temos dados suficientes
      // const precipData = data.properties.parameter.PRECTOTCORR
      // if (!precipData || Object.keys(precipData).length < 100) {
      //   throw new Error('Dados insuficientes retornados pela NASA API')
      // }

      console.log("dados sem tratamento" , Object.keys(data))

      return {
        success: true,
        data: data.properties.parameter,
        metadata: {
          startYear,
          endYear,
          location: data.geometry?.coordinates || [parseFloat(lon), parseFloat(lat)],
          // dataPoints: Object.keys(precipData).length
        }
      }

    } catch (error) {
      console.error('NASAApiClient Error:', error)
      return {
        success: false,
        error: error.message,
        details: {
          lat,
          lon,
          yearsBack,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // Método para testar conectividade
  async testConnection() {
    try {
      // Teste com coordenadas conhecidas que funcionam
      const testLat = -23.5505  // São Paulo
      const testLon = -46.6333
      const currentYear = new Date().getFullYear()

      const params = new URLSearchParams({
        parameters: 'T2M',  // Parâmetro mais simples
        community: 'SB',
        longitude: testLon.toString(),
        latitude: testLat.toString(),
        start: `${currentYear}0101`,
        end: `${currentYear}0131`,  // Apenas janeiro
        format: 'JSON'
      })

      const response = await fetch(`${NASA_POWER_BASE_URL}?${params}`)

      return {
        healthy: response.ok,
        status: response.status,
        message: response.ok ? 'NASA API está funcionando' : `NASA API retornou ${response.status}`
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        message: 'Não foi possível conectar com a NASA API'
      }
    }
  }
}

export default NASAApiClient
