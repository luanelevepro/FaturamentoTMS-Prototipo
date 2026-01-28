export interface NewModule {
	id_empresa: string;
	id_module: string;
	dt_ativacao: string;
	is_activated: boolean;
}

export interface IAllModules {
	id: string;
	ds_module: string;
	dt_created: Date;
}
