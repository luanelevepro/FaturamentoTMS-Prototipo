import { fetchData } from './request-handler';

// // // // // // // // // // Veículos // // // // // // // // // //

export async function getVeiculos() {
	return await fetchData('/api/tms/veiculos/paginacao');
}

export async function getVeiculosPaginado(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
	status: string[];
	tipoVeiculo: string[];
}) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `&status=${pageParameters.status.join(',')}` : '';
	const tipoVeiculoQuery =
		pageParameters.tipoVeiculo && pageParameters.tipoVeiculo.length > 0 ? `&tipoVeiculo=${pageParameters.tipoVeiculo.join(',')}` : '';
	return await fetchData(
		`/api/tms/veiculos/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}${statusQuery}${tipoVeiculoQuery}`,
	);
}

export async function sincronizarVeiculos(empresaId: string) {
	return await fetchData(`/api/tms/veiculos/sincronizar/${empresaId}`, null, 'POST');
}

export async function updateVeiculo(
	id: string,
	content: { ds_placa?: string; ds_nome?: string; is_ativo?: boolean; vl_aquisicao?: number; id_centro_custos?: string },
) {
	return await fetchData(`/api/tms/veiculos/${id}`, content, 'PUT');
}

export async function updateVeiculos(veiculos: { id: string; is_ativo: boolean }[]) {
	return await Promise.all(veiculos.map((veiculo) => fetchData(`/api/tms/veiculos/${veiculo.id}`, { is_ativo: veiculo.is_ativo }, 'PUT')));
}

export async function ativarVeiculos(ids: string[]) {
	return await fetchData(`/api/tms/veiculos/ativar`, { ids }, 'POST');
}

export async function inativarVeiculos(ids: string[]) {
	return await fetchData(`/api/tms/veiculos/inativar`, { ids }, 'POST');
}

export async function setCarroceria(ids: string[], isCarroceria: boolean) {
	return await fetchData(`/api/tms/veiculos/set-carroceria`, { ids, isCarroceria }, 'POST');
}

export async function setTracionador(ids: string[], isTracionador: boolean) {
	return await fetchData(`/api/tms/veiculos/set-tracionador`, { ids, isTracionador }, 'POST');
}

// // // // // // // // // // Segmentos // // // // // // // // // //

export async function getSegmentos() {
	return await fetchData('/api/tms/segmentos');
}

export async function getSegmentosPaginado(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
	status: string[];
}) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `&status=${pageParameters.status.join(',')}` : '';
	return await fetchData(
		`/api/tms/segmentos/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}${statusQuery}`,
	);
}

export async function createSegmento(data: { cd_identificador?: string; ds_nome: string; is_ativo?: boolean }) {
	return await fetchData(`/api/tms/segmentos`, data, 'POST');
}

export async function updateSegmento(id: string, data: { ds_nome: string }) {
	return await fetchData(`/api/tms/segmentos/${id}`, data, 'PUT');
}

export async function deleteSegmento(id: string) {
	return await fetchData(`/api/tms/segmentos/${id}`, null, 'DELETE');
}

export async function ativarSegmentos(ids: string[]) {
	return await fetchData(`/api/tms/segmentos/ativar`, { ids }, 'POST');
}

export async function inativarSegmentos(ids: string[]) {
	return await fetchData(`/api/tms/segmentos/inativar`, { ids }, 'POST');
}
