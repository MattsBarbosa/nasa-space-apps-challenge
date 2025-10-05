# Sistema de Sessões Persistentes para Chat

Este documento explica como usar o sistema de sessões persistentes implementado para o chat de previsão meteorológica.

## Como Funciona

O sistema mantém conversas ativas até que o agente colete todas as informações necessárias do usuário:
- **Local específico** (cidade, país)
- **Data completa** (dia, mês, ano)

Quando todos os dados são coletados, o sistema calcula as probabilidades climáticas e **automaticamente encerra a sessão**.

## Endpoints

### POST `/chat`
Envia uma mensagem e mantém a conversa ativa.

**Request Body:**
```json
{
    "message": "Vou me casar em Londres",
    "sessionId": "session_1234567890_abc123def" // opcional
}
```

**Response (Conversa Ativa):**
```json
{
    "response": "Entendido! Em qual data será o casamento?",
    "sessionId": "session_1234567890_abc123def",
    "status": "active",
    "context": {
        "location": "Londres",
        "latitude": 51.5074,
        "longitude": -0.1278
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (Conversa Finalizada):**
```json
{
    "response": "## 🌤️ Previsão para Londres em 15 de dezembro de 2025\n\n**Probabilidades climáticas:**\n- ☀️ Sol: 25%\n- ☁️ Nublado: 45%\n- 🌧️ Chuva: 30%\n\n**Temperatura esperada:** 8°C ± 3°C\n\n*Baseado em dados históricos da NASA*",
    "sessionId": "session_1234567890_abc123def",
    "status": "completed",
    "message": "Conversa finalizada. Todos os dados foram coletados e a previsão foi fornecida.",
    "timestamp": "2024-01-15T10:35:00Z"
}
```

### GET `/chat/sessions/stats`
Obtém estatísticas das sessões ativas.

**Response:**
```json
{
    "total": 5,
    "active": 3,
    "completed": 2,
    "maxAge": 1800000,
    "cleanupInterval": 300000,
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### DELETE `/chat/sessions/{sessionId}/end`
Encerra manualmente uma sessão específica.

**Response:**
```json
{
    "message": "Sessão encerrada com sucesso",
    "sessionId": "session_1234567890_abc123def",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## Exemplo de Fluxo Completo

### 1. Primeira Mensagem (Informação Incompleta)
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Nossa, vou me casar em Londres."}'
```

**Resposta:**
```json
{
    "response": "Entendido! Em qual data será o casamento?",
    "sessionId": "session_1234567890_abc123def",
    "status": "active",
    "context": {
        "location": "Londres",
        "latitude": 51.5074,
        "longitude": -0.1278
    }
}
```

### 2. Segunda Mensagem (Data Incompleta)
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Em dezembro.",
    "sessionId": "session_1234567890_abc123def"
  }'
```

**Resposta:**
```json
{
    "response": "Poderia ser mais específico? Qual o dia e ano exato?",
    "sessionId": "session_1234567890_abc123def",
    "status": "active",
    "context": {
        "location": "Londres",
        "latitude": 51.5074,
        "longitude": -0.1278
    }
}
```

### 3. Terceira Mensagem (Informação Completa)
```bash
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "15 de dezembro de 2025.",
    "sessionId": "session_1234567890_abc123def"
  }'
```

**Resposta Final:**
```json
{
    "response": "## 🌤️ Previsão para Londres em 15 de dezembro de 2025\n\n**Probabilidades climáticas:**\n- ☀️ Sol: 25%\n- ☁️ Nublado: 45%\n- 🌧️ Chuva: 30%\n\n**Temperatura esperada:** 8°C ± 3°C\n\n*Baseado em dados históricos da NASA*",
    "sessionId": "session_1234567890_abc123def",
    "status": "completed",
    "message": "Conversa finalizada. Todos os dados foram coletados e a previsão foi fornecida."
}
```

## Funcionalidades do Sistema

### ✅ Isolamento de Sessões
- Cada usuário tem sua própria sessão
- Múltiplos usuários podem conversar simultaneamente
- Dados não são misturados entre usuários

### ✅ Persistência de Contexto
- O sistema lembra informações de mensagens anteriores
- Combina dados de diferentes mensagens
- Não repete perguntas já respondidas

### ✅ Limpeza Automática
- Sessões expiram após 30 minutos de inatividade
- Limpeza automática a cada 5 minutos
- Sessões completadas são removidas automaticamente

### ✅ Gerenciamento Inteligente
- Detecta quando informações estão incompletas
- Faz uma pergunta por vez para não confundir
- Encerra automaticamente quando resultado é fornecido

## Estados da Sessão

- **`active`**: Sessão em andamento, aguardando mais informações
- **`completed`**: Todas as informações foram coletadas e resultado fornecido
- **`expired`**: Sessão expirada por inatividade (removida automaticamente)

## Tratamento de Erros

### Sessão Não Encontrada
```json
{
    "error": "Sessão não encontrada ou expirada",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Mensagem Inválida
```json
{
    "error": "Mensagem é obrigatória",
    "example": {
        "message": "Vou para Londres em 6 de fevereiro de 2027",
        "sessionId": "opcional"
    }
}
```

## Configurações

- **Tempo de expiração**: 30 minutos de inatividade
- **Limpeza automática**: A cada 5 minutos
- **Máximo de iterações por resposta**: 10
- **Suporte a múltiplos usuários**: Ilimitado (limitado pela memória)

## Notas de Implementação

1. **Memória**: Sessões são armazenadas em memória (Map)
2. **Produção**: Para ambiente de produção, considere usar Redis ou banco de dados
3. **Escalabilidade**: Sistema atual suporta múltiplos usuários em uma instância
4. **Persistência**: Dados são perdidos quando a aplicação reinicia