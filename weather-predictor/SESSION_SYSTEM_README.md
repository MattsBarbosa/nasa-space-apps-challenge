# Sistema de Sessões Persistentes - Weather Chat

## 🎯 Objetivo

Implementar um sistema de chat conversacional que mantém sessões ativas até coletar todas as informações necessárias do usuário (local e data) para gerar previsões meteorológicas baseadas em dados históricos da NASA.

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Chaves de API configuradas (Gemini, OpenCage)

### 1. Instalar Dependências
```bash
cd weather-predictor
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `wrangler.toml` com suas chaves:
```toml
[vars]
GEMINI_API_KEY = "sua_chave_gemini"
OPEN_CAGE = "sua_chave_opencage"
```

### 3. Executar em Desenvolvimento
```bash
npm run dev
```

### 4. Testar o Sistema
```bash
node test_sessions.js
```

## 📊 Como Funciona

### Fluxo da Conversa

1. **Usuário envia mensagem incompleta**
   ```
   "Nossa, vou me casar em Londres."
   ```

2. **Sistema identifica dados faltantes e pergunta**
   ```
   "Entendido! Em qual data será o casamento?"
   ```

3. **Usuário responde com informação parcial**
   ```
   "Em dezembro."
   ```

4. **Sistema solicita especificação**
   ```
   "Poderia ser mais específico? Qual o dia e ano exato?"
   ```

5. **Usuário completa a informação**
   ```
   "15 de dezembro de 2025."
   ```

6. **Sistema fornece previsão e encerra sessão**
   ```
   "## 🌤️ Previsão para Londres em 15 de dezembro de 2025
   
   **Probabilidades climáticas:**
   - ☀️ Sol: 25%
   - ☁️ Nublado: 45%  
   - 🌧️ Chuva: 30%
   
   **Temperatura esperada:** 8°C ± 3°C"
   
   Status: completed (sessão removida imediatamente)
   ```

## 🛠️ Arquitetura

### Componentes Principais

1. **SessionManager** (`src/managers/SessionManager.js`)
   - Gerencia ciclo de vida das sessões
   - Armazena histórico de conversas
   - Limpa sessões expiradas automaticamente

2. **WeatherAgentService** (`src/services/WeatherAgentService.js`)
   - Integração com Gemini AI
   - Processamento de linguagem natural
   - Chamadas para APIs de geolocalização e clima

3. **WeatherController** (`src/controllers/WeatherController.js`)
   - Endpoints HTTP
   - Validação de requests
   - Gerenciamento de respostas

### Estrutura de Dados da Sessão

```javascript
{
  id: "session_1234567890_abc123def",
  messages: [
    {
      role: "user|assistant",
      content: "texto da mensagem",
      timestamp: Date
    }
  ],
  context: {
    location: "Londres",
    latitude: 51.5074,
    longitude: -0.1278,
    date: "2025-12-15"
  },
  status: "active|completed|expired",
  createdAt: Date,
  lastActivity: Date
}
```

## 📡 API Endpoints

### POST `/chat`
Enviar mensagem e manter conversa ativa.

**Request:**
```json
{
  "message": "Vou para Paris",
  "sessionId": "opcional - criado automaticamente"
}
```

**Response (Ativa):**
```json
{
  "response": "Entendido! Em qual data será a viagem?",
  "sessionId": "session_1234567890_abc123def",
  "status": "active",
  "context": {
    "location": "Paris",
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

**Response (Finalizada):**
```json
{
  "response": "## 🌤️ Previsão completa...",
  "sessionId": "session_1234567890_abc123def",
  "status": "completed",
  "message": "Conversa finalizada. Sessão encerrada automaticamente."
}
```

### GET `/chat/sessions/stats`
Obter estatísticas das sessões ativas.

### DELETE `/chat/sessions/:sessionId/end`
Encerrar manualmente uma sessão específica.

## ⚙️ Configurações

### Tempos de Vida
- **Sessão ativa:** 30 minutos de inatividade
- **Limpeza lazy:** Executada sob demanda a cada 5 minutos
- **Sessão completada:** Removida imediatamente

### Limites
- **Máximo de iterações por resposta:** 10
- **Usuários simultâneos:** Ilimitado (limitado pela memória)
- **Histórico por sessão:** Todas as mensagens

## 🧪 Testando

### Teste Automatizado
Execute o arquivo de teste incluído:
```bash
node test_sessions.js
```

### Teste Manual com cURL

1. **Primeira mensagem:**
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Vou me casar em Londres"}'
```

2. **Continue a conversa:**
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "15 de dezembro de 2025",
    "sessionId": "SESSION_ID_RETORNADO"
  }'
```

3. **Verificar estatísticas:**
```bash
curl http://localhost:8787/chat/sessions/stats
```

## 📱 Integração Frontend

### JavaScript Vanilla
```javascript
async function sendMessage(message, sessionId = null) {
  const response = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  
  const result = await response.json();
  
  if (result.status === 'completed') {
    console.log('Conversa finalizada!');
    // Resetar interface
  }
  
  return result;
}
```

### React Hook
```javascript
import { useState, useCallback } from 'react';

export const useWeatherChat = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const sendMessage = useCallback(async (message) => {
    const result = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    }).then(r => r.json());
    
    setSessionId(result.sessionId);
    setMessages(prev => [...prev, 
      { role: 'user', content: message },
      { role: 'assistant', content: result.response }
    ]);
    
    if (result.status === 'completed') {
      setIsComplete(true);
      // Auto-reset após 3 segundos
      setTimeout(() => {
        setSessionId(null);
        setIsComplete(false);
        setMessages([]);
      }, 3000);
    }
    
    return result;
  }, [sessionId]);
  
  return { messages, sendMessage, isComplete };
};
```

## 🔧 Funcionalidades Implementadas

### ✅ Sessões Persistentes
- [x] Criação automática de sessões
- [x] Manutenção do histórico de conversa
- [x] Isolamento entre usuários
- [x] Limpeza lazy de sessões expiradas (compatível com Cloudflare Workers)

### ✅ Fluxo Conversacional
- [x] Detecção de informações incompletas
- [x] Perguntas contextuais inteligentes
- [x] Combinação de dados de múltiplas mensagens
- [x] Finalização automática quando completo

### ✅ Gerenciamento de Estado
- [x] Contexto persistente (local, data, coordenadas)
- [x] Status da sessão (active, completed, expired)
- [x] Remoção imediata de sessões completadas
- [x] Isolamento total entre conversas finalizadas
- [x] Estatísticas em tempo real
- [x] Encerramento manual de sessões

### ✅ Integração com IA
- [x] Processamento com Gemini AI
- [x] Chamadas de função para geolocalização
- [x] Chamadas de função para previsão NASA
- [x] Respostas contextuais baseadas no histórico

## 🚨 Considerações de Produção

### Escalabilidade
- **Atual:** Armazenamento em memória (Map) com lazy cleanup
- **Compatível:** Otimizado para Cloudflare Workers (sem timers globais)
- **Recomendado:** Redis ou banco de dados para alta escala
- **Clustering:** Implementar compartilhamento de sessão entre instâncias

### Performance
- **Lazy cleanup:** Limpeza sob demanda sem overhead
- **Memory efficient:** Sessões completadas removidas imediatamente
- **Session isolation:** Sessões finalizadas não podem ser reutilizadas
- **Worker-friendly:** Zero operações assíncronas no escopo global

### Segurança
- Validação de entrada rigorosa
- Rate limiting por usuário
- Sanitização de dados de sessão
- Logs de auditoria

### Monitoramento
- Métricas de sessões ativas/completadas
- Tempo médio de conclusão
- Taxa de abandono de sessões
- Performance das chamadas de API
- Eficiência da limpeza lazy

## 📋 TODO / Melhorias Futuras

- [ ] Persistência em Redis/DB
- [ ] Rate limiting por usuário
- [ ] Websockets para tempo real
- [ ] Análise de sentimento
- [ ] Suporte a múltiplos idiomas
- [ ] Cache de previsões frequentes
- [ ] Dashboard de administração
- [ ] Integração com analytics

## 📚 Documentação Adicional

- `CHAT_SESSIONS.md` - Documentação detalhada da API
- `FRONTEND_INTEGRATION.md` - Exemplos de integração frontend
- `test_sessions.js` - Suite de testes automatizados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.