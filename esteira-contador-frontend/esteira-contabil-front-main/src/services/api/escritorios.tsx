import { fetchData } from './request-handler';

export async function getEscritorios() {
	return await fetchData('/api/escritorios'); // Trás todos os escritórios do sistema
}

export async function getEmpresasEscritorio(escritorio_id: string) {
	return await fetchData(`/api/escritorios/${escritorio_id}/empresas`); // Trás todas as empresas de um escritório
}

export async function insertApiUrl(escritorio_id: string, url: string) {
	return await fetchData(`/api/escritorios/${escritorio_id}/url`, { url: url }, 'POST'); // Insere a URL da API de uma empresa
}
