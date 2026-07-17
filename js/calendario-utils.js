export const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function paraISO(ano, mesIndex, dia) {
    const mm = String(mesIndex + 1).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return `${ano}-${mm}-${dd}`;
}

export function formatarDataExtenso(iso) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return `${dia} de ${nomesMeses[mes - 1]} de ${ano}`;
}

// quantas células vazias no início da grade, e quantos dias tem o mês
export function obterInfoDoMes(ano, mesIndex) {
    const primeiroDiaSemana = new Date(ano, mesIndex, 1).getDay();
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate();
    return { primeiroDiaSemana, diasNoMes };
}