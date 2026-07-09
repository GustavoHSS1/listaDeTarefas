/* ==========================================================================
   1. SELETORES (referências aos elementos do HTML)
   ========================================================================== */

const entradaTarefa = document.getElementById('entradaTarefa');
const entradaHora = document.getElementById('entradaHora');
const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');


/* ==========================================================================
   2. ARMAZENAMENTO (ler e salvar no localStorage)
   ========================================================================== */

function obterTarefas() {
    const tarefas = localStorage.getItem('tarefas');
    return tarefas ? JSON.parse(tarefas) : [];
}

function salvarTarefas(tarefas) {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}


/* ==========================================================================
   3. ORDENAÇÃO (tarefas com hora aparecem antes, em ordem crescente)
   ========================================================================== */

function ordenarPorHora(tarefas) {
    return [...tarefas].sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });
}


/* ==========================================================================
   4. AÇÕES SOBRE TAREFAS (adicionar / remover)
   ========================================================================== */

function adicionarTarefa(texto, hora) {
    if (!texto.trim()) return;
    const tarefas = obterTarefas();
    tarefas.push({ texto: texto.trim(), hora: hora || '' });
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
   5. MODO DE EDIÇÃO (troca texto/hora por inputs editáveis)
   ========================================================================== */

function ativarModoEdicao({ itemLista, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa, indice }) {
    const inputEdicaoHora = document.createElement('input');
    inputEdicaoHora.type = 'time';
    inputEdicaoHora.value = tarefa.hora || '';
    inputEdicaoHora.className = 'input-edicao-hora';

    const inputEdicaoTexto = document.createElement('input');
    inputEdicaoTexto.type = 'text';
    inputEdicaoTexto.value = tarefa.texto;
    inputEdicaoTexto.className = 'input-edicao';

    itemLista.replaceChild(inputEdicaoHora, horaTarefa);
    itemLista.replaceChild(inputEdicaoTexto, textoTarefa);
    botaoEditar.textContent = 'Salvar';
    botaoEditar.dataset.editing = 'true';
    botaoRemover.style.display = 'none'; // esconde o Remover durante a edição

    inputEdicaoTexto.focus();

    const salvarEdicao = () => {
        const novoTexto = inputEdicaoTexto.value.trim();
        if (!novoTexto) return;
        const tarefasAtual = obterTarefas();
        tarefasAtual[indice] = { texto: novoTexto, hora: inputEdicaoHora.value || '' };
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
   6. CRIAÇÃO DE CADA ITEM DA LISTA (elementos HTML de uma tarefa)
   ========================================================================== */

function criarItemTarefa(tarefa, indice) {
    const itemLista = document.createElement('li');

    const horaTarefa = document.createElement('span');
    horaTarefa.className = 'hora-tarefa';
    horaTarefa.textContent = tarefa.hora || '--:--';

    const textoTarefa = document.createElement('span');
    textoTarefa.textContent = tarefa.texto;

    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.className = 'botao-editar';

    const botaoRemover = document.createElement('button');
    botaoRemover.textContent = 'Remover';
    botaoRemover.className = 'botao-remover';
    botaoRemover.onclick = () => removerTarefa(indice);

    botaoEditar.onclick = () => {
        if (botaoEditar.dataset.editing === 'true') return;
        ativarModoEdicao({ itemLista, horaTarefa, textoTarefa, botaoEditar, botaoRemover, tarefa, indice });
    };

    itemLista.appendChild(horaTarefa);
    itemLista.appendChild(textoTarefa);
    itemLista.appendChild(botaoEditar);
    itemLista.appendChild(botaoRemover);

    return itemLista;
}


/* ==========================================================================
   7. RENDERIZAÇÃO (desenha a lista inteira na tela)
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
   8. EVENTOS (clique no botão, tecla Enter no input)
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
   9. INICIALIZAÇÃO
   ========================================================================== */

renderizarTarefas();