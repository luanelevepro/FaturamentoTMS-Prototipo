import { fetchData } from './request-handler';

export async function getUsuarios() {
	return await fetchData('/api/usuarios'); // Trás todos os usuários do sistema
}

export async function getUsuario(usuario_id: string) {
	return await fetchData(`/api/usuarios/${usuario_id}`); // Trás um usuário específico
}

export async function sendConfirmacaoUsuario() {
	return await fetchData(`/api/usuarios/confirmar`, null, 'PATCH'); // Envia confirmação de cadastro do usuário
}

export async function updateUsuario(usuario_id: string) {
	return await fetchData(`/api/usuarios/${usuario_id}`, { method: 'POST' }); // Atualiza um usuário
}

export async function getEmpresasUsuario(usuario_id: string) {
	return await fetchData(`/api/usuarios/${usuario_id}/empresas`); // Trás todas as empresas de um usuário
}
