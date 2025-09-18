// ===== CORREÇÃO DO src/services/ProbabilityCalculator.js =====
import { WEATHER_THRESHOLDS } from '../config/constants.js'
import { getDayOfYear, clampValue } from '../utils/helpers.js'

class ProbabilityCalculator {
  async calculate(historicalData, targetDate, currentConditions = null) {

      // 1. Definir conjuntos com correção temporal
    const sets = this.defineWeatherSets(historicalData, targetDate)

    // 2. Calcular intersecções Venn
    const vennAnalysis = this.calculateVennIntersections(sets)

    // 3. NOVO: Ajuste por progressão temporal (correção da defasagem)
    const temporalAdjustment = this.calculateTemporalProgression(historicalData, targetDate)

    // 4. Ajuste Bayesiano (se temos condições atuais)
    const bayesianAdjustment = currentConditions ?
      this.applyBayesianUpdate(vennAnalysis, currentConditions, historicalData) :
      this.getDefaultAdjustment()

    // 5. Probabilidades finais com correções
    const probabilities = this.calculateFinalProbabilities(
      vennAnalysis,
      bayesianAdjustment,
      temporalAdjustment
    )

    // 6. Confiança realística
    const confidence = this.calculateRealisticConfidence(sets, historicalData, currentConditions)

    return {
      probabilities,
      vennAnalysis,
      temporalAdjustment,
      bayesianAdjustment,
      confidence,
      methodology: 'venn_diagram_temporal_corrected'
    }
  }

  // NOVO: Correção da progressão temporal
  calculateTemporalProgression(historicalData, targetDate) {
    const targetDayOfYear = getDayOfYear(new Date(targetDate))

    // Analisar padrão de 5 dias antes e depois
    const patterns = {
      dayMinus2: this.analyzeDayPattern(historicalData, targetDayOfYear - 2),
      dayMinus1: this.analyzeDayPattern(historicalData, targetDayOfYear - 1),
      targetDay: this.analyzeDayPattern(historicalData, targetDayOfYear),
      dayPlus1: this.analyzeDayPattern(historicalData, targetDayOfYear + 1),
      dayPlus2: this.analyzeDayPattern(historicalData, targetDayOfYear + 2)
    }

    // Detectar tendência: chuva está se aproximando ou se afastando?
    const trend = this.detectWeatherTrend(patterns)

    return {
      patterns,
      trend,
      adjustmentFactor: this.calculateTemporalAdjustmentFactor(trend)
    }
  }

  analyzeDayPattern(historicalData, dayOfYear) {
    const relevantDays = historicalData.filter(day => {
      const dayNum = getDayOfYear(new Date(day.date.substring(0,4), day.date.substring(4,6)-1, day.date.substring(6,8)))
      return Math.abs(dayNum - dayOfYear) <= 3 // ±3 dias
    })

    if (relevantDays.length === 0) return { rainProbability: 0, intensity: 0 }

    const rainDays = relevantDays.filter(d => d.precipitation > WEATHER_THRESHOLDS.rain.light)
    const avgPrecipitation = relevantDays.reduce((sum, d) => sum + d.precipitation, 0) / relevantDays.length

    return {
      rainProbability: rainDays.length / relevantDays.length,
      intensity: avgPrecipitation,
      totalDays: relevantDays.length
    }
  }

  detectWeatherTrend(patterns) {
    const probabilities = [
      patterns.dayMinus2.rainProbability,
      patterns.dayMinus1.rainProbability,
      patterns.targetDay.rainProbability,
      patterns.dayPlus1.rainProbability,
      patterns.dayPlus2.rainProbability
    ]

    // Calcular tendência usando regressão linear simples
    const trend = this.calculateLinearTrend(probabilities)

    return {
      direction: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
      magnitude: Math.abs(trend),
      peakDay: this.findPeakRainDay(patterns)
    }
  }

  calculateLinearTrend(values) {
    const n = values.length
    const x = [-2, -1, 0, 1, 2] // dias relativos
    const y = values

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    // Slope da regressão linear
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  findPeakRainDay(patterns) {
    const days = ['dayMinus2', 'dayMinus1', 'targetDay', 'dayPlus1', 'dayPlus2']
    let maxProb = 0
    let peakDay = 'targetDay'

    days.forEach(day => {
      if (patterns[day].rainProbability > maxProb) {
        maxProb = patterns[day].rainProbability
        peakDay = day
      }
    })

    return {
      day: peakDay,
      probability: maxProb,
      daysOffset: this.getDayOffset(peakDay)
    }
  }

  getDayOffset(peakDay) {
    const offsets = {
      'dayMinus2': -2,
      'dayMinus1': -1,
      'targetDay': 0,
      'dayPlus1': 1,
      'dayPlus2': 2
    }
    return offsets[peakDay] || 0
  }

  calculateTemporalAdjustmentFactor(trend) {
    // Se o pico de chuva é em outro dia, ajustar probabilidade
    const peakOffset = trend.peakDay.daysOffset

    if (peakOffset === 0) {
      return { rain: 1.0, sunny: 1.0 } // Pico no dia target
    } else if (Math.abs(peakOffset) === 1) {
      return { rain: 0.7, sunny: 1.3 } // Pico 1 dia antes/depois
    } else {
      return { rain: 0.4, sunny: 1.6 } // Pico 2+ dias antes/depois
    }
  }

  // CORRIGIDO: Probabilidades finais com ajuste temporal
  calculateFinalProbabilities(vennAnalysis, bayesianAdjustment, temporalAdjustment) {
    const base = vennAnalysis.basic
    const intersections = vennAnalysis.intersections
    const bayesAdj = bayesianAdjustment.adjustmentFactor
    const tempAdj = temporalAdjustment.adjustmentFactor

    // Probabilidade base de chuva
    let rainProb = (base.precipitation.light + base.precipitation.moderate + base.precipitation.heavy)
                  * bayesAdj.rainy
                  * tempAdj.rain

    // Probabilidade base de sol
    let sunnyProb = intersections.sunnyConditions * 1.2 * bayesAdj.sunny * tempAdj.sunny

    // Normalizar para evitar soma > 100%
    const total = rainProb + sunnyProb + 0.3 // 0.3 para outras condições
    if (total > 1.0) {
      rainProb = rainProb / total
      sunnyProb = sunnyProb / total
    }

    return {
      sunny: clampValue(sunnyProb),
      rainy: clampValue(rainProb),
      cloudy: clampValue(intersections.rainAndHighHumidity * 0.6),
      snowy: clampValue(0.05), // Simplificado para regiões tropicais
      windy: clampValue(0.1)   // Simplificado
    }
  }

  // CORRIGIDO: Confiança mais realística
  calculateRealisticConfidence(sets, historicalData, currentConditions) {
    const relevantDays = sets.total.length

    // Fatores de confiança
    const dataConfidence = Math.min(relevantDays / 50, 1.0) * 0.6 // Reduzido
    const temporalConfidence = Math.min(historicalData.length / (15 * 365), 1.0) * 0.3
    const currentConditionsBonus = currentConditions ? 0.1 : 0

    // Penalidade por falta de dados em tempo real
    const realTimeDataPenalty = 0.3 // Não temos dados meteorológicos atuais

    const overallConfidence = dataConfidence + temporalConfidence + currentConditionsBonus - realTimeDataPenalty

    return {
      overall: clampValue(overallConfidence, 0.1, 0.8), // Máximo 80% sem dados em tempo real
      breakdown: {
        data: dataConfidence,
        temporal: temporalConfidence,
        currentConditions: currentConditionsBonus,
        realTimePenalty: realTimeDataPenalty
      },
      limitations: [
        "Baseado apenas em padrões históricos",
        "Não considera condições meteorológicas atuais",
        "Precisão limitada para previsões de curto prazo"
      ]
    }
  }

  // Métodos existentes mantidos...
  defineWeatherSets(historicalData, targetDate) {
    const targetDayOfYear = getDayOfYear(new Date(targetDate))
    const windowDays = 10 // Reduzido para maior precisão temporal

    const relevantDays = historicalData.filter(day => {
      const dayOfYear = getDayOfYear(new Date(day.date.substring(0,4), day.date.substring(4,6)-1, day.date.substring(6,8)))
      return Math.abs(dayOfYear - targetDayOfYear) <= windowDays
    })

    if (relevantDays.length === 0) {
      throw new Error('Dados insuficientes para análise')
    }

    return {
      precipitation: {
        none: relevantDays.filter(d => d.precipitation < WEATHER_THRESHOLDS.rain.light),
        light: relevantDays.filter(d => d.precipitation >= WEATHER_THRESHOLDS.rain.light && d.precipitation < WEATHER_THRESHOLDS.rain.moderate),
        moderate: relevantDays.filter(d => d.precipitation >= WEATHER_THRESHOLDS.rain.moderate)
      },
      humidity: {
        low: relevantDays.filter(d => d.humidity < WEATHER_THRESHOLDS.humidity.low),
        high: relevantDays.filter(d => d.humidity >= WEATHER_THRESHOLDS.humidity.high)
      },
      total: relevantDays
    }
  }

  calculateVennIntersections(sets) {
    const total = sets.total.length

    const intersections = {
      rainAndHighHumidity: this.calculateIntersection(
        sets.precipitation.light.concat(sets.precipitation.moderate),
        sets.humidity.high
      ) / total,

      sunnyConditions: this.calculateIntersection(
        sets.precipitation.none,
        sets.humidity.low
      ) / total
    }

    return {
      basic: {
        precipitation: {
          none: sets.precipitation.none.length / total,
          light: sets.precipitation.light.length / total,
          moderate: sets.precipitation.moderate.length / total
        }
      },
      intersections,
      total
    }
  }

  calculateIntersection(setA, setB) {
    return setA.filter(dayA => setB.some(dayB => dayA.date === dayB.date)).length
  }

  getDefaultAdjustment() {
    return {
      adjustmentFactor: { sunny: 1, rainy: 1, snowy: 1, cloudy: 1, windy: 1 }
    }
  }

  applyBayesianUpdate(vennAnalysis, currentConditions, historicalData) {
    // Implementação simplificada
    return {
      adjustmentFactor: { sunny: 1.1, rainy: 0.9, snowy: 1.0, cloudy: 1.0, windy: 1.0 },
      similarDaysCount: 10
    }
  }
}

export default ProbabilityCalculator
