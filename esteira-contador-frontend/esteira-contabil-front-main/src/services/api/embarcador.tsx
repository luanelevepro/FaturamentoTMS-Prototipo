import { fetchData } from './request-handler';

// Classificacao
export async function getClassificacaoVeiculos(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10 }) {
	return (await fetchData(
		`/api/embarcador/parametro/classificacao-veiculos?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetClassificacaoVeiculos;
}

export async function createClassificacaoVeiculos(data: {
	ds_classificacao: string;
	fl_carroceria_um_independente: boolean;
	fl_carroceria_dois_independente: boolean;
}) {
	return await fetchData('/api/embarcador/parametro/classificacao-veiculos', data, 'POST');
}

export async function updateClassificacaoVeiculos(
	id: number,
	data: {
		ds_classificacao: string;
		fl_carroceria_um_independente: boolean;
		fl_carroceria_dois_independente: boolean;
	},
) {
	return await fetchData(`/api/embarcador/parametro/classificacao-veiculos/${id}`, data, 'PUT');
}

export async function deleteClassificacaoVeiculos(id: number) {
	return await fetchData(`/api/embarcador/parametro/classificacao-veiculos/${id}`, {}, 'DELETE');
}

export async function getClassificacaoCarrocerias(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10 }) {
	return (await fetchData(
		`/api/embarcador/parametro/classificacao-carrocerias?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetClassificacaoCarrocerias;
}

export async function createClassificacaoCarroceria(data: ESTEIRA.PAYLOAD.CreateClassificacaoCarroceria) {
	return await fetchData('/api/embarcador/parametro/classificacao-carrocerias', data, 'POST');
}

export async function updateClassificacaoCarroceria(id: number, data: ESTEIRA.PAYLOAD.UpdateClassificacaoCarroceria) {
	return await fetchData(`/api/embarcador/parametro/classificacao-carrocerias/${id}`, data, 'PUT');
}

export async function deleteClassificacaoCarroceria(id: number) {
	return await fetchData(`/api/embarcador/parametro/classificacao-carrocerias/${id}`, {}, 'DELETE');
}

export async function getMarcasCarrocerias(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10 }) {
	return await fetchData(
		`/api/sis-embarcador/marcas-carrocerias?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	);
}

export async function createMarcasCarrocerias(data: ESTEIRA.PAYLOAD.CreateMarcaCarroceria) {
	return await fetchData('/api/sis-embarcador/marcas-carrocerias', data, 'POST');
}

export async function updateMarcasCarrocerias(id: number, data: ESTEIRA.PAYLOAD.UpdateMarcaCarroceria) {
	return await fetchData(`/api/sis-embarcador/marcas-carrocerias/${id}`, data, 'PUT');
}

export async function deleteMarcasCarrocerias(id: number) {
	return await fetchData(`/api/sis-embarcador/marcas-carrocerias/${id}`, {}, 'DELETE');
}

export async function getGruposTributacoes(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10 }) {
	return await fetchData(
		`/api/embarcador/parametro/grupos?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	);
}

export async function getClassificacaoImplementos(
	query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10 },
): Promise<ESTEIRA.RESPONSE.GetClassificacaoImplementos> {
	return await fetchData(
		`/api/embarcador/parametro/classificacao-implementos?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	);
}

export async function createClassificacaoImplementos(data: ESTEIRA.PAYLOAD.CreateClassificacaoImplemento) {
	return await fetchData('/api/embarcador/parametro/classificacao-implementos', data, 'POST');
}

export async function updateClassificacaoImplementos(id: number, data: ESTEIRA.PAYLOAD.UpdateClassificacaoImplemento) {
	return await fetchData(`/api/embarcador/parametro/classificacao-implementos/${id}`, data, 'PUT');
}

export async function deleteClassificacaoImplementos(id: number) {
	return await fetchData(`/api/embarcador/parametro/classificacao-implementos/${id}`, {}, 'DELETE');
}
