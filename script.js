import { entrar, criarConta, sair, trocarSenha, traduzirErroFirebase, observarUsuario } from './auth.js';
import { ouvirTarefasDoUsuario, criarTarefa, editarTarefa, atualizarNotaTarefa, removerTarefa } from './tarefas.js';
import { nomesMeses, diasDaSemana, paraISO, formatarDataExtenso, obterInfoDoMes } from './calendario-utils.js';
import { iniciarTema } from './tema.js';
import { iniciarMenu, mostrarView, fecharMenu } from './menu.js';


/* ==========================================================================
   1. SELETORES (referências aos elementos do HTML)
   ========================================================================== */

const telaLogin = document.getElementById('telaLogin');
const telaApp = document.getElementById('telaApp');
const loginEmail = document.getElementById('loginEmail');
const loginSenha = document.getElementById('loginSenha');
const botaoEntrar = document.getElementById('botaoEntrar');
const botaoCriarConta = document.getElementById('botaoCriarConta');
const avisoLogin = document.getElementById('avisoLogin');

// lembretes
const entradaTarefa = document.getElementById('entradaTarefa');
const entradaHora = document.getElementById('entradaHora');
const entradaDataLembrete = document.getElementById('entradaDataLembrete');
const seletorCorLembrete = document.getElementById('seletorCorLembrete');
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
const listaTarefasData = document.getElementById('listaTarefasData');

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

let tarefasAtuais = [];
let pararDeOuvirTarefas = null;
let tarefaAtualNota = null;
let mesExibido = new Date();
let dataSelecionadaValor = '';
let corSelecionadaLembrete = '';
let hojeConhecido = paraISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

const paletaCores = {
    vermelho: '#ef4444',
    azul: '#3b82f6',
    amarelo: '#f5b400',
    verde: '#22c55e',
    roxo: '#a855f7'
};


/* ==========================================================================
   2. INICIALIZAÇÃO DOS MÓDULOS DE TEMA E MENU
   ========================================================================== */

iniciarTema();

iniciarMenu((nome) => {
    if (nome === 'calendario') renderizarGradeCalendario();
});


/* ==========================================================================
   2.5 SELETOR DE COR (botão compacto + popover, usado nos 2 formulários e na edição)
   ========================================================================== */

const opcoesDeCor = [
    { cor: '', classe: 'swatch-sem-cor', titulo: 'Sem cor' },
    { cor: 'vermelho', hex: '#ef4444', titulo: 'Vermelho' },
    { cor: 'azul', hex: '#3b82f6', titulo: 'Azul' },
    { cor: 'amarelo', hex: '#f5b400', titulo: 'Amarelo' },
    { cor: 'verde', hex: '#22c55e', titulo: 'Verde' },
    { cor: 'roxo', hex: '#a855f7', titulo: 'Roxo' }
];

// Monta um botão circular (mostra a cor atual) que abre um popover com as
// opções ao clicar. Retorna um objeto com "resetar()" pra voltar a "sem cor".
function construirSeletorCor(container, corInicial, aoSelecionar) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'botao-cor-trigger';
    trigger.title = 'Escolher cor';

    const popover = document.createElement('div');
    popover.className = 'popover-cor escondido';

    function atualizarTrigger(cor) {
        const opcao = opcoesDeCor.find((o) => o.cor === cor);
        if (opcao && opcao.hex) {
            trigger.style.background = opcao.hex;
        } else {
            trigger.style.background = '';
        }
    }

    opcoesDeCor.forEach((opcao) => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'swatch-cor' + (opcao.classe ? ' ' + opcao.classe : '');
        if (opcao.hex) swatch.style.background = opcao.hex;
        swatch.title = opcao.titulo;
        if (opcao.cor === corInicial) swatch.classList.add('selecionado');

        swatch.addEventListener('click', (evento) => {
            evento.stopPropagation();
            popover.querySelectorAll('.swatch-cor').forEach((s) => s.classList.remove('selecionado'));
            swatch.classList.add('selecionado');
            atualizarTrigger(opcao.cor);
            aoSelecionar(opcao.cor);
            popover.classList.add('escondido');
        });

        popover.appendChild(swatch);
    });

    trigger.addEventListener('click', (evento) => {
        evento.stopPropagation();
        document.querySelectorAll('.popover-cor').forEach((p) => {
            if (p !== popover) p.classList.add('escondido');
        });
        popover.classList.toggle('escondido');
    });

    atualizarTrigger(corInicial);
    container.appendChild(trigger);
    container.appendChild(popover);

    return {
        resetar() {
            popover.querySelectorAll('.swatch-cor').forEach((s, indice) => s.classList.toggle('selecionado', indice === 0));
            atualizarTrigger('');
        }
    };
}

// fecha qualquer popover de cor aberto ao clicar fora dele
document.addEventListener('click', () => {
    document.querySelectorAll('.popover-cor').forEach((p) => p.classList.add('escondido'));
});

const controleCorLembrete = construirSeletorCor(seletorCorLembrete, '', (cor) => { corSelecionadaLembrete = cor; });


/* ==========================================================================
   3. AUTENTICAÇÃO (login, cadastro, logout)
   ========================================================================== */

botaoEntrar.addEventListener('click', () => {
    avisoLogin.classList.remove('mostrar');
    entrar(loginEmail.value.trim(), loginSenha.value)
        .catch((erro) => {
            avisoLogin.textContent = traduzirErroFirebase(erro.code);
            avisoLogin.classList.add('mostrar');
        });
});

botaoCriarConta.addEventListener('click', () => {
    avisoLogin.classList.remove('mostrar');
    criarConta(loginEmail.value.trim(), loginSenha.value)
        .catch((erro) => {
            avisoLogin.textContent = traduzirErroFirebase(erro.code);
            avisoLogin.classList.add('mostrar');
        });
});

botaoSair.addEventListener('click', () => {
    sair();
});

observarUsuario((usuario) => {
    if (usuario) {
        telaLogin.classList.add('escondido');
        telaApp.classList.remove('escondido');
        emailUsuario.textContent = usuario.email;
        loginEmail.value = '';
        loginSenha.value = '';
        mostrarView('lembretes');
        pararDeOuvirTarefas = ouvirTarefasDoUsuario(usuario.uid, (tarefas) => {
            tarefasAtuais = tarefas;
            renderizarTarefas();
            renderizarGradeCalendario();
            renderizarListaDoDia();
        });
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
   4. TROCAR SENHA (Minha conta)
   ========================================================================== */

botaoTrocarSenha.addEventListener('click', () => {
    avisoSenha.classList.remove('mostrar');
    sucessoSenha.classList.remove('mostrar');

    if (novaSenha.value.length < 6) {
        avisoSenha.textContent = 'A nova senha precisa ter pelo menos 6 caracteres.';
        avisoSenha.classList.add('mostrar');
        return;
    }

    trocarSenha(senhaAtual.value, novaSenha.value)
        .then(() => {
            sucessoSenha.textContent = 'Senha alterada com sucesso!';
            sucessoSenha.classList.add('mostrar');
            senhaAtual.value = '';
            novaSenha.value = '';
        })
        .catch((erro) => {
            avisoSenha.textContent = traduzirErroFirebase(erro.code);
            avisoSenha.classList.add('mostrar');
        });
});


/* ==========================================================================
   5. VALIDAÇÃO DE HORÁRIO
   ========================================================================== */

function horaValida(hora) {
    return typeof hora === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

entradaHora.addEventListener('input', () => {
    entradaHora.classList.remove('campo-invalido');
    avisoHora.classList.remove('mostrar');
});


/* ==========================================================================
   6. ORDENAÇÃO
   ========================================================================== */

function ordenarPorHora(tarefas) {
    return [...tarefas].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });
}


/* ==========================================================================
   7. AÇÕES SOBRE TAREFAS (adicionar em Lembretes e no Calendário)
   ========================================================================== */

function adicionarTarefaLembrete(texto, hora) {
    if (!texto.trim()) return;

    if (!horaValida(hora)) {
        entradaHora.classList.add('campo-invalido');
        avisoHora.classList.add('mostrar');
        return;
    }

    entradaHora.classList.remove('campo-invalido');
    avisoHora.classList.remove('mostrar');

    criarTarefa({
        texto: texto.trim(),
        hora,
        data: entradaDataLembrete.value || '',
        cor: corSelecionadaLembrete
    });

    entradaTarefa.value = '';
    entradaHora.value = '';
    entradaDataLembrete.value = '';
    corSelecionadaLembrete = '';
    controleCorLembrete.resetar();
    entradaTarefa.focus();
}


/* ==========================================================================
   8. MODAL DE OBSERVAÇÃO / NOTA
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
    atualizarNotaTarefa(tarefaAtualNota.id, textoNota.value.trim());
    fecharNota();
});

modalNota.addEventListener('click', (evento) => {
    if (evento.target === modalNota) fecharNota();
});


/* ==========================================================================
   9. MODO DE EDIÇÃO (troca texto/hora por inputs editáveis)
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
    botaoEditar.textContent = '✔️';
    botaoEditar.title = 'Salvar';
    botaoEditar.dataset.editing = 'true';
    botaoRemover.style.display = 'none';

    let corEdicaoSelecionada = tarefa.cor || '';
    const seletorEdicaoCor = document.createElement('div');
    seletorEdicaoCor.className = 'seletor-cor-wrapper';
    construirSeletorCor(seletorEdicaoCor, corEdicaoSelecionada, (cor) => { corEdicaoSelecionada = cor; });
    acoesTarefa.appendChild(seletorEdicaoCor);

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

    editarTarefa(tarefa.id, {
        texto: novoTexto,
        hora: inputEdicaoHora.value,
        cor: corEdicaoSelecionada
    });

    // Atualiza a tarefa localmente e sai do modo de edição na hora,
    // mesmo que nada tenha mudado (o Firestore não dispara o listener
    // quando os dados salvos são idênticos aos que já estavam em cache).
    tarefa.texto = novoTexto;
    tarefa.hora = inputEdicaoHora.value;
    tarefa.cor = corEdicaoSelecionada;

    renderizarTarefas();
    renderizarListaDoDia();
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
   10. CRIAÇÃO DE CADA ITEM DA LISTA
   ========================================================================== */

function criarItemTarefa(tarefa) {
    const itemLista = document.createElement('li');

    if (tarefa.cor && paletaCores[tarefa.cor]) {
        itemLista.style.borderLeftWidth = '4px';
        itemLista.style.borderLeftColor = paletaCores[tarefa.cor];
    }

    const linhaTarefa = document.createElement('div');
    linhaTarefa.className = 'linha-tarefa';

    const infoTarefa = document.createElement('div');
    infoTarefa.className = 'info-tarefa';

    const horaTarefa = document.createElement('span');
    horaTarefa.className = 'hora-tarefa';
    horaTarefa.textContent = tarefa.hora || '--:--';

    const textoTarefa = document.createElement('span');
    textoTarefa.className = 'texto-tarefa';
    textoTarefa.textContent = tarefa.texto;

    infoTarefa.appendChild(horaTarefa);
    infoTarefa.appendChild(textoTarefa);

    const acoesTarefa = document.createElement('div');
    acoesTarefa.className = 'acoes-tarefa';

    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = '✏️';
    botaoEditar.title = 'Editar';
    botaoEditar.className = 'botao-editar';

    const botaoRemover = document.createElement('button');
    botaoRemover.textContent = '🗑️';
    botaoRemover.title = 'Remover';
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

    const blocoNota = document.createElement('div');
    blocoNota.className = 'bloco-nota';

    if (tarefa.nota) {
        const textoNotaEl = document.createElement('span');
        textoNotaEl.className = 'texto-nota';
        textoNotaEl.textContent = `📌 ${tarefa.nota}`;

        const botaoEditarNota = document.createElement('button');
        botaoEditarNota.textContent = '🖊️';
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
   11. RENDERIZAÇÃO DAS LISTAS
   ========================================================================== */

function renderizarTarefas() {
    listaTarefas.innerHTML = '';
    const hojeISO = paraISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const tarefasVisiveisHoje = tarefasAtuais.filter((tarefa) => !tarefa.data || tarefa.data === hojeISO);

    if (tarefasVisiveisHoje.length === 0) {
        listaTarefas.appendChild(criarListaVazia('Nenhuma tarefa por aqui ainda.'));
        return;
    }

    ordenarPorHora(tarefasVisiveisHoje).forEach((tarefa) => {
        listaTarefas.appendChild(criarItemTarefa(tarefa));
    });
}

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
   12. CALENDÁRIO (grade do mês, navegação e seleção de dia)
   ========================================================================== */

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

    const { primeiroDiaSemana, diasNoMes } = obterInfoDoMes(ano, mesIndex);
    const hoje = new Date();
    const hojeISO = paraISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'dia-celula vazio';
        calendarioGrade.appendChild(vazio);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const iso = paraISO(ano, mesIndex, dia);
        const tarefasDoDia = tarefasAtuais.filter((tarefa) => tarefa.data === iso);

        const celula = document.createElement('button');
        celula.className = 'dia-celula';

        if (iso === hojeISO) celula.classList.add('hoje');
        if (iso === dataSelecionadaValor) celula.classList.add('selecionado');

        const numero = document.createElement('span');
        numero.textContent = dia;
        celula.appendChild(numero);

        if (tarefasDoDia.length > 0) {
            const pontos = document.createElement('div');
            pontos.className = 'dia-pontos';

            tarefasDoDia.forEach((tarefa) => {
                const ponto = document.createElement('span');
                if (tarefa.cor && paletaCores[tarefa.cor]) {
                    ponto.style.background = paletaCores[tarefa.cor];
                }
                pontos.appendChild(ponto);
            });

            celula.appendChild(pontos);
        }

        celula.onclick = () => selecionarData(iso);
        calendarioGrade.appendChild(celula);
    }
}

function selecionarData(iso) {
    dataSelecionadaValor = iso;
    renderizarGradeCalendario();
    painelDiaSelecionado.classList.remove('escondido');
    tituloDiaSelecionado.textContent = formatarDataExtenso(iso);
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
   13. EVENTOS DE FORMULÁRIO (clique nos botões, tecla Enter)
   ========================================================================== */

botaoAdicionarTarefa.addEventListener('click', () => {
    adicionarTarefaLembrete(entradaTarefa.value, entradaHora.value);
});

entradaTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefaLembrete(entradaTarefa.value, entradaHora.value);
    }
});


/* ==========================================================================
   14. VIRADA DE DIA (recalcula "hoje" sem precisar recarregar a página)
   ========================================================================== */

setInterval(() => {
    const hojeAgora = paraISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    if (hojeAgora !== hojeConhecido) {
        hojeConhecido = hojeAgora;
        renderizarTarefas();
        renderizarGradeCalendario();
    }
}, 60000);