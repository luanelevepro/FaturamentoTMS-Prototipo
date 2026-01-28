import { fetchData } from './request-handler';

export async function getCargosNiveis() {
	return await fetchData('/api/rh/niveis');
}

export async function getCargosNiveisEmpresa(empresa_id: string) {
	return await fetchData(`/api/rh/cargonivel/empresa/${empresa_id}`);
}
export async function getCargoNivelById(cargo_id: string) {
	return await fetchData(`/api/rh/cargonivel/cargo/${cargo_id}`);
}

export async function processCargoItems(cargo_id: string, items: unknown[]) {
	return await fetchData(`/api/rh/cargonivel/salarios/${cargo_id}`, { items }, 'POST');
}
