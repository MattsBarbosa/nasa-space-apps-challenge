import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MapPin, Calendar, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import '../App.css';

const WeatherChat = ({ 
    onWeatherDataReceived, 
    className = '',
    onInputFocus,
    onInputBlur,
    isInputFocused 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! 🌤️ Sou seu meteorologista virtual. Conte-me sobre um evento futuro e eu te darei a previsão do tempo com base em dados históricos da NASA!\n\nExemplo: "Vou me casar em Paris em junho de 2025"',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('waiting');
    const [context, setContext] = useState({});
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    const API_BASE_URL = 'https://nasa-weather-predictor.webdevinkel.workers.dev';

    const scrollToBottom = (force = false) => {
        if (!force && isUserScrolling) return;
        
        messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
        });
    };

    // Detectar quando usuário está fazendo scroll manual
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        
        const container = messagesContainerRef.current;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        
        setIsUserScrolling(!isAtBottom);
        
        // Reset do flag após um tempo sem scroll
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            setIsUserScrolling(false);
        }, 2000);
    };

    useEffect(() => {
        // Só fazer scroll automático se não for scroll do usuário
        if (!isUserScrolling) {
            scrollToBottom();
        }
    }, [messages, isUserScrolling]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }
    }, []);

    const handleInputFocus = () => {
        setIsExpanded(true);
        if (onInputFocus) {
            onInputFocus();
        }
        // Scroll para baixo quando expandir
        setTimeout(() => scrollToBottom(true), 300);
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            if (!document.activeElement?.closest('.weather-chat__panel')) {
                setIsExpanded(false);
                if (onInputBlur) {
                    onInputBlur();
                }
            }
        }, 150);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded) {
            if (onInputFocus) {
                onInputFocus();
            }
            // Scroll para baixo quando expandir manualmente
            setTimeout(() => scrollToBottom(true), 300);
        } else {
            if (onInputBlur) {
                onInputBlur();
            }
        }
    };

    const formatMessage = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^## (.*$)/gim, '<h3 class="chat-message-heading">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 class="chat-message-heading">$1</h2>')
            .replace(/^- (.*$)/gim, '<li class="chat-message-list-item">$1</li>')
            .replace(/\n/g, '<br>');
    };

    const extractWeatherData = (content) => {
    console.log('Extraindo dados do contexto:', context);
    console.log('Conteúdo da resposta:', content);
    
    // Tentar extrair coordenadas do contexto primeiro
    let coordinates = null;
    if (context.latitude && context.longitude) {
        coordinates = {
            lat: parseFloat(context.latitude),
            lon: parseFloat(context.longitude)
        };
    }
    
    // Se não tiver coordenadas no contexto, tentar extrair da resposta ou usar coordenadas conhecidas
    if (!coordinates) {
        const latMatch = content.match(/latitude[:\s]*(-?\d+\.?\d*)/i);
        const lonMatch = content.match(/longitude[:\s]*(-?\d+\.?\d*)/i);
        
        if (latMatch && lonMatch) {
            coordinates = {
                lat: parseFloat(latMatch[1]),
                lon: parseFloat(lonMatch[1])
            };
        } else {
            // Mapeamento de cidades conhecidas para coordenadas
            const cityCoordinates = {
                'tóquio': { lat: 35.6762, lon: 139.6503 },
                'tokyo': { lat: 35.6762, lon: 139.6503 },
                'paris': { lat: 48.8566, lon: 2.3522 },
                'new york': { lat: 40.7128, lon: -74.0060 },
                'nova york': { lat: 40.7128, lon: -74.0060 },
                'london': { lat: 51.5074, lon: -0.1278 },
                'londres': { lat: 51.5074, lon: -0.1278 },
                'são paulo': { lat: -23.5505, lon: -46.6333 },
                'sao paulo': { lat: -23.5505, lon: -46.6333 },
                'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
                'madrid': { lat: 40.4168, lon: -3.7038 },
                'barcelona': { lat: 41.3851, lon: 2.1734 },
                'rome': { lat: 41.9028, lon: 12.4964 },
                'roma': { lat: 41.9028, lon: 12.4964 },
                'berlin': { lat: 52.5200, lon: 13.4050 },
                'berlim': { lat: 52.5200, lon: 13.4050 },
                'moscow': { lat: 55.7558, lon: 37.6176 },
                'moscou': { lat: 55.7558, lon: 37.6176 },
                'beijing': { lat: 39.9042, lon: 116.4074 },
                'pequim': { lat: 39.9042, lon: 116.4074 },
                'sydney': { lat: -33.8688, lon: 151.2093 },
                'los angeles': { lat: 34.0522, lon: -118.2437 },
                'chicago': { lat: 41.8781, lon: -87.6298 },
                'miami': { lat: 25.7617, lon: -80.1918 },
                'dubai': { lat: 25.2048, lon: 55.2708 },
                'singapore': { lat: 1.3521, lon: 103.8198 },
                'singapura': { lat: 1.3521, lon: 103.8198 },
                'mumbai': { lat: 19.0760, lon: 72.8777 },
                'delhi': { lat: 28.7041, lon: 77.1025 },
                'bangkok': { lat: 13.7563, lon: 100.5018 },
                'cairo': { lat: 30.0444, lon: 31.2357 },
                'cidade do cabo': { lat: -33.9249, lon: 18.4241 },
                'cape town': { lat: -33.9249, lon: 18.4241 },
                'buenos aires': { lat: -34.6118, lon: -58.3960 },
                'lima': { lat: -12.0464, lon: -77.0428 },
                'bogotá': { lat: 4.7110, lon: -74.0721 },
                'bogota': { lat: 4.7110, lon: -74.0721 },
                'mexico city': { lat: 19.4326, lon: -99.1332 },
                'cidade do méxico': { lat: 19.4326, lon: -99.1332 },
                'toronto': { lat: 43.6532, lon: -79.3832 },
                'vancouver': { lat: 49.2827, lon: -123.1207 },
                'montreal': { lat: 45.5017, lon: -73.5673 },
                'brasília': { lat: -15.8267, lon: -47.9218 },
                'brasilia': { lat: -15.8267, lon: -47.9218 },
                'salvador': { lat: -12.9714, lon: -38.5014 },
                'fortaleza': { lat: -3.7319, lon: -38.5267 },
                'recife': { lat: -8.0476, lon: -34.8770 },
                'porto alegre': { lat: -30.0346, lon: -51.2177 },
                'curitiba': { lat: -25.4284, lon: -49.2733 },
                'belo horizonte': { lat: -19.9191, lon: -43.9378 },
                'manaus': { lat: -3.1190, lon: -60.0217 },
                'belém': { lat: -1.4558, lon: -48.5044 },
                'belem': { lat: -1.4558, lon: -48.5044 },
                'goiânia': { lat: -16.6869, lon: -49.2648 },
                'goiania': { lat: -16.6869, lon: -49.2648 }
            };
            
            // Procurar por nome da cidade na resposta
            const responseText = content.toLowerCase();
            let foundCity = null;
            
            // Primeiro tentar extrair do contexto se houver location
            if (context.location) {
                const contextLocation = context.location.toLowerCase();
                for (const [city, coords] of Object.entries(cityCoordinates)) {
                    if (contextLocation.includes(city)) {
                        foundCity = coords;
                        break;
                    }
                }
            }
            
            // Se não encontrou no contexto, procurar na resposta
            if (!foundCity) {
                for (const [city, coords] of Object.entries(cityCoordinates)) {
                    if (responseText.includes(city)) {
                        foundCity = coords;
                        break;
                    }
                }
            }
            
            if (foundCity) {
                coordinates = foundCity;
            }
        }
    }
    
    // Extrair data
    let extractedDate = null;
    if (context.date) {
        extractedDate = context.date;
    } else {
        // Tentar extrair data da resposta - múltiplos formatos
        const datePatterns = [
            /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i, // "20 de abril de 2030"
            /(\d{4})-(\d{2})-(\d{2})/i, // "2030-04-20"
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/i, // "20/04/2030"
        ];
        
        for (const pattern of datePatterns) {
            const match = content.match(pattern);
            if (match) {
                if (pattern === datePatterns[0]) { // formato "20 de abril de 2030"
                    extractedDate = `${match[3]}-${getMonthNumber(match[2])}-${match[1].padStart(2, '0')}`;
                } else if (pattern === datePatterns[1]) { // formato "2030-04-20"
                    extractedDate = match[0];
                } else if (pattern === datePatterns[2]) { // formato "20/04/2030"
                    extractedDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
                }
                break;
            }
        }
    }
    
    // Extrair localização
    let location = context.location || 'Local não identificado';
    
    // Tentar extrair localização da resposta se não tiver no contexto
    if (!context.location || context.location === 'Local não identificado') {
        const locationPatterns = [
            /em\s+([^,]+),\s+a\s+probabilidade/i, // "em Tóquio, a probabilidade"
            /em\s+([^,]+)\s+em\s+\d/i, // "em Tóquio em 20"
            /,\s+em\s+([^,]+),/i, // ", em Tóquio,"
        ];
        
        for (const pattern of locationPatterns) {
            const match = content.match(pattern);
            if (match) {
                location = match[1].trim();
                break;
            }
        }
    }
    
    // Extrair temperatura
    const tempMatch = content.match(/(\d+)°C/);
    
    console.log('Dados extraídos:', {
        location,
        date: extractedDate,
        coordinates,
        temperature: tempMatch ? parseInt(tempMatch[1]) : null
    });
    
    // Retornar dados se tiver pelo menos coordenadas OU localização válida
    if (coordinates || (location && location !== 'Local não identificado')) {
        return {
            location,
            date: extractedDate,
            temperature: tempMatch ? parseInt(tempMatch[1]) : null,
            coordinates,
            probabilities: extractProbabilities(content),
            source: 'chat'
        };
    }
    
    return null;
};

const getMonthNumber = (monthName) => {
    const months = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12',
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    return months[monthName.toLowerCase()] || '01';
};

    const extractProbabilities = (content) => {
        const probabilities = {};
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

        return probabilities;
    };

    const sendMessage = async (message) => {
        if (!message.trim()) return;

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const payload = {
                message: message.trim(),
                ...(sessionId && { sessionId })
            };

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            console.log('Resultado da API:', result);

            if (response.ok) {
                setSessionId(result.sessionId);
                setSessionStatus(result.status);
                setContext(result.context || {});

                const assistantMessage = {
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, assistantMessage]);

                // Se a conversa foi finalizada, tentar extrair dados para o mapa
                if (result.status === 'completed') {
                    const weatherData = extractWeatherData(result.response);
                    console.log('Dados do tempo extraídos:', weatherData);
                    
                    if (weatherData && onWeatherDataReceived) {
                        onWeatherDataReceived(weatherData);
                    }

                    // Aguardar mais tempo antes de mostrar mensagem de finalização
                    setTimeout(() => {
                        setMessages(prev => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: '✅ Conversa finalizada! A previsão foi enviada para o mapa.\n\n💡 Você pode iniciar uma nova consulta digitando uma mensagem ou clicando no botão "Nova Conversa".',
                                timestamp: new Date()
                            }
                        ]);
                        // Forçar scroll para mostrar mensagem de finalização
                        setTimeout(() => scrollToBottom(true), 100);
                    }, 2000);
                }
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Erro: ${result.error || 'Erro desconhecido'}`,
                        timestamp: new Date()
                    }
                ]);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '❌ Erro de conexão. Verifique se o servidor está rodando.',
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetSession = () => {
        setSessionId(null);
        setSessionStatus('waiting');
        setContext({});
        setMessages([
            {
                role: 'assistant',
                content: '🌤️ Nova consulta iniciada! Conte-me sobre um evento futuro e eu te darei a previsão do tempo.\n\nExemplo: "Vou viajar para o Japão em março de 2026"',
                timestamp: new Date()
            }
        ]);
        // Reset do scroll quando iniciar nova conversa
        setIsUserScrolling(false);
        setTimeout(() => scrollToBottom(true), 100);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            // Se o usuário digitar durante uma sessão completada, resetar imediatamente
            if (sessionStatus === 'completed') {
                resetSession();
                // Pequeno delay para garantir que a sessão foi resetada
                setTimeout(() => {
                    sendMessage(inputValue);
                }, 100);
            } else {
                sendMessage(inputValue);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const startNewConversation = () => {
        resetSession();
    };

    return (
        <div className={`weather-chat ${className}`} data-status={sessionStatus}>
            {/* Input sempre visível */}
            <div className="weather-chat__input-container">
                <form className="weather-chat__form" onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={sessionStatus === 'completed' 
                            ? "Digite para iniciar nova consulta..." 
                            : "Pergunte sobre o tempo em uma data futura..."
                        }
                        className="weather-chat__input"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="weather-chat__send"
                        disabled={isLoading || !inputValue.trim()}
                        title="Enviar mensagem"
                    >
                        <Send size={18} />
                    </button>
                    <button 
                        type="button"
                        className="weather-chat__expand-toggle"
                        onClick={toggleExpanded}
                        title={isExpanded ? "Minimizar chat" : "Expandir chat"}
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {!isExpanded && sessionStatus === 'active' && (
                            <div className="weather-chat__notification"></div>
                        )}
                    </button>
                </form>
            </div>

            {/* Painel expandido */}
            {isExpanded && (
                <div className="weather-chat__panel">
                    <div className="weather-chat__header">
                        <div className="weather-chat__header-info">
                            <div className="weather-chat__session-info">
                                <span className="weather-chat__session-id">
                                    {sessionId ? `${sessionId.substring(0, 12)}...` : 'Nova conversa'}
                                </span>
                                <span className={`weather-chat__status weather-chat__status--${sessionStatus}`}>
                                    {sessionStatus === 'active' ? 'Ativa' : 
                                     sessionStatus === 'completed' ? '✅ Finalizada' : 'Aguardando..'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Container de mensagens com ref para scroll */}
                    <div 
                        ref={messagesContainerRef}
                        className="weather-chat__messages"
                    >
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`weather-chat__message weather-chat__message--${message.role}`}
                            >
                                <div className="weather-chat__message-avatar">
                                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className="weather-chat__message-content">
                                    <div 
                                        className="weather-chat__message-text"
                                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                                    />
                                    <div className="weather-chat__message-time">
                                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="weather-chat__message weather-chat__message--assistant">
                                <div className="weather-chat__message-avatar">
                                    <Bot size={16} />
                                </div>
                                <div className="weather-chat__message-content">
                                    <div className="weather-chat__typing">
                                        <div className="weather-chat__typing-dot"></div>
                                        <div className="weather-chat__typing-dot"></div>
                                        <div className="weather-chat__typing-dot"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Botão para voltar ao final se usuário fez scroll */}
                    {isUserScrolling && (
                        <button 
                            className="weather-chat__scroll-to-bottom"
                            onClick={() => {
                                setIsUserScrolling(false);
                                scrollToBottom(true);
                            }}
                            title="Ir para o final"
                        >
                            ↓ Nova mensagem
                        </button>
                    )}

                    {/* Context Info */}
                    {Object.keys(context).length > 0 && (
                        <div className="weather-chat__context">
                            <h4 className="weather-chat__context-title">Informações Coletadas:</h4>
                            <div className="weather-chat__context-items">
                                {context.location && (
                                    <div className="weather-chat__context-item">
                                        <MapPin size={14} />
                                        <span>{context.location}</span>
                                    </div>
                                )}
                                {context.date && (
                                    <div className="weather-chat__context-item">
                                        <Calendar size={14} />
                                        <span>{context.date}</span>
                                    </div>
                                )}
                                {context.latitude && context.longitude && (
                                    <div className="weather-chat__context-item">
                                        <span>📍</span>
                                        <span>{parseFloat(context.latitude).toFixed(4)}, {parseFloat(context.longitude).toFixed(4)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* New Conversation Button - só aparece quando sessão está completada */}
                    {sessionStatus === 'completed' && (
                        <div className="weather-chat__new-conversation">
                            <p className="weather-chat__completion-message">
                                🎉 Previsão enviada para o mapa! Pronto para nova consulta?
                            </p>
                            <button 
                                type="button"
                                onClick={startNewConversation}
                                className="weather-chat__new-conversation-btn"
                                title="Iniciar nova conversa"
                            >
                                <RotateCcw size={16} />
                                <span>Nova Conversa</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WeatherChat;