export interface NFeItem {
	ds_produto: string | null;
	cd_ncm: string | null;
	cd_cfop: string | null;
	vl_quantidade: string | null;
	vl_unitario: string | null;
	vl_total: string | null;
	ds_cst: string | null;
}

export interface NFeData {
	id: string;
	ds_chave: string | null;

	ds_numero: string | null;
	ds_serie: string | null;
	ds_modelo: string | null;
	dt_emissao: string | Date | null;

	ds_razao_social_emitente: string | null;
	ds_documento_emitente: string | null;
	ds_razao_social_destinatario: string | null;
	ds_documento_destinatario: string | null;

	vl_nf: string | null;
	vl_produto: string | null;
	vl_icms: string | null;
	vl_frete: string | null;
	vl_seg: string | null;
	vl_desc: string | null;
	vl_outros: string | null;

	fis_nfe_itens: NFeItem[];
}

export interface CTeCarga {
	ds_und: string;
	ds_tipo_medida: string;
	vl_qtd_carregada: string;
}

export interface CTeComp {
	ds_nome: string;
	vl_comp: string;
}

export interface CTeData {
	/* chave técnica */
	id: string;
	ds_chave: string;
	ds_numero: string | null;
	ds_serie: number | null;
	ds_modelo: number | null;
	dt_emissao: string | Date | null;

	/* partes */
	ds_razao_social_emitente: string | null;
	ds_documento_emitente: string | null;
	ds_razao_social_remetente: string | null;
	ds_documento_remetente: string | null;
	ds_razao_social_destinatario: string | null;
	ds_documento_destinatario: string | null;

	/* locais */
	ds_nome_mun_ini: string | null;
	ds_uf_ini: string | null;
	ds_nome_mun_fim: string | null;
	ds_uf_fim: string | null;

	/* totais principais */
	vl_total: string | null;
	vl_rec: string | null;
	vl_total_trib: string | null;
	vl_base_calculo_icms: string | null;
	vl_icms: string | null;
	vl_porcentagem_icms: string | null;

	/* listas */
	fis_cte_comp_carga: CTeComp[];
	fis_cte_carga: CTeCarga[];
}

export interface ServicoData {
	id: string;
	id_servico: string; // id da tabela de servico
	id_item_padrao: string; // id do item padrão da tabela de item padrão
	id_tipo_servico: string; // id do tipo de serviço da tabela de tipo de serviço

	ds_valor_unitario: string;
	ds_quantidade: string;
	ds_valor_total: string;
	ds_discriminacao: string; // descrição do serviço

	ds_base_calculo: string;
	ds_aliquota: string;
	ds_valor_iss: string;
	ds_valor_deducoes: string;
	ds_valor_descontos: string;

	is_iss_retido: boolean;
	ds_exigibilidade_iss: string;
	ds_municipio_incidencia: string; // enviar codigo de IBGE

	ds_valor_pis: string;
	ds_valor_cofins: string;
	ds_valor_inss: string;
	ds_valor_ir: string;
	ds_valor_csll: string;
	ds_outras_retencoes: string;

	use_item_padrao: boolean; // se o serviço é um item padrão ou não
}

export interface NFSeData {
	id?: string;
	ds_numero: string;
	dt_emissao: Date | undefined;
	dt_competencia: Date | undefined;
	ds_codigo_verificacao: string;
	id_fis_fornecedor: string;

	fis_fornecedor?: {
		id: string;
		ds_nome: string;
		ds_documento: string;
		ds_inscricao_municipal: string;
		ds_ibge: string;
	};

	is_optante_simples_nacional: boolean;

	js_servicos: ServicoData[];

	ds_discriminacao?: string;
	ds_valor_liquido_nfse: string;
	ds_valor_servicos: string;
	ds_valor_retencoes: string;
	ds_valor_descontos: string;
	ds_valor_pis: string;
	ds_valor_cofins: string;
	ds_valor_inss: string;
	ds_valor_ir: string;
	ds_valor_csll: string;
	ds_outras_retencoes: string;
}
