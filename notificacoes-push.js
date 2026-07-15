import { getToken } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { messaging, db } from './firebase-config.js';

// TROQUE pela VAPID key que você gerou no console do Firebase
const VAPID_KEY = 'BPDNX8CdfJXhzR4L5YXM9nUf0IfECqjJvLhPXNxu6QMNN-gZX9P2ZDypFnu7HhoaDtXBFTjVVYTe0FGBRNDbCo0';

export async function gerarTokenPush() {
    try {
        const registroServiceWorker = await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registroServiceWorker
        });

        if (token) {
            console.log('Token de push gerado:', token);
            return token;
        }

        console.log('Não foi possível gerar o token — permissão pode estar negada.');
        return null;
    } catch (erro) {
        console.error('Erro ao gerar token de push:', erro);
        return null;
    }
}

// salva o token vinculado ao usuário — usamos o próprio token como ID do
// documento, assim, se o mesmo navegador gerar o token de novo (o que é
// comum acontecer), ele so atualiza o registro em vez de duplicar
export function salvarTokenPush(uid, token) {
    return setDoc(doc(db, 'tokensPush', token), {
        uid,
        token,
        atualizadoEm: new Date().toISOString()
    });
}

// função "tudo em um": pede permissão (se preciso), gera o token e salva
export async function configurarNotificacoesPush(uid) {
    if (Notification.permission !== 'granted') {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
            console.log('Permissão de notificação negada pelo usuário.');
            return null;
        }
    }

    const token = await gerarTokenPush();
    if (token) {
        await salvarTokenPush(uid, token);
        console.log('Token salvo no Firestore com sucesso.');
    }

    return token;
}