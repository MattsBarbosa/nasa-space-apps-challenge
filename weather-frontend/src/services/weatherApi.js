const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nasa-weather-predictor.webdevinkel.workers.dev';

class WeatherApi {
    async predict(lat, lon, date) {
        try {
            const response = await fetch(`${API_BASE_URL}predict?lat=${lat}&lon=${lon}&date=${date}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('data predict', data)
            return { success: true, data };

        } catch (error) {
            console.error('Weather API error:', error);
            return {
                success: false,
                error: error.message,
                // Dados mock para desenvolvimento
                mockData: this.getMockData()
            };
        }
    }

    async getCurrentWeather(lat, lon) {
        try {
            const response = await fetch(`${API_BASE_URL}current?lat=${lat}&lon=${lon}`);

            if (!response.ok) {
                throw new Error(`Current Weather API Error: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Current weather error:', error);
            return { success: false, error: error.message };
        }
    }

    async getApiHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}health`);
            let responseData = await response.json()
            return await responseData
        } catch (error) {
            return { status: 'unreachable', error: error.message };
        }
    }

    //https://nasa-weather-predictor.webdevinkel.workers.dev/predict?lat=-26.9189&lon=-49.0658&date=2026-01-10

    // Dados mock para desenvolvimento quando API estiver offline
    getMockData() {
        return {
            "predictions": [
                {
                    "event": "Wind",
                    "data": {
                        "none": 0.0267022696929239,
                        "weak": 99.9732977303071,
                        "moderate": 0,
                        "strong": 0,
                        "intense": 0
                    }
                },
                {
                    "event": "Preciptation",
                    "data": {
                        "none": 22.9906542056075,
                        "weak": 56.4218958611482,
                        "moderate": 12.5233644859813,
                        "strong": 1.61103693813974,
                        "intense": 0.142412105028927
                    }
                },
                {
                    "event": "Cloud",
                    "data": {
                        "none": 3.17757009345794,
                        "weak": 7.36092567868269,
                        "moderate": 30.8411214953271,
                        "strong": 58.5046728971963
                    }
                },
                {
                    "event": "SunRadiation",
                    "data": {
                        "none": 0.0712060525144637,
                        "weak": 0,
                        "moderate": 0,
                        "strong": 0,
                        "intense": 99.9287939474855
                    }
                },
                {
                    "event": "Temperature",
                    "data": {
                        "extreme_cold": 0.0267022696929239,
                        "cold": 2.40320427236315,
                        "mild": 58.1041388518024,
                        "warm": 38.4156653315532,
                        "hot": 0,
                        "extreme_hot": 0
                    }
                },
                {
                    "event": "Sunlight",
                    "data": 170.737194808826
                },
                {
                    "event": "Snow",
                    "data": {
                        "none": 100,
                        "weak": 0,
                        "moderate": 0,
                        "strong": 0
                    }
                }
            ],
            "metadata": {
                "location": {
                    "latitude": -26.9189,
                    "longitude": -49.0658
                },
                "target_date": "2026-01-10",
                "data_sources": {
                    "primary": {
                        "name": "NASA POWER API",
                        "description": "MERRA-2 Reanalysis Data",
                        "period": "1995-2025",
                        "url": "https://power.larc.nasa.gov/"
                    },
                    "validation": {
                        "name": "NASA Earthdata Search",
                        "status": "validated",
                        "available_datasets": [
                            {
                                "name": "GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07 (GPM_3IMERGDF) at GES DISC",
                                "shortName": "GPM_3IMERGDF",
                                "description": "Global Precipitation Measurement - Precipitação diária"
                            },
                            {
                                "name": "MERRA-2 tavg1_2d_slv_Nx: 2d,1-Hourly,Time-Averaged,Single-Level,Assimilation,Single-Level Diagnostics 0.625 x 0.5 degree V5.12.4 (M2T1NXSLV) at GES DISC",
                                "shortName": "M2T1NXSLV",
                                "description": "MERRA-2 - Dados meteorológicos de superfície"
                            }
                        ],
                        "url": "https://earthdata.nasa.gov/"
                    },
                    "visualization": {
                        "name": "NASA Giovanni",
                        "description": "Interactive data visualization",
                        "link": "https://giovanni.gsfc.nasa.gov/giovanni/#service=TmAvMp&starttime=2020-01-01&endtime=2020-12-31&bbox=-51.0658%2C-28.9189%2C-47.0658%2C-24.9189&data=TRMM_3B42_Daily_7_precipitation&dataKeyword=TRMM",
                        "url": "https://giovanni.gsfc.nasa.gov/"
                    }
                },
                "generated_at": "2025-10-04T20:56:09.960Z"
            }
        };
    }
}

export default new WeatherApi();