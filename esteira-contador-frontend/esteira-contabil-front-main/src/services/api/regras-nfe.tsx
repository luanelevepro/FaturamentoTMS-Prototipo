import { fetchData } from './request-handler';

export interface RegrasNfeData {
	ds_descricao: string;
	id_regime_destinatario: string;
	id_segmento_destinatario: string;
	ds_destino_uf: string;
	ds_origem_uf: string;
	dt_vigencia: string;
	js_tipo_produto: string[];
	js_origem_trib: string[];
	js_ncm_produto: string[];
	id_regime_emitente: string;
	js_cfop_origem: string[];
	js_cst_origem: string[];
	id_cfop_entrada: string;
	id_cst_entrada: string;
	id_cfop_gerado?: string;
	id_cst_gerado?: string | 'MANTER_CST';
}

export async function getRegrasNfe() {
	return await fetchData('/api/fiscal/regras-nfe');
}

export async function getRegrasNfeById(id: string) {
	return await fetchData(`/api/fiscal/regras-nfe/${id}`);
}

export async function createRegrasNfe(data: RegrasNfeData) {
	return await fetchData('/api/fiscal/regras-nfe', data, 'POST');
}

export async function updateRegraNfe(id: string, data: RegrasNfeData) {
	return await fetchData(`/api/fiscal/regras-nfe/${id}`, data, 'PUT');
}

export async function deleteRegraNfe(id: string) {
	return await fetchData(`/api/fiscal/regras-nfe/${id}`, {}, 'DELETE');
}

// Duplica uma regra NFE existente
export async function duplicateRegraNfe(id: string) {
	return await fetchData(`/api/fiscal/regras-nfe/${id}/duplicate`, {}, 'POST');
}

// Executa regras de NFE para uma lista de NFEs
export async function executeRegrasNfe(payload: { nfeIds: string[] }) {
	return await fetchData(`/api/fiscal/regras-nfe/executar`, payload, 'POST');
}
