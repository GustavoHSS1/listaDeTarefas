import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


/* ==========================================================================
   1. CONFIGURAÇÃO DO FIREBASE
   ========================================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyB1VuM8VTwglUL-KK_YfqQgI03IjoPAIpw",
    authDomain: "minha-agenda-713.firebaseapp.com",
    projectId: "minha-agenda-713",
    storageBucket: "minha-agenda-713.firebasestorage.app",
    messagingSenderId: "707157289905",
    appId: "1:707157289905:web:bb1a8114c1e09f91b1ab90"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* ==========================================================================
   2. SELETORES (referências aos elementos do HTML)
   ========================================================================== */

const telaLogin = document.getElementById('telaLogin');
const telaApp = document.getElementById('telaApp');
const loginEmail = document.getElementById('loginEmail');
const loginSenha = document.getElementById('loginSenha');
const botaoEntrar = document.getElementById('botaoEntrar');
const botaoCriarConta = document.getElementById('botaoCriarConta');
const avisoLogin = document.getElementById('avisoLogin');
const emailUsuario = document.getElementById('emailUsuario');
const botaoSair = document.getElementById('botaoSair');

const entradaTarefa = document.getElementById('entradaTarefa');
const entradaHora = document.getElementById('entradaHora');
const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');
const botaoModoEscuro = document.getElementById('botaoModoEscuro');
const avisoHora = document.getElementById('avisoHora');

let tarefasAtuais = [];
let pararDeOuvirTarefas = null; // cancela o listener do Firestore ao sair da conta


/* ==========================================================================
   3. MODO ESCURO (aplicar preferência salva e alternar ao clicar)
   ========================================================================== */

function aplicarModoEscuro(ativo) {
    document.body.classList.toggle('modo-escuro', ativo);
    botaoModoEscuro.textContent = ativo ? '☀️' : '🌙';
}

function alternarModoEscuro() {
    const ativo = !document.body.classList.contains('modo-escuro');
    aplicarModoEscuro(ativo);
    localStorage.setItem('modoEscuro', ativo ? 'true' : 'false');
}

// preferência de tema continua no localStorage: é do dispositivo, não do usuário
aplicarModoEscuro(localStorage.getItem('modoEscuro') === 'true');
botaoModoEscuro.addEventListener('click', alternarModoEscuro);


/* ==========================================================================
   4. AUTENTICAÇÃO (login, cadastro, logout)
   ========================================================================== */

function mostrarErroLogin(mensagem) {
    avisoLogin.textContent = mensagem;
    avisoLogin.classList.add('mostrar');
}

function esconderErroLogin() {
    avisoLogin.classList.remove('mostrar');
}

function traduzirErroFirebase(codigo) {
    const mensagens = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/missing-password': 'Digite uma senha.',
        'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
        'auth/email-already-in-use': 'Esse e-mail já tem uma conta. Tente entrar.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-not-found': 'E-mail ou senha incorretos.',
        'auth/wrong-password': 'E-mail ou senha incorretos.',
        'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.'
    };
    return mensagens[codigo] || 'Não foi possível completar a ação. Tente novamente.';
}

botaoEntrar.addEventListener('click', () => {
    esconderErroLogin();
    signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginSenha.value)
        .catch((erro) => mostrarErroLogin(traduzirErroFirebase(erro.code)));
});

botaoCriarConta.addEventListener('click', () => {
    esconderErroLogin();
    createUserWithEmailAndPassword(auth, loginEmail.value.trim(), loginSenha.value)
        .catch((erro) => mostrarErroLogin(traduzirErroFirebase(erro.code)));
});

botaoSair.addEventListener('click', () => {
    signOut(auth);
});

// dispara sempre que o estado de login muda (entrou, saiu, abriu a página já logado)
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        telaLogin.classList.add('escondido');
        telaApp.classList.remove('escondido');
        emailUsuario.textContent = usuario.email;
        loginEmail.value = '';
        loginSenha.value = '';
        ouvirTarefas(usuario.uid);
    } else {
        telaApp.classList.add('escondido');
        telaLogin.classList.remove('escondido');

        if (pararDeOuvirTarefas) {
            pararDeOuvirTarefas();
            pararDeOuvirTarefas = null;
        }

        tarefasAtuais = [];
        listaTarefas.innerHTML = '';
    }
});


/* ==========================================================================
   5. VALIDAÇÃO DE HORÁRIO
   ========================================================================== */

function horaValida(hora) {
    return typeof hora === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

function mostrarErroHora() {
    entradaHora.classList.add('campo-invalido');
    avisoHora.classList.add('mostrar');
}

function esconderErroHora() {
    entradaHora.classList.remove('campo-invalido');
    avisoHora.classList.remove('mostrar');
}

entradaHora.addEventListener('input', esconderErroHora);


/* ==========================================================================
   6. ORDENAÇÃO (tarefas com hora aparecem antes, em ordem crescente)
   ========================================================================== */

function ordenarPorHora(tarefas) {
    return [...tarefas].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });
}


/* ==========================================================================
   7. FIRESTORE (ouvir, adicionar, editar e remover tarefas do usuário logado)
   ========================================================================== */

function ouvirTarefas(uid) {
    const consulta = query(collection(db, 'tarefas'), where('uid', '==', uid));

    // onSnapshot fica "ouvindo" o banco: qualquer mudança (deste dispositivo
    // ou de outro) atualiza a tela na hora, sem precisar recarregar a página
    pararDeOuvirTarefas = onSnapshot(consulta, (snapshot) => {
        tarefasAtuais = snapshot.docs.map((documento) => ({
            id: documento.id,
            texto: documento.data().texto,
            hora: documento.data().hora
        }));
        renderizarTarefas();
    });
}

function adicionarTarefa(texto, hora) {
    if (!texto.trim()) return;

    if (!horaValida(hora)) {
        mostrarErroHora();
        return;
    }

    esconderErroHora();

    addDoc(collection(db, 'tarefas'), {
        uid: auth.currentUser.uid,
        texto: texto.trim(),
        hora
    });

    entradaTarefa.value = '';
    entradaHora.value = '';
    entradaTarefa.focus();
}

function removerTarefa(id) {
    deleteDoc(doc(db, 'tarefas', id));
}

function editarTarefa(id, novoTexto, novaHora) {
    updateDoc(doc(db, 'tarefas', id), {
        texto: novoTexto,
        hora: novaHora
    });
}


/* ==========================================================================
   8. MODO DE EDIÇÃO (troca texto/hora por inputs editáveis)
   ========================================================================== */

function ativarModoEdicao({ infoTarefa, acoesTarefa, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa }) {
    const inputEdicaoHora = document.createElement('input');
    inputEdicaoHora.type = 'time';
    inputEdicaoHora.value = tarefa.hora || '';
    inputEdicaoHora.className = 'input-edicao-hora';

    const inputEdicaoTexto = document.createElement('input');
    inputEdicaoTexto.type = 'text';
    inputEdicaoTexto.value = tarefa.texto;
    inputEdicaoTexto.className = 'input-edicao';

    infoTarefa.replaceChild(inputEdicaoHora, horaTarefa);
    infoTarefa.replaceChild(inputEdicaoTexto, textoTarefa);
    infoTarefa.classList.add('editando');
    botaoEditar.textContent = 'Salvar';
    botaoEditar.dataset.editing = 'true';
    botaoRemover.style.display = 'none';

    const avisoEdicao = document.createElement('span');
    avisoEdicao.className = 'aviso-erro-edicao';
    avisoEdicao.textContent = 'Selecione um horário válido.';

    inputEdicaoTexto.focus();

    const mostrarErroEdicao = () => {
        inputEdicaoHora.classList.add('campo-invalido');
        if (!avisoEdicao.isConnected) acoesTarefa.appendChild(avisoEdicao);
    };

    const esconderErroEdicao = () => {
        inputEdicaoHora.classList.remove('campo-invalido');
        avisoEdicao.remove();
    };

    inputEdicaoHora.addEventListener('input', esconderErroEdicao);

    const salvarEdicao = () => {
        const novoTexto = inputEdicaoTexto.value.trim();
        if (!novoTexto) return;

        if (!horaValida(inputEdicaoHora.value)) {
            mostrarErroEdicao();
            return;
        }

        editarTarefa(tarefa.id, novoTexto, inputEdicaoHora.value);
    };

    inputEdicaoTexto.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') salvarEdicao();
        if (e.key === 'Escape') renderizarTarefas();
    });

    botaoEditar.onclick = () => {
        if (botaoEditar.dataset.editing === 'true') {
            salvarEdicao();
        }
    };
}


/* ==========================================================================
   9. CRIAÇÃO DE CADA ITEM DA LISTA (elementos HTML de uma tarefa)
   ========================================================================== */

function criarItemTarefa(tarefa) {
    const itemLista = document.createElement('li');

    const infoTarefa = document.createElement('div');
    infoTarefa.className = 'info-tarefa';

    const horaTarefa = document.createElement('span');
    horaTarefa.className = 'hora-tarefa';
    horaTarefa.textContent = tarefa.hora || '--:--';

    const textoTarefa = document.createElement('span');
    textoTarefa.textContent = tarefa.texto;

    infoTarefa.appendChild(horaTarefa);
    infoTarefa.appendChild(textoTarefa);

    const acoesTarefa = document.createElement('div');
    acoesTarefa.className = 'acoes-tarefa';

    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.className = 'botao-editar';

    const botaoRemover = document.createElement('button');
    botaoRemover.textContent = 'Remover';
    botaoRemover.className = 'botao-remover';
    botaoRemover.onclick = () => removerTarefa(tarefa.id);

    acoesTarefa.appendChild(botaoEditar);
    acoesTarefa.appendChild(botaoRemover);

    botaoEditar.onclick = () => {
        if (botaoEditar.dataset.editing === 'true') return;
        ativarModoEdicao({ infoTarefa, acoesTarefa, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa });
    };

    itemLista.appendChild(infoTarefa);
    itemLista.appendChild(acoesTarefa);

    return itemLista;
}


/* ==========================================================================
   10. RENDERIZAÇÃO (desenha a lista inteira na tela)
   ========================================================================== */

function renderizarTarefas() {
    listaTarefas.innerHTML = '';

    if (tarefasAtuais.length === 0) {
        const vazio = document.createElement('li');
        vazio.className = 'vazio';
        vazio.textContent = 'Nenhuma tarefa por aqui ainda.';
        listaTarefas.appendChild(vazio);
        return;
    }

    ordenarPorHora(tarefasAtuais).forEach((tarefa) => {
        listaTarefas.appendChild(criarItemTarefa(tarefa));
    });
}


/* ==========================================================================
   11. EVENTOS (clique no botão, tecla Enter no input)
   ========================================================================== */

botaoAdicionarTarefa.addEventListener('click', () => {
    adicionarTarefa(entradaTarefa.value, entradaHora.value);
});

entradaTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa(entradaTarefa.value, entradaHora.value);
    }
});