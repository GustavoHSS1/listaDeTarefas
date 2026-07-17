import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { auth } from './firebase-config.js';

export function traduzirErroFirebase(codigo) {
    const mensagens = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/missing-password': 'Digite uma senha.',
        'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
        'auth/email-already-in-use': 'Esse e-mail já tem uma conta. Tente entrar.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-not-found': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'Senha atual incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.'
    };
    return mensagens[codigo] || 'Não foi possível completar a ação. Tente novamente.';
}

export function entrar(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
}

export function criarConta(email, senha) {
    return createUserWithEmailAndPassword(auth, email, senha);
}

export function sair() {
    return signOut(auth);
}

export function trocarSenha(senhaAtual, novaSenha) {
    const credencial = EmailAuthProvider.credential(auth.currentUser.email, senhaAtual);
    return reauthenticateWithCredential(auth.currentUser, credencial)
        .then(() => updatePassword(auth.currentUser, novaSenha));
}

// dispara sempre que o estado de login muda (entrou, saiu, abriu a página já logado)
export function observarUsuario(callback) {
    return onAuthStateChanged(auth, callback);
}