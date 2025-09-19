import WeatherPredictor from '../services/WeatherPredictor.js'
import { validateCoordinates, validateDate } from '../utils/validators.js'

class WeatherController {
    constructor() {
        this.predict = this.predict.bind(this)
        this.health = this.health.bind(this)
        this.home = this.home.bind(this)
        this.debug = this.debug.bind(this)
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

    async debug(c) {
        try {
            const lat = parseFloat(c.req.query('lat')) || -23.5505
            const lon = parseFloat(c.req.query('lon')) || -46.6333

            const predictor = new WeatherPredictor(c.env)
            const nasaTest = await predictor.nasaClient.testConnection()

            const debugInfo = {
                timestamp: new Date().toISOString(),
                coordinates: { lat, lon },
                nasa_api: nasaTest,
                environment: {
                    kv_storage: c.env?.WEATHER_CACHE ? 'available' : 'unavailable',
                    worker_version: '2.1-historical-focus',
                    focus: 'NASA historical data only'
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
            const nasaTest = await predictor.nasaClient.testConnection()

            return c.json({
                status: nasaTest.healthy ? 'healthy' : 'degraded',
                version: '2.1-historical-focus',
                timestamp: new Date().toISOString(),
                components: {
                    nasa_api: {
                        status: nasaTest.healthy ? 'connected' : 'failed',
                        message: nasaTest.message
                    },
                    cache: c.env?.WEATHER_CACHE ? 'available' : 'unavailable'
                },
                focus: 'Historical patterns from NASA data only'
            })

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
      <p><strong>Análise de padrões climáticos baseada exclusivamente em dados históricos da NASA</strong></p>

      <h2>Conceito:</h2>
      <p>Esta API utiliza 20+ anos de dados meteorológicos da NASA POWER para identificar padrões históricos e calcular probabilidades de condições climáticas futuras usando análise estatística avançada.</p>

      <h2>Endpoints:</h2>
      <ul>
        <li><code>GET /predict?lat={lat}&lon={lon}&date={YYYY-MM-DD}</code> - Previsão baseada em histórico</li>
        <li><code>GET /health</code> - Status da API NASA</li>
        <li><code>GET /debug</code> - Debug da integração NASA</li>
        <li><code>DELETE /cache</code> - Limpar cache</li>
      </ul>

      <h2>Casos de Uso Ideais:</h2>
      <ul>
        <li><a href="/predict?lat=-28.1&lon=-49.47&date=2025-07-15">Neve em São Joaquim - julho 2025</a></li>
        <li><a href="/predict?lat=-26.9&lon=-49.07&date=2027-09-15">Planejamento de casamento - setembro 2027</a></li>
        <li><a href="/predict?lat=-26.5356&lon=-48.3915&date=2025-09-20">Análise sazonal - Blumenau</a></li>
      </ul>

      <h2>Metodologia:</h2>
      <ul>
        <li>✅ <strong>Dados NASA POWER</strong> - 20+ anos de histórico global</li>
        <li>✅ <strong>Teoria de Conjuntos</strong> - Análise de intersecções (Diagrama de Venn)</li>
        <li>✅ <strong>Probabilidade Bayesiana</strong> - Cálculos estatísticos avançados</li>
        <li>✅ <strong>Análise Temporal</strong> - Detecção de padrões sazonais</li>
      </ul>

      <h2>Para que serve:</h2>
      <p><strong>Planejamento de médio/longo prazo</strong> baseado em padrões históricos climáticos.</p>

      <p><em>NASA Space Apps Challenge 2025 - Demonstrando uso avançado de dados históricos da NASA</em></p>
    `)
    }
}

export default WeatherController
