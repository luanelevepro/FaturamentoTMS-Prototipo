import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/general/administrativo/empresas/empresa-columns';
import { toast } from 'sonner';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import EmptyState from '@/components/states/empty-state';
import { getEmpresasEscritorio } from '@/services/api/escritorios';
import { useCompanyContext } from '@/context/company-context';
import HandleInsertEmpresa from '@/components/general/administrativo/empresas/btn-insert-empresa';
import HandleUpdateEmpresas from '@/components/general/administrativo/empresas/btn-update-all';

export interface Company {
	id: string;
	dt_created: string;
	dt_updated: string;
	ds_razao_social: string;
	ds_fantasia: string;
	ds_apelido: string;
	ds_nome: string;
	ds_documento: string;
	is_ativo: boolean;
	dt_ativacao: string;
	dt_inativacao: string;
	ds_cnae: string;
	ds_uf: string;
	is_escritorio: boolean;
	id_escritorio: string;
	id_externo: string;
	ds_url: string;
	id_segmento: string;
	id_regime_tributario: string;
}

export default function EmpresasPage() {
	const [searchTerm, setSearchTerm] = useState<string>(''); // Adiciona o estado para o termo de busca
	const { state } = useCompanyContext();
	const {
		data: companies,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-empresas', state],
		queryFn: () => {
			return getEmpresasEscritorio(state);
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!state,
	});

	const filteredCompanies = useMemo(() => {
		if (!searchTerm) return companies;

		return companies?.filter((company: Company) => {
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
				<title>Empresas | Esteira</title>
			</Head>
			<DashboardLayout title='Empresas' description='Gerencie as empresas da organização.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar empresas...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o estado do termo de busca
								className='mr-2 pl-8'
							/>
						</div>
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleUpdateEmpresas />
						<HandleInsertEmpresa onChange={() => refetch()}>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsertEmpresa>
					</div>
					{filteredCompanies?.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhuma empresa.' />
					) : (
						<DataTable columns={columns} data={filteredCompanies || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
