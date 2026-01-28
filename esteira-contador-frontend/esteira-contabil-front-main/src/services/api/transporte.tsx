import { fetchData } from './request-handler';
import { AccessPayload, IDfesParams, IEmailParams, ICreateCte, IPatchDfe, ICtesParams } from '@/interfaces';

export async function getDfes(params: IDfesParams) {
	const query = new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value)]),
	).toString();

	const url = query ? `/api/transporte/dfe?${query}` : `/api/transporte/dfe`;
	return await fetchData(url, undefined, 'GET');
}

export async function patchDfe(payload: IPatchDfe) {
	return await fetchData(`/api/transporte/dfe/${payload?.id}/control-number`, payload, 'PATCH');
}

export async function getDfeStatics() {
	return await fetchData(`/api/transporte/statistics`, undefined, 'GET');
}

export async function postEmployeeAccess(id_employee: string, payload: AccessPayload) {
	return await fetchData(`/api/transporte/enterprise/${id_employee}/grant-access`, payload, 'POST');
}

export async function postEmployeeEnterprise(payload: AccessPayload) {
	return await fetchData(`/api/modules/enterprises`, payload, 'POST');
}

export async function getModule(id_empresa: string) {
	const query = new URLSearchParams({
		id_empresa: id_empresa,
		ds_module: 'FATURAMENTO',
	});
	return await fetchData(`/api/modules/find-one?${query}`, undefined, 'GET');
}

export async function getAllModules() {
	return await fetchData(`/api/modules/only-modules`, undefined, 'GET');
}

export async function getEmails(params: IEmailParams) {
	const query = new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => [key, value]),
	).toString();

	const url = query ? `/api/transporte/emails-by-user-id?${query}` : `/api/transporte/dfe`;
	return await fetchData(url, undefined, 'GET');
}

export async function postCte(payload: ICreateCte) {
	return await fetchData(`/api/transporte/enviar-cte`, payload, 'POST');
}

export async function getCtes(id_employee: string, params: ICtesParams) {
	const query = new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => [key, value instanceof Date ? value.toISOString() : String(value)]),
	).toString();

	const url = `/api/transporte/enterprise/${id_employee}/cte?${query}`;
	return await fetchData(url, undefined, 'GET');
}

export async function getCFOPCte() {
	return await fetchData('/api/geral/cadastros/cfop?fl_fit_cte=true');
}