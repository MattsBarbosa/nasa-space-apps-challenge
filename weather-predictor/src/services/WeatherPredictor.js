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

    async predict(lat, lon, futureDate) {
        try {
            const futureDateObj = new Date(futureDate)
            if (isNaN(futureDateObj.getTime())) {
                throw new Error('Data inválida fornecida')
            }

            const historicalData = await this.nasaClient.fetchHistoricalData(lat, lon)

            // Vento
            let ventoData = Object.values(historicalData.data["WS10M"]);

            let categoryVento = {
                fraco: [null, 5.4],
                moderado: [5.5, 10.7],
                forte: [10.8, 17.1],
                intenso: [17.2, null]
            };

            let ventoResult = this.calculateCategory(ventoData, categoryVento);

            console.log("---------------VENTO--------------------------------");
            console.log(ventoResult);
            console.log("---------------VENTO--------------------------------");

            // Chuva

            let chuvaData = Object.values(historicalData.data["PRECTOTCORR"]);
            let categoryChuva = {
                fraco: [0.2, 10],
                moderado: [10.1, 30],
                forte: [30.1, 60],
                intenso: [60.1, null]
            };

            let chuvaResult = this.calculateCategory(chuvaData, categoryChuva);

            console.log("---------------CHUVA--------------------------------");
            console.log(chuvaResult);
            console.log("---------------CHUVA--------------------------------");

            return {
                vento: ventoResult,
                chuva: chuvaResult
            }

            // return result

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
