import NASAApiClient from './NASAApiClient.js'
import NASAVennBayesCalculator from './ProbabilityCalculator.js'
import CacheManager from '../utils/cache.js'
import { getDayOfYear } from '../utils/helpers.js'

class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient()
        this.calculator = new NASAVennBayesCalculator()
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

            if (cached && cached.futureDate === futureDate) {
                return { ...cached, fromCache: true }
            }

            // Buscar dados históricos NASA
            const historicalData = await this.nasaClient.fetchHistoricalData(lat, lon)

            function calculoDeEvento(historicalData, nomeEvento, nomeParametro, parametroFraco, parametroMedio, parametroForte, parametroIntenso) {
                let historicalDataArray = []

                let fraco = []
                let moderado = []
                let forte = []
                let intenso = []


                Object.values(historicalData.data[parametro]).forEach((data) => {

                historicalDataArray.push(data)

                switch (true) {
                case data < 5.4:
                    fraco.push(data);
                    break;

                case data > 5.5 && data < 10.7:
                    moderado.push(data);
                    break;

                case data > 10.8 && data < 17.1:
                    forte.push(data);
                    break;

                case data > 17.2:
                    intenso.push(data);
                    break;
                }

            })

            }

            let historicalDataArray = []

            // VENTO
            let ventoFraco = []
            let ventoModerado = []
            let ventoForte = []
            let ventoIntenso = []

            Object.values(historicalData.data['WS10M']).forEach((data) => {

                historicalDataArray.push(data)

                if (data < 5.4 ) {
                    ventoFraco.push(data)
                }

                if (data > 5.5 && data < 10.7) {
                    ventoModerado.push(data)
                }
                
                if (data > 10.8 && data < 17.1 ) {
                    ventoForte.push(data)
                }

                if (data > 17.2) {
                    ventoIntenso.push(data)
                }
            })

            
            let resultventoFraco = (ventoFraco.length / historicalDataArray.length) * 100
            let resultventoModerado = (ventoModerado.length / historicalDataArray.length) * 100
            let resultventoForte = (ventoForte.length / historicalDataArray.length) * 100
            let resultventoIntenso = (ventoIntenso.length / historicalDataArray.length) * 100

            
            console.log("---------------VENTO--------------------------------")
            console.log("FRACO", resultventoFraco)
            console.log("MODERADO", resultventoModerado)
            console.log("FORTE", resultventoForte)
            console.log("INTENSO", resultventoIntenso)
            console.log("---------------VENTO--------------------------------")


            //CHUVA

            let chuvaFraca = []
            let chuvaModerada = []
            let chuvaForte = []
            let chuvaIntenso = []

            Object.values(historicalData.data['PRECTOTCORR']).forEach((data) => {

                historicalDataArray.push(data)

                if (data < 10 && data > 0.2 ) {
                    chuvaFraca.push(data)
                }

                if (data > 10.1 && data < 30) {
                    chuvaModerada.push(data)
                }
                
                if (data > 30.1 && data < 60 ) {
                    chuvaForte.push(data)
                }

                if (data > 60) {
                    chuvaIntenso.push(data)
                }
            })

            
            let resultchuvaFraca = (chuvaFraca.length / historicalDataArray.length) * 100
            let resultchuvaModerada = (chuvamoderada.length / historicalDataArray.length) * 100
            let resultchuvaForte = (chuvaForte.length / historicalDataArray.length) * 100
            let resultchuvaIntenso = (chuvaIntenso.length / historicalDataArray.length) * 100


            console.log("---------------CHUVA--------------------------------")
            console.log("FRACO", resultventoFraco)
            console.log("MODERADO", resultventoModerado)
            console.log("FORTE", resultventoForte)
            console.log("INTENSO", resultventoIntenso)
            console.log("---------------CHUVA--------------------------------")
            

            //
            
            return historicalData.data







            // if (!historicalData.success) {
            //     throw new Error(historicalData.error)
            // }

            // console.log('NASA API data keys:', Object.keys(historicalData.data))
            // console.log('Sample PRECTOTCORR data:', Object.keys(historicalData.data.PRECTOTCORR || {}).slice(0, 5))

            // // CORREÇÃO: Passar dados brutos da NASA diretamente para a calculadora
            // const prediction = await this.calculator.calculate(
            //     historicalData.data,  // Dados brutos da NASA API
            //     futureDate,
            //     null  // Sem condições atuais por enquanto
            // )

            // const result = this.buildResponse(prediction, lat, lon, futureDate)

            // result.futureDate = futureDate

            // // Cache por 24h - dados históricos são estáveis
            // await this.cache.set(cacheKey, result, 86400)

            // return result

        } catch (error) {
            console.error('WeatherPredictor error:', error)
            return {
                error: `Erro na previsão: ${error.message}`,
                code: 500
            }
        }
    }

    buildResponse(prediction, lat, lon, futureDate) {
        // Encontrar condição dominante
        const [dominantCondition, dominantProbability] = this.findDominantCondition(prediction.probabilities)

        const response = {
            location: {
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            },
            futureDate: futureDate,
            prediction: {
                dominantCondition: dominantCondition,
                probability: Math.round(dominantProbability * 100),
                confidence: Math.round(prediction.confidence * 100),

                // Sanitizar probabilidades
                conditions: this.sanitizeConditions(prediction.probabilities),

                // Dados específicos do Venn + Bayes
                vennAnalysis: {
                    methodology: "Diagrama de Venn aplicado aos dados NASA",
                    intersections: {
                        dryAndLowHumidity: Math.round(prediction.vennAnalysis.intersections.dryAndLowHumidity * 100),
                        rainAndHighHumidity: Math.round(prediction.vennAnalysis.intersections.rainAndHighHumidity * 100),
                        idealSunny: Math.round(prediction.vennAnalysis.intersections.idealSunny * 100),
                        stormConditions: Math.round(prediction.vennAnalysis.intersections.stormConditions * 100)
                    },
                    basicProbabilities: {
                        dry: Math.round(prediction.vennAnalysis.basicProbabilities.precipitation.dry * 100),
                        lightRain: Math.round(prediction.vennAnalysis.basicProbabilities.precipitation.lightRain * 100),
                        heavyRain: Math.round(prediction.vennAnalysis.basicProbabilities.precipitation.heavyRain * 100)
                    }
                },

                bayesianAnalysis: prediction.bayesianDetails ? {
                    methodology: "Teorema de Bayes aplicado (sem condições atuais)",
                    priors: this.roundObject(prediction.bayesianDetails.priors),
                    method: prediction.bayesianDetails.method
                } : {
                    methodology: "Apenas probabilidades a priori (sem dados atuais para Bayes)"
                },

                recommendations: this.generateRecommendations(dominantCondition)
            },

            metadata: {
                daysAnalyzed: prediction.vennAnalysis.totalDays,
                dataSource: 'NASA_POWER',
                method: prediction.methodology,
                version: '2.1-venn-bayes',
                generatedAt: new Date().toISOString(),
                targetDayOfYear: getDayOfYear(new Date(futureDate)),
                targetYear: new Date(futureDate).getFullYear(),
                mathematicalApproach: [
                    "Teoria de Conjuntos (Diagrama de Venn)",
                    "Teorema de Bayes (quando aplicável)"
                ]
            }
        }

        console.log('Built response - dominant:', dominantCondition, 'probability:', Math.round(dominantProbability * 100))
        return response
    }

    findDominantCondition(probabilities) {
        const validEntries = Object.entries(probabilities)
            .map(([key, value]) => {
                const cleanValue = (typeof value === 'number' && !isNaN(value)) ? Math.max(0, value) : 0
                return [key, cleanValue]
            })
            .filter(([key, value]) => value > 0)
            .sort(([, a], [, b]) => b - a)

        if (validEntries.length === 0) {
            console.warn('Nenhuma condição com probabilidade válida, usando cloudy como padrão')
            return ['cloudy', 0.3]
        }

        const [condition, probability] = validEntries[0]

        if (probability < 0.05) {
            return [condition, 0.2]
        }

        return [condition, probability]
    }

    sanitizeConditions(probabilities) {
        const sanitized = {}

        Object.entries(probabilities).forEach(([key, value]) => {
            const cleanValue = (typeof value === 'number' && !isNaN(value)) ? Math.max(0, value) : 0
            sanitized[key] = Math.round(cleanValue * 100)
        })

        return sanitized
    }

    roundObject(obj) {
        const rounded = {}
        Object.entries(obj).forEach(([key, value]) => {
            rounded[key] = Math.round(value * 100)
        })
        return rounded
    }

    generateRecommendations(condition) {
        const baseRecommendations = {
            sunny: [
                "Análise de Venn sugere condições favoráveis para secar roupas",
                "Intersecção histórica de dias secos + baixa umidade"
            ],
            rainy: [
                "Diagrama de Venn indica alta probabilidade de chuva",
                "Prepare-se baseado em intersecções históricas chuva + alta umidade"
            ],
            cloudy: [
                "Padrão de Venn sugere condições nubladas",
                "Intersecção histórica indica possível chuva leve"
            ],
            stormy: [
                "Análise de Venn indica condições de tempestade",
                "Intersecção tripla: chuva forte + alta umidade detectada"
            ],
            windy: [
                "Padrões históricos sugerem condições ventosas",
                "Baseado em análise frequentista dos dados NASA"
            ],
            snowy: [
                "Intersecção chuva + frio sugere possibilidade de neve",
                "Análise de Venn aplicada a condições de baixa temperatura"
            ]
        }

        const recommendations = baseRecommendations[condition] || [
            "Condições normais esperadas baseado na análise matemática"
        ]

        recommendations.push("Análise baseada em Teoria de Conjuntos aplicada aos dados históricos da NASA")

        return recommendations
    }
}

export default WeatherPredictor
