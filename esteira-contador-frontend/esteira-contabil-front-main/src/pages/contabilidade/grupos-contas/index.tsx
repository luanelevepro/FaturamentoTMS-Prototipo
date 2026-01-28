import React, { useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table-expandable';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { useCompanyContext } from '@/context/company-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getColumns } from '@/components/general/contabilidade/grupo-contas/grupo-contas-columns';
import { DataTableRef } from '@/components/ui/data-table';
import HandleInsertGrupo from '@/components/general/contabilidade/grupo-contas/btn-insert-grupo';
import { getGrupoContasByEmpresaID } from '@/services/api/grupo-contas';

export interface GrupoConta {
	id: string | null;
	ds_nome_grupo: string | null;
	ds_classificacao_grupo?: string | null;
	ds_tipo?: string | null;
	is_ativo: boolean | null;
	con_tipo_grupo: {
		ds_nome_tipo: string | null;
	};
	js_con_plano_contas: {
		ds_nome_cta: string | null;
	}[];
}

export default function GrupoContasPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const tableRef = useRef<DataTableRef<GrupoConta>>(null);
	const [filterTerm, setFilterTerm] = useState<string | null>('Ativos');
	const { state } = useCompanyContext();

	const {
		data: grupoContas,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery<GrupoConta[]>({
		queryKey: ['get-grupo-contas', state],
		queryFn: () => getGrupoContasByEmpresaID(state),
		staleTime: 1000 * 60 * 5,
		enabled: !!state,
	});
	const columns = getColumns(refetch);

	const filteredGrupoContas = useMemo(() => {
		let filtered = grupoContas || [];
		if (filterTerm) {
			switch (filterTerm) {
				case 'Ativos':
					filtered = filtered.filter((grupoContas: GrupoConta) => grupoContas.is_ativo);
					break;
				case 'Inativos':
					filtered = filtered.filter((grupoContas: GrupoConta) => !grupoContas.is_ativo);
					break;

				default:
					break;
			}
		}
		return filtered.filter((grupoContas: GrupoConta) => grupoContas.ds_nome_grupo?.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [grupoContas, searchTerm, filterTerm]);

	if (isError) {
		toast.error((error as Error).message);
	}

	return (
		<>
			<Head>
				<title>Grupo Contas | Esteira</title>
			</Head>
			<DashboardLayout title='Grupo de Contas' description='Cadastro de Grupo de Contas.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar...'
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
						<HandleInsertGrupo onChange={() => refetch()}>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar Grupo</p>
							</Button>
						</HandleInsertGrupo>
					</div>
					{filteredGrupoContas?.length === 0 ? (
						<EmptyState label='Nenhum produto encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredGrupoContas || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
