export interface AccessPayload {
	id_empresa: string;
	id_module: string;
	dt_ativacao: string;
	is_activated: boolean;
}

export interface IPatchDfe {
	id: string;
	controlNumber: number;
}

export interface ICreateModules {
	ds_module: string;
}

export interface IProfilesModules {
	id_profile: string;
	id_module: string;
	dt_ativacao: Date;
	is_activated: boolean;
	dt_updated?: Date;
}

export interface IEmpresasModule {
	id_empresa: string;
	id_module: string;
	dt_ativacao: Date;
	is_activated: boolean;
	dt_updated?: Date;
	dt_created: Date;
	module: IModule;
	empresa: IEmpresa;
}

export interface IModule {
	id: string;
	ds_module: string;
	dt_created: Date;
}

export interface IEmpresa {
	id: string;
	id_externo: Date;
	dt_created: Date;
	dt_updated: Date;
	ds_razao_social: string;
	ds_fantasia: string;
	ds_apelido: string;
	ds_nome: string;
	ds_municipio: string;
	ds_documento: string;
	is_ativo: boolean;
	dt_ativacao: Date;
	dt_inativacao: Date;
	ds_url: string;
	ds_integration_key: string;
	ds_cnae: string;
	ds_inscricao_municipal: string;
	ds_uf: string;
	is_escritorio: boolean;
	id_segmento: string;
	id_regime_tributario: string;
	id_escritorio: string;
}

export interface IAccess {
	id_empresa?: string;
	id_profile?: string;
	id_module: string;
	is_activated: string;
}

export interface EmployeProps {
	id: string;
	text: string;
	date?: Date;
	hability: boolean;
}
