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
    tarefas.push(tarefa);
    salvarTarefas(tarefas);
    renderizarTarefas();
    entradaTarefa.value = ''; 
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

    tarefas.forEach((tarefa, indice) => {
        const itemLista = document.createElement('li');
        itemLista.textContent = tarefa;

        const botaoRemover = document.createElement('button');
        botaoRemover.textContent = 'Remover';
        botaoRemover.onclick = () => removerTarefa(indice);

        itemLista.appendChild(botaoRemover);
        listaTarefas.appendChild(itemLista);
    });
}

botaoAdicionarTarefa.addEventListener('click', () => adicionarTarefa(entradaTarefa.value));

renderizarTarefas();
