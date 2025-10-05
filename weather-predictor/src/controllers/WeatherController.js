import WeatherPredictor from "../services/WeatherPredictor.js";
import WeatherAgentService from "../services/WeatherAgentService.js";
import sessionManager from "../managers/SessionManager.js";
import { validateCoordinates, validateDate } from "../utils/validators.js";
import { homepageHTML } from "../templates/homepage.js";

class WeatherController {
    constructor() {
        this.predict = this.predict.bind(this);
        this.health = this.health.bind(this);
        this.home = this.home.bind(this);
        this.debug = this.debug.bind(this);
        this.chat = this.chat.bind(this);
        this.getSessionStats = this.getSessionStats.bind(this);
        this.endSession = this.endSession.bind(this);
    }

    async predict(c) {
        try {
            const lat = parseFloat(c.req.query("lat"));
            const lon = parseFloat(c.req.query("lon"));
            const futureDate = c.req.query("date");

            if (!lat || !lon || !futureDate) {
                return c.json(
                    {
                        error: "Parâmetros obrigatórios: lat, lon, date",
                        example:
                            "/predict?lat=-26.9166&lon=-49.0713&date=2025-09-17",
                    },
                    400,
                );
            }

            const coordValidation = validateCoordinates(lat, lon);
            if (!coordValidation.valid) {
                return c.json({ error: coordValidation.error }, 400);
            }

            const dateValidation = validateDate(futureDate);
            if (!dateValidation.valid) {
                return c.json({ error: dateValidation.error }, 400);
            }

            const predictor = new WeatherPredictor(c.env);
            const result = await predictor.predict(lat, lon, futureDate);

            if (result.error) {
                return c.json(result, result.code || 500);
            }

            return c.json(result);
        } catch (error) {
            console.error("Controller error:", error);
            return c.json(
                {
                    error: "Erro interno do servidor",
                    details: error.message,
                    timestamp: new Date().toISOString(),
                },
                500,
            );
        }
    }

    async debug(c) {
        try {
            const lat = parseFloat(c.req.query("lat")) || -23.5505;
            const lon = parseFloat(c.req.query("lon")) || -46.6333;

            const predictor = new WeatherPredictor(c.env);
            const nasaTest = await predictor.nasaClient.testConnection();
            const earthdataTest =
                await predictor.earthdataClient.testConnection();

            const debugInfo = {
                timestamp: new Date().toISOString(),
                coordinates: { lat, lon },
                apis: {
                    nasa_power: nasaTest,
                    earthdata_cmr: earthdataTest,
                },
                environment: {
                    worker_version: "2.2-multi-source",
                    focus: "NASA POWER + Earthdata validation",
                },
            };

            return c.json(debugInfo);
        } catch (error) {
            return c.json(
                {
                    error: "Debug failed",
                    details: error.message,
                    timestamp: new Date().toISOString(),
                },
                500,
            );
        }
    }

    async health(c) {
        try {
            const predictor = new WeatherPredictor(c.env);
            const nasaTest = await predictor.nasaClient.testConnection();
            const earthdataTest =
                await predictor.earthdataClient.testConnection();

            const isHealthy = nasaTest.healthy && earthdataTest.healthy;

            return c.json({
                status: isHealthy ? "healthy" : "degraded",
                version: "2.2-multi-source",
                timestamp: new Date().toISOString(),
                components: {
                    nasa_power: {
                        status: nasaTest.healthy ? "connected" : "failed",
                        message: nasaTest.message,
                        role: "primary_data_source",
                    },
                    earthdata_cmr: {
                        status: earthdataTest.healthy ? "connected" : "failed",
                        message: earthdataTest.message,
                        role: "metadata_validation",
                    },
                    giovanni: {
                        status: "connected",
                        message: "Visualization links generated",
                        role: "data_visualization",
                    },
                },
                data_sources: {
                    primary: "NASA POWER API (MERRA-2)",
                    validation: "NASA Earthdata Search",
                    visualization: "NASA Giovanni",
                },
            });
        } catch (error) {
            return c.json(
                {
                    status: "unhealthy",
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
                500,
            );
        }
    }

    async chat(c) {
        try {
            let body;
            try {
                body = await c.req.json();
            } catch (jsonError) {
                return c.json(
                    {
                        error: "JSON inválido",
                        message:
                            "O corpo da requisição deve ser um JSON válido",
                        example: {
                            message: "Vou para Londres em 6 de fevereiro de 2027",
                            sessionId: "opcional - será criado automaticamente se não fornecido"
                        },
                    },
                    400,
                );
            }

            const { message, sessionId } = body;

            if (
                !message ||
                typeof message !== "string" ||
                message.trim() === ""
            ) {
                return c.json(
                    {
                        error: "Mensagem é obrigatória",
                        example: {
                            message: "Vou para Londres em 6 de fevereiro de 2027",
                            sessionId: "opcional"
                        },
                    },
                    400,
                );
            }

            // Validar sessionId se fornecido
            if (sessionId && typeof sessionId !== "string") {
                return c.json(
                    {
                        error: "sessionId deve ser uma string",
                        example: {
                            message: "Vou para Londres em 6 de fevereiro de 2027",
                            sessionId: "session_1234567890_abc123def"
                        },
                    },
                    400,
                );
            }

            const agentService = new WeatherAgentService(c.env);
            const result = await agentService.chat(message.trim(), sessionId);

            // Se a conversa foi completada, encerrar a sessão
            if (result.isComplete) {
                sessionManager.completeSession(result.sessionId);
                
                return c.json(
                    {
                        response: result.response,
                        sessionId: result.sessionId,
                        status: "completed",
                        message: "Conversa finalizada. Todos os dados foram coletados e a previsão foi fornecida.",
                        timestamp: new Date().toISOString(),
                    },
                    200,
                );
            }

            // Conversa ainda em andamento
            return c.json(
                {
                    response: result.response,
                    sessionId: result.sessionId,
                    status: "active",
                    context: result.context,
                    timestamp: new Date().toISOString(),
                },
                200,
            );
        } catch (error) {
            console.error("Erro no chat:", error);
            return c.json(
                {
                    error: "Erro interno do servidor",
                    message: error.message,
                },
                500,
            );
        }
    }

    async getSessionStats(c) {
        try {
            const stats = sessionManager.getStats();
            return c.json({
                ...stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Erro ao obter estatísticas:", error);
            return c.json(
                {
                    error: "Erro interno do servidor",
                    message: error.message,
                },
                500,
            );
        }
    }

    async endSession(c) {
        try {
            const sessionId = c.req.param('sessionId');
            
            if (!sessionId) {
                return c.json(
                    {
                        error: "sessionId é obrigatório",
                        example: "/chat/sessions/session_1234567890_abc123def/end"
                    },
                    400,
                );
            }

            const success = sessionManager.endSession(sessionId);
            
            if (success) {
                return c.json({
                    message: "Sessão encerrada com sucesso",
                    sessionId,
                    timestamp: new Date().toISOString()
                });
            } else {
                return c.json({
                    error: "Sessão não encontrada",
                    sessionId,
                    timestamp: new Date().toISOString()
                }, 404);
            }
        } catch (error) {
            console.error("Erro ao encerrar sessão:", error);
            return c.json(
                {
                    error: "Erro interno do servidor",
                    message: error.message,
                },
                500,
            );
        }
    }

    home(c) {
        return c.html(homepageHTML);
    }
}

export default WeatherController;
