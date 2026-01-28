import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { FileCheck, MoreVertical, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { useCompanyContext } from '@/context/company-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import HandleUpdatePlanoContas from '@/components/general/contabilidade/plano-contas/btn-update-all';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import { getPlanoContasPaginado } from '@/services/api/plano-contas';
import { columns } from '@/components/general/contabilidade/plano-contas/plano-contas-columns';
import HandleInsertGrupoToPlano from '@/components/general/contabilidade/plano-contas/btn-add-grupo-to-plano';
import { SortingState } from '@tanstack/react-table';

export interface PlanoConta {
	id: string;
	ds_nome_cta: string;
	ds_classificacao_cta?: string;
	id_conta_pai?: string | null;
	ds_tipo_cta?: string;
	is_ativo: boolean;
	js_con_grupo_contas?: {
		ds_nome_grupo: string;
	};
	children?: PlanoConta[];
}

export default function PlanoContasPage() {
	const tableRef = useRef<DataTableRef<PlanoConta> | null>(null);
	const { state } = useCompanyContext();
	const [openDialog, setOpenDialog] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [filterTerm, setFilterTerm] = useState<string | null>('Ativos');
	const [pageParameters, setPageParameters] = useState({
		page: 1,
		pageSize: 10,
		orderBy: 'asc' as 'asc' | 'desc',
		orderColumn: 'ds_classificacao_cta',
		search: '',
		status: filterTerm, // 'Ativos' ou 'Inativos' ou null
	});
	useEffect(() => {
		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: filterTerm, page: 1 }));
	}, [filterTerm]);

	useEffect(() => {
		if (sorting.length === 0) return;

		const [{ id: orderColumn, desc }] = sorting;
		setPageParameters((prev) => ({
			...prev,
			orderColumn, // ex: 'js_nfse.dt_emissao'
			orderBy: desc ? 'desc' : 'asc',
			page: 1, // sempre volta pra página 1
		}));
	}, [sorting]);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-plano-contas-paginado', pageParameters, state],
		queryFn: () => getPlanoContasPaginado({ empresaId: state, ...pageParameters }),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
		enabled: !!state,
	});

	if (isError) {
		toast.error((error as Error).message);
	}

	const handlePageChange = (newPage: number) => {
		if (newPage < 1) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	const handlePageSizeChange = (newSize: number) => {
		setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }));
	};

	return (
		<>
			<Head>
				<title>Plano Contas | Esteira</title>
			</Head>
			<DashboardLayout title='Plano de Contas' description='Gerenciamento do seu plano de contas.'>
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
						<HandleUpdatePlanoContas pageParameters={pageParameters} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' tooltip='Opções' size='icon' aria-label='Abrir menu de ações'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onSelect={() => {
										setOpenDialog(true);
									}}
								>
									<div className='hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1'>
										<FileCheck className='h-4 w-4' />
										<span>Vincular Grupo</span>
									</div>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{data?.planoContas?.length === 0 ? (
						<EmptyState label='Nenhum plano de contas encontrado.' />
					) : (
						<DataTableDynamic
							ref={tableRef}
							columns={columns}
							data={data?.planoContas || []}
							pageParameters={{
								page: pageParameters.page,
								pageSize: pageParameters.pageSize,
								total: data?.total || 0,
								totalPages: data?.totalPages || 1,
							}}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
			<HandleInsertGrupoToPlano
				open={openDialog}
				onOpenChange={setOpenDialog}
				onChange={() => {
					refetch();
				}}
				pageParameters={pageParameters}
				tableRef={tableRef}
			/>
		</>
	);
}
