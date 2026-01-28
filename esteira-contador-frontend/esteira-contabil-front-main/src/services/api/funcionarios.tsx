import { fetchData } from './request-handler';

export async function getFuncionarios() {
	return await fetchData('/api/rh/funcionarios'); // Trás todos os funcionários do sistema
}

export async function getFuncionario(funcionario_id: string) {
	return await fetchData(`/api/rh/funcionarios/${funcionario_id}`); // Trás funcionários
}

export async function addCargoNivelFuncionario(funcionario_id: string, cargonivelId: string) {
	return await fetchData(`/api/rh/funcionarios/${funcionario_id}/cargonivel/${cargonivelId}`, { method: 'POST' }); // Adiciona um cargo - nível a um funcionário
}

export async function getFuncionarioEmpresa(empresa_id: string) {
	return await fetchData(`/api/rh/funcionarios/empresa/${empresa_id}`); // Trás funcionários ligadaos a uma empresa
}

export async function updateFuncionarioCargo(cargo_id: string) {
	return await fetchData(`/api/rh/funcionarios/salarios/${cargo_id}`);
}

export async function sincronizarFuncionariosByEmpresaId(empresa_id: string) {
	return await fetchData(`/api/rh/sincronizar/funcionarios/${empresa_id}`);
}
