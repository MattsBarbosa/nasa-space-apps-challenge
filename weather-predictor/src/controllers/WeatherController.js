import WeatherPredictor from '../services/WeatherPredictor.js'
import OpenMeteoClient from '../services/OpenMeteoClient.js' // NOVO
import { validateCoordinates, validateDate } from '../utils/validators.js'

class WeatherController {
  constructor() {
    this.predict = this.predict.bind(this)
    this.health = this.health.bind(this)
    this.home = this.home.bind(this)
    this.debug = this.debug.bind(this)
    this.current = this.current.bind(this) // NOVO
    this.clearCache = this.clearCache.bind(this)
  }

  async predict(c) {
    try {
      const lat = parseFloat(c.req.query('lat'))
      const lon = parseFloat(c.req.query('lon'))
      const futureDate = c.req.query('date')

      if (!lat || !lon || !futureDate) {
        return c.json({
          error: 'Parâmetros obrigatórios: lat, lon, date',
          example: '/predict?lat=-26.9166&lon=-49.0713&date=2025-09-17'
        }, 400)
      }

      const coordValidation = validateCoordinates(lat, lon)
      if (!coordValidation.valid) {
        return c.json({ error: coordValidation.error }, 400)
      }

      const dateValidation = validateDate(futureDate)
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400)
      }

      const predictor = new WeatherPredictor(c.env)
      const result = await predictor.predict(lat, lon, futureDate)

      if (result.error) {
        return c.json(result, result.code || 500)
      }

      return c.json(result)

    } catch (error) {
      console.error('Controller error:', error)
      return c.json({
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  // NOVO: Endpoint para obter condições meteorológicas atuais
  async current(c) {
    try {
      const lat = parseFloat(c.req.query('lat'))
      const lon = parseFloat(c.req.query('lon'))

      if (!lat || !lon) {
        return c.json({
          error: 'Parâmetros obrigatórios: lat, lon',
          example: '/current?lat=-26.9166&lon=-49.0713'
        }, 400)
      }

      const coordValidation = validateCoordinates(lat, lon)
      if (!coordValidation.valid) {
        return c.json({ error: coordValidation.error }, 400)
      }

      const meteoClient = new OpenMeteoClient()
      const currentWeather = await meteoClient.getCurrentConditions(lat, lon)

      if (!currentWeather.success) {
        return c.json({
          success: false,
          error: currentWeather.error,
          fallback: currentWeather.fallback,
          message: 'Usando dados estimados devido a erro na API'
        }, 200) // 200 porque temos fallback
      }

      return c.json({
        success: true,
        location: { lat, lon },
        current: currentWeather.data,
        metadata: currentWeather.metadata
      })

    } catch (error) {
      console.error('Current weather error:', error)
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  async debug(c) {
    try {
      const lat = parseFloat(c.req.query('lat')) || -23.5505  // Default: São Paulo
      const lon = parseFloat(c.req.query('lon')) || -46.6333

      const predictor = new WeatherPredictor(c.env)
      const meteoClient = new OpenMeteoClient()

      // Testar ambas as APIs
      const [nasaTest, meteoTest] = await Promise.all([
        predictor.nasaClient.testConnection(),
        meteoClient.testConnection()
      ])

      const debugInfo = {
        timestamp: new Date().toISOString(),
        coordinates: { lat, lon },
        apis: {
          nasa_power: nasaTest,
          open_meteo: meteoTest
        },
        environment: {
          kv_storage: c.env?.WEATHER_CACHE ? 'available' : 'unavailable',
          worker_version: '2.1'
        }
      }

      return c.json(debugInfo)

    } catch (error) {
      return c.json({
        error: 'Debug failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  async health(c) {
    try {
      const predictor = new WeatherPredictor(c.env)
      const meteoClient = new OpenMeteoClient()

      const [nasaTest, meteoTest] = await Promise.all([
        predictor.nasaClient.testConnection(),
        meteoClient.testConnection()
      ])

      const overallHealthy = nasaTest.healthy && meteoTest.healthy

      return c.json({
        status: overallHealthy ? 'healthy' : 'degraded',
        version: '2.1',
        timestamp: new Date().toISOString(),
        components: {
          nasa_api: {
            status: nasaTest.healthy ? 'connected' : 'failed',
            message: nasaTest.message
          },
          openmeteo_api: {
            status: meteoTest.healthy ? 'connected' : 'failed',
            message: meteoTest.message,
            sample_data: meteoTest.sampleData
          },
          cache: c.env?.WEATHER_CACHE ? 'available' : 'unavailable'
        }
      }, overallHealthy ? 200 : 503)

    } catch (error) {
      return c.json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  async clearCache(c) {
    try {
      const predictor = new WeatherPredictor(c.env)
      const result = await predictor.cache.clearCache()

      return c.json({
        success: result,
        message: result ? 'Cache limpo com sucesso' : 'Erro ao limpar cache',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500)
    }
  }

  home(c) {
    return c.html(`
      <h1>NASA Weather Predictor API v2.1</h1>
      <p><strong>Agora com dados meteorológicos atuais da Open-Meteo!</strong></p>

      <h2>Endpoints Principais:</h2>
      <ul>
        <li><code>GET /predict?lat={lat}&lon={lon}&date={YYYY-MM-DD}</code> - Previsão com dados atuais</li>
        <li><code>GET /current?lat={lat}&lon={lon}</code> - Condições meteorológicas atuais</li>
        <li><code>GET /health</code> - Status de todas as APIs</li>
        <li><code>GET /debug</code> - Debug completo das integrações</li>
        <li><code>DELETE /cache</code> - Limpar cache</li>
      </ul>

      <h2>Novos Testes com Dados Reais:</h2>
      <ul>
        <li><a href="/current?lat=-26.5356&lon=-48.3915">Tempo Atual - Blumenau</a></li>
        <li><a href="/predict?lat=-26.5356&lon=-48.3915&date=2025-09-20">Previsão Blumenau (com dados atuais)</a></li>
        <li><a href="/current?lat=40.7128&lon=-74.0061">Tempo Atual - NYC</a></li>
        <li><a href="/predict?lat=40.7128&lon=-74.0061&date=2025-09-20">Previsão NYC (com dados atuais)</a></li>
      </ul>

      <h2>Utilitários:</h2>
      <ul>
        <li><a href="/health">Health Check Completo</a></li>
        <li><a href="/debug">Debug das APIs</a></li>
        <li><a href="#" onclick="fetch('/cache', {method:'DELETE'}).then(r=>r.json()).then(d=>alert(d.message)); return false;">Limpar Cache</a></li>
      </ul>

      <h2>Melhorias v2.1:</h2>
      <ul>
        <li>✅ <strong>Condições meteorológicas atuais</strong> via Open-Meteo</li>
        <li>✅ <strong>Análise temporal</strong> com correção de defasagem</li>
        <li>✅ <strong>Probabilidade Bayesiana</strong> com dados reais</li>
        <li>✅ <strong>Confiança realística</strong> com limitações explícitas</li>
        <li>✅ <strong>Fallback inteligente</strong> quando APIs falham</li>
      </ul>

      <p><em>Agora combinamos 20+ anos de dados históricos da NASA com condições meteorológicas atuais!</em></p>
    `)
  }
}

export default WeatherController
