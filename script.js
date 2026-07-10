import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
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
const botaoModoEscuro = document.getElementById('botaoModoEscuro');

// menu lateral
const botaoMenu = document.getElementById('botaoMenu');
const overlayMenu = document.getElementById('overlayMenu');
const itensMenu = document.querySelectorAll('.item-menu');
const viewLembretes = document.getElementById('viewLembretes');
const viewCalendario = document.getElementById('viewCalendario');
const viewConta = document.getElementById('viewConta');
const views = { lembretes: viewLembretes, calendario: viewCalendario, conta: viewConta };

// lembretes
const entradaTarefa = document.getElementById('entradaTarefa');
const entradaHora = document.getElementById('entradaHora');
const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');
const avisoHora = document.getElementById('avisoHora');

// calendário
const mesAnterior = document.getElementById('mesAnterior');
const mesProximo = document.getElementById('mesProximo');
const mesAnoAtual = document.getElementById('mesAnoAtual');
const calendarioGrade = document.getElementById('calendarioGrade');
const painelDiaSelecionado = document.getElementById('painelDiaSelecionado');
const tituloDiaSelecionado = document.getElementById('tituloDiaSelecionado');
const entradaTarefaData = document.getElementById('entradaTarefaData');
const entradaHoraData = document.getElementById('entradaHoraData');
const botaoAdicionarTarefaData = document.getElementById('botaoAdicionarTarefaData');
const listaTarefasData = document.getElementById('listaTarefasData');
const avisoData = document.getElementById('avisoData');

// minha conta
const emailUsuario = document.getElementById('emailUsuario');
const senhaAtual = document.getElementById('senhaAtual');
const novaSenha = document.getElementById('novaSenha');
const botaoTrocarSenha = document.getElementById('botaoTrocarSenha');
const avisoSenha = document.getElementById('avisoSenha');
const sucessoSenha = document.getElementById('sucessoSenha');
const botaoSair = document.getElementById('botaoSair');

// modal de nota
const modalNota = document.getElementById('modalNota');
const textoNota = document.getElementById('textoNota');
const botaoSalvarNota = document.getElementById('botaoSalvarNota');
const botaoFecharNota = document.getElementById('botaoFecharNota');

const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let tarefasAtuais = [];
let pararDeOuvirTarefas = null; // cancela o listener do Firestore ao sair da conta
let tarefaAtualNota = null; // qual tarefa está aberta no modal de observação
let mesExibido = new Date(); // mês/ano que a grade do calendário está mostrando
let dataSelecionadaValor = ''; // dia clicado na grade, formato 'AAAA-MM-DD'


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

aplicarModoEscuro(localStorage.getItem('modoEscuro') === 'true');
botaoModoEscuro.addEventListener('click', alternarModoEscuro);


/* ==========================================================================
   4. MENU LATERAL (abrir/fechar e trocar de tela)
   ========================================================================== */

function abrirMenu() {
    document.body.classList.add('menu-aberto');
}

function fecharMenu() {
    document.body.classList.remove('menu-aberto');
}

function mostrarView(nome) {
    Object.entries(views).forEach(([chave, elemento]) => {
        elemento.classList.toggle('escondido', chave !== nome);
    });

    itensMenu.forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.view === nome);
    });

    fecharMenu();

    if (nome === 'calendario') renderizarGradeCalendario();
}

botaoMenu.addEventListener('click', abrirMenu);
overlayMenu.addEventListener('click', fecharMenu);

itensMenu.forEach((botao) => {
    botao.addEventListener('click', () => mostrarView(botao.dataset.view));
});


/* ==========================================================================
   5. AUTENTICAÇÃO (login, cadastro, logout)
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
        'auth/wrong-password': 'Senha atual incorreta.',
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

onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        telaLogin.classList.add('escondido');
        telaApp.classList.remove('escondido');
        emailUsuario.textContent = usuario.email;
        loginEmail.value = '';
        loginSenha.value = '';
        mostrarView('lembretes');
        ouvirTarefas(usuario.uid);
    } else {
        telaApp.classList.add('escondido');
        telaLogin.classList.remove('escondido');
        fecharMenu();

        if (pararDeOuvirTarefas) {
            pararDeOuvirTarefas();
            pararDeOuvirTarefas = null;
        }

        tarefasAtuais = [];
        dataSelecionadaValor = '';
        painelDiaSelecionado.classList.add('escondido');
        listaTarefas.innerHTML = '';
        listaTarefasData.innerHTML = '';
    }
});


/* ==========================================================================
   6. TROCAR SENHA (Minha conta)
   ========================================================================== */

function mostrarErroSenha(mensagem) {
    sucessoSenha.classList.remove('mostrar');
    avisoSenha.textContent = mensagem;
    avisoSenha.classList.add('mostrar');
}

function mostrarSucessoSenha(mensagem) {
    avisoSenha.classList.remove('mostrar');
    sucessoSenha.textContent = mensagem;
    sucessoSenha.classList.add('mostrar');
}

botaoTrocarSenha.addEventListener('click', () => {
    avisoSenha.classList.remove('mostrar');
    sucessoSenha.classList.remove('mostrar');

    if (novaSenha.value.length < 6) {
        mostrarErroSenha('A nova senha precisa ter pelo menos 6 caracteres.');
        return;
    }

    const credencial = EmailAuthProvider.credential(auth.currentUser.email, senhaAtual.value);

    reauthenticateWithCredential(auth.currentUser, credencial)
        .then(() => updatePassword(auth.currentUser, novaSenha.value))
        .then(() => {
            mostrarSucessoSenha('Senha alterada com sucesso!');
            senhaAtual.value = '';
            novaSenha.value = '';
        })
        .catch((erro) => mostrarErroSenha(traduzirErroFirebase(erro.code)));
});


/* ==========================================================================
   7. VALIDAÇÃO DE HORÁRIO
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
   8. ORDENAÇÃO (tarefas com hora aparecem antes, em ordem crescente)
   ========================================================================== */

function ordenarPorHora(tarefas) {
    return [...tarefas].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });
}


/* ==========================================================================
   9. FIRESTORE (ouvir, adicionar, editar e remover tarefas do usuário logado)
   ========================================================================== */

function ouvirTarefas(uid) {
    const consulta = query(collection(db, 'tarefas'), where('uid', '==', uid));

    pararDeOuvirTarefas = onSnapshot(consulta, (snapshot) => {
        tarefasAtuais = snapshot.docs.map((documento) => ({
            id: documento.id,
            texto: documento.data().texto,
            hora: documento.data().hora,
            data: documento.data().data || '',
            nota: documento.data().nota || ''
        }));
        renderizarTarefas();
        renderizarGradeCalendario();
        renderizarListaDoDia();
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
        hora,
        data: '',
        nota: ''
    });

    entradaTarefa.value = '';
    entradaHora.value = '';
    entradaTarefa.focus();
}

function mostrarErroData(mensagem) {
    avisoData.textContent = mensagem;
    avisoData.classList.add('mostrar');
}

function esconderErroData() {
    avisoData.classList.remove('mostrar');
}

function adicionarTarefaData(texto, hora) {
    if (!texto.trim()) return;

    if (!dataSelecionadaValor) {
        mostrarErroData('Selecione uma data antes de adicionar.');
        return;
    }

    if (!horaValida(hora)) {
        mostrarErroData('Selecione um horário válido para adicionar a tarefa.');
        return;
    }

    esconderErroData();

    addDoc(collection(db, 'tarefas'), {
        uid: auth.currentUser.uid,
        texto: texto.trim(),
        hora,
        data: dataSelecionadaValor,
        nota: ''
    });

    entradaTarefaData.value = '';
    entradaHoraData.value = '';
    entradaTarefaData.focus();
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
   10. MODAL DE OBSERVAÇÃO / NOTA
   ========================================================================== */

function abrirNota(tarefa) {
    tarefaAtualNota = tarefa;
    textoNota.value = tarefa.nota || '';
    modalNota.classList.remove('escondido');
    textoNota.focus();
}

function fecharNota() {
    modalNota.classList.add('escondido');
    tarefaAtualNota = null;
}

botaoFecharNota.addEventListener('click', fecharNota);

botaoSalvarNota.addEventListener('click', () => {
    if (!tarefaAtualNota) return;
    updateDoc(doc(db, 'tarefas', tarefaAtualNota.id), { nota: textoNota.value.trim() });
    fecharNota();
});

modalNota.addEventListener('click', (evento) => {
    if (evento.target === modalNota) fecharNota();
});


/* ==========================================================================
   11. MODO DE EDIÇÃO (troca texto/hora por inputs editáveis)
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
        if (e.key === 'Escape') {
            renderizarTarefas();
            renderizarListaDoDia();
        }
    });

    botaoEditar.onclick = () => {
        if (botaoEditar.dataset.editing === 'true') {
            salvarEdicao();
        }
    };
}


/* ==========================================================================
   12. CRIAÇÃO DE CADA ITEM DA LISTA (elementos HTML de uma tarefa)
   ========================================================================== */

function criarItemTarefa(tarefa) {
    const itemLista = document.createElement('li');

    const linhaTarefa = document.createElement('div');
    linhaTarefa.className = 'linha-tarefa';

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

    linhaTarefa.appendChild(infoTarefa);
    linhaTarefa.appendChild(acoesTarefa);
    itemLista.appendChild(linhaTarefa);

    // observação: aparece direto na tela quando existe, sem precisar clicar
    const blocoNota = document.createElement('div');
    blocoNota.className = 'bloco-nota';

    if (tarefa.nota) {
        const textoNotaEl = document.createElement('span');
        textoNotaEl.className = 'texto-nota';
        textoNotaEl.textContent = `📌 ${tarefa.nota}`;

        const botaoEditarNota = document.createElement('button');
        botaoEditarNota.textContent = '✏️';
        botaoEditarNota.className = 'botao-editar-nota';
        botaoEditarNota.title = 'Editar observação';
        botaoEditarNota.onclick = () => abrirNota(tarefa);

        blocoNota.appendChild(textoNotaEl);
        blocoNota.appendChild(botaoEditarNota);
    } else {
        const botaoAdicionarNota = document.createElement('button');
        botaoAdicionarNota.textContent = '+ Adicionar observação';
        botaoAdicionarNota.className = 'botao-adicionar-nota';
        botaoAdicionarNota.onclick = () => abrirNota(tarefa);

        blocoNota.appendChild(botaoAdicionarNota);
    }

    itemLista.appendChild(blocoNota);

    return itemLista;
}

function criarListaVazia(mensagem) {
    const vazio = document.createElement('li');
    vazio.className = 'vazio';
    vazio.textContent = mensagem;
    return vazio;
}


/* ==========================================================================
   13. RENDERIZAÇÃO DAS LISTAS
   ========================================================================== */

// Lembretes: tarefas sem data específica (a lista original, sem filtro)
function renderizarTarefas() {
    listaTarefas.innerHTML = '';
    const tarefasSemData = tarefasAtuais.filter((tarefa) => !tarefa.data);

    if (tarefasSemData.length === 0) {
        listaTarefas.appendChild(criarListaVazia('Nenhuma tarefa por aqui ainda.'));
        return;
    }

    ordenarPorHora(tarefasSemData).forEach((tarefa) => {
        listaTarefas.appendChild(criarItemTarefa(tarefa));
    });
}

// Calendário: lista de tarefas do dia selecionado na grade
function renderizarListaDoDia() {
    listaTarefasData.innerHTML = '';

    if (!dataSelecionadaValor) return;

    const tarefasDoDia = tarefasAtuais.filter((tarefa) => tarefa.data === dataSelecionadaValor);

    if (tarefasDoDia.length === 0) {
        listaTarefasData.appendChild(criarListaVazia('Nenhum lembrete para esse dia ainda.'));
        return;
    }

    ordenarPorHora(tarefasDoDia).forEach((tarefa) => {
        listaTarefasData.appendChild(criarItemTarefa(tarefa));
    });
}


/* ==========================================================================
   14. CALENDÁRIO (grade do mês, navegação e seleção de dia)
   ========================================================================== */

function paraISO(ano, mesIndex, dia) {
    const mm = String(mesIndex + 1).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return `${ano}-${mm}-${dd}`;
}

function formatarDataExtenso(iso) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return `${dia} de ${nomesMeses[mes - 1]} de ${ano}`;
}

function renderizarGradeCalendario() {
    const ano = mesExibido.getFullYear();
    const mesIndex = mesExibido.getMonth();

    mesAnoAtual.textContent = `${nomesMeses[mesIndex]} de ${ano}`;
    calendarioGrade.innerHTML = '';

    diasDaSemana.forEach((label) => {
        const celulaLabel = document.createElement('div');
        celulaLabel.className = 'dia-semana';
        celulaLabel.textContent = label;
        calendarioGrade.appendChild(celulaLabel);
    });

    const primeiroDiaSemana = new Date(ano, mesIndex, 1).getDay();
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate();
    const hoje = new Date();
    const hojeISO = paraISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'dia-celula vazio';
        calendarioGrade.appendChild(vazio);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const iso = paraISO(ano, mesIndex, dia);
        const celula = document.createElement('button');
        celula.className = 'dia-celula';
        celula.textContent = dia;

        if (iso === hojeISO) celula.classList.add('hoje');
        if (iso === dataSelecionadaValor) celula.classList.add('selecionado');
        if (tarefasAtuais.some((tarefa) => tarefa.data === iso)) celula.classList.add('tem-tarefa');

        celula.onclick = () => selecionarData(iso);
        calendarioGrade.appendChild(celula);
    }
}

function selecionarData(iso) {
    dataSelecionadaValor = iso;
    renderizarGradeCalendario();
    painelDiaSelecionado.classList.remove('escondido');
    tituloDiaSelecionado.textContent = formatarDataExtenso(iso);
    esconderErroData();
    renderizarListaDoDia();
}

mesAnterior.addEventListener('click', () => {
    mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1);
    renderizarGradeCalendario();
});

mesProximo.addEventListener('click', () => {
    mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1);
    renderizarGradeCalendario();
});


/* ==========================================================================
   15. EVENTOS (clique nos botões, tecla Enter)
   ========================================================================== */

botaoAdicionarTarefa.addEventListener('click', () => {
    adicionarTarefa(entradaTarefa.value, entradaHora.value);
});

entradaTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa(entradaTarefa.value, entradaHora.value);
    }
});

botaoAdicionarTarefaData.addEventListener('click', () => {
    adicionarTarefaData(entradaTarefaData.value, entradaHoraData.value);
});

entradaTarefaData.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefaData(entradaTarefaData.value, entradaHoraData.value);
    }
});