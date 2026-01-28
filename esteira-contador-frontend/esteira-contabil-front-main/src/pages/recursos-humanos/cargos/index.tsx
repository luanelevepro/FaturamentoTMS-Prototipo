import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table-expandable';
import { columns } from '@/components/general/recursos-humanos/cargos/cargo-columns';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { useCompanyContext } from '@/context/company-context';
import { getCargoEmpresa } from '@/services/api/cargos';
import HandleUpdateCargos from '@/components/general/recursos-humanos/cargos/btn-update-all';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface Cargo {
	id: string;
	created_at: string;
	ds_nome: string;
	is_ativo: boolean;
	is_gerencia_supervisao: boolean;
	empresa_id: string;
	id_externo: string;
	niveis_senioridade: NivelSenioridade[];
	rh_funcionarios: Funcionarios[];
}

export interface NivelSenioridade {
	id: string;
	senioridade: string;
	nivel: string;
	salarioMin: number;
	salarioMax: number;
}

export interface Funcionarios {
	id: string;
	ds_nome: string;
}

export default function CargosPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterTerm, setFilterTerm] = useState<string | null>('Ativos');
	const { state: empresa_id } = useCompanyContext();

	const {
		data: cargos,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-cargo-empresa', empresa_id],
		queryFn: async () => {
			return await getCargoEmpresa(empresa_id);
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!empresa_id,
	});

	const filteredCargos = useMemo(() => {
		let filtered = cargos || [];
		if (filterTerm) {
			switch (filterTerm) {
				case 'Ativos':
					filtered = filtered.filter((cargo: Cargo) => cargo.is_ativo);
					break;
				case 'Inativos':
					filtered = filtered.filter((cargo: Cargo) => !cargo.is_ativo);
					break;

				default:
					break;
			}
		}
		return filtered.filter((cargo: Cargo) => cargo.ds_nome.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [cargos, searchTerm, filterTerm]);

	if (isError) {
		toast.error((error as Error).message);
	}

	return (
		<>
			<Head>
				<title>Cargos | Esteira</title>
			</Head>
			<DashboardLayout title='Cargos' description='Gerencie os cargos.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar cargos...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button tooltip='Filtros' variant='outline'>
									{filterTerm ? filterTerm : 'Status'}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-48'>
								<DropdownMenuItem onSelect={() => setFilterTerm('Ativos')}>Ativos</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setFilterTerm('Inativos')}>Inativos</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setFilterTerm(null)}>Limpar Filtros</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button tooltip='Atualizar' variant='outline' size='icon' disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleUpdateCargos />
					</div>

					{filteredCargos?.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhum cargo.' />
					) : (
						<DataTable columns={columns} data={filteredCargos || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
