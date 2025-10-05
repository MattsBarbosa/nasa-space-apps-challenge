import NASAApiClient from "./NASAApiClient.js";
import EarthdataClient from "./EarthdataClient.js";

class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient();
        this.earthdataClient = new EarthdataClient();
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
                    results[cat].push(value);
                    break;
                }
            }
        });

        for (let cat in results) {
            results[cat] = (results[cat].length / total) * 100;
        }

        return results;
    }

    processEvent(historicalData, key, categories, name) {
        let data = Object.values(historicalData.data[key]);
        let result = this.calculateCategory(data, categories);
        return { event: name, data: result };
    }

    processSunlight(historicalData) {
        const sunData = Object.entries(
            historicalData.data["ALLSKY_SFC_SW_DWN"],
        ); // [[dateString, value], ...]

        const currentYear = new Date().getFullYear();
        const lastThirtyYears = Array.from(
            { length: 30 },
            (_, i) => currentYear - i,
        );

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

        return { event: "Sunlight", data: overallAverage };

        // --- Funções auxiliares ---

        function initializeYearMonthStructure(years) {
            const structure = {};
            years.forEach((year) => {
                structure[year] = {};
                for (let month = 1; month <= 12; month++) {
                    structure[year][month] = [];
                }
            });
            return structure;
        }

        function populateGroupedData(grouped, data) {
            data.forEach(([dateString, value]) => {
                const year = parseInt(dateString.slice(0, 4));
                const month = parseInt(dateString.slice(4, 6));
                if (grouped[year] && grouped[year][month]) {
                    grouped[year][month].push({ date: dateString, value });
                }
            });
        }

        function calculateMonthlyAverages(grouped) {
            const monthlyAvg = {};
            for (let year in grouped) {
                monthlyAvg[year] = {};
                for (let month in grouped[year]) {
                    const validValues = grouped[year][month]
                        .filter((item) => item.value !== -999)
                        .map((item) => item.value);
                    const avg = validValues.length
                        ? validValues.reduce((sum, v) => sum + v, 0) /
                          validValues.length
                        : 0;
                    monthlyAvg[year][month] = avg;
                }
            }
            return monthlyAvg;
        }

        function calculateYearlyAverages(monthlyAvg) {
            const yearlyAvg = {};
            for (let year in monthlyAvg) {
                const months = Object.values(monthlyAvg[year]);
                yearlyAvg[year] =
                    months.reduce((sum, v) => sum + v, 0) / months.length;
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

        const dates = Object.keys(tempMap).filter((d) => d in precipMap);

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

    weightedPercentage(data, weights) {
        let total = 0;
        let weightedSum = 0;
        for (let key in data) {
            const value = data[key] || 0;
            const weight = weights[key] || 0;
            weightedSum += value * weight;
            total += value;
        }
        return total ? weightedSum / total : 0;
    }

    isSunny(categoryResults, sunlightResult) {
        const cloud = categoryResults.find((l) => l.event === "Cloud");
        const precipitation = categoryResults.find(
            (l) => l.event === "Preciptation",
        );
        const sunlight = sunlightResult?.data || 0;

        if (!cloud || !precipitation)
            return { howSunny: "Sem previsão de sol" };

        const cloudWeights = {
            weak: 10,
            moderate: 20,
            strong: 30,
            intense: 40,
        };
        const rainWeights = { weak: 10, moderate: 20, strong: 30, intense: 40 };

        const cloudiness = this.weightedPercentage(cloud.data, cloudWeights);
        const raininess = this.weightedPercentage(
            precipitation.data,
            rainWeights,
        );

        let howSunny = "Sem previsão de sol";

        // Se alta radiação solar e pouca chuva → ensolarado
        if (sunlight > 200 && raininess < 20) {
            if (cloudiness < 10) howSunny = "Sunny";
            else if (cloudiness < 35) howSunny = "Sun with clouds";
            else howSunny = "Parcialmente ensolarado";
        } else if (cloudiness > 50) {
            howSunny = "No sun";
        }

        return {
            howSunny,
            cloudiness: { percentage: cloudiness },
        };
    }

    getMainWeatherCondition(predictions, dominanceThreshold = 10) {
        const getEvent = (name) => predictions.find((p) => p.event === name);

        // Extrai eventos
        const precipitation = getEvent("Preciptation");
        const cloud = getEvent("Cloud");
        const snow = getEvent("Snow");
        const sunlight = getEvent("SunRadiation"); // opcional
        const isSunnyObj = predictions.find((p) => p.howSunny);

        // Pesos para categorias
        const weights = { weak: 25, moderate: 50, strong: 75, intense: 100 };

        // Função auxiliar: converte categorias em escala 0-100
        const eventScore = (ev) => {
            if (!ev || !ev.data) return 0;
            // Ignora 'none'
            const filtered = Object.fromEntries(
                Object.entries(ev.data).filter(([k]) => k !== "none"),
            );
            return this.weightedPercentage(filtered, weights);
        };

        // Calcula score proporcional
        const precipScore = eventScore(precipitation);
        const cloudScore = eventScore(cloud);
        const snowScore = eventScore(snow);

        // Sol: se isSunny definido, transforma em 0-100
        const sunnyScoreMap = {
            Sunny: 100,
            "Sun with clouds": 70,
            "No sun": 0,
            Sol: 100,
            "Sol com poucas nuvens": 70,
            "Sem previsão de sol": 0,
        };
        const sunScore = isSunnyObj
            ? (sunnyScoreMap[isSunnyObj.howSunny] ?? 0)
            : 0;

        // Lista de eventos para comparar
        const eventStrengths = [
            { name: "Chuvoso", value: precipScore },
            { name: "Nublado", value: cloudScore },
            { name: "Nevando", value: snowScore },
            { name: "Ensolarado", value: sunScore },
        ];

        // Ordena do maior para menor
        const sorted = eventStrengths.slice().sort((a, b) => b.value - a.value);
        const top = sorted[0] || { value: 0 };
        const second = sorted[1] || { value: 0 };

        // Diferença de dominância percentual
        const dominanceDiff =
            second.value === 0
                ? Infinity
                : ((top.value - second.value) / second.value) * 100;

        // Se diferença pequena, retorna sem condição dominante
        if (
            !(dominanceDiff === Infinity) &&
            dominanceDiff < dominanceThreshold
        ) {
            return {
                main: "Sem condição dominante",
                confidence: 0,
                dominanceDiff: parseFloat(
                    (isFinite(dominanceDiff) ? dominanceDiff : 0).toFixed(2),
                ),
                eventStrengths,
            };
        }

        // Define main baseado no top
        let main = "Sem condição dominante";
        switch (top.name) {
            case "Chuvoso":
                main = top.value > 10 ? "Chuvoso" : main;
                break;
            case "Nublado":
                main = top.value > 10 ? "Nublado" : main;
                break;
            case "Nevando":
                main = top.value > 10 ? "Nevando" : main;
                break;
            case "Ensolarado":
                if (sunScore >= 85) main = "Ensolarado";
                else if (sunScore >= 50) main = "Parcialmente ensolarado";
                else main = "Ensolarado";
                break;
        }

        return {
            main,
            confidence: parseFloat(top.value.toFixed(2)),
            dominanceDiff:
                dominanceDiff === Infinity
                    ? 9999
                    : parseFloat(dominanceDiff.toFixed(2)),
            eventStrengths,
        };
    }

    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate);
            if (isNaN(futureDateObj.getTime())) {
                throw new Error("Data inválida fornecida");
            }

            // 1. Buscar dados históricos NASA POWER (fonte principal)
            const historicalData = await this.nasaClient.fetchHistoricalData(
                lat,
                lon,
            );

            // 2. Buscar metadados Earthdata (validação secundária, não-crítico)
            const earthdataMetadata =
                await this.earthdataClient.fetchDatasetMetadata(lat, lon);

            // 3. Gerar link para visualização Giovanni
            const currentYear = new Date().getFullYear();
            const giovanniLink = this.earthdataClient.generateGiovanniLink(
                lat,
                lon,
                `${currentYear - 5}-01-01`, // Últimos 5 anos
                `${currentYear}-12-31`,
            );

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
                    );
                },
            );

            const sunlightResult = this.processSunlight(historicalData);
            const snowResult = this.processSnow(historicalData);

            const isSunny = this.isSunny(categoryResults, sunlightResult);
            const mainWeather = this.getMainWeatherCondition([
                ...categoryResults,
                isSunny,
            ]);

            const results = [
                ...categoryResults,
                sunlightResult,
                snowResult,
                isSunny,
            ];

            // Retornar com metadados enriquecidos
            return {
                mainWeather: mainWeather,
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
            console.error("WeatherPredictor error:", error);
            return {
                error: `Erro na previsão: ${error.message}`,
                code: 500,
            };
        }
    }
}

export default WeatherPredictor;
