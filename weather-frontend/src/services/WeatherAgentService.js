import { GoogleGenAI, Type } from "@google/genai";
import WeatherPredictor from '../services/WeatherPredictor.js';

class WeatherAgentService {
    constructor(env) {
        this.ai = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY
        });
        this.openCageApiKey = env.OPEN_CAGE;
        this.env = env;
        this.model = "gemini-1.5-flash";

        this.chatSessions = new Map();

        this.systemInstruction = `Você é um meteorologista especializado em análise de dados climáticos históricos da NASA.

            ## Sua Função
            Analisar a mensagem do usuário e fornecer probabilidades climáticas para eventos futuros com base em dados históricos.

            ## Como Responder
            1. Se a mensagem contiver local e data clara: use as ferramentas para buscar os dados e responda com as probabilidades
            2. Se faltar informação (local ou data): faça UMA pergunta clara e objetiva para obter o que falta
            3. Após obter todas as informações e gerar a resposta com probabilidades, ENCERRE a conversa

            ## Formato da Resposta Final
            Apresente as probabilidades de forma clara e estruturada:
            - Use emojis para facilitar visualização
            - Mostre percentuais
            - Inclua temperatura esperada
            - Seja direto e objetivo
            - Sempre formate em markdown

            ## Importante
            - Trabalhe com probabilidades baseadas em dados históricos
            - Sua precisão é maior para eventos 6+ meses no futuro
            - Nunca garanta condições específicas
            - Após dar a resposta completa, não prolongue a conversa
            `;

        this.tools = [
            {
                functionDeclarations: [
                    { name: "get_latitude_and_longitude", description: "Obtém a latitude e longitude de uma localização/cidade", parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: "Nome da cidade ou local" } }, required: ["location"] } },
                    { name: "get_date", description: "Extrai e formata a data no formato YYYY-MM-DD", parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" } }, required: ["date"] } },
                    { name: "predict", description: "Busca dados históricos da NASA e calcula probabilidades climáticas", parameters: { type: Type.OBJECT, properties: { lat: { type: Type.STRING, description: "Latitude" }, lon: { type: Type.STRING, description: "Longitude" }, date: { type: Type.STRING, description: "Data YYYY-MM-DD" } }, required: ["lat", "lon", "date"] } },
                ],
            },
        ];
    }

    async getLatitudeAndLongitude({ location }) {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${this.openCageApiKey}`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                return { lat, lng, location };
            }
            return { error: "Localização não encontrada" };
        } catch (error) {
            return { error: `Falha ao buscar coordenadas: ${error.message}` };
        }
    }

    getDate({ date }) {
        return { date };
    }

    async predict({ lat, lon, date }) {
        try {
            const predictor = new WeatherPredictor(this.env);
            const result = await predictor.predict(lat, lon, date);
            return { result };
        } catch (error) {
            return { error: `Falha ao obter dados da NASA: ${error.message}` };
        }
    }

    async chat(userMessage, sessionId) {
        const toolFunctions = {
            get_latitude_and_longitude: this.getLatitudeAndLongitude.bind(this),
            get_date: this.getDate.bind(this),
            predict: this.predict.bind(this),
        };

        let contents = this.chatSessions.get(sessionId) || [];

        contents.push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        try {
            let iterations = 0;
            const maxIterations = 5;

            while (iterations < maxIterations) {
                iterations++;

                const result = await this.ai.models.generateContent({
                    model: this.model,
                    contents,
                    tools: this.tools,
                    systemInstruction: this.systemInstruction,
                });

                const response = result?.response;
                const functionCalls = response?.candidates?.[0]?.content?.parts?.filter(part => part.functionCall).map(part => part.functionCall);

                if (functionCalls && functionCalls.length > 0) {
                    contents.push(response.candidates[0].content);

                    for (const functionCall of functionCalls) {
                        const { name, args } = functionCall;
                        const toolResponse = await toolFunctions[name](args);

                        contents.push({
                            role: "tool",
                            parts: [{
                                functionResponse: {
                                    name,
                                    response: toolResponse,
                                },
                            }],
                        });
                    }
                } else {
                    const textParts = response?.candidates?.[0]?.content?.parts?.filter(part => part.text).map(part => part.text) || [];
                    const finalResponse = textParts.join('\n');
                    
                    // Adiciona a resposta final do modelo ao histórico
                    contents.push({ role: 'model', parts: [{ text: finalResponse }] });

                    this.chatSessions.set(sessionId, contents);
                    return finalResponse;
                }
            }

            throw new Error('Limite de iterações atingido');

        } catch (error) {
            console.error(`ERRO CRÍTICO na sessão ${sessionId}:`, error);
            throw new Error(`Falha na comunicação com o serviço de IA: ${error.message}`);
        }
    }
}

export default WeatherAgentService;