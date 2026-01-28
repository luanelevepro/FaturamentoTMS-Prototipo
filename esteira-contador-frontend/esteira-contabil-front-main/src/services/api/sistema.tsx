import { downloadFile, fetchData } from './request-handler';

export async function setAsEscritorio(empresa_id: string) {
	return await fetchData(`/api/escritorios/${empresa_id}/escritorio`, null, 'PATCH');
}

export async function setAsEmpresa(empresa_id: string) {
	return await fetchData(`/api/escritorios/${empresa_id}/empresa`, null, 'PATCH');
}

export async function updateExternoEmpresas(escritorio_id: string) {
	return await fetchData(`/api/sincronizar/escritorio/${escritorio_id}`);
}

// // // // // // // // // // CADASTROS // // // // // // // // // //

export async function getCidades(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10, search: '' }) {
	return (await fetchData(
		`/api/geral/cadastros/cidades?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&orderColumn=${query.orderColumn}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetCidades;
}

export async function getCidade(params: { cd_cidade: string }) {
	return (await fetchData(`/api/geral/cadastros/cidades/${params.cd_cidade}`)) as ESTEIRA.RESPONSE.GetCidade;
}

export async function updateCidade(cd_cidade: string, data: { ds_state: string }) {
	return await fetchData(`/api/geral/cadastros/cidades/${cd_cidade}`, data, 'PUT');
}

export async function createCidade(data: { cd_cidade: string; ds_state: string; ds_uf: string }) {
	return await fetchData('/api/geral/cadastros/cidades', data, 'POST');
}

export async function deleteCidade(cd_cidade: string) {
	return await fetchData(`/api/geral/cadastros/cidades/${cd_cidade}`, {}, 'DELETE');
}

export async function getUFs(query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10, search: '' }) {
	return (await fetchData(
		`/api/geral/cadastros/uf?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetUFs;
}

export async function getUF(params: { ds_uf: string }) {
	return (await fetchData(`/api/geral/cadastros/uf/${params.ds_uf}`)) as ESTEIRA.RESPONSE.GetUF;
}

export async function deleteUF(ds_uf: string) {
	return await fetchData(`/api/geral/cadastros/uf/${ds_uf}`, {}, 'DELETE');
}

export async function getUFsGeral() {
	return await fetchData('/api/geral/cadastros/ufs');
}

export async function getUFCidades(ds_uf: number) {
	return (await fetchData(`/api/geral/cadastros/uf/${ds_uf}/cidades`)) as ESTEIRA.RESPONSE.GetUFCidades;
}

// UF Historico
export async function getUFHistoricos(params: { ds_uf: string }, query: ESTEIRA.PAYLOAD.Paginacao = { page: 1, pageSize: 10, search: '' }) {
	return (await fetchData(
		`/api/geral/cadastros/uf/${params.ds_uf}/vigencias?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}`,
	)) as ESTEIRA.RESPONSE.GetUFHistoricos;
}

export async function createUFHistorico(data: {
	ds_uf: string;
	dt_vigencia: Date;
	vl_percentual_ipva_carros: number;
	vl_percentual_ipva_caminhoes: number;
	vl_icms_proprio: number;
}) {
	return await fetchData(
		`/api/geral/cadastros/uf/${data.ds_uf}/vigencias`,
		{
			...data,
		},
		'POST',
	);
}

export async function deleteUFHistorico({ ds_uf, dt_vigencia }: { ds_uf: string; dt_vigencia: Date }) {
	return await fetchData(`/api/geral/cadastros/uf/${ds_uf}/vigencias`, { ds_uf, dt_vigencia }, 'DELETE');
}

// // // // // // // // // // Regimes Tributarios // // // // // // // // // //

export async function getRegimesTributarios() {
	return await fetchData('/api/geral/cadastros/regimes-tributarios');
}

export async function createRegimeTributario(content: unknown) {
	return await fetchData('/api/geral/cadastros/regimes-tributarios', content, 'POST');
}

export async function updateRegimeTributario(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/regimes-tributarios/${id}`, content, 'PUT');
}

export async function deleteRegimeTributario(id: string) {
	return await fetchData(`/api/geral/cadastros/regimes-tributarios/${id}`, null, 'DELETE');
}

// // // // // // // // // // Regimes Tributarios @ Simples Nacional // // // // // // // // // //

export async function getSimplesNacional(query: ESTEIRA.PAYLOAD.Paginacao) {
	return await fetchData(`/api/geral/cadastros/simples-nacional?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&orderColumn=${query.orderColumn}`);
}

export async function createSimplesNacional(content: unknown) {
	return await fetchData('/api/geral/cadastros/simples-nacional', content, 'POST');
}

export async function updateSimplesNacional(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/simples-nacional/${id}`, content, 'PUT');
}

export async function deleteSimplesNacional(id: string) {
	return await fetchData(`/api/geral/cadastros/simples-nacional/${id}`, null, 'DELETE');
}

// // // // // // // // // // Tipos de Produto // // // // // // // // // //

export async function getTiposProduto() {
	return await fetchData('/api/geral/cadastros/tipos-produto');
}

export async function createTiposProduto(content: unknown) {
	return await fetchData('/api/geral/cadastros/tipos-produto', content, 'POST');
}

export async function updateTiposProduto(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/tipos-produto/${id}`, content, 'PUT');
}

export async function deleteTiposProduto(id: string) {
	return await fetchData(`/api/geral/cadastros/tipos-produto/${id}`, null, 'DELETE');
}

// // // // // // // // // // Tipos de Serviço // // // // // // // // // //

export async function getTiposServico() {
	return await fetchData('/api/geral/cadastros/tipos-servico');
}

export async function createTiposServico(content: unknown) {
	return await fetchData('/api/geral/cadastros/tipos-servico', content, 'POST');
}

export async function updateTiposServico(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/tipos-servico/${id}`, content, 'PUT');
}

export async function deleteTiposServico(id: string) {
	return await fetchData(`/api/geral/cadastros/tipos-servico/${id}`, null, 'DELETE');
}

// // // // // // // // // // Origem CST // // // // // // // // // //

export async function getOrigemCST() {
	return await fetchData('/api/geral/cadastros/origem-cst');
}

export async function createOrigemCST(content: unknown) {
	return await fetchData('/api/geral/cadastros/origem-cst', content, 'POST');
}

export async function updateOrigemCST(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/origem-cst/${id}`, content, 'PUT');
}

export async function deleteOrigemCST(id: string) {
	return await fetchData(`/api/geral/cadastros/origem-cst/${id}`, null, 'DELETE');
}

// // // // // // // // // // CST // // // // // // // // // //

export async function getCST() {
	return await fetchData('/api/geral/cadastros/cst');
}

export async function createCST(content: unknown) {
	return await fetchData('/api/geral/cadastros/cst', content, 'POST');
}

export async function updateCST(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/cst/${id}`, content, 'PUT');
}

export async function deleteCST(id: string) {
	return await fetchData(`/api/geral/cadastros/cst/${id}`, null, 'DELETE');
}

// // // // // // // // // // CFOP // // // // // // // // // //

export async function getCFOP() {
	return await fetchData('/api/geral/cadastros/cfop');
}

export async function createCFOP(content: unknown) {
	return await fetchData('/api/geral/cadastros/cfop', content, 'POST');
}

export async function updateCFOP(id: string, content: unknown) {
	return await fetchData(`/api/geral/cadastros/cfop/${id}`, content, 'PUT');
}

export async function deleteCFOP(id: string) {
	return await fetchData(`/api/geral/cadastros/cfop/${id}`, null, 'DELETE');
}

// // // // // // // // // // EMBARCADOR // // // // // // // // // //

export async function createMarcaCarroceria(data: ESTEIRA.PAYLOAD.CreateMarcaCarroceria) {
	return await fetchData('/api/embarcador/parametro/marcas/carrocerias', data, 'POST');
}

export async function updateMarcaCarroceria(data: ESTEIRA.PAYLOAD.UpdateMarcaCarroceria) {
	return await fetchData(`/api/embarcador/parametro/marcas/carrocerias/${data.id}`, data, 'PUT');
}

export async function deleteMarcaCarroceria(id: number) {
	return await fetchData(`/api/embarcador/parametro/marcas/carrocerias/${id}`, {}, 'DELETE');
}

export async function getEstabelecimentos(query: ESTEIRA.PAYLOAD.Paginacao) {
	return (await fetchData(
		`/api/embarcador/cadastro/estabelecimentos?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetEstabelecimentos;
}

export async function createEstabelecimento(data: ESTEIRA.PAYLOAD.CreateEstabelecimento) {
	return await fetchData('/api/embarcador/cadastro/estabelecimentos', data, 'POST');
}

export async function updateEstabelecimento(data: ESTEIRA.PAYLOAD.UpdateEstabelecimento) {
	return await fetchData(`/api/embarcador/cadastro/estabelecimentos/${data.id}`, data, 'PUT');
}

export async function deleteEstabelecimento(id: string) {
	return await fetchData(`/api/embarcador/cadastro/estabelecimentos/${id}`, {}, 'DELETE');
}
export async function getTransportadoras(query: ESTEIRA.PAYLOAD.Paginacao) {
	return (await fetchData(
		`/api/embarcador/cadastro/transportadoras?page=${query.page}&pageSize=${query.pageSize}&orderBy=${query.orderBy}&search=${query.search}`,
	)) as ESTEIRA.RESPONSE.GetTransportadoras;
}

export async function createTransportadora(data: ESTEIRA.PAYLOAD.CreateTransportadora) {
	return await fetchData('/api/embarcador/cadastro/transportadoras', data, 'POST');
}

export async function updateTransportadora(cd_transportadora: number, data: ESTEIRA.PAYLOAD.UpdateTransportadora) {
	return await fetchData(`/api/embarcador/cadastro/transportadoras/${cd_transportadora}`, data, 'PUT');
}

export async function deleteTransportadora(id: string) {
	return await fetchData(`/api/embarcador/cadastro/transportadoras/${id}`, {}, 'DELETE');
}

export async function getNotificacoes() {
	return ((await fetchData(`/api/notificacoes`)) as ESTEIRA.RESPONSE.GetNotificacoes) || [];
}

export async function deleteNotification(id: string) {
	return await fetchData(`/api/notificacoes/${id}`, {}, 'DELETE');
}

export async function downloadXlsxModel(table: string) {
	return await downloadFile(`/api/import/xlsx/${table}`);
}
