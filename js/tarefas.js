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

export function ouvirTarefasDoUsuario(uid, aoAtualizar) {
    const consulta = query(collection(db, 'tarefas'), where('uid', '==', uid));

    return onSnapshot(consulta, (snapshot) => {
        const tarefas = snapshot.docs.map((documento) => ({
            id: documento.id,
            texto: documento.data().texto,
            hora: documento.data().hora,
            data: documento.data().data || '',
            nota: documento.data().nota || '',
            cor: documento.data().cor || '',
            concluida: documento.data().concluida || false
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
        cor,
        concluida: false
    });
}

export function editarTarefa(id, dadosAtualizados) {
    return updateDoc(doc(db, 'tarefas', id), dadosAtualizados);
}

export function atualizarNotaTarefa(id, nota) {
    return updateDoc(doc(db, 'tarefas', id), { nota });
}

export function alternarConclusaoTarefa(id, concluida) {
    return updateDoc(doc(db, 'tarefas', id), { concluida });
}

export function removerTarefa(id) {
    return deleteDoc(doc(db, 'tarefas', id));
}