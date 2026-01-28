import { fetchData } from './request-handler';

// // // // // // // // // // Notas Fiscais de Serviço // // // // // // // // // //

export async function getDocumentosFiscais(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
	date: Date | string;
	status?: string[];
	tipos?: string[];
}) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `&status=${pageParameters.status.join(',')}` : '';
	const tiposQuery = pageParameters.tipos && pageParameters.tipos.length > 0 ? `&tipos=${pageParameters.tipos.join(',')}` : '';
	return await fetchData(
		`/api/fiscal/documentos/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}&date=${pageParameters.date}${statusQuery}${tiposQuery}`,
	);
}

export async function getDocumentosSaidasFiscais(pageParameters: {
	page: number;
	pageSize: number;
	orderBy: string;
	orderColumn: string;
	search: string;
	date: Date | string;
	status?: string[];
	tipos?: string[];
}) {
	const statusQuery = pageParameters.status && pageParameters.status.length > 0 ? `&status=${pageParameters.status.join(',')}` : '';
	const tiposQuery = pageParameters.tipos && pageParameters.tipos.length > 0 ? `&tipos=${pageParameters.tipos.join(',')}` : '';
	return await fetchData(
		`/api/fiscal/documentos/saidas/paginacao?page=${pageParameters.page}&pageSize=${pageParameters.pageSize}&orderBy=${pageParameters.orderBy}&orderColumn=${pageParameters.orderColumn}&search=${pageParameters.search}&date=${pageParameters.date}${statusQuery}${tiposQuery}`,
	);
}

export async function getNotaFiscal(id: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/${id}`);
}

export async function createNotaFiscalServico(content: unknown) {
	return await fetchData(`/api/fiscal/notas-fiscais`, content, 'POST');
}

export async function downloadXmlNotaFiscalServico(id: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/${id}/xml`, null, 'POST');
}

export async function integrarListaNotaFiscalServico(notaFiscalIDs: string[]) {
	return await fetchData(`/api/fiscal/notas-fiscais/integrar-lista`, { notaFiscalIDs }, 'POST');
}

export async function integrarNotaFiscalServico(id: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/${id}/integrar`, null, 'POST');
}

export async function integrarNfeEntrada(id_nfe: string[], dt_competencia: string) {
	return await fetchData(`/api/fiscal/documentos/nfe/integrar/dominio`, { id_nfe, dt_competencia }, 'POST');
}

export async function reverterIntegracaoNfeEntrada(ids: string[], dt_competencia: string) {
	return await fetchData(`/api/fiscal/documentos/nfe/reverter/dominio`, { ids, dt_competencia }, 'POST');
}

export async function deleteNotaFiscalServico(id: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/${id}`, null, 'DELETE');
}

export async function updateNotaFiscalServico(id: string, content: unknown) {
	return await fetchData(`/api/fiscal/notas-fiscais/${id}`, content, 'PUT');
}

export async function sincronizarDominio(competencia: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/sincronizar-dominio`, { competencia }, 'POST');
}
export async function sincronizarDominioNfe(competencia: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/sincronizar-dominio-nfe`, { competencia }, 'POST');
}
export async function sincronizarDominioCte(competencia: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/sincronizar-dominio-cte`, { competencia }, 'POST');
}
export async function sincronizarVerfDominio(competencia: string) {
	return await fetchData(`/api/fiscal/notas-fiscais/sincronizar-verf-dominio`, { competencia }, 'POST');
}

// // // // // // // // // // Extração // // // // // // // // // //

export async function getLengthOfDocumentosDfeError(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/documentos/dfe-error`, { empresaId, competencia });
}

// Itens da NFe
export async function getItensNfe(id_nfe: string) {
	return await fetchData(`/api/fiscal/documentos/nfe/itens/${id_nfe}`);
}

// Inserir/alterar itens da NFe (payload normalizado)
export async function insertItensAlterNfe(payload: unknown) {
	return await fetchData(`/api/fiscal/documentos/nfe/itens/alterar`, payload, 'POST');
}

// Atualiza dt_saida_entrega da NFe (PATCH /nfe/:id_nfe/dt-saida-entrega)
export async function updateDtSaidaEntregaNfe(id_nfe: string, dtSaida: string) {
	return await fetchData(`/api/fiscal/documentos/nfe/${id_nfe}/dt-saida-entrega`, { dtSaida }, 'PATCH');
}

// Marca documentos como "operação não realizada" com justificativas
export async function operacaoNaoRealizada(items: Array<{ id_documento: string; justificativa: string }>) {
	return await fetchData(`/api/fiscal/documentos/operacao-nao-realizada`, { items }, 'POST');
}

// // // // // // // // // // Subcontratação CTe // // // // // // // // // //

/**
 * Registra uma solicitação de alteração de subcontratação em um documento CTe
 * @param documentoId - ID do documento DFe
 * @param empresaId - ID da empresa para a qual transferir a subcontratação
 * @param ds_motivo - Motivo/justificativa da alteração
 */
export async function solicitarAlteracaoSubcontratacao(documentoId: string, empresaId: string, ds_motivo: string) {
	return await fetchData(
		'/api/fiscal/documentos/cte/subcontratacao/alterar',
		{
			documentoId,
			empresaId,
			ds_motivo,
		},
		'POST',
	);
}

/**
 * Atualiza a situação de uma alteração de subcontratação
 * @param idAlteracao - ID do registro de alteração
 * @param situacao - Nova situação: PENDENTE, APROVADO, REJEITADO, REVERTIDO
 * @param ds_observacao - Observação opcional (motivo da rejeição ou observação)
 */
export async function atualizarSituacaoAlteracaoSubcontratacao(
	idAlteracao: string,
	situacao: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'REVERTIDO',
	ds_observacao?: string,
) {
	return await fetchData(
		`/api/fiscal/documentos/cte/subcontratacao/alteracao/${idAlteracao}/situacao`,
		{
			situacao,
			ds_observacao,
		},
		'PATCH',
	);
}

/**
 * Aprova uma alteração de subcontratação
 * @param idAlteracao - ID do registro de alteração
 * @param ds_observacao - Observação adicional opcional
 */
export async function aprovarAlteracaoSubcontratacao(idAlteracao: string, ds_observacao?: string) {
	return await atualizarSituacaoAlteracaoSubcontratacao(idAlteracao, 'APROVADO', ds_observacao);
}

/**
 * Rejeita uma alteração de subcontratação
 * @param idAlteracao - ID do registro de alteração
 * @param ds_observacao - Motivo da rejeição
 */
export async function rejeitarAlteracaoSubcontratacao(idAlteracao: string, ds_observacao?: string) {
	return await atualizarSituacaoAlteracaoSubcontratacao(idAlteracao, 'REJEITADO', ds_observacao);
}

/**
 * Reverte uma alteração de subcontratação
 * @param idAlteracao - ID do registro de alteração
 * @param ds_observacao - Motivo da reversão
 */
export async function reverterAlteracaoSubcontratacao(idAlteracao: string, ds_observacao?: string) {
	return await fetchData(
		`/api/fiscal/documentos/cte/subcontratacao/alteracao/${idAlteracao}/reverter`,
		{
			situacao: 'REVERTIDO',
			ds_observacao,
		},
		'POST',
	);
}
