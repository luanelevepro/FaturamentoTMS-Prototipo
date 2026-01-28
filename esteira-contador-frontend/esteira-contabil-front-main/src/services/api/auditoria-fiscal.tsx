import { fetchData } from './request-handler';

// === TYPES ===

export type TipoDocumento = 'NFE' | 'NFSE' | 'CTE' | 'NFCE';
export type AuditoriaStatusTecnico = 'OK' | 'INCONSISTENTE';
export type AuditoriaStatusOperacional = 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'IGNORADA';
export type CriticidadeLevel = 'INFO' | 'AVISO' | 'CRITICA';
export type StatusTratativa = 'ABERTA' | 'EM_TRATAMENTO' | 'AJUSTADA' | 'JUSTIFICADA' | 'IGNORADA';

export interface FisAuditoriaDoc {
	id: string;
	dt_created: Date | string;
	dt_updated: Date | string;
	id_execucao_auditoria?: string;
	id_fis_documento: string;
	ds_chave?: string;
	ds_tipo_doc: TipoDocumento;
	dt_emissao?: Date | string;
	ds_cnpj_emitente?: string;
	ds_cnpj_destinatario?: string;
	vl_documento?: number;
	status_tecnico: AuditoriaStatusTecnico;
	status_operacional: AuditoriaStatusOperacional;
	qtde_inconsistencias?: number;
	nivel_criticidade_max?: CriticidadeLevel;
	js_meta?: Record<string, unknown>;
	js_inconsistencias?: Record<string, unknown>;
	id_nfe?: string;
	id_nfse?: string;
	id_cte?: string;
	ds_razao_social_emitente?: string;
	ds_razao_social_destinatario?: string;
}

export interface FisTipoInconsistencia {
	id: string;
	dt_created: Date | string;
	dt_updated: Date | string;
	cd_codigo: string;
	ds_descricao: string;
	criticidade_padrao: CriticidadeLevel;
	ds_grupo?: string;
	fl_ativo: boolean;
	ds_ordem_exibicao?: number;
	versao_regra?: string;
	dt_inicio_vigencia?: Date | string;
	dt_fim_vigencia?: Date | string;
}

export interface FisAuditoriaDocIncons {
	id: string;
	dt_created: Date | string;
	id_auditoria_doc: string;
	id_tipo_inconsistencia?: string;
	ds_campo_impactado?: string;
	ds_valor_encontrado?: string;
	ds_valor_esperado?: string;
	ds_mensagem_detalhada?: string;
	criticidade?: CriticidadeLevel;
	status_tratativa?: StatusTratativa;
	id_usuario_responsavel?: string;
	js_origem?: Record<string, unknown>;
	vl_impacto_financeiro?: number;
	dt_resolucao?: Date | string;
	tipo_inconsistencia?: FisTipoInconsistencia;
}

export interface FisExecucaoAuditoria {
	id: string;
	dt_inicio: Date | string;
	dt_fim?: Date | string;
	ds_status_execucao?: string;
	qtde_documentos?: number;
	qtde_inconsistencias?: number;
	id_usuario_execucao?: string;
	js_parametros?: Record<string, unknown>;
	ds_mensagem_erro?: string;
}

export interface EstatisticasGerais {
	totalDocumentos: number;
	totalInconsistencias: number;
	documentosInconsistentes: number;
	documentosOk: number;
	porStatusOperacional: {
		ABERTA: number;
		EM_ANALISE: number;
		RESOLVIDA: number;
		IGNORADA: number;
	};
	valorTotalRisco: number;
}

export interface EstatisticasEmpresa {
	totalDocumentos: number;
	totalInconsistencias: number;
	porStatusOperacional: {
		ABERTA: number;
		EM_ANALISE: number;
		RESOLVIDA: number;
		IGNORADA: number;
	};
	porCriticidade: {
		CRITICA: number;
		AVISO: number;
		INFO: number;
	};
	valorTotalRisco: number;
}

export interface EmpresaComEstatisticas {
	id: string;
	cnpj: string;
	nome: string;
	total_documentos: number;
	total_inconsistencias: number;
	documentos_resolvidos: number;
	documentos_criticos: number;
	valor_total: number;
}

// === API FUNCTIONS ===

/**
 * Lista documentos auditados com filtros opcionais
 * Nota: empresa_cnpj e is_escritorio são resolvidos automaticamente pelo backend via empresaId do header
 */
export async function getDocumentosAuditoria(filters?: {
	status_tecnico?: AuditoriaStatusTecnico;
	status_operacional?: AuditoriaStatusOperacional;
	tipo_doc?: TipoDocumento;
	criticidade?: CriticidadeLevel | 'SEM_CRITICIDADE';
	dt_inicio?: string;
	dt_fim?: string;
}) {
	const params = new URLSearchParams();
	if (filters?.status_tecnico) params.append('status_tecnico', filters.status_tecnico);
	if (filters?.status_operacional) params.append('status_operacional', filters.status_operacional);
	if (filters?.tipo_doc) params.append('tipo_doc', filters.tipo_doc);
	if (filters?.criticidade) params.append('criticidade', filters.criticidade);
	if (filters?.dt_inicio) params.append('dt_inicio', filters.dt_inicio);
	if (filters?.dt_fim) params.append('dt_fim', filters.dt_fim);

	const query = params.toString() ? `?${params.toString()}` : '';
	return await fetchData<FisAuditoriaDoc[]>(`/api/fiscal/auditoria/documentos${query}`);
}

/**
 * Obtém um documento auditado por ID
 */
export async function getDocumentoAuditoriaById(id: string) {
	return await fetchData<FisAuditoriaDoc>(`/api/fiscal/auditoria/documentos/${id}`);
}

/**
 * Obtém inconsistências de um documento
 */
export async function getInconsistenciasDocumento(id: string) {
	return await fetchData<FisAuditoriaDocIncons[]>(`/api/fiscal/auditoria/documentos/${id}/inconsistencias`);
}

/**
 * Lista tipos de inconsistência
 */
export async function getTiposInconsistencia(activeOnly: boolean = true) {
	const query = activeOnly ? '?active=true' : '';
	return await fetchData<FisTipoInconsistencia[]>(`/api/fiscal/auditoria/tipos-inconsistencia${query}`);
}

/**
 * Obtém estatísticas gerais da auditoria
 */
export async function getEstatisticasGerais() {
	return await fetchData<EstatisticasGerais>('/api/fiscal/auditoria/estatisticas');
}

/**
 * Lista empresas vinculadas com suas estatísticas (para escritórios)
 * Retorna vazio se o usuário for uma empresa
 */
export async function getEmpresasAuditoria() {
	return await fetchData<EmpresaComEstatisticas[]>('/api/fiscal/auditoria/empresas');
}

/**
 * Obtém estatísticas de uma empresa específica
 */
export async function getEstatisticasEmpresa(cnpj: string) {
	return await fetchData<EstatisticasEmpresa>(`/api/fiscal/auditoria/estatisticas/${cnpj}`);
}

/**
 * Lista execuções de auditoria
 */
export async function getExecucoesAuditoria() {
	return await fetchData<FisExecucaoAuditoria[]>('/api/fiscal/auditoria/execucoes');
}
