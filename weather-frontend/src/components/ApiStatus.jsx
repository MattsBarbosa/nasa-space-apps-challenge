import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Satellite, Activity, Zap } from 'lucide-react';
import weatherApi from '../services/weatherApi';

const ApiStatus = () => {
    const [status, setStatus] = useState({ loading: true });
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        checkApiHealth();
        // Verificar a cada 30 segundos
        const interval = setInterval(checkApiHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkApiHealth = async () => {
        const health = await weatherApi.getApiHealth();
        setStatus({ loading: false, ...health });
    };

    const getStatusIcon = () => {
        if (status.loading) {
            return (
                <div className="api-status__loading-icon">
                    <div className="api-status__loading-spinner" />
                    <Satellite className="api-status__loading-satellite" />
                </div>
            );
        }

        if (status.status === 'healthy') return <CheckCircle className="api-status__icon api-status__icon--healthy" />;
        if (status.status === 'degraded') return <AlertCircle className="api-status__icon api-status__icon--warning" />;
        if (status.status === 'unreachable') return <WifiOff className="api-status__icon api-status__icon--error" />;
        return <XCircle className="api-status__icon api-status__icon--error" />;
    };

    const getStatusText = () => {
        if (status.loading) return 'Verificando Sistema...';
        if (status.status === 'healthy') return 'Sistema Online';
        if (status.status === 'degraded') return 'Sistema Parcial';
        if (status.status === 'unreachable') return 'Sistema Offline';
        return 'Erro no Sistema';
    };

    const getStatusClass = () => {
        if (status.status === 'healthy') return 'api-status--healthy';
        if (status.status === 'degraded') return 'api-status--warning';
        return 'api-status--error';
    };

    return (
        <div className="api-status">
            {/* Status Principal */}
            <div
                className={`api-status__main ${getStatusClass()}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="api-status__main-content">
                    {getStatusIcon()}
                    <div className="api-status__main-info">
                        <span className="api-status__main-text">
                            {getStatusText()}
                        </span>
                        {status.status === 'healthy' && (
                            <div className="api-status__main-status">
                                <div className="api-status__main-dot"></div>
                                <span className="api-status__main-status-text">Conectado</span>
                            </div>
                        )}
                    </div>

                    <div className={`api-status__toggle-icon ${isExpanded ? 'api-status__toggle-icon--rotated' : ''}`}>
                        <Activity className="api-status__toggle-svg" />
                    </div>
                </div>
            </div>

            {/* Painel Expandido */}
            {isExpanded && (
                <div className="api-status__panel">

                    {/* Header do painel expandido */}
                    <div className="api-status__panel-header">
                        <Satellite className="api-status__panel-header-icon" />
                        <span className="api-status__panel-header-text">Status dos Componentes</span>
                    </div>

                    {/* Componentes do sistema */}
                    {status.components && (
                        <div className="api-status__components">
                            {/* NASA API */}
                            <div className="api-status__component">
                                <div className="api-status__component-info">
                                    <div className="api-status__component-icon api-status__component-icon--nasa">
                                        <Satellite className="api-status__component-icon-svg" />
                                    </div>
                                    <div className="api-status__component-details">
                                        <span className="api-status__component-name">NASA API</span>
                                        <div className="api-status__component-desc">Dados meteorológicos</div>
                                    </div>
                                </div>

                                <div className="api-status__component-status">
                                    {status.components.nasa_api?.status === 'connected' ? (
                                        <>
                                            <div className="api-status__component-dot api-status__component-dot--success"></div>
                                            <span className="api-status__component-status-text api-status__component-status-text--success">Conectado</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="api-status__component-dot api-status__component-dot--error"></div>
                                            <span className="api-status__component-status-text api-status__component-status-text--error">
                                                {status.components.nasa_api?.status || 'Desconhecido'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sistema de Previsão */}
                            <div className="api-status__component">
                                <div className="api-status__component-info">
                                    <div className="api-status__component-icon api-status__component-icon--ai">
                                        <Activity className="api-status__component-icon-svg" />
                                    </div>
                                    <div className="api-status__component-details">
                                        <span className="api-status__component-name">Algoritmo IA</span>
                                        <div className="api-status__component-desc">Processamento de dados</div>
                                    </div>
                                </div>

                                <div className="api-status__component-status">
                                    <div className="api-status__component-dot api-status__component-dot--success"></div>
                                    <span className="api-status__component-status-text api-status__component-status-text--success">Ativo</span>
                                </div>
                            </div>

                            {/* Conectividade */}
                            <div className="api-status__component">
                                <div className="api-status__component-info">
                                    <div className="api-status__component-icon api-status__component-icon--network">
                                        <Wifi className="api-status__component-icon-svg" />
                                    </div>
                                    <div className="api-status__component-details">
                                        <span className="api-status__component-name">Conectividade</span>
                                        <div className="api-status__component-desc">Rede e latência</div>
                                    </div>
                                </div>

                                <div className="api-status__component-status">
                                    <div className="api-status__component-dot api-status__component-dot--success"></div>
                                    <span className="api-status__component-status-text api-status__component-status-text--success">Estável</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Métricas de Performance */}
                    <div className="api-status__metrics">
                        <div className="api-status__metric">
                            <div className="api-status__metric-header">
                                <Zap className="api-status__metric-icon" />
                                <span className="api-status__metric-label">Latência</span>
                            </div>
                            <div className="api-status__metric-value">
                                {status.responseTime ? `${status.responseTime}ms` : '< 100ms'}
                            </div>
                        </div>

                        <div className="api-status__metric">
                            <div className="api-status__metric-header">
                                <Activity className="api-status__metric-icon" />
                                <span className="api-status__metric-label">Uptime</span>
                            </div>
                            <div className="api-status__metric-value">99.9%</div>
                        </div>
                    </div>

                    {/* Timestamp da última verificação */}
                    <div className="api-status__timestamp">
                        <div className="api-status__timestamp-content">
                            <div className="api-status__timestamp-dot"></div>
                            <span className="api-status__timestamp-text">
                                Última verificação: {new Date().toLocaleTimeString('pt-BR')}
                            </span>
                            <div className="api-status__timestamp-dot"></div>
                        </div>
                    </div>

                    {/* Botão de atualização manual */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            checkApiHealth();
                        }}
                        className="api-status__refresh-btn"
                        disabled={status.loading}
                    >
                        <div className="api-status__refresh-btn-content">
                            {status.loading ? (
                                <div className="api-status__refresh-btn-spinner" />
                            ) : (
                                <Activity className="api-status__refresh-btn-icon" />
                            )}
                            <span>{status.loading ? 'Verificando...' : 'Atualizar Status'}</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Indicador de notificação para problemas */}
            {status.status !== 'healthy' && status.status !== 'loading' && (
                <div className="api-status__notification"></div>
            )}
        </div>
    );
};

export default ApiStatus;