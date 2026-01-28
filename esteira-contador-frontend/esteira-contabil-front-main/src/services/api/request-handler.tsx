import { createClient } from '@/utils/supabase/component';
import { getUserIdCached } from '../user/user-cached';
import { getCookie } from 'cookies-next';

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchData<T>(path: string, body?: T, method: 'GET' | 'PUT' | 'DELETE' | 'POST' | 'PATCH' = 'GET') {
	const supabase = createClient();

	let userID = await getUserIdCached();

	if (!userID) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		userID = user?.id;
	}

	const userCompanyContext = getCookie('USER_COMPANY_CONTEXT_STATE');

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(userID && { Authorization: `Bearer ${userID} ${userCompanyContext}` }),
	};

	const options: RequestInit = {
		method,
		headers,
		...(body && { body: JSON.stringify(body) }),
	};

	// console.log(JSON.stringify(headers));

	const response = await fetch(`${API_URL}${path}`, options);

	// console.log('Fetching:', `${API_URL}${path}`);
	// console.log('Options:', options);

	if (!response.ok) {
		let errorMessage = `${response.status}: Erro desconhecido`;

		try {
			const errorResponse = await response.json();
			errorMessage = `${response.status}: ${errorResponse.error || 'Erro desconhecido'}`;
		} catch {
			const errorText = await response.text();
			errorMessage = `${response.status}: ${errorText}`;
		}

		throw new Error(`${errorMessage}`);
	}

	// Este retornos implicam que o body esteja vazio, dar parse em algo undefined gera erro json linha 1 de 1
	switch (response.status) {
		case 204:
		case 100:
		case 102:
		case 103:
			return;
		default:
			return response.json();
	}
}

export async function downloadFile(path: string) {
	const supabase = createClient();

	let userID = await getUserIdCached();

	if (!userID) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		userID = user?.id;
	}

	const userCompanyContext = getCookie('USER_COMPANY_CONTEXT_STATE');

	const headers: Record<string, string> = {
		...(userID && { Authorization: `Bearer ${userID} ${userCompanyContext}` }),
	};

	const options: RequestInit = {
		method: 'GET',
		headers,
	};

	const response = await fetch(`${API_URL}${path}`, options);

	if (!response.ok) {
		let errorMessage = `${response.status}: Erro desconhecido`;

		try {
			const errorResponse = await response.json();
			errorMessage = `${response.status}: ${errorResponse.error || 'Erro desconhecido'}`;
		} catch {
			const errorText = await response.text();
			errorMessage = `${response.status}: ${errorText}`;
		}

		throw new Error(`${errorMessage}`);
	}

	const blob = await response.blob();

	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;

	const fileName = response.headers.get('filename') ?? 'modelo_importacao.xlsx';

	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	window.URL.revokeObjectURL(url);
}

export async function uploadData(path: string, data: FormData) {
	const supabase = createClient();

	let userID = await getUserIdCached();

	if (!userID) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		userID = user?.id;
	}

	const userCompanyContext = getCookie('USER_COMPANY_CONTEXT_STATE');

	const headers: Record<string, string> = {
		...(userID && { Authorization: `Bearer ${userID} ${userCompanyContext}` }),
	};

	const options: RequestInit = {
		method: 'POST',
		headers,
		body: data,
	};

	const response = await fetch(`${API_URL}${path}`, options);

	if (!response.ok) {
		let errorMessage = `${response.status}: Erro desconhecido`;

		try {
			const errorResponse = await response.json();
			errorMessage = `${response.status}: ${errorResponse.error || 'Erro desconhecido'}`;
		} catch {
			const errorText = await response.text();
			errorMessage = `${response.status}: ${errorText}`;
		}

		throw new Error(`${errorMessage}`);
	}

	return;
}
