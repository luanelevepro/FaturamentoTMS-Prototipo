import { fetchData } from './request-handler';

export async function getUfEmpresa(empresa_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}/uf`);
}

export async function getEmpresas() {
	return await fetchData('/api/empresas?is_escritorio=false'); // Trás todas as empresas do sistema
}

export async function getUsuariosEmpresa(empresa_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}/usuarios`); // Trás todos os usuários de uma empresa
}

export async function getEmpresa(empresa_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}`); // Trás uma empresa específica
}

export async function insertApiKey(empresaId: string, key: string) {
	return await fetchData(`/api/escritorios/${empresaId}/integration/key`, { key: key }, 'POST'); // Insere a URL da API de uma empresa
}

export async function getAcessosEmpresa(empresaId: string) {
	return await fetchData(`/api/empresas/${empresaId}/acessos`); // Trás usuários que acessam uma empresa
}

export async function addUsuarioEmpresa(empresa_id: string, usuario_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}/usuario/${usuario_id}`, null, 'POST'); // Adiciona um usuário a uma empresa
}

export async function addUsuarioByEmailEmpresa(empresa_id: string, email: string) {
	return await fetchData(`/api/empresas/${empresa_id}/usuario/email/${email}`, null, 'POST'); // Adiciona um usuário a uma empresa
}

export async function deleteUsuarioEmpresa(empresa_id: string, usuario_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}/usuario/${usuario_id}`, null, 'DELETE'); // Remove um usuário de uma empresa
}

export async function createUpdateEmpresa(empresa: unknown) {
	return await fetchData('/api/empresas', empresa, 'POST'); // Adiciona uma nova empresa
}

export async function blockAcessoUsuarioEmpresa(empresa_id: string, usuario_id: string) {
	return await fetchData(`/api/empresas/${empresa_id}/usuario/${usuario_id}/bloquear`, null, 'PATCH');
}

export async function addSegmentoToEmpresa(segmento_id: string, id_empresa: string) {
	return await fetchData(`/api/empresas/addsegmento/${segmento_id}`, { id_empresa }, 'PUT');
}

export async function addRegimeTributarioToEmpresa(regime_tributario_id: string, id_empresa: string) {
	return await fetchData(`/api/empresas/addregime/${regime_tributario_id}`, { id_empresa }, 'PUT');
}

export async function getSegmentoById(segmento_id: string) {
	return await fetchData(`/api/fiscal/cadastros/segmentos/${segmento_id}`); // Trás segmentos vinculados à empresa
}

export async function getRegimeTributarioById(regime_tributario_id: string) {
	return await fetchData(`/api/geral/cadastros/regimes-tributarios/${regime_tributario_id}`); // Trás regimes tributários vinculados à empresa
}
