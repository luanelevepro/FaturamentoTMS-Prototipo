import { FornecedoresData } from '@/pages/fiscal/fornecedores';
import { fetchData } from './request-handler';

// // // // // // // // // // Produtos // // // // // // // // // //

export async function getProdutosEmpresas() {
	return await fetchData('/api/fiscal/produtos?tipo=produto');
}

export async function getProdutosAtivosEmpresas(cd_ncm?: string, tipo: string = 'produto') {
	const qTipo = tipo || 'produto';
	return await fetchData('/api/fiscal/produtos/ativos?tipo=' + encodeURIComponent(qTipo) + '&cd_ncm=' + encodeURIComponent(cd_ncm || ''));
}

export async function getServicosEmpresas() {
	return await fetchData('/api/fiscal/produtos?tipo=servico');
}

export async function updateProdutosEmpresas(content: unknown) {
	return await fetchData(`/api/fiscal/produtos`, content, 'POST');
}

export async function ativarTodosProdutos(tipo: string) {
	return await fetchData(`/api/fiscal/produtos/ativar-all`, { tipo }, 'PUT');
}

export async function inativarTodosProdutos(tipo: string) {
	return await fetchData(`/api/fiscal/produtos/inativar-all`, { tipo }, 'PUT');
}

export async function createProduto(content: unknown) {
	return await fetchData(`/api/fiscal/produtos/criar`, content, 'POST');
}

export async function getProdutosEmpresasPaginado(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
	tipo: string;
	status: string[];
	tipo_item: string[];
}) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `&status=${pageParameters.status.join(',')}` : '';
	const tipoItemQuery =
		pageParameters.tipo_item && pageParameters.tipo_item.length > 0 ? `&tipo_item=${pageParameters.tipo_item.join(',')}` : '';
	return await fetchData(
		`/api/fiscal/produtos/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}&tipo=${pageParameters.tipo}${statusQuery}${tipoItemQuery}`,
	);
}

export async function updateProdutosEmpresasExterno() {
	return await fetchData(`/api/fiscal/produtos/sincronizar`, null, 'POST');
}

// // // // // // // // // // Fornecedores // // // // // // // // // //

export async function sincronizarFornecedores() {
	return await fetchData(`/api/fiscal/fornecedores/sincronizar`);
}

export async function getFornecedores() {
	return await fetchData(`/api/fiscal/fornecedores`);
}

export async function createFornecedores(content: FornecedoresData) {
	return await fetchData(`/api/fiscal/fornecedores`, content, 'POST');
}

export async function updateFornecedores(id: string, content: FornecedoresData) {
	return await fetchData(`/api/fiscal/fornecedores/${id}`, content, 'PUT');
}

export async function deleteFornecedores(id: string) {
	return await fetchData(`/api/fiscal/fornecedores/${id}`, null, 'DELETE');
}

export async function getFornecedoresPaginado(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
}) {
	return await fetchData(
		`/api/fiscal/fornecedores/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}`,
	);
}

// // // // // // // // // // Certificados // // // // // // // // // //

export async function getCertificados() {
	return await fetchData('/api/geral/certificados');
}

export async function getCertificado(id: string) {
	return await fetchData(`/api/geral/certificado/${id}`);
}

export async function createCertificado(content: unknown) {
	return await fetchData(`/api/geral/certificado`, content, 'POST');
}

export async function deleteCertificado(id: string) {
	return await fetchData(`/api/geral/certificado/${id}`, null, 'DELETE');
}

// // // // // // // // // // CADASTROS // // // // // // // // // //

// // // // // // // // // // Segmentos Empresa // // // // // // // // // //

export async function getSegmentosEmpresas() {
	return await fetchData('/api/fiscal/cadastros/segmentos-empresas');
}

export async function createSegmentosEmpresas(content: unknown) {
	return await fetchData(`/api/fiscal/cadastros/segmentos-empresas`, content, 'POST');
}

export async function updateSegmentosEmpresas(id: string, content: unknown) {
	return await fetchData(`/api/fiscal/cadastros/segmentos-empresas/${id}`, content, 'PUT');
}

export async function deleteSegmentosEmpresas(id: string) {
	return await fetchData(`/api/fiscal/cadastros/segmentos-empresas/${id}`, null, 'DELETE');
}

// // // // // // // // // // Produtos padrões por segmento // // // // // // // // // //

export async function getPadraoSegmento() {
	return await fetchData('/api/fiscal/cadastros/padroes-segmento');
}

export async function createPadraoSegmento(content: unknown) {
	return await fetchData(`/api/fiscal/cadastros/padroes-segmento`, content, 'POST');
}

export async function updatePadraoSegmento(id: string, content: unknown) {
	return await fetchData(`/api/fiscal/cadastros/padroes-segmento/${id}`, content, 'PUT');
}

export async function deletePadraoSegmento(id: string) {
	return await fetchData(`/api/fiscal/cadastros/padroes-segmento/${id}`, null, 'DELETE');
}

// // // // // // // // // // Tipos de Inconsistência (Auditoria) // // // // // // // // // //

export interface TipoInconsistencia {
	id: string;
	cd_codigo: string;
	ds_descricao: string;
	criticidade_padrao: 'INFO' | 'AVISO' | 'CRITICA';
	ds_grupo: string | null;
	fl_ativo: boolean;
	ds_ordem_exibicao: number;
	versao_regra: string | null;
	dt_inicio_vigencia: string | null;
	dt_fim_vigencia: string | null;
	dt_created: string;
	dt_updated: string;
}

export interface TipoInconsistenciaPayload {
	cd_codigo: string;
	ds_descricao: string;
	criticidade_padrao?: 'INFO' | 'AVISO' | 'CRITICA';
	ds_grupo?: string | null;
	fl_ativo?: boolean;
	ds_ordem_exibicao?: number;
	versao_regra?: string | null;
	dt_inicio_vigencia?: string | null;
	dt_fim_vigencia?: string | null;
}

export async function getTiposInconsistencia(active?: boolean): Promise<TipoInconsistencia[]> {
	const query = active !== undefined ? `?active=${active ? '1' : '0'}` : '';
	return await fetchData(`/api/fiscal/auditoria/tipos${query}`);
}

export async function getTipoInconsistencia(id: string): Promise<TipoInconsistencia> {
	return await fetchData(`/api/fiscal/auditoria/tipos/${id}`);
}

export async function createTipoInconsistencia(content: TipoInconsistenciaPayload): Promise<TipoInconsistencia> {
	return await fetchData('/api/fiscal/auditoria/tipos', content, 'POST');
}

export async function updateTipoInconsistencia(id: string, content: Partial<TipoInconsistenciaPayload>): Promise<TipoInconsistencia> {
	return await fetchData(`/api/fiscal/auditoria/tipos/${id}`, content, 'PUT');
}

export async function deleteTipoInconsistencia(id: string): Promise<void> {
	return await fetchData(`/api/fiscal/auditoria/tipos/${id}`, null, 'DELETE');
}
