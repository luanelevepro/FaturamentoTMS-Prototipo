import { fetchData } from './request-handler';

// interface de tipo
export interface TipoIntegracao {
	id: string
	ds_nome: string
  }

export async function getTipoIntegracao() {
	return await fetchData(`/api/integracao/tipo`);
}

export async function createTipoIntegracao(ds_nome: string): Promise<TipoIntegracao> {
	return await fetchData(`/api/integracao/tipo`, { ds_nome }, 'POST');
}
