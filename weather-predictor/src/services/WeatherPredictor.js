import NASAApiClient from './NASAApiClient.js'
import { API_LIMITS } from '../config/constants.js'
class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient()
    }

    calculateCategory(dataArray, categories) {
        let total = dataArray.length
        let results = {};

        for (let cat in categories) {
            results[cat] = []
        }

        dataArray.forEach((value) => {
            for (let cat in categories) {
                let [min, max] = categories[cat]
                if ((min === null || value >= min) && (max === null || value <= max)) {
                    results[cat].push(value)
                    break
                }
            }
        })

        for (let cat in results) {
            results[cat] = (results[cat].length / total) * 100
        }

        return results
    }

    processEvent(historicalData, key, categories, name) {
        let data = Object.values(historicalData.data[key])
        let result = this.calculateCategory(data, categories)
        return { event: name, data: result }
    }

    processSunlight(historicalData) {
        const sunData = Object.entries(historicalData.data["ALLSKY_SFC_SW_DWN"]); // [[dateString, value], ...]

        const currentYear = new Date().getFullYear();
        const lastThirtyYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

        // Inicializa objeto com anos e meses
        const groupedByYear = initializeYearMonthStructure(lastThirtyYears);

        // Popula os dados agrupados por ano e mês
        populateGroupedData(groupedByYear, sunData);

        // Calcula média mensal de cada ano
        const monthlyAverages = calculateMonthlyAverages(groupedByYear);

        // Calcula média anual a partir das médias mensais
        const yearlyAverages = calculateYearlyAverages(monthlyAverages);

        // Calcula média geral de todos os anos
        const overallAverage = calculateOverallAverage(yearlyAverages);

        // Lógica para categorizar intensidade
        const counts = { weak: 0, moderate: 0, strong: 0, intense: 0 };
        let valid = 0;

        for (let year in monthlyAverages) {
            for (let month in monthlyAverages[year]) {
                const val = monthlyAverages[year][month];
                if (!Number.isFinite(val) || val === -999) continue;
                valid++;

                // Categorias baseadas em thresholds típicos de radiação solar diária média (kWh/m²/dia)
                if (val < 1) counts.weak++;
                else if (val < 2.5) counts.moderate++;
                else if (val < 5) counts.strong++;
                else counts.intense++;
            }
        }

        const totalCounts = counts.weak + counts.moderate + counts.strong + counts.intense;
        const distribution = valid === 0 ?
            { weak: 0, moderate: 0, strong: 0, intense: 0 } :
            {
                weak: (counts.weak / totalCounts) * 100,
                moderate: (counts.moderate / totalCounts) * 100,
                strong: (counts.strong / totalCounts) * 100,
                intense: (counts.intense / totalCounts) * 100
            };

        const sunChance = valid === 0 ? 0 : (totalCounts / valid) * 100; // chance de ter radiação "significativa"

        return {
            event: "Sunlight",
            chance_to_sunlight: sunChance,
            distribution: distribution
        };

        // Funções auxiliares 
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
                const year = parseInt(dateString.slice(0, 4));
                const month = parseInt(dateString.slice(4, 6));
                if (grouped[year] && grouped[year][month]) {
                    grouped[year][month].push({ date: dateString, value });
                }
            })
        }

        function calculateMonthlyAverages(grouped) {
            const monthlyAvg = {};
            for (let year in grouped) {
                monthlyAvg[year] = {};
                for (let month in grouped[year]) {
                    const validValues = grouped[year][month].filter(item => item.value !== -999).map(item => item.value);
                    const avg = validValues.length ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
                    monthlyAvg[year][month] = avg;
                }
            }
            return monthlyAvg;
        }

        function calculateYearlyAverages(monthlyAvg) {
            const yearlyAvg = {};
            for (let year in monthlyAvg) {
                const months = Object.values(monthlyAvg[year]);
                yearlyAvg[year] = months.reduce((sum, v) => sum + v, 0) / months.length;
            }
            return yearlyAvg;
        }

        function calculateOverallAverage(yearlyAvg) {
            const years = Object.values(yearlyAvg);
            return years.reduce((sum, v) => sum + v, 0) / years.length;
        }
    }


    processSnow(historicalData) {
        const tempMap = historicalData.data?.T2M || {};
        const precipMap = historicalData.data?.PRECTOTCORR || {};

        // datas que existem em ambos
        const dates = Object.keys(tempMap).filter(d => d in precipMap);

        const counts = { weak: 0, moderate: 0, strong: 0 };
        let valid = 0;

        for (const date of dates) {
            const t = Number(tempMap[date]);
            const p = Number(precipMap[date]);

            // pular valores inválidos
            if (!Number.isFinite(t) || !Number.isFinite(p)) continue;
            if (t === -999 || p === -999) continue;

            valid++;

            // aplicação das regras de neve
            if (p >= 0.1 && t > 0 && t <= 2 && p < 5) {
                counts.weak++;
            } else if (p >= 5 && p <= 15 && t <= 2) {
                counts.moderate++;
            } else if (p > 15 && t <= 2) {
                counts.strong++;
            }
        }

        const snowyDays = counts.weak + counts.moderate + counts.strong;
        const snowChance = valid === 0 ? 0 : (snowyDays / valid) * 100;

        const distribution = {};
        if (snowyDays === 0) {
            distribution.weak = 0;
            distribution.moderate = 0;
            distribution.strong = 0;
        } else {
            distribution.weak = (counts.weak / snowyDays) * 100;
            distribution.moderate = (counts.moderate / snowyDays) * 100;
            distribution.strong = (counts.strong / snowyDays) * 100;
        }

        return {
            event: "Snow",
            chance_to_snow: snowChance,
            distribution: distribution
        };
    }


    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate)
            if (isNaN(futureDateObj.getTime())) {
                throw new Error('Data inválida fornecida')
            }

            if (
                lat < API_LIMITS.NASA_LAT_MIN ||
                lat > API_LIMITS.NASA_LAT_MAX ||
                lon < API_LIMITS.NASA_LON_MIN ||
                lon > API_LIMITS.NASA_LON_MAX
            ) {
                throw new Error(`Coordenadas fora dos limites permitidos:
                Latitude deve estar entre ${API_LIMITS.NASA_LAT_MIN} e ${API_LIMITS.NASA_LAT_MAX},
                Longitude entre ${API_LIMITS.NASA_LON_MIN} e ${API_LIMITS.NASA_LON_MAX}.`)
            }

            const historicalData = await this.nasaClient.fetchHistoricalData(lat, lon)

            const categories = {
                Wind: {
                    key: "WS10M",
                    ranges: {
                        none: [null, 0.1],
                        weak: [0.2, 5.4],
                        moderate: [5.5, 10.7],
                        strong: [10.8, 17.1],
                        intense: [17.2, null]
                    }
                },
                Preciptation: {
                    key: "PRECTOTCORR",
                    ranges: {
                        none: [null, 0.1],
                        weak: [0.2, 10],
                        moderate: [10.1, 30],
                        strong: [30.1, 60],
                        intense: [60.1, null]
                    }
                },
                Cloud: {
                    key: "CLOUD_AMT",
                    ranges: {
                        none: [null, 9.9],
                        weak: [10, 30],
                        moderate: [30.1, 70],
                        strong: [70.1, null]
                    }
                },
                SunRadiation: {
                    key: "ALLSKY_SFC_SW_DWN",
                    ranges: {
                        none: [null, 1],
                        weak: [1.1, 3],
                        moderate: [3.1, 5],
                        strong: [5.1, 7],
                        intense: [7.1, null]
                    }
                },
                Temperature: {
                    key: "T2M",
                    ranges: {
                        extreme_cold: [null, 0],
                        cold: [0.1, 10],
                        mild: [10.1, 20],
                        warm: [20.1, 30],
                        hot: [30.1, 40],
                        extreme_hot: [40.1, null]
                    }
                }
            }

            // Processa cada categoria
            const categoryResults = Object.entries(categories).map(([name, config]) => {
                return this.processEvent(historicalData, config.key, config.ranges, name)
            });

            // Processa sunlight separadamente
            const sunlightResult = this.processSunlight(historicalData)


            // Processa snow separadamente
            const snowResult = this.processSnow(historicalData)

            const results = [...categoryResults, sunlightResult, snowResult]

            return results;

        } catch (error) {
            console.error('WeatherPredictor error:', error)
            return {
                error: `Erro na previsão: ${error.message}`,
                code: 500
            }
        }
    }
}

export default WeatherPredictor
