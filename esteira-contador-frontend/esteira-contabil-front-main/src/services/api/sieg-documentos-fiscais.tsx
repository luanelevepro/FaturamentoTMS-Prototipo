import { fetchData } from './request-handler';

export async function coletarEntradasSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-sieg`, { empresaId, competencia }, 'POST');
}
//----------Entradas Sieg----------//
export async function coletarNfseSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfse-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarNfeSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfe-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarNfceSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfce-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarCteSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-cte-sieg`, { empresaId, competencia }, 'POST');
}

//----------Saidas Sieg----------//
export async function coletarNfseSaidaSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfse-saida-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarNfeSaidaSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfe-saida-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarNfceSaidaSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-nfce-saida-sieg`, { empresaId, competencia }, 'POST');
}

export async function coletarCteSaidaSieg(empresaId: string, competencia: string) {
	return await fetchData(`/api/fiscal/sieg/sync-cte-saida-sieg`, { empresaId, competencia }, 'POST');
}

export async function sincronizarPrestadores(empresaId: string) {
	return await fetchData(`/api/fiscal/sieg/prestadores-sieg`, { empresaId }, 'POST');
}
