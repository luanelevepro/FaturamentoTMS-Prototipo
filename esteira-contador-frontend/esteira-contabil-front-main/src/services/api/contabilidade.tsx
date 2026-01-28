import { fetchData } from './request-handler';

// // // // // // // // // // Departamentos // // // // // // // // // //

export async function getDepartamentos() {
	return await fetchData('/api/contabilidade/departamentos/paginacao');
}

export async function getDepartamentosPaginado(pageParameters: { status: string[] }) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `?status=${pageParameters.status.join(',')}` : '';
	return await fetchData(`/api/contabilidade/departamentos/paginacao${statusQuery}`);
}

export async function sincronizarDepartamentos(empresaId: string) {
	return await fetchData(`/api/contabilidade/departamentos/sincronizar/${empresaId}`, null, 'POST');
}

export async function updateDepartamento(id: string, content: { ds_nome_depart?: string; is_ativo?: boolean }) {
	return await fetchData(`/api/contabilidade/departamentos/${id}`, content, 'PUT');
}

export async function updateDepartamentos(departamentos: { id: string; is_ativo: boolean }[]) {
	return await Promise.all(
		departamentos.map((departamento) =>
			fetchData(`/api/contabilidade/departamentos/${departamento.id}`, { is_ativo: departamento.is_ativo }, 'PUT'),
		),
	);
}

export async function ativarDepartamentos(ids: string[]) {
	return await fetchData(`/api/contabilidade/departamentos/ativar`, { ids }, 'POST');
}

export async function inativarDepartamentos(ids: string[]) {
	return await fetchData(`/api/contabilidade/departamentos/inativar`, { ids }, 'POST');
}

// // // // // // // // // // Centros de Custos // // // // // // // // // //

export async function getCentrosCustos() {
	return await fetchData('/api/contabilidade/centrocustos/paginacao');
}

export async function getCentrosCustosPaginado(pageParameters: { status: string[] }) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `?status=${pageParameters.status.join(',')}` : '';
	return await fetchData(`/api/contabilidade/centrocustos/paginacao${statusQuery}`);
}

export async function sincronizarCentrosCustos(empresaId: string) {
	return await fetchData(`/api/contabilidade/centrocustos/sincronizar/${empresaId}`, null, 'POST');
}

export async function updateCentroCustos(id: string, content: { ds_nome_ccusto?: string; is_ativo?: boolean }) {
	return await fetchData(`/api/contabilidade/centrocustos/${id}`, content, 'PUT');
}

export async function updateCentrosCustos(centrosCustos: { id: string; is_ativo: boolean }[]) {
	return await Promise.all(
		centrosCustos.map((centro) => fetchData(`/api/contabilidade/centrocustos/${centro.id}`, { is_ativo: centro.is_ativo }, 'PUT')),
	);
}

export async function ativarCentrosCustos(ids: string[]) {
	return await fetchData(`/api/contabilidade/centrocustos/ativar`, { ids }, 'POST');
}

export async function inativarCentrosCustos(ids: string[]) {
	return await fetchData(`/api/contabilidade/centrocustos/inativar`, { ids }, 'POST');
}
