import { fetchData } from './request-handler';

export async function getTipoGrupoByEmpresaID() {
	return await fetchData(`/api/contabilidade/tipogrupo/`);
}

export async function createTipoGrupo(ds_nome_tipo: string) {
	return await fetchData(`/api/contabilidade/tipogrupo/`, { ds_nome_tipo }, 'POST');
}

export async function deleteTipoGrupo(tipo_id: string) {
	return await fetchData(`/api/contabilidade/tipogrupo/${tipo_id}`, undefined, 'DELETE');
}

export async function deactivateTipoGrupo(grupo_id: string) {
	return await fetchData(`/api/contabilidade/tipogrupo/deactivate/${grupo_id}`, undefined, 'PUT');
}

export async function activateTipoGrupo(grupo_id: string) {
	return await fetchData(`/api/contabilidade/tipogrupo/activate/${grupo_id}`, undefined, 'PUT');
}

export async function updateTipoGrupo(tipo_id: string, ds_nome_tipo: string) {
	return await fetchData(`/api/contabilidade/tipogrupo/${tipo_id}`, { ds_nome_tipo }, 'PUT');
}
