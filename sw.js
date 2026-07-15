self.addEventListener('install', () => {
    console.log('[Service Worker] instalado');
    self.skipWaiting(); // força a nova versão a assumir sem precisar fechar abas
});

self.addEventListener('activate', (evento) => {
    console.log('[Service Worker] ativado');
    evento.waitUntil(clients.claim()); // assume controle das abas já abertas
});

// escuta mensagens vindas da página (script.js) e mostra uma notificação
self.addEventListener('message', (evento) => {
    console.log('[Service Worker] mensagem recebida:', evento.data);

    if (evento.data && evento.data.tipo === 'MOSTRAR_NOTIFICACAO_TESTE') {
        self.registration.showNotification('Notificação de teste', {
            body: 'Se você está vendo isso, o Service Worker consegue mostrar notificações!'
        }).then(() => {
            console.log('[Service Worker] showNotification executado com sucesso');
        }).catch((erro) => {
            console.error('[Service Worker] erro ao mostrar notificação:', erro);
        });
    }
});

// dispara quando o Firebase Cloud Messaging entrega uma notificação
// enquanto a aba está fechada ou em segundo plano
self.addEventListener('push', (evento) => {
    console.log('[Service Worker] push recebido:', evento);

    let dados = {};
    try {
        dados = evento.data ? evento.data.json() : {};
    } catch (erro) {
        console.error('[Service Worker] erro ao ler dados do push:', erro);
    }

    const titulo = (dados.notification && dados.notification.title) || 'Lista de Tarefas';
    const corpo = (dados.notification && dados.notification.body) || 'Você tem um lembrete.';

    evento.waitUntil(
        self.registration.showNotification(titulo, { body: corpo })
    );
});

// clicar na notificação foca (ou abre) a aba do app
self.addEventListener('notificationclick', (evento) => {
    evento.notification.close();
    evento.waitUntil(
        clients.matchAll({ type: 'window' }).then((listaDeJanelas) => {
            if (listaDeJanelas.length > 0) {
                return listaDeJanelas[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});