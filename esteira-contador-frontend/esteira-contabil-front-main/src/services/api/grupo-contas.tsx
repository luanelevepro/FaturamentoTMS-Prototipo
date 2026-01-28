import { fetchData } from './request-handler';

export async function getGrupoContasByEmpresaID(empresa_id: string) {
	return await fetchData(`/api/contabilidade/grupocontas/${empresa_id}`);
}

export async function createGrupoContas(empresa_id: string, grupocontas: unknown, tipogrupo: string) {
	return await fetchData(`/api/contabilidade/grupocontas`, { grupocontas, empresa_id, tipogrupo }, 'POST');
}

export async function deleteGrupoContas(grupo_id: string) {
	return await fetchData(`/api/contabilidade/grupocontas/${grupo_id}`, undefined, 'DELETE');
}

export async function deactivateGrupoContas(grupo_id: string) {
	return await fetchData(`/api/contabilidade/grupocontas/deactivate/${grupo_id}`, undefined, 'PUT');
}

export async function activateGrupoContas(grupo_id: string) {
	return await fetchData(`/api/contabilidade/grupocontas/activate/${grupo_id}`, undefined, 'PUT');
}
