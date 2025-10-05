// Gerador simples de UUID sem dependência externa
function generateSimpleId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

class SessionManager {
    constructor() {
        // Map para armazenar as sessões: sessionId -> sessionData
        this.sessions = new Map();

        // Configurações
        this.maxSessionAge = 30 * 60 * 1000; // 30 minutos em ms
        this.lastCleanup = Date.now(); // Timestamp da última limpeza
        this.cleanupThreshold = 5 * 60 * 1000; // Limpar a cada 5 minutos
    }

    /**
     * Cria uma nova sessão
     * @returns {string} sessionId
     */
    createSession() {
        // Fazer limpeza lazy antes de criar nova sessão
        this.performLazyCleanup();
        
        const sessionId = generateSimpleId();
        const sessionData = {
            id: sessionId,
            messages: [], // Histórico de mensagens
            context: {}, // Dados coletados (local, data, etc.)
            status: 'active', // active, completed, expired
            createdAt: new Date(),
            lastActivity: new Date()
        };
        
        this.sessions.set(sessionId, sessionData);
        console.log(`Nova sessão criada: ${sessionId}`);
        return sessionId;
    }

    /**
     * Obtém uma sessão existente
     * @param {string} sessionId
     * @returns {Object|null} sessionData ou null se não encontrada
     */
    getSession(sessionId) {
        // Fazer limpeza lazy se necessário
        this.performLazyCleanup();

        if (!sessionId || !this.sessions.has(sessionId)) {
            return null;
        }

        const session = this.sessions.get(sessionId);
        
        // Verifica se a sessão expirou
        if (this.isSessionExpired(session)) {
            this.endSession(sessionId);
            return null;
        }

        // Se sessão está completed, tratá-la como não existente
        // Isso força a criação de uma nova sessão
        if (session.status === 'completed') {
            return null;
        }

        // Atualiza última atividade
        session.lastActivity = new Date();
        return session;
    }

    /**
     * Adiciona uma mensagem ao histórico da sessão
     * @param {string} sessionId
     * @param {string} role - 'user' ou 'assistant'
     * @param {string} content
     */
    addMessage(sessionId, role, content) {
        // Limpeza lazy também é executada no getSession
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada ou expirada');
        }

        session.messages.push({
            role,
            content,
            timestamp: new Date()
        });

        session.lastActivity = new Date();
    }

    /**
     * Atualiza o contexto da sessão com dados coletados
     * @param {string} sessionId
     * @param {Object} contextData
     */
    updateContext(sessionId, contextData) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada ou expirada');
        }

        session.context = { ...session.context, ...contextData };
        session.lastActivity = new Date();
    }

    /**
     * Verifica se a sessão tem todos os dados necessários
     * @param {string} sessionId
     * @returns {Object} { complete: boolean, missing: string[] }
     */
    isSessionComplete(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return { complete: false, missing: ['sessão'] };
        }

        const required = ['location', 'date'];
        const missing = required.filter(field => !session.context[field]);

        return {
            complete: missing.length === 0,
            missing
        };
    }

    /**
     * Marca a sessão como concluída e remove imediatamente
     * @param {string} sessionId 
     */
    completeSession(sessionId) {
        const session = this.sessions.get(sessionId); // Usar get direto para evitar retorno null
        if (session) {
            session.status = 'completed';
            console.log(`Sessão concluída: ${sessionId}`);
            
            // Remove a sessão imediatamente
            this.endSession(sessionId);
        }
    }

    /**
     * Encerra e remove uma sessão
     * @param {string} sessionId
     */
    endSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            const session = this.sessions.get(sessionId);
            console.log(`Sessão removida: ${sessionId} (status: ${session.status})`);
            this.sessions.delete(sessionId);
            return true;
        }
        return false;
    }

    /**
     * Verifica se uma sessão expirou
     * @param {Object} session
     * @returns {boolean}
     */
    isSessionExpired(session) {
        const now = new Date();
        const timeDiff = now - session.lastActivity;
        return timeDiff > this.maxSessionAge;
    }

    /**
     * Executa limpeza lazy baseada em tempo
     */
    performLazyCleanup() {
        const now = Date.now();
        
        // Só limpa se passou tempo suficiente desde a última limpeza
        if (now - this.lastCleanup > this.cleanupThreshold) {
            this.cleanupExpiredSessions();
            this.lastCleanup = now;
        }
    }

    /**
     * Remove sessões expiradas (chamada sob demanda)
     */
    cleanupExpiredSessions() {
        let cleanedCount = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (this.isSessionExpired(session)) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`Limpeza lazy: ${cleanedCount} sessões expiradas removidas`);
        }
    }

    /**
     * Obtém todas as sessões do sistema
     * @returns {Array} Array de objetos de sessão
     */
    getAllSessions() {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.lastActivity - a.lastActivity); // Ordena por atividade mais recente
    }

    /**
     * Obtém estatísticas das sessões
     * @returns {Object}
     */
    getStats() {
        let activeCount = 0;
        let completedCount = 0;

        for (const session of this.sessions.values()) {
            if (session.status === 'active') activeCount++;
            else if (session.status === 'completed') completedCount++;
        }

        // Executar limpeza antes de retornar stats
        this.performLazyCleanup();
        
        return {
            total: this.sessions.size,
            active: activeCount,
            completed: completedCount,
            maxAge: this.maxSessionAge,
            lastCleanup: new Date(this.lastCleanup).toISOString()
        };
    }

    /**
     * Constrói o histórico de mensagens no formato esperado pela AI
     * @param {string} sessionId
     * @returns {Array}
     */
    buildConversationHistory(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return [];
        }

        return session.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
    }
}

// Instância singleton para ser usada em toda a aplicação
const sessionManager = new SessionManager();

export default sessionManager;
export { SessionManager };
