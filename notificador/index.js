const admin = require('firebase-admin');

const credenciais = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(credenciais)
});

const db = admin.firestore();
const FUSO_HORARIO = 'America/Sao_Paulo';
const JANELA_MINUTOS = 5; // mesmo intervalo do agendamento no GitHub Actions

// pega a hora atual no fuso do Brasil, sem depender de configuração nenhuma do usuário
function obterAgoraNoFuso() {
    const formatador = new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO_HORARIO,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    const partes = Object.fromEntries(formatador.formatToParts(new Date()).map((p) => [p.type, p.value]));
    return {
        iso: `${partes.year}-${partes.month}-${partes.day}`,
        minutosDoDia: Number(partes.hour) * 60 + Number(partes.minute)
    };
}

function minutosDaHora(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

async function buscarTokensDoUsuario(uid) {
    const snapshot = await db.collection('tokensPush').where('uid', '==', uid).get();
    return snapshot.docs.map((doc) => doc.data().token);
}

async function enviarNotificacao(token, titulo, corpo) {
    try {
        await admin.messaging().send({
            token,
            notification: { title: titulo, body: corpo }
        });
        console.log(`Notificação enviada (token ${token.slice(0, 12)}...)`);
    } catch (erro) {
        console.error(`Erro ao enviar (token ${token.slice(0, 12)}...):`, erro.message);
    }
}

async function processarTarefas() {
    const agora = obterAgoraNoFuso();
    console.log(`Verificando lembretes — hoje ${agora.iso}, ${agora.minutosDoDia} min desde 00:00`);

    const snapshot = await db.collection('tarefas').get();
    let notificacoesEnviadas = 0;

    for (const doc of snapshot.docs) {
        const tarefa = doc.data();

        if (tarefa.concluida) continue;
        if (!tarefa.hora) continue;
        if (tarefa.data && tarefa.data !== agora.iso) continue;
        if (tarefa.notificacaoEnviadaEm === agora.iso) continue;

        const minutosTarefa = minutosDaHora(tarefa.hora);
        const diferenca = agora.minutosDoDia - minutosTarefa;

        // dispara quando o horário da tarefa já chegou, mas ainda está
        // dentro da janela desde a última execução (evita perder o aviso
        // entre uma rodada e outra do agendamento)
        if (diferenca >= 0 && diferenca < JANELA_MINUTOS) {
            const tokens = await buscarTokensDoUsuario(tarefa.uid);

            if (tokens.length === 0) {
                console.log(`Tarefa "${tarefa.texto}" não tem token de push salvo — pulando.`);
            }

            for (const token of tokens) {
                await enviarNotificacao(token, 'Lembrete: ' + tarefa.texto, `Às ${tarefa.hora}`);
                notificacoesEnviadas++;
            }

            await doc.ref.update({ notificacaoEnviadaEm: agora.iso });
        }
    }

    console.log(`Verificação concluída. ${notificacoesEnviadas} notificação(ões) enviada(s).`);
}

processarTarefas()
    .then(() => process.exit(0))
    .catch((erro) => {
        console.error('Erro geral no processamento:', erro);
        process.exit(1);
    });