import { GoogleGenAI, Type } from "@google/genai";
import WeatherPredictor from '../services/WeatherPredictor.js';
import sessionManager from '../managers/SessionManager.js';

class WeatherAgentService {
    constructor(env) {
        this.ai = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY
        });
        this.openCageApiKey = env.OPEN_CAGE;
        this.env = env;
        this.model = "gemini-2.5-flash";

        this.systemInstruction = `Você é um meteorologista especializado em análise de dados climáticos históricos da NASA.

            ## Sua Função
            Analisar mensagens do usuário em uma conversa contínua para coletar informações sobre local e data, e fornecer probabilidades climáticas baseadas em dados históricos.

            ## Fluxo da Conversa
            1. **Análise da mensagem atual**: Examine o que o usuário disse agora
            2. **Verificar contexto**: Use informações já coletadas em mensagens anteriores
            3. **Identificar o que falta**:
               - Local específico (cidade, país)
               - Data completa (dia, mês, ano)
            4. **Estratégia de resposta**:
               - Se AMBOS local e data estão completos: use as ferramentas e forneça a previsão final
               - Se falta APENAS um item: faça UMA pergunta específica para obter o que falta
               - Se faltam AMBOS: priorize obter o local primeiro
               - Se a informação está parcial (ex: "dezembro" sem ano/dia): peça especificação

            ## Contexto da Sessão
            Você tem acesso ao histórico da conversa. Use-o para:
            - Não repetir perguntas já respondidas
            - Combinar informações de mensagens diferentes
            - Manter continuidade na conversa

            ## Formato da Resposta Final
            Quando tiver TODOS os dados necessários:
            - Use emojis para facilitar visualização
            - Mostre percentuais de probabilidade
            - Inclua temperatura esperada
            - Seja direto e objetivo
            - Formate em markdown
            - Esta será a ÚLTIMA mensagem da conversa

            ## Importante
            - Seja natural e conversacional
            - Uma pergunta por vez para não confundir o usuário
            - Confirme dados ambíguos (ex: "Londres, Reino Unido?")
            - Trabalhe com probabilidades, nunca certezas
            - Após dar a resposta final com probabilidades, a conversa será automaticamente encerrada
            `;

        this.tools = [
            {
                functionDeclarations: [
                    {
                        name: "get_latitude_and_longitude",
                        description: "Obtém a latitude e longitude de uma localização/cidade",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                location: {
                                    type: Type.STRING,
                                    description: "Nome da cidade ou local",
                                },
                            },
                            required: ["location"],
                        },
                    },
                    {
                        name: "get_date",
                        description: "Extrai e formata a data no formato YYYY-MM-DD",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                date: {
                                    type: Type.STRING,
                                    description: "Data no formato YYYY-MM-DD",
                                },
                            },
                            required: ["date"],
                        },
                    },
                    {
                        name: "predict",
                        description: "Busca dados históricos da NASA e calcula probabilidades climáticas",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                lat: { type: Type.STRING, description: "Latitude" },
                                lon: { type: Type.STRING, description: "Longitude" },
                                date: { type: Type.STRING, description: "Data YYYY-MM-DD" },
                            },
                            required: ["lat", "lon", "date"],
                        },
                    },
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
            return { error: error.message };
        }
    }

    getDate({ date }) {
        return { date };
    }

    async predict({ lat, lon, date }) {
        const predictor = new WeatherPredictor(this.env);
        const result = await predictor.predict(lat, lon, date);
        return { result };
    }

    async chat(userMessage, sessionId = null) {
        const toolFunctions = {
            get_latitude_and_longitude: this.getLatitudeAndLongitude.bind(this),
            get_date: this.getDate.bind(this),
            predict: this.predict.bind(this),
        };

        // Gerenciar sessão
        if (!sessionId) {
            sessionId = sessionManager.createSession();
        }

        // Adicionar mensagem do usuário à sessão
        sessionManager.addMessage(sessionId, 'user', userMessage);

        // Construir histórico da conversa
        const conversationHistory = sessionManager.buildConversationHistory(sessionId);

        let contents = [...conversationHistory];
        let iterations = 0;
        const maxIterations = 10;

        while (iterations < maxIterations) {
            iterations++;

            const result = await this.ai.models.generateContent({
                model: this.model,
                contents,
                config: {
                    tools: this.tools,
                    systemInstruction: this.systemInstruction,
                    thinkingConfig: { thinkingBudget: 0 },
                    temperature: 0.1,
                },
            });

            if (result.functionCalls && result.functionCalls.length > 0) {
                for (const functionCall of result.functionCalls) {
                    const { name, args } = functionCall;
                    const toolResponse = await toolFunctions[name](args);

                    // Atualizar contexto da sessão baseado nas chamadas de função
                    if (name === 'get_latitude_and_longitude' && toolResponse.lat && toolResponse.lng) {
                        sessionManager.updateContext(sessionId, {
                            location: args.location,
                            latitude: toolResponse.lat,
                            longitude: toolResponse.lng
                        });
                    }

                    if (name === 'get_date' && toolResponse.date) {
                        sessionManager.updateContext(sessionId, {
                            date: toolResponse.date
                        });
                    }

                    contents.push({
                        role: "model",
                        parts: [{ functionCall }],
                    });

                    contents.push({
                        role: "user",
                        parts: [{
                            functionResponse: {
                                name,
                                response: toolResponse,
                            },
                        }],
                    });

                    // Se foi uma previsão bem-sucedida, marcar sessão como completa
                    if (name === 'predict' && toolResponse.result && !toolResponse.result.error) {
                        // A sessão será marcada como completa após a resposta final
                    }
                }
            } else {
                const parts = result.candidates?.[0]?.content?.parts || [];
                const response = parts
                    .filter(part => part.text)
                    .map(part => part.text)
                    .join('\n');

                // Adicionar resposta do assistente à sessão
                sessionManager.addMessage(sessionId, 'assistant', response);

                // Verificar se é uma resposta final (contém probabilidades/previsão)
                const isFinalResponse = this.isFinalResponse(response);

                return {
                    response,
                    sessionId,
                    isComplete: isFinalResponse,
                    context: sessionManager.getSession(sessionId)?.context || {}
                };
            }
        }

        throw new Error('Limite de iterações atingido');
    }

    /**
     * Verifica se a resposta é final (contém previsão completa)
     */
    isFinalResponse(response) {
        const finalIndicators = [
            'probabilidade',
            'temperatura',
            '°C',
            '%',
            'baseado em dados históricos',
            'previsão',
            'condições climáticas'
        ];

        const lowerResponse = response.toLowerCase();
        const hasMultipleIndicators = finalIndicators.filter(indicator =>
            lowerResponse.includes(indicator)
        ).length >= 3;

        // Também verifica se não é uma pergunta
        const isNotQuestion = !response.trim().endsWith('?') &&
                             !lowerResponse.includes('qual') &&
                             !lowerResponse.includes('quando') &&
                             !lowerResponse.includes('onde') &&
                             !lowerResponse.includes('poderia');

        return hasMultipleIndicators && isNotQuestion;
    }
}

export default WeatherAgentService;
