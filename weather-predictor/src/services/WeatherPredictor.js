import NASAApiClient from './NASAApiClient.js'
import ProbabilityCalculator from './ProbabilityCalculator.js'
import OpenMeteoClient from './OpenMeteoClient.js' // NOVO
import CacheManager from '../utils/cache.js'
import { getDayOfYear, parseDateString } from '../utils/helpers.js'

class WeatherPredictor {
  constructor(env) {
    this.nasaClient = new NASAApiClient()
    this.meteoClient = new OpenMeteoClient() // NOVO
    this.calculator = new ProbabilityCalculator()
    this.cache = new CacheManager(env?.WEATHER_CACHE)
  }

  async predict(lat, lon, futureDate) {
    try {
      const futureDateObj = new Date(futureDate)
      if (isNaN(futureDateObj.getTime())) {
        throw new Error('Data inválida fornecida')
      }

      const cacheKey = this.cache.generateKey(lat, lon, futureDate)
      console.log('Cache key:', cacheKey)

      const cached = await this.cache.get(cacheKey)

      if (cached) {
        if (cached.futureDate === futureDate) {
          return { ...cached, fromCache: true }
        } else {
          console.warn('Cache date mismatch, invalidating:', {
            requested: futureDate,
            cached: cached.futureDate
          })
          await this.cache.delete(cacheKey)
        }
      }

      // Buscar dados históricos NASA e condições atuais em paralelo
      const [historicalData, currentWeather] = await Promise.all([
        this.nasaClient.fetchHistoricalData(lat, lon),
        this.meteoClient.getCurrentConditions(lat, lon) // NOVO: dados reais
      ])

      if (!historicalData.success) {
        throw new Error(historicalData.error)
      }

      const processedData = this.processHistoricalData(historicalData.data, futureDate)

      // NOVO: usar condições reais ou fallback
      const currentConditions = currentWeather.success ?
        currentWeather.data :
        currentWeather.fallback

      console.log('Current conditions:', currentConditions) // Debug

      const prediction = await this.calculator.calculate(processedData, futureDate, currentConditions)

      const result = this.buildResponse(prediction, lat, lon, futureDate, processedData, currentWeather)

      result.futureDate = futureDate

      // Cache por menos tempo se usamos dados atuais (2h vs 24h)
      const cacheTTL = currentWeather.success ? 7200 : 86400
      await this.cache.set(cacheKey, result, cacheTTL)

      return result

    } catch (error) {
      console.error('WeatherPredictor error:', error)
      return {
        error: `Erro na previsão: ${error.message}`,
        code: 500
      }
    }
  }

  processHistoricalData(nasaData, futureDate) {
    const futureDateObj = new Date(futureDate)
    const targetDayOfYear = getDayOfYear(futureDateObj)
    const windowDays = 15
    const relevantDays = []

    console.log('Processing for date:', futureDate, 'day of year:', targetDayOfYear)

    Object.keys(nasaData.PRECTOTCORR || {}).forEach(dateStr => {
      const date = parseDateString(dateStr)
      const dayOfYear = getDayOfYear(date)

      if (Math.abs(dayOfYear - targetDayOfYear) <= windowDays) {
        relevantDays.push({
          date: dateStr,
          year: date.getFullYear(),
          precipitation: nasaData.PRECTOTCORR?.[dateStr] || 0,
          tempMax: nasaData.T2M_MAX?.[dateStr] || null,
          tempMin: nasaData.T2M_MIN?.[dateStr] || null,
          humidity: nasaData.RH2M?.[dateStr] || null,
          windSpeed: nasaData.WS10M?.[dateStr] || null,
          snow: 0
        })
      }
    })

    console.log('Relevant days found:', relevantDays.length)
    return relevantDays.sort((a, b) => b.year - a.year)
  }

  // REMOVIDO: getSimulatedCurrentConditions() - não precisamos mais

  // ATUALIZADO: incluir dados atuais na resposta
  buildResponse(prediction, lat, lon, futureDate, processedData, currentWeather) {
    const dominantCondition = Object.entries(prediction.probabilities)
      .sort(([,a], [,b]) => b - a)[0]

    const temporalInsight = this.generateTemporalInsight(prediction.temporalAdjustment)

    const response = {
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      futureDate: futureDate,
      prediction: {
        dominantCondition: dominantCondition[0],
        probability: Math.round(dominantCondition[1] * 100),
        confidence: Math.round(prediction.confidence.overall * 100),

        conditions: Object.fromEntries(
          Object.entries(prediction.probabilities).map(([k, v]) => [k, Math.round(v * 100)])
        ),

        temporalAnalysis: {
          peakRainDay: prediction.temporalAdjustment.trend.peakDay,
          trend: prediction.temporalAdjustment.trend.direction,
          daysOffset: prediction.temporalAdjustment.trend.peakDay.daysOffset,
          insight: temporalInsight
        },

        vennAnalysis: {
          rainAndHighHumidity: Math.round(prediction.vennAnalysis.intersections.rainAndHighHumidity * 100),
          sunnyConditions: Math.round(prediction.vennAnalysis.intersections.sunnyConditions * 100)
        },

        recommendations: this.generateRecommendations(dominantCondition[0], prediction.temporalAdjustment),
        limitations: prediction.confidence.limitations
      },

      // NOVO: Condições meteorológicas atuais
      currentWeather: {
        source: currentWeather.success ? 'Open-Meteo' : 'Estimated',
        data: currentWeather.success ? currentWeather.data : currentWeather.fallback,
        timestamp: currentWeather.metadata?.timestamp || new Date().toISOString(),
        reliability: currentWeather.success ? 'high' : 'low'
      },

      metadata: {
        daysAnalyzed: processedData.length,
        dataSource: 'NASA_POWER',
        currentWeatherSource: currentWeather.success ? 'Open-Meteo' : 'Fallback',
        method: prediction.methodology,
        version: '2.1',
        generatedAt: new Date().toISOString(),
        targetDayOfYear: getDayOfYear(new Date(futureDate)),
        targetYear: new Date(futureDate).getFullYear(),
        confidenceBreakdown: prediction.confidence.breakdown
      }
    }

    console.log('Built response for date:', response.futureDate)
    return response
  }

  generateTemporalInsight(temporalAdjustment) {
    const peakOffset = temporalAdjustment.trend.peakDay.daysOffset

    if (peakOffset === 0) {
      return "Pico de chuva previsto para o dia solicitado"
    } else if (peakOffset === -1) {
      return "Maior probabilidade de chuva no dia anterior"
    } else if (peakOffset === 1) {
      return "Maior probabilidade de chuva no dia seguinte"
    } else if (peakOffset === -2) {
      return "Chuva mais provável 2 dias antes"
    } else if (peakOffset === 2) {
      return "Chuva mais provável 2 dias depois"
    }
    return "Padrão temporal indefinido"
  }

  generateRecommendations(condition, temporalAdjustment) {
    const baseRecommendations = {
      sunny: ["Ideal para secar roupas", "Ótimo para atividades externas"],
      rainy: ["Tire as roupas do varal", "Leve guarda-chuva"],
      snowy: ["Vista roupas quentes", "Ótimo para turismo de inverno"],
      cloudy: ["Monitore o céu", "Possível chuva leve"],
      windy: ["Prenda objetos soltos", "Ideal para esportes com vento"]
    }

    const recommendations = baseRecommendations[condition] || ["Condições normais esperadas"]

    const peakOffset = temporalAdjustment.trend.peakDay.daysOffset

    if (condition === 'rainy' && peakOffset !== 0) {
      if (peakOffset > 0) {
        recommendations.push(`Atenção: chuva mais intensa prevista em ${peakOffset} dia(s)`)
      } else {
        recommendations.push(`Chuva pode estar diminuindo (pico foi ${Math.abs(peakOffset)} dia(s) atrás)`)
      }
    }

    if (Math.abs(peakOffset) <= 1) {
      recommendations.push("Combinando dados históricos com condições meteorológicas atuais")
    }

    return recommendations
  }
}

export default WeatherPredictor
