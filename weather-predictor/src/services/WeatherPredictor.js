import NASAApiClient from './NASAApiClient.js'
import { getDayOfYear } from '../utils/helpers.js'

class WeatherPredictor {
    constructor(env) {
        this.nasaClient = new NASAApiClient()
    }

    calculateCategory(dataArray, categories) {
        let total = dataArray.length;
        let results = {};

        // Inicializa arrays por categoria
        for (let cat in categories) {
            results[cat] = [];
        }

        // Distribui os valores nas categorias
        dataArray.forEach((value) => {
            for (let cat in categories) {
                let [min, max] = categories[cat];
                if ((min === null || value >= min) && (max === null || value <= max)) {
                    results[cat].push(value);
                    break;
                }
            }
        });

        // Converte em percentual
        for (let cat in results) {
            console.log((results[cat].length / total) * 100)
            results[cat] = (results[cat].length / total) * 100;
        }

        return results;
    }

    processEvento(historicalData, key, categories, name) {
        let data = Object.values(historicalData.data[key]);
        let result = this.calculateCategory(data, categories);
        return { evento: name, data: result}
    }

    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate)
            if (isNaN(futureDateObj.getTime())) {
                throw new Error('Data inválida fornecida')
            }

            const historicalData = await this.nasaClient.fetchHistoricalData(lat, lon)

            const categories = {
                Vento: {
                    key: "WS10M",
                    ranges: {
                        fraco: [null, 5.4],
                        moderado: [5.5, 10.7],
                        forte: [10.8, 17.1],
                        intenso: [17.2, null]
                    }
                },
                Chuva: {
                    key: "PRECTOTCORR",
                    ranges: {
                        fraco: [0.2, 10],
                        moderado: [10.1, 30],
                        forte: [30.1, 60],
                        intenso: [60.1, null]
                    }
                }
            }

            const results = Object.entries(categories).map(([name, config]) => {
                return this.processEvento(historicalData, config.key, config.ranges, name);
            });

            return results

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
