import { fetchData } from './../request-handler';

export async function getConsumoIntegracaoEmpAndCompt(empresaId: string, competencia: string) {
	return await fetchData(`/api/administrativo/consumo-integracao`, { empresaId, competencia }, 'POST');
}

export async function getConsumoIntegracaoByEmpresasList(empresasIdList: string[], integracaoId: string, competencia: string) {
	return await fetchData(`/api/administrativo/consumo-integracao/lista-empresas`, { empresasIdList, integracaoId, competencia }, 'POST');
}
