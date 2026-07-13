import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { db, auth } from './firebase-config.js';

// fica "ouvindo" o banco: qualquer mudança atualiza a tela na hora.
// Retorna a função de cancelamento (unsubscribe) do listener.
export function ouvirTarefasDoUsuario(uid, aoAtualizar) {
    const consulta = query(collection(db, 'tarefas'), where('uid', '==', uid));

    return onSnapshot(consulta, (snapshot) => {
        const tarefas = snapshot.docs.map((documento) => ({
            id: documento.id,
            texto: documento.data().texto,
            hora: documento.data().hora,
            data: documento.data().data || '',
            nota: documento.data().nota || '',
            cor: documento.data().cor || ''
        }));
        aoAtualizar(tarefas);
    });
}

export function criarTarefa({ texto, hora, data = '', nota = '', cor = '' }) {
    return addDoc(collection(db, 'tarefas'), {
        uid: auth.currentUser.uid,
        texto,
        hora,
        data,
        nota,
        cor
    });
}

export function editarTarefa(id, dadosAtualizados) {
    return updateDoc(doc(db, 'tarefas', id), dadosAtualizados);
}

export function atualizarNotaTarefa(id, nota) {
    return updateDoc(doc(db, 'tarefas', id), { nota });
}

export function removerTarefa(id) {
    return deleteDoc(doc(db, 'tarefas', id));
}