const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class WeatherApi {
  async predict(lat, lon, date) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict?lat=${lat}&lon=${lon}&date=${date}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/current?lat=${lat}&lon=${lon}`);

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
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'unreachable', error: error.message };
    }
  }

  // Dados mock para desenvolvimento quando API estiver offline
  getMockData() {
    return {
      location: { lat: -26.5356, lon: -48.3915 },
      futureDate: "2025-09-20",
      prediction: {
        dominantCondition: "cloudy",
        probability: 32,
        confidence: 65,
        conditions: {
          sunny: 15,
          rainy: 25,
          cloudy: 32,
          snowy: 3,
          windy: 12
        },
        temporalAnalysis: {
          insight: "Maior probabilidade de chuva no dia seguinte"
        },
        limitations: ["Dados de exemplo para desenvolvimento"]
      }
    };
  }
}

export default new WeatherApi();
