import NASAApiClient from "./NASAApiClient.js";
import EarthdataClient from "./EarthdataClient.js";

class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient()
        this.earthdataClient = new EarthdataClient()
    }

    calculateCategory(dataArray, categories) {
        let total = dataArray.length;
        let results = {};

        for (let cat in categories) {
            results[cat] = [];
        }

        dataArray.forEach((value) => {
            for (let cat in categories) {
                let [min, max] = categories[cat];
                if (
                    (min === null || value >= min) &&
                    (max === null || value <= max)
                ) {
                    results[cat].push(value)
                    break;
                }
            }
        })

        for (let cat in results) {
            results[cat] = (results[cat].length / total) * 100;
        }

        return results;
    }

    processEvent(historicalData, key, categories, name) {
        let data = Object.values(historicalData.data[key])
        let result = this.calculateCategory(data, categories)
        return { event: name, data: result };
    }

    processSunlight(historicalData) {
        const sunData = Object.entries(historicalData.data["ALLSKY_SFC_SW_DWN"]) // [[dateString, value], ...]

        const currentYear = new Date().getFullYear()
        const lastThirtyYears = Array.from({ length: 30 }, (_, i) => currentYear - i)

        // Inicializa objeto com anos e meses
        const groupedByYear = initializeYearMonthStructure(lastThirtyYears)

        // Popula os dados agrupados por ano e mês
        populateGroupedData(groupedByYear, sunData)

        // Calcula média mensal de cada ano
        const monthlyAverages = calculateMonthlyAverages(groupedByYear)

        // Calcula média anual a partir das médias mensais
        const yearlyAverages = calculateYearlyAverages(monthlyAverages)

        // Calcula média geral de todos os anos
        const overallAverage = calculateOverallAverage(yearlyAverages)

        return { event: 'Sunlight', data: overallAverage };

        // --- Funções auxiliares ---

        function initializeYearMonthStructure(years) {
            const structure = {};
            years.forEach(year => {
                structure[year] = {};
                for (let month = 1; month <= 12; month++) {
                    structure[year][month] = [];
                }
            })
            return structure;
        }

        function populateGroupedData(grouped, data) {
            data.forEach(([dateString, value]) => {
                const year = parseInt(dateString.slice(0, 4))
                const month = parseInt(dateString.slice(4, 6))
                if (grouped[year] && grouped[year][month]) {
                    grouped[year][month].push({ date: dateString, value })
                }
            })
        }

        function calculateMonthlyAverages(grouped) {
            const monthlyAvg = {};
            for (let year in grouped) {
                monthlyAvg[year] = {};
                for (let month in grouped[year]) {
                    const validValues = grouped[year][month].filter(item => item.value !== -999).map(item => item.value)
                    const avg = validValues.length ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
                    monthlyAvg[year][month] = avg;
                }
            }
            return monthlyAvg;
        }

        function calculateYearlyAverages(monthlyAvg) {
            const yearlyAvg = {};
            for (let year in monthlyAvg) {
                const months = Object.values(monthlyAvg[year])
                yearlyAvg[year] = months.reduce((sum, v) => sum + v, 0) / months.length;
            }
            return yearlyAvg;
        }

        function calculateOverallAverage(yearlyAvg) {
            const years = Object.values(yearlyAvg)
            return years.reduce((sum, v) => sum + v, 0) / years.length;
        }
    }

    processSnow(historicalData) {
        const tempMap = historicalData.data?.T2M || {};
        const precipMap = historicalData.data?.PRECTOTCORR || {};

        const dates = Object.keys(tempMap).filter((d) => d in precipMap)

        const counts = { none: 0, weak: 0, moderate: 0, strong: 0 };
        let valid = 0;

        for (const date of dates) {
            const rawT = tempMap[date];
            const rawP = precipMap[date];

            const t = Number(rawT);
            const p = Number(rawP);

            if (!Number.isFinite(t) || !Number.isFinite(p)) continue;
            if (t === -999 || p === -999) continue;

            valid++;

            if (p >= 0 && p <= 0.1 && t > 2) {
                counts.none++;
            } else if (p >= 0.2 && p <= 5 && t > 0 && t < 2) {
                counts.weak++;
            } else if (p >= 5.1 && p <= 20 && t <= 0) {
                counts.moderate++;
            } else if (p >= 20.1 && t <= 0) {
                counts.strong++;
            } else {
                counts.none++;
            }
        }

        const result = {};
        if (valid === 0) {
            for (const k of Object.keys(counts)) result[k] = 0;
        } else {
            for (const k of Object.keys(counts)) {
                result[k] = (counts[k] / valid) * 100;
            }
        }

        return { event: "Snow", data: result };
    }

    isSunny(categoryResults, sunlightResult) {
        const cloud = categoryResults.find(l => l.event === 'Cloud')

        if (!cloud || !cloud.data) {
            console.warn("Dados de nuvem ausentes.")
            return { classification: 'Desconhecido', sunlight, cloudiness: null }
        }

        // Descobre o nível de nuvem predominante
        const { key: maxKey, value: maxValue } = Object.entries(cloud.data).reduce(
            (max, [key, value]) => (value > max.value ? { key, value } : max),
            { key: null, value: -Infinity }
        )

        let howSunny = ''

        if (maxValue < 10) {
            howSunny = 'Sunny'
        } else if (maxValue >= 10 && maxValue <= 30) {
            howSunny = 'Sun with clouds'
        } else {
            howSunny = 'No sun'
        }

        // Retorna objeto estruturado
        return {
            howSunny,
            cloudiness: {
                level: maxKey,
                percentage: maxValue
            }
        }
    }

    getMainWeatherCondition(predictions, dominanceThreshold = 10) {
        const getEvent = (name) => predictions.find(p => p.event === name)

        const precipitation = getEvent('Preciptation')
        const cloud = getEvent('Cloud')
        const snow = getEvent('Snow')
        const sunlight = getEvent('Sunlight')
        const sunnyCondition = predictions.find(p => p.howSunny)?.howSunny;

        // Pega o maior valor de cada evento 
        const maxPrecip = precipitation ? Math.max(...Object.values(precipitation.data)) : 0;
        const maxCloud = cloud ? Math.max(...Object.values(cloud.data)) : 0;
        const maxSnow = snow ? Math.max(...Object.values(snow.data)) : 0;
        const sunValue = sunlight ? sunlight.data : 0; 

        // Monta lista de comparações gerais
        const eventStrengths = [
            { name: 'Chuvoso', value: maxPrecip },
            { name: 'Nublado', value: maxCloud },
            { name: 'Nevando', value: maxSnow },
            { name: 'Ensolarado', value: sunValue }
        ];

        // Ordena por força
        const sorted = eventStrengths.sort((a, b) => b.value - a.value)
        const top = sorted[0];
        const second = sorted[1];
        const diffPercent = ((top.value - second.value) / second.value) * 100;

        // Verifica dominância entre eventos
        if (diffPercent < dominanceThreshold) {
            return {
                main: 'Sem condição dominante',
                confidence: 0,
                dominanceDiff: parseFloat(diffPercent.toFixed(2)),
                eventStrengths
            };
        }

        // Agora decide o tempo principal baseado no evento dominante
        let main = 'Sem condição dominante';
        let confidence = top.value;

        switch (top.name) {
            case 'Nevando':
                if (maxSnow > 10) main = 'Nevando';
                break;
            case 'Chuvoso':
                if (maxPrecip > 20) main = 'Chuvoso';
                break;
            case 'Nublado':
                if (maxCloud > 40 || sunnyCondition === 'No sun') main = 'Nublado';
                break;
            case 'Ensolarado':
                if (sunnyCondition === 'Sunny' && maxCloud < 15) main = 'Ensolarado';
                else if (sunnyCondition === 'Sun with clouds') main = 'Parcialmente ensolarado';
                break;
        }

        return {
            main,
            confidence: parseFloat(confidence.toFixed(2)),
            dominanceDiff: parseFloat(diffPercent.toFixed(2)),
            eventStrengths,
            details: {
                sunnyCondition,
                precipitation: precipitation?.data,
                cloud: cloud?.data,
                snow: snow?.data,
                sunlight: sunlight?.data
            }
        };
    }

    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate)
            if (isNaN(futureDateObj.getTime())) {
                throw new Error("Data inválida fornecida")
            }

            // 1. Buscar dados históricos NASA POWER (fonte principal)
            const historicalData = await this.nasaClient.fetchHistoricalData(
                lat,
                lon,
            )

            // 2. Buscar metadados Earthdata (validação secundária, não-crítico)
            const earthdataMetadata =
                await this.earthdataClient.fetchDatasetMetadata(lat, lon)

            // 3. Gerar link para visualização Giovanni
            const currentYear = new Date().getFullYear()
            const giovanniLink = this.earthdataClient.generateGiovanniLink(
                lat,
                lon,
                `${currentYear - 5}-01-01`, // Últimos 5 anos
                `${currentYear}-12-31`,
            )

            const categories = {
                Wind: {
                    key: "WS10M",
                    ranges: {
                        none: [null, 0.1],
                        weak: [0.2, 5.4],
                        moderate: [5.5, 10.7],
                        strong: [10.8, 17.1],
                        intense: [17.2, null],
                    },
                },
                Preciptation: {
                    key: "PRECTOTCORR",
                    ranges: {
                        none: [null, 0.1],
                        weak: [0.2, 10],
                        moderate: [10.1, 30],
                        strong: [30.1, 60],
                        intense: [60.1, null],
                    },
                },
                Cloud: {
                    key: "CLOUD_AMT",
                    ranges: {
                        none: [null, 9.9],
                        weak: [10, 30],
                        moderate: [30.1, 70],
                        strong: [70.1, null],
                    },
                },
                SunRadiation: {
                    key: "ALLSKY_SFC_SW_DWN",
                    ranges: {
                        none: [null, 1],
                        weak: [1.1, 3],
                        moderate: [3.1, 5],
                        strong: [5.1, 7],
                        intense: [7.1, null],
                    },
                },
                Temperature: {
                    key: "T2M",
                    ranges: {
                        extreme_cold: [null, 0],
                        cold: [0.1, 10],
                        mild: [10.1, 20],
                        warm: [20.1, 30],
                        hot: [30.1, 40],
                        extreme_hot: [40.1, null],
                    },
                },
            };

            // Processa cada categoria
            const categoryResults = Object.entries(categories).map(
                ([name, config]) => {
                    return this.processEvent(
                        historicalData,
                        config.key,
                        config.ranges,
                        name,
                    )
                },
            )

            const sunlightResult = this.processSunlight(historicalData)
            const snowResult = this.processSnow(historicalData)

            const isSunny = this.isSunny(categoryResults, sunlightResult)
            const mainWeather = this.getMainWeatherCondition(categoryResults)

            const results = [...categoryResults, sunlightResult, snowResult, isSunny]

            // Retornar com metadados enriquecidos
            return {
                mainWeather : mainWeather,
                predictions: results,
                metadata: {
                    location: {
                        latitude: lat,
                        longitude: lon,
                    },
                    target_date: futureDate,
                    data_sources: {
                        primary: {
                            name: "NASA POWER API",
                            description: "MERRA-2 Reanalysis Data",
                            period: `${currentYear - 30}-${currentYear}`,
                            url: "https://power.larc.nasa.gov/",
                        },
                        validation: {
                            name: "NASA Earthdata Search",
                            status: earthdataMetadata.success
                                ? "validated"
                                : "unavailable",
                            available_datasets:
                                earthdataMetadata.datasets || [],
                            url: "https://earthdata.nasa.gov/",
                        },
                        visualization: {
                            name: "NASA Giovanni",
                            description: "Interactive data visualization",
                            link: giovanniLink,
                            url: "https://giovanni.gsfc.nasa.gov/",
                        },
                    },
                    generated_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            console.error("WeatherPredictor error:", error)
            return {
                error: `Erro na previsão: ${error.message}`,
                code: 500,
            };
        }
    }
}

export default WeatherPredictor;
