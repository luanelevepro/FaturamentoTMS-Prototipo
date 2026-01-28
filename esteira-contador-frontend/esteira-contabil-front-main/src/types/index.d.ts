declare namespace ESTEIRA {
	namespace RAW {
		type SisIbgeUf = {
			id: number;
			dt_created?: Date;
			dt_updated?: Date;
			ds_state: string;
			ds_uf: string;
		};

		type SisIgbeCity = {
			id: number;
			dt_created: Date;
			dt_updated: Date;
			ds_city: string;
			js_uf: SisIbgeUf;
			id_ibge_uf: number;
		};

		type EmbIbgeCidades = {
			id: number;
			id_sis_cidade: number;
			js_sis_city: ESTEIRA.RAW.SisIgbeCity;
			id_emb_uf: number;
			js_emb_ibge_uf: ESTEIRA.RAW.EmbIbgeUf;
		};

		type EmbIbgeUf = {
			id: number;
			id_sis_ibge_uf: number;
			js_sis_ibge_uf?: ESTEIRA.RAW.SisIbgeUf;
		};

		type UFHistorico = {
			cd_uf: string;
			dt_vigencia: string;
			vl_percentual_ipva_carros: number;
			vl_percentual_ipva_caminhoes: number;
			vl_icms_proprio: number;
		};

		type ClassificacaoVeiculo = {
			id: number;
			ds_classificacao: string;
			fl_carroceria_um_independente?: boolean;
			fl_carroceria_dois_independente?: boolean;
			id_emb_empresas: string;
			dt_created?: string;
			dt_updated?: string;
		};

		type ClassificacaoCarroceria = {
			id: number;
			ds_classificacao: string;
			id_emb_empresas: string;
			dt_created?: string;
			dt_updated?: string;
		};

		type ClassificacaoImplemento = {
			id: number;
			ds_classificacao: string;
			fl_acrescimo_eixo?: boolean;
			id_emb_empresas: string;
			dt_created?: string;
			dt_updated?: string;
		};

		type MarcaCarroceria = {
			id: number;
			cd_marca: number;
			ds_nome: string;
		};

		type SimplesNacional = {
			id: string;
			cd_simples: string;
			ds_nome: string;
			id_emb_empresas: string;
		};

		type MarcasCarrocerias = {
			id: number;
			cd_marca: number;
			ds_nome: string;
		};

		type Transportadora = {
			cd_transportadora: string;
			ds_cnpj: string;
			ds_nome_fantasia: string;
			ds_razao_social: string;
			id_emb_ibge_uf: number;
			js_emb_ibge_uf?: ESTEIRA.RAW.EmbIbgeCidades;
			id_emb_ibge_cidade: number;
			id_emb_empresas: string;
			js_emb_ibge_cidade?: ESTEIRA.RAW.EmbIbgeCidades;
			dt_created: string;
			dt_updated: string;
		};

		type TransportadoraHistorico = {
			cd_transportadora: string;
			js_transportadora?: ESTEIRA.RAW.Transportadora;
			dt_vigencia: string;
			id_regime_tributario?: string;
			js_regime_tributario?: ESTEIRA.RAW.RegimesTributarions;
			dt_created: string;
			dt_updated: string;
		};

		type TaxaJurosAnoModelo = {
			cd_ano: number;
			vl_taxa_juros: number;
			dt_created: Date;
			dt_updated: Date;
		};

		type Estabelecimento = {
			id: string;
			ds_nome: string;
			emb_empresas?: {
				sis_empresas: {
					ds_fantasia: string;
				};
			};
			emb_empresas: string;
			id_emb_ibge_cidade: number;
			js_emb_ibge_cidade?: ESTEIRA.RAW.EmbIbgeCidades;
			dt_created: string;
			dt_updated: string;
		};

		type NotificationType = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG' | 'PENDING';

		interface Notification {
			id: string;
			ds_titulo: string;
			ds_descricao?: string;
			dt_created: Date;
			cd_tipo: ESTEIRA.RAW.NotificationType;
			ds_url?: string;
		}
	}

	namespace PAYLOAD {
		type Paginacao = {
			page?: number;
			pageSize?: number;
			orderBy?: 'asc' | 'desc';
			orderColumn?: string; // ex: 'js_nfse.dt_emissao'
			search?: string;
		};

		// Sistema - Marcas Carrocerias
		type CreateMarcaCarroceria = Omit<ESTEIRA.RAW.MarcaCarroceria, 'id'>;
		type UpdateMarcaCarroceria = ESTEIRA.RAW.MarcaCarroceria;
		type DeleteMarcaCarroceria = Pick<ESTEIRA.RAW.MarcaCarroceria, 'id'>;

		// Sistema - Regimes Tributarios
		type CreateRegimeTributario = Omit<ESTEIRA.RAW.RegimeTributario, 'id'>;
		type UpdateRegimeTributario = ESTEIRA.RAW.RegimeTributario;
		type DeleteRegimeTributario = Pick<ESTEIRA.RAW.RegimeTributario, 'id'>;

		// Sistema - Simples Nacional
		type CreateSimplesNacional = Omit<ESTEIRA.RAW.SimplesNacional, 'id'>;
		type UpdateSimplesNacional = ESTEIRA.RAW.SimplesNacional;
		type DeleteSimplesNacional = Pick<ESTEIRA.RAW.SimplesNacional, 'id'>;

		// Sistema - UF
		type UpdateUF = Pick<ESTEIRA.RAW.SisIbgeUf, 'ds_nome'>;
		type CreateUF = Pick<ESTEIRA.RAW.SisIbgeUf, 'ds_state' | 'ds_uf'>;
		type DeleteUF = Pick<ESTEIRA.RAW.SisIbgeUf, 'cd_uf'>;

		// Sistema - Notificações
		type CreateNotification = Omit<ESTEIRA.RAW.Notification, 'id', 'dt_created' | 'dt_updated'>;
		type DeleteNotification = void;

		// Parametros - Classificação Veículos
		type CreateClassificacaoVeiculo = Omit<ESTEIRA.RAW.ClassificacaoVeiculo, 'id' | 'dt_created' | 'dt_updated' | 'id_emb_empresas'>;
		type UpdateClassificacaoVeiculo = Omit<CreateClassificacaoVeiculo, 'id_emb_empresas'>;
		type DeleteClassificacaoVeiculo = Pick<ESTEIRA.RAW.ClassificacaoVeiculo, 'id'>;

		// Parametros - Classificação Carrocerias
		type CreateClassificacaoCarroceria = Omit<
			ESTEIRA.RAW.ClassificacaoCarroceria,
			'id' | 'dt_created' | 'dt_updated' | 'id_emb_empresas'
		>;
		type UpdateClassificacaoCarroceria = Omit<CreateClassificacaoCarroceria, 'id_emb_empresas'>;
		type DeleteClassificacaoCarroceria = Pick<ESTEIRA.RAW.ClassificacaoCarroceria, 'id'>;

		// Parametros - Classificação Implementos
		type CreateClassificacaoImplemento = Omit<
			ESTEIRA.RAW.ClassificacaoImplemento,
			'id' | 'dt_created' | 'dt_updated' | 'id_emb_empresas'
		>;
		type UpdateClassificacaoImplemento = Omit<CreateClassificacaoImplemento, 'id_emb_empresas'>;
		type DeleteClassificacaoImplemento = Pick<ESTEIRA.RAW.ClassificacaoImplemento, 'id'>;

		// Cadastros - Estabelecimentos
		type CreateEstabelecimento = {
			ds_nome: string;
			id_sis_ibge_cidade: number;
		};
		type UpdateEstabelecimento = {
			id: string;
			ds_nome: string;
			id_sis_ibge_cidade: number;
		};
		type DeleteEstabelecimento = Pick<ESTEIRA.RAW.Estabelecimento, 'id'>;

		// Cadastros - Transportadoras
		type CreateTransportadora = {
			cd_transportadora: string;
			ds_cnpj: string;
			ds_nome_fantasia: string;
			ds_razao_social: string;
			id_sis_ibge_cidade: number;
		};
		type UpdateTransportadora = {
			cd_transportadora: string;
			ds_cnpj: string;
			ds_nome_fantasia: string;
			ds_razao_social: string;
			id_sis_ibge_cidade: number;
		};
		type DeleteTransportadora = Pick<ESTEIRA.RAW.Transportadora, 'ds_codigo'>;
	}

	namespace RESPONSE {
		type Paginado<K extends string, T extends object> = {
			total: number;
			totalPages: number;
			page: number;
		} & {
			[P in K]: T[];
		};

		// Sistema - UF
		type GetUFs = Paginado<'ufs', ESTEIRA.RAW.SisIbgeUf>;
		type GetUF = { uf: ESTEIRA.RAW.SisIbgeUf };
		type GetUFHistoricos = Paginado<'vigencias', ESTEIRA.RAW.SisIbgeUfHistorico>;
		type GetUFCidades = { cidades: ESTEIRA.RAW.SisIgbeCity[] };

		// Sistema - Regimes Tributarios
		type GetRegimesTributarios = ESTEIRA.RAW.RegimeTributario[];
		type GetRegimeTributario = ESTEIRA.RAW.RegimeTributario;
		type CreateRegimeTributario = ESTEIRA.RAW.RegimeTributario;
		type UpdateRegimeTributario = ESTEIRA.RAW.RegimeTributario;

		// Sistema - Simples Nacional
		type GetSimplesNacional = Paginado<'simples', ESTEIRA.RAW.SimplesNacional>;
		type GetSimplesNacional = ESTEIRA.RAW.SimplesNacional;
		type CreateSimplesNacional = ESTEIRA.RAW.SimplesNacional;
		type UpdateSimplesNacional = ESTEIRA.RAW.SimplesNacional;

		// Parametros - Classificação veíulos
		type GetClassificacaoVeiculos = Paginado<'classificacoes', ESTEIRA.RAW.ClassificacaoVeiculo>;
		type GetClassificacaoVeiculo = ESTEIRA.RAW.ClassificacaoVeiculo;
		type createClassificacaoVeiculo = ESTEIRA.RAW.ClassificacaoVeiculo;
		type updateClassificacaoVeiculo = ESTEIRA.RAW.ClassificacaoVeiculo;
		type deleteClassificacaoVeiculo = void;

		// Parametros - Classificação Carrocerias
		type GetClassificacaoCarrocerias = Paginado<'carrocerias', ESTEIRA.RAW.ClassificacaoCarroceria>;
		type CreateClassificacaoCarroceria = STEIRA.RAW.ClassificacaoCarroceria;
		type UpdateClassificacaoCarroceria = ESTEIRA.RAW.ClassificacaoCarroceria;
		type DeleteClassificacaoCarroceria = ESTEIRA.RAW.ClassificacaoCarroceria;

		// Parametros - Classificação Implementos
		type GetClassificacaoImplementos = Paginado<'implementos', ESTEIRA.RAW.ClassificacaoImplemento>;
		type CreateClassificacaoImplemento = ESTEIRA.RAW.ClassificacaoImplemento;
		type UpdateClassificacaoImplemento = ESTEIRA.RAW.ClassificacaoImplemento;
		type DeleteClassificacaoImplemento = ESTEIRA.RAW.ClassificacaoImplemento;

		// Parametros - Marcas Carrocerias
		type GetMarcasCarrocerias = Paginado<'marcas', ESTEIRA.RAW.MarcaCarroceria>;
		type CreateMarcaCarroceria = ESTEIRA.RAW.MarcaCarroceria;
		type UpdateMarcaCarroceria = ESTEIRA.RAW.MarcaCarroceria;
		type DeleteMarcaCarroceria = ESTEIRA.RAW.MarcaCarroceria;

		// Sistema - Cidades
		type GetCidades = Paginado<'cities', ESTEIRA.RAW.SisIgbeCity>;
		type GetCidade = ESTEIRA.RAW.SisIgbeCity;
		type CreateCidade = ESTEIRA.RAW.SisIgbeCity;
		type UpdateCidade = ESTEIRA.RAW.SisIgbeCity;
		type DeleteCidade = ESTEIRA.RAW.SisIgbeCity;

		// Sistema - Notificações
		type GetNotificacoes = ESTEIRA.RAW.Notification[];
		type GetNotification = ESTEIRA.RAW.Notification;
		type CreateNotification = void;

		// Embarcador - Transportadoras
		type GetTransportadoras = Paginado<'transportadoras', ESTEIRA.RAW.Transportadora>;
		type GetTransportadora = ESTEIRA.RAW.Transportadora;
		type CreateTransportadora = ESTEIRA.RAW.Transportadora;
		type UpdateTransportadora = ESTEIRA.RAW.Transportadora;
		type DeleteTransportadora = ESTEIRA.RAW.Transportadora;

		// Embarcador - Estabelecimentos
		type GetEstabelecimentos = Paginado<'estabelecimentos', ESTEIRA.RAW.Estabelecimento>;
		type GetEstabelecimento = ESTEIRA.RAW.Estabelecimento;
		type CreateEstabelecimento = ESTEIRA.RAW.Estabelecimento;
		type UpdateEstabelecimento = ESTEIRA.RAW.Estabelecimento;
		type DeleteEstabelecimento = ESTEIRA.RAW.Estabelecimento;
	}
}
