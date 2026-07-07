const entradaTarefa = document.getElementById('entradaTarefa');
const botaoAdicionarTarefa = document.getElementById('botaoAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');

function obterTarefas() {
    const tarefas = localStorage.getItem('tarefas');
    return tarefas ? JSON.parse(tarefas) : [];
}

function salvarTarefas(tarefas) {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

function adicionarTarefa(tarefa) {
    if (!tarefa.trim()) return;
    const tarefas = obterTarefas();
    tarefas.push(tarefa.trim());
    salvarTarefas(tarefas);
    renderizarTarefas();
    entradaTarefa.value = '';
    entradaTarefa.focus();
}

function removerTarefa(indice) {
    const tarefas = obterTarefas();
    tarefas.splice(indice, 1);
    salvarTarefas(tarefas);
    renderizarTarefas();
}

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

    tarefas.forEach((tarefa, indice) => {
        const itemLista = document.createElement('li');

        const textoTarefa = document.createElement('span');
        textoTarefa.textContent = tarefa;

        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.className = 'botao-remover';
        botaoRemover.onclick = () => removerTarefa(indice);

        itemLista.appendChild(textoTarefa);
        itemLista.appendChild(botaoRemover);
        listaTarefas.appendChild(itemLista);
    });
}

botaoAdicionarTarefa.addEventListener('click', () => adicionarTarefa(entradaTarefa.value));

entradaTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa(entradaTarefa.value);
    }
});

renderizarTarefas();