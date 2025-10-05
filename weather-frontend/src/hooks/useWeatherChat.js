import { useState, useCallback, useRef, useEffect } from 'react';

export const useWeatherChat = (apiBaseUrl = 'http://localhost:8787') => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! 🌤️ Sou seu meteorologista virtual. Conte-me sobre um evento futuro e eu te darei a previsão do tempo com base em dados históricos da NASA!\n\nExemplo: "Vou me casar em Paris em junho de 2025"',
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('waiting');
    const [context, setContext] = useState({});
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    // Cleanup em caso de unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const sendMessage = useCallback(async (message) => {
        if (!message || message.trim() === '') return null;

        // Cancelar request anterior se ainda estiver pendente
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Criar novo AbortController
        abortControllerRef.current = new AbortController();

        const userMessage = { 
            role: 'user', 
            content: message.trim(), 
            timestamp: new Date() 
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                message: message.trim(),
                ...(sessionId && { sessionId })
            };

            const response = await fetch(`${apiBaseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: abortControllerRef.current.signal
            });

            const result = await response.json();

            if (response.ok) {
                // Atualizar estado da sessão
                setSessionId(result.sessionId);
                setSessionStatus(result.status);
                setContext(result.context || {});

                // Adicionar resposta do assistente
                const assistantMessage = {
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);

                // Retornar dados para callback externo
                const responseData = {
                    ...result,
                    isComplete: result.status === 'completed'
                };

                // Se conversa finalizada, programar reset
                if (result.status === 'completed') {
                    setTimeout(() => {
                        setMessages(prev => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: '✅ Conversa finalizada! Você pode iniciar uma nova consulta quando quiser.',
                                timestamp: new Date()
                            }
                        ]);
                    }, 1500);

                    setTimeout(() => {
                        resetSession();
                    }, 4000);
                }

                return responseData;
            } else {
                const errorMsg = result.error || 'Erro desconhecido';
                setError(errorMsg);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Erro: ${errorMsg}`,
                        timestamp: new Date()
                    }
                ]);
                return { error: errorMsg };
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request cancelado');
                return { cancelled: true };
            }

            console.error('Erro na requisição:', err);
            const errorMsg = 'Erro de conexão. Verifique se o servidor está rodando.';
            setError(errorMsg);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ ${errorMsg}`,
                    timestamp: new Date()
                }
            ]);
            return { error: errorMsg };
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [sessionId, apiBaseUrl]);

    const resetSession = useCallback(() => {
        setSessionId(null);
        setSessionStatus('waiting');
        setContext({});
        setError(null);
        setMessages([
            {
                role: 'assistant',
                content: 'Pronto para uma nova consulta! Como posso ajudar com a previsão do tempo? 😊',
                timestamp: new Date()
            }
        ]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const addMessage = useCallback((role, content) => {
        const newMessage = {
            role,
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    // Utilitários para extrair dados da resposta
    const extractWeatherData = useCallback((content, currentContext) => {
        try {
            // Tentar extrair temperatura
            const tempMatch = content.match(/(\d+)°C/);
            
            // Tentar extrair data
            const dateMatch = content.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
            
            // Usar contexto para local
            const location = currentContext.location;
            
            if (tempMatch && dateMatch && location) {
                const monthMap = {
                    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
                    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
                    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
                };
                
                const month = monthMap[dateMatch[2].toLowerCase()] || '01';
                const formattedDate = `${dateMatch[3]}-${month}-${dateMatch[1].padStart(2, '0')}`;
                
                return {
                    location,
                    date: formattedDate,
                    temperature: parseInt(tempMatch[1]),
                    coordinates: {
                        lat: currentContext.latitude,
                        lon: currentContext.longitude
                    },
                    probabilities: extractProbabilities(content),
                    source: 'chat',
                    rawResponse: content
                };
            }
        } catch (error) {
            console.warn('Erro ao extrair dados do tempo:', error);
        }
        return null;
    }, []);

    const extractProbabilities = useCallback((content) => {
        const probabilities = {};
        
        try {
            const patterns = {
                sun: /☀️.*?(\d+)%/,
                clouds: /☁️.*?(\d+)%/,
                rain: /🌧️.*?(\d+)%/
            };

            Object.entries(patterns).forEach(([key, pattern]) => {
                const match = content.match(pattern);
                if (match) {
                    probabilities[key] = parseInt(match[1]);
                }
            });
        } catch (error) {
            console.warn('Erro ao extrair probabilidades:', error);
        }

        return probabilities;
    }, []);

    // Estatísticas da conversa
    const getConversationStats = useCallback(() => {
        const userMessages = messages.filter(m => m.role === 'user').length;
        const assistantMessages = messages.filter(m => m.role === 'assistant').length;
        const hasContext = Object.keys(context).length > 0;
        const conversationDuration = messages.length > 1 ? 
            messages[messages.length - 1].timestamp - messages[0].timestamp : 0;

        return {
            userMessages,
            assistantMessages,
            totalMessages: messages.length,
            hasContext,
            conversationDuration,
            isActive: sessionStatus === 'active',
            isComplete: sessionStatus === 'completed'
        };
    }, [messages, context, sessionStatus]);

    return {
        // Estado
        messages,
        isLoading,
        sessionId,
        sessionStatus,
        context,
        error,
        
        // Ações
        sendMessage,
        resetSession,
        clearMessages,
        addMessage,
        
        // Utilitários
        extractWeatherData,
        extractProbabilities,
        getConversationStats,
        
        // Estados derivados
        hasActiveSession: sessionStatus === 'active',
        isSessionComplete: sessionStatus === 'completed',
        hasContext: Object.keys(context).length > 0
    };
};

export default useWeatherChat;