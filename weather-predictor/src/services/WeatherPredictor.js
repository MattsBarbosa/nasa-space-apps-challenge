import NASAApiClient from './NASAApiClient.js'

class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient()
    }

    calculateCategory(dataObj, categories) {
        let results = {};

        // Inicializa arrays por categoria
        for (let cat in categories) {
            results[cat] = [];
        }

        // Distribui os valores nas categorias
        for (let [date, value] of Object.entries(dataObj)) {
            // Ignora valores inválidos (ex: -999)
            if (value === -999 || value === null) continue;

            for (let cat in categories) {
                let [min, max] = categories[cat];
                if ((min === null || value >= min) && (max === null || value <= max)) {
                    results[cat].push({ date, value });
                    break;
                }
            }
        }

        // Converte em percentual se quiser
        const totalValid = Object.values(dataObj).filter(v => v !== -999 && v !== null).length;
        for (let cat in results) {
            results[cat] = {
                percentage: (results[cat].length / totalValid) * 100,
                entries: results[cat] // aqui estão os objetos {date, value}
            }
        }

        return results;
    }

    processEvent(historicalData, key, categories, name) {
        let data = historicalData.data[key];
        let result = this.calculateCategory(data, categories);
        return { evento: name, data: result }
    }

    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate)
            if (isNaN(futureDateObj.getTime())) {
                throw new Error('Data inválida fornecida')
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
                Radiation: {
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

            const results = Object.entries(categories).map(([name, config]) => {
                return this.processEvent(historicalData, config.key, config.ranges, name);
            });


            //SEPARETA VALUES YEAR AND MONTH

            return 1

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

