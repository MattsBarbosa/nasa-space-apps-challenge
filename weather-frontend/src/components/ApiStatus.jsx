import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import weatherApi from '../services/weatherApi';

const ApiStatus = () => {
  const [status, setStatus] = useState({ loading: true });

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
    if (status.loading) return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
    if (status.status === 'healthy') return <CheckCircle className="text-green-600" size={16} />;
    if (status.status === 'degraded') return <AlertCircle className="text-yellow-600" size={16} />;
    if (status.status === 'unreachable') return <WifiOff className="text-red-600" size={16} />;
    return <XCircle className="text-red-600" size={16} />;
  };

  const getStatusColor = () => {
    if (status.status === 'healthy') return 'text-green-600';
    if (status.status === 'degraded') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-50">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {status.loading ? 'Verificando...' :
           status.status === 'healthy' ? 'API Online' :
           status.status === 'degraded' ? 'API Parcial' :
           status.status === 'unreachable' ? 'API Offline' : 'API Error'}
        </span>
      </div>

      {status.components && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>NASA:</span>
            <span className={status.components.nasa_api?.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {status.components.nasa_api?.status || 'unknown'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;
