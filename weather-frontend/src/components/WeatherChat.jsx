import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, X, MapPin, Calendar, RotateCcw } from 'lucide-react';
import '../App.css';

const WeatherChat = ({ onWeatherDataReceived, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
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

    const API_BASE_URL = 'https://nasa-weather-predictor.webdevinkel.workers.dev';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
    const chatContainer = messagesEndRef.current?.parentNode;
    if (!chatContainer) return;

    const currentScroll = chatContainer.scrollTop; 
    const currentHeight = chatContainer.scrollHeight;

    requestAnimationFrame(() => {
        const newHeight = chatContainer.scrollHeight;
        chatContainer.scrollTop = currentScroll + (newHeight - currentHeight);
    });
}, [messages]);

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
        const tempMatch = content.match(/(\d+)°C/);
        const dateMatch = content.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
        const locationMatch = context.location;

        if (tempMatch && dateMatch && locationMatch) {
            return {
                location: locationMatch,
                date: `${dateMatch[3]}-${getMonthNumber(dateMatch[2])}-${dateMatch[1].padStart(2, '0')}`,
                temperature: parseInt(tempMatch[1]),
                coordinates: {
                    lat: context.latitude,
                    lon: context.longitude
                },
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
            'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
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
                    }, 2000);

                    // Não fazer reset automático, deixar o usuário decidir
                
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

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button 
                className={`weather-chat__toggle ${isOpen ? 'weather-chat__toggle--active' : ''}`}
                onClick={toggleChat}
                title={isOpen ? 'Fechar Chat' : 'Abrir Chat com IA'}
            >
                {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
                {!isOpen && sessionStatus === 'active' && (
                    <div className="weather-chat__notification"></div>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className={`weather-chat__panel ${className}`} data-status={sessionStatus}>
                    <div className="weather-chat__header">
                        <div className="weather-chat__header-info">
                            <div className='weather-chat__header-container'>
                                <h3 className="weather-chat__header-title">Meteorologista IA</h3>
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
                        <button 
                            className="weather-chat__close"
                            onClick={toggleChat}
                            title="minimizar Chat"
                        >
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-square-rounded-minus-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12.5 21c-.18 .002 -.314 0 -.5 0c-7.2 0 -9 -1.8 -9 -9s1.8 -9 9 -9s9 1.8 9 9c0 1.136 -.046 2.138 -.152 3.02" /><path d="M16 19h6" /></svg>
                        </button>
                    </div>

                    <div className="weather-chat__messages">
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

                    <form className="weather-chat__form" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={sessionStatus === 'completed' 
                                ? "Digite para iniciar nova consulta..." 
                                : "Digite sua mensagem..."
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
                    </form>
                </div>
            )}
        </>
    );
};

export default WeatherChat;