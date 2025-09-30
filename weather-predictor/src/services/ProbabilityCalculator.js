import { WEATHER_THRESHOLDS } from '../config/constants.js'
import { getDayOfYear } from '../utils/helpers.js'

class NASAVennBayesCalculator {

    // async calculate(historicalData, targetDate, currentConditions = null) {
    //     // 1. Processar dados da NASA POWER API
    //     const nasaData = this.processNASAData(historicalData, targetDate)

    //     // 2. Aplicar Diagrama de Venn (Teoria de Conjuntos)
    //     const vennAnalysis = this.applyVennDiagram(nasaData)

    //     // 3. Aplicar Teorema de Bayes (se há condições atuais)
    //     const bayesianResult = currentConditions ?
    //         this.applyBayesTheorem(vennAnalysis, currentConditions, nasaData) :
    //         this.getPriorProbabilities(vennAnalysis)

    //     // 4. CORREÇÃO: Calcular todas as condições independentemente
    //     const allProbabilities = this.calculateAllConditions(nasaData, vennAnalysis, currentConditions)

    //     return {
    //         probabilities: allProbabilities,
    //         vennAnalysis: vennAnalysis,
    //         bayesianDetails: bayesianResult,
    //         confidence: this.calculateConfidence(nasaData),
    //         methodology: 'nasa_venn_bayes',
    //         dataSource: 'NASA_POWER'
    //     }
    // }

    // NOVA FUNÇÃO: Calcular todas as condições independentemente
    calculateAllConditions(nasaData, vennAnalysis, currentConditions = null) {
        const total = nasaData.length

        if (total === 0) {
            return this.getDefaultProbabilities()
        }

        // Calcular cada condição baseada em critérios específicos
        const conditions = {
            // SUNNY: Dias secos + baixa umidade + temperatura amena
            sunny: this.calculateSunnyProbability(nasaData, vennAnalysis),

            // RAINY: Dias com precipitação
            rainy: this.calculateRainyProbability(nasaData, vennAnalysis),

            // CLOUDY: Dias com alta umidade mas pouca chuva
            cloudy: this.calculateCloudyProbability(nasaData, vennAnalysis),

            // STORMY: Dias com chuva forte + alta umidade
            stormy: this.calculateStormyProbability(nasaData, vennAnalysis),

            // WINDY: Dias com vento forte
            windy: this.calculateWindyProbability(nasaData, currentConditions),

            // SNOWY: Dias frios com precipitação
            snowy: this.calculateSnowyProbability(nasaData, currentConditions)
        }

        // Aplicar ajuste Bayesiano se há condições atuais
        if (currentConditions) {
            return this.applyBayesianAdjustment(conditions, currentConditions, nasaData)
        }

        // Garantir que nenhuma probabilidade seja 0 (mínimo de 1%)
        Object.keys(conditions).forEach(key => {
            conditions[key] = Math.max(conditions[key], 0.01)
        })

        return conditions
    }

    // Calcular probabilidade de sol
    calculateSunnyProbability(nasaData, vennAnalysis) {
        const total = nasaData.length

        // Critério: dias secos + baixa/moderada umidade
        const sunnyDays = nasaData.filter(d =>
            d.precipitation < WEATHER_THRESHOLDS.rain.light &&
            d.humidity && d.humidity < WEATHER_THRESHOLDS.humidity.high
        ).length

        const baseProb = sunnyDays / total

        // Usar intersecção do Venn como boost
        const vennBoost = vennAnalysis.intersections.idealSunny || 0

        return Math.max(baseProb, vennBoost) * 0.9 // Máximo 90%
    }

    // Calcular probabilidade de chuva
    calculateRainyProbability(nasaData, vennAnalysis) {
        const total = nasaData.length

        const rainyDays = nasaData.filter(d =>
            d.precipitation >= WEATHER_THRESHOLDS.rain.light
        ).length

        return Math.max(rainyDays / total, 0.05) // Mínimo 5%
    }

    // Calcular probabilidade de nublado
    calculateCloudyProbability(nasaData, vennAnalysis) {
        const total = nasaData.length

        // Critério: alta umidade mas pouca chuva
        const cloudyDays = nasaData.filter(d =>
            d.humidity && d.humidity >= WEATHER_THRESHOLDS.humidity.moderate &&
            d.precipitation < WEATHER_THRESHOLDS.rain.moderate
        ).length

        return Math.max(cloudyDays / total, 0.05) // Mínimo 5%
    }

    // Calcular probabilidade de tempestade
    calculateStormyProbability(nasaData, vennAnalysis) {
        const total = nasaData.length

        const stormyDays = nasaData.filter(d =>
            d.precipitation >= WEATHER_THRESHOLDS.rain.moderate &&
            d.humidity && d.humidity >= WEATHER_THRESHOLDS.humidity.high
        ).length

        const baseProb = stormyDays / total
        const vennBoost = vennAnalysis.intersections.stormConditions || 0

        return Math.max(baseProb, vennBoost, 0.02) // Mínimo 2%
    }

    // Aplicar ajuste Bayesiano às condições
    applyBayesianAdjustment(conditions, currentConditions, nasaData) {
        const adjusted = { ...conditions }

        // Ajuste baseado na temperatura atual
        if (currentConditions.temperature !== undefined) {
            if (currentConditions.temperature > WEATHER_THRESHOLDS.temperature.warm) {
                adjusted.sunny *= 1.3
                adjusted.stormy *= 1.2
                adjusted.snowy *= 0.1
            } else if (currentConditions.temperature < WEATHER_THRESHOLDS.temperature.cold) {
                adjusted.snowy *= 2.0
                adjusted.sunny *= 0.7
            }
        }

        // Ajuste baseado na umidade atual
        if (currentConditions.humidity !== undefined) {
            if (currentConditions.humidity > WEATHER_THRESHOLDS.humidity.high) {
                adjusted.rainy *= 1.4
                adjusted.stormy *= 1.3
                adjusted.cloudy *= 1.2
                adjusted.sunny *= 0.6
            } else if (currentConditions.humidity < WEATHER_THRESHOLDS.humidity.low) {
                adjusted.sunny *= 1.3
                adjusted.rainy *= 0.7
                adjusted.cloudy *= 0.8
            }
        }

        // Ajuste baseado na pressão atual
        if (currentConditions.pressure !== undefined) {
            // Pressão baixa indica instabilidade
            if (currentConditions.pressure < 1000) {
                adjusted.rainy *= 1.3
                adjusted.stormy *= 1.4
                adjusted.sunny *= 0.7
            } else if (currentConditions.pressure > 1020) {
                adjusted.sunny *= 1.2
                adjusted.rainy *= 0.8
            }
        }

        // Ajuste baseado no vento atual
        if (currentConditions.windSpeed !== undefined) {
            if (currentConditions.windSpeed > WEATHER_THRESHOLDS.wind.moderate) {
                adjusted.windy *= 2.0
                adjusted.stormy *= 1.3
            }
        }

        // Garantir que nenhuma probabilidade seja 0 após ajustes
        Object.keys(adjusted).forEach(key => {
            adjusted[key] = Math.max(adjusted[key], 0.01)
            adjusted[key] = Math.min(adjusted[key], 0.95) // Máximo 95%
        })

        return adjusted
    }

    // Probabilidades padrão quando não há dados suficientes
    getDefaultProbabilities() {
        return {
            sunny: 0.25,
            rainy: 0.20,
            cloudy: 0.25,
            stormy: 0.05,
            windy: 0.15,
            snowy: 0.10
        }
    }

    // PASSO 1: Processar dados específicos da NASA POWER API
    processNASAData(historicalData, targetDate) {
        const targetDayOfYear = getDayOfYear(new Date(targetDate))
        const windowDays = 15 // ±15 dias para padrão sazonal

        const relevantDays = []

        // Iterar pelos dados da NASA no formato YYYYMMDD
        Object.keys(historicalData.PRECTOTCORR || {}).forEach(dateStr => {
            const date = this.parseNASADate(dateStr)
            const dayOfYear = getDayOfYear(date)

            // Filtrar apenas dias na janela temporal desejada
            if (Math.abs(dayOfYear - targetDayOfYear) <= windowDays) {
                const dayData = {
                    date: dateStr,
                    year: date.getFullYear(),
                    dayOfYear: dayOfYear,

                    // Extrair variáveis meteorológicas da NASA
                    precipitation: historicalData.PRECTOTCORR[dateStr] || 0,
                    tempMax: historicalData.T2M_MAX?.[dateStr] || null,
                    tempMin: historicalData.T2M_MIN?.[dateStr] || null,
                    humidity: historicalData.RH2M?.[dateStr] || null,
                    windSpeed: historicalData.WS10M?.[dateStr] || null,
                    pressure: historicalData.PS?.[dateStr] || null
                }

                // Calcular temperatura média
                if (dayData.tempMax !== null && dayData.tempMin !== null) {
                    dayData.tempMean = (dayData.tempMax + dayData.tempMin) / 2
                }

                relevantDays.push(dayData)
            }
        })

        console.log(`NASA Data: ${relevantDays.length} dias relevantes processados`)
        return relevantDays
    }

    // PASSO 2: DIAGRAMA DE VENN - Teoria de Conjuntos
    applyVennDiagram(nasaData) {
        if (nasaData.length === 0) {
            throw new Error('Dados NASA insuficientes para análise de Venn')
        }

        console.log('Aplicando Diagrama de Venn aos dados NASA...')

        // DEFINIR CONJUNTOS BASEADOS NOS DADOS NASA

        // Conjunto A: Estados de Precipitação
        const A = {
            dry: nasaData.filter(d => d.precipitation < WEATHER_THRESHOLDS.rain.light),
            lightRain: nasaData.filter(d =>
                d.precipitation >= WEATHER_THRESHOLDS.rain.light &&
                d.precipitation < WEATHER_THRESHOLDS.rain.moderate
            ),
            heavyRain: nasaData.filter(d => d.precipitation >= WEATHER_THRESHOLDS.rain.moderate)
        }

        // Conjunto B: Estados de Temperatura
        const B = {
            cold: nasaData.filter(d => d.tempMean && d.tempMean < WEATHER_THRESHOLDS.temperature.cold),
            mild: nasaData.filter(d =>
                d.tempMean &&
                d.tempMean >= WEATHER_THRESHOLDS.temperature.cold &&
                d.tempMean < WEATHER_THRESHOLDS.temperature.warm
            ),
            hot: nasaData.filter(d => d.tempMean && d.tempMean >= WEATHER_THRESHOLDS.temperature.warm)
        }

        // Conjunto C: Estados de Umidade
        const C = {
            lowHumidity: nasaData.filter(d => d.humidity && d.humidity < WEATHER_THRESHOLDS.humidity.low),
            moderateHumidity: nasaData.filter(d =>
                d.humidity &&
                d.humidity >= WEATHER_THRESHOLDS.humidity.low &&
                d.humidity < WEATHER_THRESHOLDS.humidity.high
            ),
            highHumidity: nasaData.filter(d => d.humidity && d.humidity >= WEATHER_THRESHOLDS.humidity.high)
        }

        // CALCULAR INTERSEÇÕES DO DIAGRAMA DE VENN
        const total = nasaData.length

        const intersections = {
            // Interseções de 2 conjuntos
            dryAndLowHumidity: this.intersectSets(A.dry, C.lowHumidity).length / total,
            rainAndHighHumidity: this.intersectSets(
                A.lightRain.concat(A.heavyRain),
                C.highHumidity
            ).length / total,
            coldAndRain: this.intersectSets(
                A.lightRain.concat(A.heavyRain),
                B.cold
            ).length / total,

            // Interseções de 3 conjuntos (centro do Venn)
            idealSunny: this.intersectThreeSets(A.dry, B.mild, C.lowHumidity).length / total,
            stormConditions: this.intersectThreeSets(A.heavyRain, B.mild, C.highHumidity).length / total
        }

        // Probabilidades básicas (conjuntos individuais)
        const basicProbabilities = {
            precipitation: {
                dry: A.dry.length / total,
                lightRain: A.lightRain.length / total,
                heavyRain: A.heavyRain.length / total
            },
            temperature: {
                cold: B.cold.length / total,
                mild: B.mild.length / total,
                hot: B.hot.length / total
            },
            humidity: {
                low: C.lowHumidity.length / total,
                moderate: C.moderateHumidity.length / total,
                high: C.highHumidity.length / total
            }
        }

        console.log('Interseções de Venn calculadas:', intersections)

        return {
            sets: { A, B, C },
            intersections,
            basicProbabilities,
            totalDays: total
        }
    }

    // PASSO 3: TEOREMA DE BAYES
    applyBayesTheorem(vennAnalysis, currentConditions, nasaData) {
        console.log('Aplicando Teorema de Bayes com condições atuais...')

        // PRIORS (probabilidades a priori baseadas no histórico)
        const priors = {
            sunny: vennAnalysis.intersections.idealSunny || 0.1,
            rainy: vennAnalysis.basicProbabilities.precipitation.lightRain +
                vennAnalysis.basicProbabilities.precipitation.heavyRain,
            cloudy: vennAnalysis.intersections.rainAndHighHumidity || 0.1,
            stormy: vennAnalysis.intersections.stormConditions || 0.05
        }

        // LIKELIHOOD (probabilidade das condições atuais dado cada evento)
        const likelihoods = this.calculateLikelihoods(currentConditions, nasaData)

        // EVIDÊNCIA (probabilidade marginal das condições atuais)
        const evidence = Object.keys(priors).reduce((sum, event) => {
            return sum + (likelihoods[event] * priors[event])
        }, 0)

        // POSTERIORS (Teorema de Bayes): P(Evento|Evidência) = P(Evidência|Evento) × P(Evento) / P(Evidência)
        const posteriors = {}
        Object.keys(priors).forEach(event => {
            posteriors[event] = evidence > 0 ?
                (likelihoods[event] * priors[event]) / evidence :
                priors[event]
        })

        console.log('Bayes - Priors:', priors)
        console.log('Bayes - Likelihoods:', likelihoods)
        console.log('Bayes - Posteriors:', posteriors)

        return {
            priors,
            likelihoods,
            evidence,
            posteriors,
            method: 'bayes_theorem'
        }
    }

    // Calcular Likelihood P(Condições Atuais | Evento)
    calculateLikelihoods(currentConditions, nasaData) {
        // Encontrar dias históricos com condições similares às atuais
        const similarDays = nasaData.filter(day => {
            const tempDiff = day.tempMean ? Math.abs(day.tempMean - currentConditions.temperature) : 100
            const humidityDiff = day.humidity ? Math.abs(day.humidity - currentConditions.humidity) : 100
            const pressureDiff = day.pressure ? Math.abs(day.pressure - currentConditions.pressure) : 100

            // Considerar "similar" se diferenças estão dentro de tolerâncias
            return tempDiff <= 5 && humidityDiff <= 20 && pressureDiff <= 10
        })

        console.log(`Encontrados ${similarDays.length} dias similares às condições atuais`)

        if (similarDays.length === 0) {
            // Sem dias similares, usar distribuição uniforme
            return { sunny: 0.25, rainy: 0.25, cloudy: 0.25, stormy: 0.25 }
        }

        // Calcular likelihood baseado nos dias similares
        const likelihoods = {
            sunny: similarDays.filter(d =>
                d.precipitation < WEATHER_THRESHOLDS.rain.light &&
                d.humidity < WEATHER_THRESHOLDS.humidity.moderate
            ).length / similarDays.length,

            rainy: similarDays.filter(d =>
                d.precipitation >= WEATHER_THRESHOLDS.rain.light
            ).length / similarDays.length,

            cloudy: similarDays.filter(d =>
                d.humidity >= WEATHER_THRESHOLDS.humidity.high
            ).length / similarDays.length,

            stormy: similarDays.filter(d =>
                d.precipitation >= WEATHER_THRESHOLDS.rain.moderate &&
                d.humidity >= WEATHER_THRESHOLDS.humidity.high
            ).length / similarDays.length
        }

        return likelihoods
    }

    // Fallback se não há condições atuais - usar apenas priors
    getPriorProbabilities(vennAnalysis) {
        const priors = {
            sunny: vennAnalysis.intersections.dryAndLowHumidity,
            rainy: vennAnalysis.basicProbabilities.precipitation.lightRain +
                vennAnalysis.basicProbabilities.precipitation.heavyRain,
            cloudy: vennAnalysis.intersections.rainAndHighHumidity,
            stormy: vennAnalysis.intersections.stormConditions,
            windy: 0.1, // Estimativa básica
            snowy: vennAnalysis.intersections.coldAndRain * 0.3 // Parte da chuva fria como neve
        }

        return {
            priors,
            posteriors: priors,
            method: 'prior_probabilities_only'
        }
    }

    // Calcular probabilidades específicas
    calculateWindyProbability(nasaData, currentConditions = null) {
        const windyDays = nasaData.filter(d =>
            d.windSpeed && d.windSpeed > WEATHER_THRESHOLDS.wind.moderate
        ).length

        let baseProb = nasaData.length > 0 ? windyDays / nasaData.length : 0.1

        // Ajuste Bayesiano se há condições atuais
        if (currentConditions && currentConditions.windSpeed) {
            const adjustment = currentConditions.windSpeed > WEATHER_THRESHOLDS.wind.moderate ? 1.5 : 0.7
            baseProb *= adjustment
        }

        return Math.max(Math.min(baseProb, 1.0), 0.02) // Entre 2% e 100%
    }

    calculateSnowyProbability(nasaData, currentConditions = null) {
        const coldRainyDays = nasaData.filter(d =>
            d.precipitation > WEATHER_THRESHOLDS.rain.light &&
            d.tempMean && d.tempMean < WEATHER_THRESHOLDS.temperature.cold
        ).length

        let baseProb = nasaData.length > 0 ? (coldRainyDays / nasaData.length) * 0.5 : 0.05 // 50% da chuva fria vira neve

        // Ajuste Bayesiano se há condições atuais
        if (currentConditions && currentConditions.temperature !== undefined) {
            const adjustment = currentConditions.temperature < WEATHER_THRESHOLDS.temperature.cold ? 2.0 : 0.1
            baseProb *= adjustment
        }

        return Math.max(Math.min(baseProb, 1.0), 0.01) // Entre 1% e 100%
    }

    // Calcular confiança baseada na qualidade dos dados NASA
    calculateConfidence(nasaData) {
        const dataPoints = nasaData.length
        const dataCompleteness = nasaData.filter(d =>
            d.precipitation !== null && d.tempMean !== null && d.humidity !== null
        ).length / Math.max(dataPoints, 1)

        const baseConfidence = Math.min(dataPoints / 100, 1.0) * 0.7
        const completenessBonus = dataCompleteness * 0.3

        return Math.min(baseConfidence + completenessBonus, 0.9) // Máximo 90%
    }

    // UTILITÁRIOS PARA INTERSEÇÕES
    intersectSets(setA, setB) {
        return setA.filter(dayA => setB.some(dayB => dayA.date === dayB.date))
    }

    intersectThreeSets(setA, setB, setC) {
        return setA.filter(dayA =>
            setB.some(dayB => dayA.date === dayB.date) &&
            setC.some(dayC => dayA.date === dayC.date)
        )
    }

    parseNASADate(dateStr) {
        // Converter YYYYMMDD para Date
        return new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
        )
    }
}

export default NASAVennBayesCalculator
