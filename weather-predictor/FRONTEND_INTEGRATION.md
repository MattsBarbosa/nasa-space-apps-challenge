# Integração Frontend - Sistema de Sessões Persistentes

Este documento fornece exemplos de como integrar o sistema de sessões persistentes no frontend.

## Vue.js 3 (Composition API)

```vue
<template>
  <div class="weather-chat">
    <div class="chat-header">
      <h1>🌤️ Previsão do Tempo com IA</h1>
      <div class="session-info">
        <span>Sessão: {{ sessionDisplay }}</span>
        <span :class="`status status-${sessionStatus}`">{{ statusDisplay }}</span>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="`message ${message.role}-message`"
      >
        <div class="message-content" v-html="formatMessage(message.content)"></div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="input-form">
      <input
        v-model="inputValue"
        @keypress="handleKeyPress"
        :disabled="isLoading"
        placeholder="Digite sua mensagem..."
        class="message-input"
      />
      <button
        type="submit"
        :disabled="isLoading || !inputValue.trim()"
        class="send-button"
      >
        {{ isLoading ? 'Enviando...' : 'Enviar' }}
      </button>
    </form>

    <div v-if="Object.keys(context).length > 0" class="context-info">
      <h4>Informações Coletadas:</h4>
      <ul>
        <li v-if="context.location">📍 Local: {{ context.location }}</li>
        <li v-if="context.date">📅 Data: {{ context.date }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

const apiUrl = 'http://localhost:8787';

// Estado reativo
const sessionId = ref(null);
const messages = ref([
  {
    role: 'assistant',
    content: 'Olá! Conte-me sobre um evento futuro e eu te darei a previsão do tempo!'
  }
]);
const isLoading = ref(false);
const sessionStatus = ref('waiting');
const context = ref({});
const inputValue = ref('');
const messagesContainer = ref(null);

// Computed properties
const sessionDisplay = computed(() => {
  return sessionId.value ? `${sessionId.value.substring(0, 15)}...` : 'Nova';
});

const statusDisplay = computed(() => {
  switch (sessionStatus.value) {
    case 'active': return 'Ativa';
    case 'completed': return 'Finalizada';
    default: return 'Aguardando';
  }
});

// Métodos
const formatMessage = (content) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\n/g, '<br>');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async (message) => {
  if (!message || message.trim() === '') return;

  // Adicionar mensagem do usuário
  messages.value.push({ role: 'user', content: message });
  scrollToBottom();
  isLoading.value = true;

  try {
    const payload = {
      message: message.trim(),
      ...(sessionId.value && { sessionId: sessionId.value })
    };

    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      // Atualizar estado
      sessionId.value = result.sessionId;
      sessionStatus.value = result.status;
      context.value = result.context || {};

      // Adicionar resposta
      messages.value.push({ role: 'assistant', content: result.response });
      scrollToBottom();

      // Lidar com finalização
      if (result.status === 'completed') {
        setTimeout(() => {
          messages.value.push({
            role: 'assistant',
            content: '✅ Conversa finalizada! Você pode iniciar uma nova consulta.'
          });
          scrollToBottom();
        }, 1000);

        setTimeout(() => {
          resetSession();
        }, 4000);
      }

    } else {
      messages.value.push({ role: 'assistant', content: `❌ Erro: ${result.error}` });
      scrollToBottom();
    }

  } catch (error) {
    console.error('Erro:', error);
    messages.value.push({ role: 'assistant', content: '❌ Erro de conexão' });
    scrollToBottom();
  } finally {
    isLoading.value = false;
  }
};

const resetSession = () => {
  sessionId.value = null;
  sessionStatus.value = 'waiting';
  context.value = {};
  messages.value = [{
    role: 'assistant',
    content: 'Pronto para uma nova consulta! Como posso ajudar?'
  }];
  scrollToBottom();
};

const handleSubmit = () => {
  if (inputValue.value.trim()) {
    sendMessage(inputValue.value);
    inputValue.value = '';
  }
};

const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};
</script>
```

## Configurações de Produção

### Variáveis de Ambiente

```javascript
// config.js
const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://sua-api.dominio.com'
    : 'http://localhost:8787',

  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  maxRetries: 3,
  retryDelay: 1000
};

export default config;
```

### Tratamento de Erros Avançado

```javascript
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

const handleApiCall = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new ApiError(result.error || 'Erro desconhecido', response.status, result);
      }

      return result;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Persistência Local (LocalStorage)

```javascript
class SessionPersistence {
  static save(sessionId, messages, context) {
    const data = {
      sessionId,
      messages,
      context,
      timestamp: Date.now()
    };
    localStorage.setItem('weatherChatSession', JSON.stringify(data));
  }

  static load() {
    const stored = localStorage.getItem('weatherChatSession');
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      // Verificar se não expirou (1 hora)
      if (Date.now() - data.timestamp > 60 * 60 * 1000) {
        SessionPersistence.clear();
        return null;
      }
      return data;
    } catch {
      SessionPersistence.clear();
      return null;
    }
  }

  static clear() {
    localStorage.removeItem('weatherChatSession');
  }
}
```

Estes exemplos mostram como integrar o sistema de sessões persistentes em diferentes tecnologias frontend, mantendo a funcionalidade completa de conversas contínuas até a coleta de todos os dados necessários.
