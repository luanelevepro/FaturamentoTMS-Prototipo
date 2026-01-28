import { fetchData } from './request-handler';

export async function addCargoNivelFuncionario(funcionario_id: string, cargonivelId: string) {
	return await fetchData(`/api/rh/funcionarios/${funcionario_id}/cargonivel/${cargonivelId}`, { method: 'POST' }); // Adiciona um cargo - nível a um funcionário
}

export async function getCargoEmpresa(empresa_id: string) {
	return await fetchData(`/api/rh/cargos/${empresa_id}/cargos`);
}

export async function deactivateCargo(cargo_id: string) {
	return await fetchData(`/api/rh/cargos/${cargo_id}/desativar`, undefined, 'PATCH');
}

export async function activateCargo(cargo_id: string) {
	return await fetchData(`/api/rh/cargos/${cargo_id}/ativar`, undefined, 'PATCH');
}

export async function sincronizarCargosByEmpresaId(empresa_id: string) {
	return await fetchData(`/api/rh/sincronizar/cargos/${empresa_id}`);
}

export async function getVigenciaByCargo(cargo_id: string) {
	return await fetchData(`/api/rh/vigencia/salario/${cargo_id}`);
}
