import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/general/administrativo/escritorios/escritorio-columns';
import { toast } from 'sonner';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import EmptyState from '@/components/states/empty-state';
import { Company } from '../empresas';
import HandleInsertEscritorio from '@/components/general/administrativo/escritorios/btn-insert-escritorio';
import { getEscritorios } from '@/services/api/escritorios';

export default function EmpresasPage() {
	const [searchTerm, setSearchTerm] = useState<string>(''); // Adiciona o estado para o termo de busca
	const {
		data: companies,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({ queryKey: ['get-escritorios'], queryFn: getEscritorios, staleTime: 1000 * 60 * 5 });

	const filteredCompanies = useMemo(() => {
		if (!companies) return [];

		// Filtra empresas que possuem is_escritorio === true
		const validCompanies = companies.filter((company: Company) => company.is_escritorio === true);

		if (!searchTerm) return validCompanies;

		return validCompanies.filter((company: Company) => {
			const normalizedSearchTerm = searchTerm.toLowerCase().trim();

			// Divide a busca em termos com base no espaço
			const terms = normalizedSearchTerm.split(' ');

			return terms.every((term) => {
				// Verifica se o termo segue o formato "chave:valor"
				const [key, ...valueParts] = term.split(':');
				const value = valueParts.join(':').trim().toLowerCase();

				if (value) {
					// Filtro específico para campos definidos
					switch (key) {
						case 'uf':
							return company.ds_uf?.toLowerCase().includes(value);
						case 'razao':
							return company.ds_razao_social?.toLowerCase().includes(value);
						case 'fantasia':
							return company.ds_fantasia?.toLowerCase().includes(value);
						case 'cnae':
							return company.ds_cnae?.toLowerCase().includes(value);
						default:
							// Ignora chaves não reconhecidas
							return false;
					}
				} else {
					// Filtro geral para buscas sem chave
					return (
						company.ds_razao_social?.toLowerCase().includes(term) ||
						company.ds_fantasia?.toLowerCase().includes(term) ||
						company.ds_apelido?.toLowerCase().includes(term) ||
						company.ds_documento?.toLowerCase().includes(term) ||
						formatCnpjCpf(company.ds_documento)?.includes(term) ||
						company.ds_uf?.toLowerCase().includes(term) ||
						company.ds_cnae?.toLowerCase().includes(term)
					);
				}
			});
		});
	}, [companies, searchTerm]);

	if (isError) {
		toast.error(error.message);
	}

	return (
		<>
			<Head>
				<title>Escritórios | Esteira</title>
			</Head>
			<DashboardLayout title='Escritórios' description='Gerencie os escritórios do sistema.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar escritórios...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o estado do termo de busca
								className='mr-2 pl-8'
							/>
						</div>

						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleInsertEscritorio onChange={refetch}>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar Escritório</p>
							</Button>
						</HandleInsertEscritorio>
					</div>
					{filteredCompanies?.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhum escritório.' />
					) : (
						<DataTable columns={columns} data={filteredCompanies || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
