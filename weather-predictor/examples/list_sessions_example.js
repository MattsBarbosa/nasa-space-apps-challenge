import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8787';

class SessionListExample {
    constructor() {
        this.baseUrl = BASE_URL;
    }

    /**
     * Lista todas as sessões do sistema
     */
    async listAllSessions() {
        console.log('📋 Listando todas as sessões...\n');
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/sessions`);
            const data = await response.json();
            
            console.log(`✅ Total de sessões: ${data.pagination.total}`);
            console.log(`📊 Exibindo: ${data.sessions.length} sessões\n`);
            
            data.sessions.forEach((session, index) => {
                console.log(`${index + 1}. 🆔 ${session.sessionId}`);
                console.log(`   📊 Status: ${this.formatStatus(session.status)}`);
                console.log(`   🕐 Criada: ${new Date(session.createdAt).toLocaleString('pt-BR')}`);
                console.log(`   🔄 Última atividade: ${new Date(session.lastActivity).toLocaleString('pt-BR')}`);
                console.log(`   💬 Mensagens: ${session.messageCount}`);
                console.log(`   📍 Contexto: ${this.formatContext(session.context)}`);
                
                if (session.lastMessages.length > 0) {
                    console.log(`   📝 Últimas mensagens:`);
                    session.lastMessages.forEach(msg => {
                        const icon = msg.role === 'user' ? '👤' : '🤖';
                        console.log(`      ${icon} ${msg.content}`);
                    });
                }
                console.log('');
            });
            
            return data;
        } catch (error) {
            console.error('❌ Erro ao listar sessões:', error.message);
        }
    }

    /**
     * Lista apenas sessões ativas
     */
    async listActiveSessions() {
        console.log('🟢 Listando sessões ativas...\n');
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/sessions?status=active`);
            const data = await response.json();
            
            if (data.sessions.length === 0) {
                console.log('📭 Nenhuma sessão ativa encontrada.\n');
                return data;
            }
            
            console.log(`✅ Sessões ativas: ${data.sessions.length}\n`);
            
            data.sessions.forEach((session, index) => {
                console.log(`${index + 1}. 🆔 ${session.sessionId.substring(0, 20)}...`);
                console.log(`   ⏱️  Ativa há: ${this.calculateDuration(session.lastActivity)}`);
                console.log(`   📍 Local: ${session.context.location || 'Não definido'}`);
                console.log(`   📅 Data: ${session.context.date || 'Não definida'}`);
                console.log(`   💬 ${session.messageCount} mensagens trocadas\n`);
            });
            
            return data;
        } catch (error) {
            console.error('❌ Erro ao listar sessões ativas:', error.message);
        }
    }

    /**
     * Lista sessões com paginação
     */
    async listSessionsWithPagination(limit = 5, offset = 0) {
        console.log(`📄 Listando sessões com paginação (limite: ${limit}, offset: ${offset})...\n`);
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/sessions?limit=${limit}&offset=${offset}`);
            const data = await response.json();
            
            console.log(`📊 Página atual: ${Math.floor(offset / limit) + 1}`);
            console.log(`📋 Mostrando ${data.sessions.length} de ${data.pagination.total} sessões`);
            console.log(`➡️  Há mais páginas: ${data.pagination.hasMore ? 'Sim' : 'Não'}\n`);
            
            data.sessions.forEach((session, index) => {
                const globalIndex = offset + index + 1;
                console.log(`${globalIndex}. ${session.sessionId.substring(0, 25)}...`);
                console.log(`    Status: ${this.formatStatus(session.status)} | Mensagens: ${session.messageCount}`);
                console.log('');
            });
            
            return data;
        } catch (error) {
            console.error('❌ Erro ao listar sessões com paginação:', error.message);
        }
    }

    /**
     * Obtém detalhes completos de uma sessão específica
     */
    async getSessionDetails(sessionId) {
        console.log(`🔍 Obtendo detalhes da sessão: ${sessionId}\n`);
        
        try {
            const response = await fetch(`${this.