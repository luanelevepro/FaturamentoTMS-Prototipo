export interface ICreateCte {
	id_empresa?: string;
	nfe_ids?: string[];
	dados_adicionais: IDadosAdicionais;
}

interface IDadosAdicionais {
	serie?: string;
	modal?: string;
	tpServ?: string;
	RNTRC?: string;
	dPrev?: string;
	cfop?: string;
	valorFrete?: string;
	pesoTotal?: number;
	pagamento?: string;
}

export interface CfopCte {
	id: string;
	dt_created: Date;
	dt_updated: Date;
	ds_descricao: string;
	ds_codigo: string;
	fl_fit_entrada: boolean;
	fl_fit_saida: boolean;
	fl_fit_cte: boolean;
	fl_fit_nfe: boolean;
}
