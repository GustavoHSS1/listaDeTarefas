/* ==========================================================================
   1. SELETORES (referências aos elementos do HTML)
   ========================================================================== */

const entradaTarefa = document.getElementById('entradaTarefa');
const entradaHora = document.getElementById('entradaHora');
const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');
const botaoModoEscuro = document.getElementById('botaoModoEscuro');
const avisoHora = document.getElementById('avisoHora');


/* ==========================================================================
   2. MODO ESCURO (aplicar preferência salva e alternar ao clicar)
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

// aplica a preferência salva assim que a página carrega
aplicarModoEscuro(localStorage.getItem('modoEscuro') === 'true');

botaoModoEscuro.addEventListener('click', alternarModoEscuro);


/* ==========================================================================
   3. ARMAZENAMENTO (ler e salvar no localStorage)
   ========================================================================== */

function obterTarefas() {
    const tarefas = localStorage.getItem('tarefas');
    return tarefas ? JSON.parse(tarefas) : [];
}

function salvarTarefas(tarefas) {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}


/* ==========================================================================
   4. VALIDAÇÃO DE HORÁRIO
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

// assim que o usuário mexe no campo de novo, o aviso some
entradaHora.addEventListener('input', esconderErroHora);


/* ==========================================================================
   5. ORDENAÇÃO (tarefas com hora aparecem antes, em ordem crescente)
   ========================================================================== */

function ordenarPorHora(tarefas) {
    return [...tarefas].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });
}


/* ==========================================================================
   6. AÇÕES SOBRE TAREFAS (adicionar / remover)
   ========================================================================== */

function adicionarTarefa(texto, hora) {
    if (!texto.trim()) return;

    if (!horaValida(hora)) {
        mostrarErroHora();
        return;
    }

    esconderErroHora();
    const tarefas = obterTarefas();
    tarefas.push({ texto: texto.trim(), hora });
    salvarTarefas(tarefas);
    renderizarTarefas();
    entradaTarefa.value = '';
    entradaHora.value = '';
    entradaTarefa.focus();
}

function removerTarefa(indiceOriginal) {
    const tarefas = obterTarefas();
    tarefas.splice(indiceOriginal, 1);
    salvarTarefas(tarefas);
    renderizarTarefas();
}


/* ==========================================================================
   7. MODO DE EDIÇÃO (troca texto/hora por inputs editáveis)
   ========================================================================== */

function ativarModoEdicao({ itemLista, infoTarefa, acoesTarefa, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa, indice }) {
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
    botaoEditar.textContent = 'Salvar';
    botaoEditar.dataset.editing = 'true';
    botaoRemover.style.display = 'none'; // esconde o Remover durante a edição

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

        const tarefasAtual = obterTarefas();
        tarefasAtual[indice] = { texto: novoTexto, hora: inputEdicaoHora.value };
        salvarTarefas(tarefasAtual);
        renderizarTarefas();
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
   8. CRIAÇÃO DE CADA ITEM DA LISTA (elementos HTML de uma tarefa)
   ========================================================================== */

function criarItemTarefa(tarefa, indice) {
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
    botaoRemover.onclick = () => removerTarefa(indice);

    acoesTarefa.appendChild(botaoEditar);
    acoesTarefa.appendChild(botaoRemover);

    botaoEditar.onclick = () => {
        if (botaoEditar.dataset.editing === 'true') return;
        ativarModoEdicao({ itemLista, infoTarefa, acoesTarefa, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa, indice });
    };

    itemLista.appendChild(infoTarefa);
    itemLista.appendChild(acoesTarefa);

    return itemLista;
}


/* ==========================================================================
   9. RENDERIZAÇÃO (desenha a lista inteira na tela)
   ========================================================================== */

function renderizarTarefas() {
    listaTarefas.innerHTML = '';
    const tarefas = obterTarefas();

    if (tarefas.length === 0) {
        const vazio = document.createElement('li');
        vazio.className = 'vazio';
        vazio.textContent = 'Nenhuma tarefa por aqui ainda.';
        listaTarefas.appendChild(vazio);
        return;
    }

    const tarefasOrdenadas = ordenarPorHora(tarefas);

    tarefasOrdenadas.forEach((tarefa) => {
        const indice = tarefas.indexOf(tarefa);
        const itemLista = criarItemTarefa(tarefa, indice);
        listaTarefas.appendChild(itemLista);
    });
}


/* ==========================================================================
   10. EVENTOS (clique no botão, tecla Enter no input)
   ========================================================================== */

botaoAdicionarTarefa.addEventListener('click', () => {
    adicionarTarefa(entradaTarefa.value, entradaHora.value);
});

entradaTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa(entradaTarefa.value, entradaHora.value);
    }
});


/* ==========================================================================
   11. INICIALIZAÇÃO
   ========================================================================== */

renderizarTarefas();