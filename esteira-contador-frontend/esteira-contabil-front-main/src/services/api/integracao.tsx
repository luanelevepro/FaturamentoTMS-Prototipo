import { fetchData } from './request-handler';

export interface Integration {
	id: string;
	ds_nome: string;
	ds_descricao?: string;
	fl_is_para_escritorio: boolean;
	fl_is_para_sistema: boolean;
	js_tipo_integracao: {
		id: string;
		ds_nome: string;
	};
}

export async function getIntegracao(empresa_id: string, tipoConsulta: 'gerencial' | 'conexao' = 'conexao') {
	return await fetchData(`/api/integracao/${empresa_id}/${tipoConsulta}`);
}

export async function createIntegracao(
	ds_nome: string,
	ds_descricao: string,
	id_tipo_integracao: string,
	fl_is_para_escritorio: boolean,
	fl_is_para_sistema: boolean,
	fields: { id: string; name: string; placeholder: string; type: string }[],
) {
	return await fetchData(
		`/api/integracao/`,
		{ ds_nome, ds_descricao, id_tipo_integracao, fl_is_para_escritorio, fl_is_para_sistema, fields },
		'POST',
	);
}

export async function getIntegracaoCompletaById(integracaoId: string, empresa_id: string) {
	return await fetchData(`/api/integracao/completo/${integracaoId}/${empresa_id}`);
}

export async function deleteIntegracao(integracaoId: string) {
	return await fetchData(`/api/integracao/${integracaoId}`, {}, 'DELETE');
}

export async function upsertConfigIntegracao(id_integracao: string, id_sis_empresas: string, ds_valores_config: Record<string, string>) {
	return await fetchData(`/api/integracao/config`, { id_integracao, id_sis_empresas, ds_valores_config }, 'POST');
}

export async function testarIntegracao(id_integracao: string, id_sis_empresas: string) {
	return await fetchData(`/api/integracao/test-conexao`, { id_integracao, id_sis_empresas }, 'POST');
}
