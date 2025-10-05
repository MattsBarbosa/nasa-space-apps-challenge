import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8787';

async function testSessionFlow() {
    console.log('🧪 Testando Sistema de Sessões Persistentes\n');
    
    try {
        // Teste 1: Primeira mensagem com informação incompleta
        console.log('1. Enviando mensagem inicial...');
        const response1 = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Nossa, vou me casar em Londres."
            })
        });
        
        const result1 = await response1.json();
        console.log('✅ Resposta:', result1.response);
        console.log('📋 Status:', result1.status);
        console.log('🆔 Session ID:', result1.sessionId);
        console.log('📝 Contexto:', JSON.stringify(result1.context, null, 2));
        
        const sessionId = result1.sessionId;
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Teste 2: Segunda mensagem com data incompleta
        console.log('2. Respondendo com data incompleta...');
        const response2 = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Em dezembro.",
                sessionId: sessionId
            })
        });
        
        const result2 = await response2.json();
        console.log('✅ Resposta:', result2.response);
        console.log('📋 Status:', result2.status);
        console.log('📝 Contexto:', JSON.stringify(result2.context, null, 2));
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Teste 3: Terceira mensagem com data completa
        console.log('3. Fornecendo data completa...');
        const response3 = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "15 de dezembro de 2025.",
                sessionId: sessionId
            })
        });
        
        const result3 = await response3.json();
        console.log('✅ Resposta:', result3.response);
        console.log('📋 Status:', result3.status);
        
        if (result3.status === 'completed') {
            console.log('🎉 Conversa finalizada com sucesso!');
            console.log('💡 Sessão foi automaticamente encerrada.');
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Teste 4: Verificar estatísticas
        console.log('4. Verificando estatísticas das sessões...');
        const statsResponse = await fetch(`${BASE_URL}/chat/sessions/stats`);
        const stats = await statsResponse.json();
        console.log('📊 Estatísticas:', JSON.stringify(stats, null, 2));
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Teste 5: Tentar usar sessão encerrada
        console.log('5. Tentando usar sessão encerrada...');
        const response4 = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Outra pergunta",
                sessionId: sessionId
            })
        });
        
        const result4 = await response4.json();
        console.log('🔄 Nova sessão criada:', result4.sessionId !== sessionId);
        console.log('📝 Resposta:', result4.response);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

async function testMultipleUsers() {
    console.log('\n🧪 Testando Múltiplos Usuários Simultaneamente\n');
    
    const users = [
        { name: 'User A', message: 'Vou para Paris' },
        { name: 'User B', message: 'Viagem para Tokyo' },
        { name: 'User C', message: 'Casamento em Roma' }
    ];
    
    const sessions = [];
    
    // Criar sessões para múltiplos usuários
    for (const user of users) {
        try {
            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: user.message
                })
            });
            
            const result = await response.json();
            sessions.push({
                user: user.name,
                sessionId: result.sessionId,
                context: result.context
            });
            
            console.log(`✅ ${user.name}: ${result.response.substring(0, 50)}...`);
        } catch (error) {
            console.error(`❌ Erro para ${user.name}:`, error.message);
        }
    }
    
    console.log('\n📊 Sessões criadas:');
    sessions.forEach(session => {
        console.log(`- ${session.user}: ${session.sessionId}`);
    });
    
    // Verificar isolamento
    console.log('\n🔒 Verificando isolamento entre usuários...');
    const statsResponse = await fetch(`${BASE_URL}/chat/sessions/stats`);
    const stats = await statsResponse.json();
    console.log(`📈 Total de sessões ativas: ${stats.active}`);
    console.log(`✅ Isolamento ${sessions.length === stats.active ? 'OK' : 'FALHOU'}`);
}

async function testErrorHandling() {
    console.log('\n🧪 Testando Tratamento de Erros\n');
    
    // Teste 1: Mensagem vazia
    try {
        console.log('1. Testando mensagem vazia...');
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '' })
        });
        
        const result = await response.json();
        console.log(`❌ Status: ${response.status}`);
        console.log(`📝 Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
    
    // Teste 2: JSON inválido
    try {
        console.log('\n2. Testando JSON inválido...');
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'json inválido'
        });
        
        const result = await response.json();
        console.log(`❌ Status: ${response.status}`);
        console.log(`📝 Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
    
    // Teste 3: Session ID inválido
    try {
        console.log('\n3. Testando sessionId inválido...');
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Teste',
                sessionId: 123 // Deve ser string
            })
        });
        
        const result = await response.json();
        console.log(`❌ Status: ${response.status}`);
        console.log(`📝 Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Iniciando Testes do Sistema de Sessões\n');
    console.log('⚠️  Certifique-se de que o servidor está rodando em http://localhost:8787\n');
    
    await testSessionFlow();
    await testMultipleUsers();
    await testErrorHandling();
    
    console.log('\n✅ Todos os testes concluídos!');
    console.log('📖 Consulte CHAT_SESSIONS.md para mais informações sobre o uso.');
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { testSessionFlow, testMultipleUsers, testErrorHandling, runAllTests };