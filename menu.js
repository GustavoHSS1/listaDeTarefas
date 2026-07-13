const botaoMenu = document.getElementById('botaoMenu');
const overlayMenu = document.getElementById('overlayMenu');
const itensMenu = document.querySelectorAll('.item-menu');

const views = {
    lembretes: document.getElementById('viewLembretes'),
    calendario: document.getElementById('viewCalendario'),
    conta: document.getElementById('viewConta')
};

function abrirMenu() {
    document.body.classList.add('menu-aberto');
}

export function fecharMenu() {
    document.body.classList.remove('menu-aberto');
}

// aoTrocarView(nome) é chamada toda vez que o usuário troca de tela,
// útil pra re-renderizar algo específico daquela tela (ex: o calendário)
export function mostrarView(nome, aoTrocarView) {
    Object.entries(views).forEach(([chave, elemento]) => {
        elemento.classList.toggle('escondido', chave !== nome);
    });

    itensMenu.forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.view === nome);
    });

    fecharMenu();

    if (aoTrocarView) aoTrocarView(nome);
}

export function iniciarMenu(aoTrocarView) {
    botaoMenu.addEventListener('click', abrirMenu);
    overlayMenu.addEventListener('click', fecharMenu);

    itensMenu.forEach((botao) => {
        botao.addEventListener('click', () => mostrarView(botao.dataset.view, aoTrocarView));
    });
}