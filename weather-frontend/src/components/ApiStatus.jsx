import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Satellite, Activity, Zap, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.jsx';
import weatherApi from '../services/weatherApi';

const ApiStatus = () => {
    const { t, currentLanguage } = useTranslation();

    const [status, setStatus] = useState({ loading: true });
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const checkApiHealth = useCallback(async (manual = false) => {
        if (manual) {
            setIsRefreshing(true);
        }

        try {
            const health = await weatherApi.getApiHealth();
            setStatus({ loading: false, ...health });
            setLastCheck(new Date());
        } catch (error) {
            setStatus({
                loading: false,
                status: 'unreachable',
                error: error.message,
                components: {}
            });
            setLastCheck(new Date());
        } finally {
            if (manual) {
                setIsRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        checkApiHealth();

        if (autoRefresh) {
            const interval = setInterval(() => checkApiHealth(), 30000);
            return () => clearInterval(interval);
        }
    }, [checkApiHealth, autoRefresh]);

    const handleManualRefresh = () => {
        checkApiHealth(true);
    };

    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };

    const getStatusIcon = () => {
        if (status.loading || isRefreshing) {
            return (
                <div className="api-status__loading-icon">
                    <div className="api-status__loading-spinner" />
                    <Satellite className="api-status__loading-satellite" />
                </div>
            );
        }

        switch (status.status) {
            case 'healthy':
                return <CheckCircle className="api-status__icon api-status__icon--healthy" />;
            case 'degraded':
                return <AlertCircle className="api-status__icon api-status__icon--warning" />;
            case 'unreachable':
                return <WifiOff className="api-status__icon api-status__icon--error" />;
            default:
                return <XCircle className="api-status__icon api-status__icon--error" />;
        }
    };

    const getStatusText = () => {
        if (status.loading) return t('apiStatus.checking', 'Verificando Sistema...');
        if (isRefreshing) return t('apiStatus.refreshing', 'Atualizando...');

        switch (status.status) {
            case 'healthy':
                return t('apiStatus.online', 'Sistema Online');
            case 'degraded':
                return t('apiStatus.partial', 'Sistema Parcial');
            case 'unreachable':
                return t('apiStatus.offline', 'Sistema Offline');
            default:
                return t('apiStatus.error', 'Erro no Sistema');
        }
    };

    const getStatusClass = () => {
        switch (status.status) {
            case 'healthy':
                return 'api-status--healthy';
            case 'degraded':
                return 'api-status--warning';
            default:
                return 'api-status--error';
        }
    };

    const getComponentStatusColor = (componentStatus) => {
        switch (componentStatus) {
            case 'connected':
            case 'operational':
                return 'success';
            case 'degraded':
            case 'partial':
                return 'warning';
            default:
                return 'error';
        }
    };

    const getComponentStatusText = (componentStatus) => {
        switch (componentStatus) {
            case 'connected':
                return t('apiStatus.components.connected', 'Conectado');
            case 'degraded':
                return t('apiStatus.components.degraded', 'Degradado');
            case 'unreachable':
                return t('apiStatus.components.unreachable', 'Indisponível');
            default:
                return t('apiStatus.components.unknown', 'Desconhecido');
        }
    };

    const formatLastCheck = () => {
        if (!lastCheck) return t('apiStatus.never', 'Nunca');

        const now = new Date();
        const diff = Math.floor((now - lastCheck) / 1000);

        if (diff < 60) {
            return currentLanguage === 'en'
                ? `${diff}s ago`
                : `${diff}s atrás`;
        }
        if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return currentLanguage === 'en'
                ? `${minutes}min ago`
                : `${minutes}min atrás`;
        }

        const locale = currentLanguage === 'en' ? 'en-US' : 'pt-BR';
        return lastCheck.toLocaleTimeString(locale);
    };

    const components = [
        {
            key: 'nasa_power',
            name: 'NASA POWER',
            description: t('apiStatus.components.nasaPower.description', 'Dados meteorológicos históricos'),
            icon: Satellite,
            url: 'https://power.larc.nasa.gov/'
        },
        {
            key: 'earthdata_cmr',
            name: 'NASA Earthdata',
            description: t('apiStatus.components.earthdata.description', 'Catálogo de dados científicos'),
            icon: Satellite,
            url: 'https://earthdata.nasa.gov/'
        },
        {
            key: 'giovanni',
            name: 'NASA Giovanni',
            description: t('apiStatus.components.giovanni.description', 'Visualização de dados'),
            icon: Satellite,
            url: 'https://giovanni.gsfc.nasa.gov/'
        }
    ];

    return (
        <div className="api-status">
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
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="api-status__panel">
                    <div className="api-status__panel-header">
                        <div className="api-status__panel-header-content">
                            <span className="api-status__panel-header-text">
                                🛰️ {t('apiStatus.componentsTitle', 'Status dos Componentes NASA')}
                            </span>
                            <div className="api-status__panel-controls">
                                <button
                                    className={`api-status__auto-refresh ${autoRefresh ? 'api-status__auto-refresh--active' : ''}`}
                                    onClick={toggleAutoRefresh}
                                    title={autoRefresh ?
                                        t('apiStatus.disableAutoRefresh', 'Desativar atualização automática') :
                                        t('apiStatus.enableAutoRefresh', 'Ativar atualização automática')
                                    }
                                >
                                    <Clock size={14} />
                                    <span>
                                        {autoRefresh ?
                                            t('apiStatus.auto', 'Auto') :
                                            t('apiStatus.manual', 'Manual')
                                        }
                                    </span>
                                </button>
                                <button
                                    className="api-status__refresh-button"
                                    onClick={handleManualRefresh}
                                    disabled={isRefreshing}
                                    title={t('apiStatus.refreshStatus', 'Atualizar status')}
                                >
                                    <RefreshCw
                                        size={14}
                                        className={isRefreshing ? 'api-status__refresh-spinning' : ''}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {status.components && Object.keys(status.components).length > 0 ? (
                        <div className="api-status__components">
                            {components.map((component) => {
                                const componentStatus = status.components[component.key];
                                const statusColor = getComponentStatusColor(componentStatus?.status);
                                const Icon = component.icon;

                                return (
                                    <div key={component.key} className="api-status__component">
                                        <div className="api-status__component-info">
                                            <div className={`api-status__component-icon api-status__component-icon--${statusColor}`}>
                                                <Icon className="api-status__component-icon-svg" />
                                            </div>
                                            <div className="api-status__component-details">
                                                <div className="api-status__component-name-row">
                                                    <span className="api-status__component-name">{component.name}</span>
                                                    <a
                                                        href={component.url}

                                                        rel="noopener noreferrer"
                                                        className="api-status__component-link"
                                                        title={currentLanguage === 'en'
                                                            ? `Open ${component.name}`
                                                            : `Abrir ${component.name}`
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <div className="api-status__component-desc">{component.description}</div>
                                            </div>
                                        </div>

                                        <div className="api-status__component-status">
                                            <div className={`api-status__component-dot api-status__component-dot--${statusColor}`}></div>
                                            <span className={`api-status__component-status-text api-status__component-status-text--${statusColor}`}>
                                                {getComponentStatusText(componentStatus?.status)}
                                            </span>
                                            {componentStatus?.responseTime && (
                                                <span className="api-status__component-latency">
                                                    {componentStatus.responseTime}ms
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="api-status__no-components">
                            <AlertCircle className="api-status__no-components-icon" />
                            <span className="api-status__no-components-text">
                                {t('apiStatus.noComponents', 'Nenhum componente disponível')}
                            </span>
                        </div>
                    )}

                    <div className="api-status__metrics">
                        <div className="api-status__metric">
                            <div className="api-status__metric-header">
                                <Zap className="api-status__metric-icon" />
                                <span className="api-status__metric-label">
                                    {t('apiStatus.metrics.averageLatency', 'Latência Média')}
                                </span>
                            </div>
                            <div className="api-status__metric-value">
                                {status.responseTime ? `${status.responseTime}ms` :
                                    status.components ?
                                        `${Math.round(Object.values(status.components)
                                            .filter(c => c.responseTime)
                                            .reduce((acc, c) => acc + c.responseTime, 0) /
                                            Object.values(status.components).filter(c => c.responseTime).length) || 0}ms` :
                                        '< 100ms'}
                            </div>
                        </div>

                        <div className="api-status__metric">
                            <div className="api-status__metric-header">
                                <Activity className="api-status__metric-icon" />
                                <span className="api-status__metric-label">
                                    {t('apiStatus.metrics.availability', 'Disponibilidade')}
                                </span>
                            </div>
                            <div className="api-status__metric-value">
                                {status.components ?
                                    `${Math.round((Object.values(status.components).filter(c => c.status === 'connected').length / Object.keys(status.components).length) * 100)}%` :
                                    status.status === 'healthy' ? '100%' : '0%'}
                            </div>
                        </div>
                    </div>

                    {status.error && (
                        <div className="api-status__error-details">
                            <div className="api-status__error-header">
                                <AlertCircle className="api-status__error-icon" />
                                <span className="api-status__error-title">
                                    {t('apiStatus.errorDetails', 'Detalhes do Erro')}
                                </span>
                            </div>
                            <div className="api-status__error-message">
                                {status.error}
                            </div>
                        </div>
                    )}

                    <div className="api-status__timestamp">
                        <div className="api-status__timestamp-content">
                            <div className="api-status__timestamp-dot"></div>
                            <span className="api-status__timestamp-text">
                                {t('apiStatus.lastCheck', 'Última verificação')}: {formatLastCheck()}
                            </span>
                            <div className="api-status__timestamp-dot"></div>
                        </div>
                    </div>
                </div>
            )}

            {status.status !== 'healthy' && status.status !== 'loading' && !isExpanded && (
                <div className="api-status__notification">
                    <div className="api-status__notification-pulse"></div>
                </div>
            )}
        </div>
    );
};

export default ApiStatus;