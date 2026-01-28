import { IPagination } from '@/interfaces';

export interface ITransporteDFe {
	data?: IDFe[];
	error?: string;
	success?: boolean;
	pagination: IPagination;
	allIds?: Array<{ id: string; id_nfe?: string | null; id_cte?: string | null }>;
}

export interface ITransporteCte {
	data?: ICte[];
	error?: string;
	success?: boolean;
	pagination: IPagination;
	allIds?: Array<{ id: string; id_cte?: string | null }>;
}

export type DFeStatus = 'ERRO' | 'IMPORTADO' | 'INTEGRADO';
export type NewDFeStatus = 'PENDENTE' | 'VINCULADO' | 'PROCESSADO' | 'CANCELADO';
export type typeDfe = 'nfe' | 'nfse' | 'cte' | undefined;
export interface IDfesParams {
	id?: string;
	page?: number;
	pageSize?: number;
	startDate?: Date | string;
	endDate?: Date | string;
	sortBy?: 'dt_created' | 'dt_updated' | 'dt_emissao' | 'valorTotal' | 'ds_controle';
	sortOrder?: 'asc' | 'desc';
	search?: string;
	type: typeDfe;
	status?: DFeStatus | DFeStatus[];
	situacao?: NewDFeStatus | NewDFeStatus[];
	emit?: boolean;
}

export interface ICtesParams {
	page?: number;
	pageSize?: number;
	startDate?: Date | string;
	endDate?: Date | string;
	sortBy?: 'dt_created' | 'dt_updated' | 'dt_emissao' | 'ds_numero' | 'ds_razao_social_emitente' | 'vl_total';
	sortOrder?: 'asc' | 'desc';
	search?: string;
}
export interface IDFe {
	id: string;
	ds_raw: string;
	ds_controle: number;
	ds_error?: boolean;
	dt_created: string;
	dt_updated: string;
	ds_tipo: string;
	ds_situacao_integracao: string;
	ds_origem: string;
	ds_status?: 'PENDENTE' | 'VINCULADO' | 'PROCESSADO' | 'CANCELADO';
	ds_documento_destinatario: string;
	ds_documento_emitente: string;
	ds_documento_tomador?: string;
	ds_documento_remetente?: string;
	dt_emissao: string;
	id_nfse?: string;
	id_nfe: string;
	id_cte: string;
	id_fis_documento?: string;
	id_fis_empresas: string;
	id_protocolo_raw?: string;
	ds_tipo_ef: string;
	valorTotal: number;
	vFrete: number;
	vCarga: number;
	nomeDestinatario?: string;
	nomeEmitente?: string;
	xMunIni: string;
	UFIni: string;
	xMunFim: string;
	UFFim: string;
	obs?: string;
	ds_numero?: string;
	ds_serie?: string;
	ds_chave?: string;
	js_nfe: INfeJs;
	is_subcontratada: boolean;
	ds_documento_subcontratada?: string;
	alteracao_subcontratacao_pendente?: {
		id_alteracao: string;
		ds_motivo: string;
		ds_razao_social_subcontratada_original: string;
		usuario_solicitante: {
			ds_email: string;
		};
	};
}

export interface ICte {
	id: string;
	dt_created: string;
	dt_updated: string;
	id_fis_empresa_emitente: string;
	id_fis_empresa_destinatario: string;
	id_fis_empresa_remetente: string;
	id_fis_empresa_tomador: string;
	id_fis_empresa_subcontratada: string;
	id_fis_fornecedor: string;
	ds_id_cte: string;
	ds_chave: string;
	ds_chave_nfe: string;
	ds_observacao: string;
	js_documentos_autorizados: string;
	js_placas_veiculos: string;
	ds_uf: string;
	cd_ibge: string;
	cd_cte: string;
	ds_cfop: string;
	ds_icms_tag: string;
	ds_natureza_operacao: string;
	ds_modelo: number;
	ds_serie: number;
	ds_numero: string;
	dt_emissao: string;
	ds_tp_cte: number;
	ds_modal: string;
	ds_tp_serv: number;
	cd_mun_env: string;
	ds_nome_mun_env: string;
	ds_uf_env: string;
	cd_mun_ini: string;
	ds_nome_mun_ini: string;
	ds_uf_ini: string;
	cd_mun_fim: string;
	ds_nome_mun_fim: string;
	ds_uf_fim: string;
	ds_retira: number;
	ds_ind_ie_toma: number;
	ds_documento_emitente: string;
	ds_razao_social_emitente: string;
	ds_documento_remetente: string;
	ds_razao_social_remetente: string;
	ds_documento_destinatario: string;
	ds_razao_social_destinatario: string;
	ds_documento_tomador: string;
	ds_razao_social_tomador: string;
	ds_razao_social_subcontratada: string;
	ds_documento_subcontratada: string;
	vl_total: string;
	vl_rec: string;
	vl_total_trib: string;
	ds_cst_tributacao: string;
	vl_base_calculo_icms: string;
	vl_icms: string;
	cd_icms: string;
	vl_porcentagem_icms: string;
}

export interface INfeJs {
	cd_nf: string;
	acd_nf: string;
	ascd_nf: string;
}
export interface XMLInfo {
	file: File;
	nCT?: string;
	tipo?: 'NFe' | 'CTe' | 'Desconhecido';
}
