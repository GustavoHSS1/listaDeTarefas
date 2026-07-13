const botaoModoEscuro = document.getElementById('botaoModoEscuro');

function aplicarModoEscuro(ativo) {
    document.body.classList.toggle('modo-escuro', ativo);
    botaoModoEscuro.textContent = ativo ? '☀️' : '🌙';

    // avisa o navegador qual esquema de cores usar nos controles nativos
    // (input de hora/data, scrollbar etc.), senão eles podem ficar com
    // texto invisível quando o tema não bate com o padrão do sistema
    document.documentElement.style.colorScheme = ativo ? 'dark' : 'light';
}

export function iniciarTema() {
    aplicarModoEscuro(localStorage.getItem('modoEscuro') === 'true');

    botaoModoEscuro.addEventListener('click', () => {
        const ativo = !document.body.classList.contains('modo-escuro');
        aplicarModoEscuro(ativo);
        localStorage.setItem('modoEscuro', ativo ? 'true' : 'false');
    });
}