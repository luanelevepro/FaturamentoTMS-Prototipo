import { useQuery } from '@tanstack/react-query';

const apiIBGE = 'https://servicodados.ibge.gov.br/api';

export interface IStates {
	id: number;
	sigla: string;
	nome: string;
}

const getStates = async (): Promise<IStates[]> => {
	const res = await fetch(`${apiIBGE}/v1/localidades/estados?orderBy=nome`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		throw new Error(`Erro ao buscar estados: ${res.status} - ${res.statusText}`);
	}

	return res.json();
};

const getCities = async (ufId: string): Promise<IStates[]> => {
	const res = await fetch(`${apiIBGE}/v1/localidades/estados/${ufId}/municipios?orderBy=nome`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		throw new Error(`Erro ao buscar estados: ${res.status} - ${res.statusText}`);
	}

	return res.json();
};

export const useUF = (enabled?: boolean) => {
	return useQuery<IStates[]>({
		queryKey: ['uf'],
		queryFn: getStates,
		enabled,
		staleTime: 1000 * 60 * 5,
		refetchOnWindowFocus: false,
	});
};

export const useCities = (ufId: string) => {
	return useQuery<IStates[]>({
		queryKey: ['city', ufId],
		queryFn: () => getCities(ufId),
		enabled: !!ufId,
		staleTime: 1000 * 60 * 5,
		refetchOnWindowFocus: false,
	});
};
