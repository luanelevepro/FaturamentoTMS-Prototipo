import DashboardLayout from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Eye, RefreshCw, SearchIcon } from 'lucide-react';
import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import AddCte from '@/components/general/transporte/AddCte';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { formatBRL } from '@/utils/format-brazilian-currency';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { useCompanyContext } from '@/context/company-context';
import { ICtesParams, ITransporteCte, ICte } from '@/interfaces';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCtes } from '@/services/api/transporte';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import EmptyState from '@/components/states/empty-state';

export interface IStatus {
	fiscal: boolean;
	financeiro: boolean;
	contabilidade: boolean;
	bloqueio: boolean;
}

export default function TransporteCte() {
	const { state: empresa_id } = useCompanyContext();
	const tableRef = useRef<DataTableRef<ICte>>(null);
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: 'dt_emissao',
			desc: true,
		},
	]);
	const [filter, setFilter] = useState<ICtesParams>({
		page: 1,
		pageSize: 10,
		search: '',
		endDate: undefined,
		startDate: undefined,
		sortBy: 'dt_emissao',
		sortOrder: 'desc',
	});

	const { data, isFetching, refetch } = useQuery<ITransporteCte>({
		queryKey: ['ctes', empresa_id, filter],
		queryFn: () => getCtes(empresa_id, filter),
		staleTime: 1000 * 60 * 60,
		retry: 1,
		placeholderData: keepPreviousData,
	});

	const columns: ColumnDef<ICte>[] = [
		// {
		// 	id: 'select',
		// 	header: ({ table }) => (
		// 		<Checkbox
		// 			checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
		// 			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
		// 			aria-label='Select all'
		// 		/>
		// 	),
		// 	cell: ({ row }) => (
		// 		<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />
		// 	),
		// 	enableSorting: false,
		// 	enableHiding: false,
		// },
		{
			id: 'ds_numero',
			accessorKey: 'ds_numero',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Número' />,
			cell: ({ row }) => {
				const numero = row.getValue('ds_numero') as string;
				return <div>{numero || '--'}</div>;
			},
		},
		{
			id: 'dt_emissao',
			accessorKey: 'dt_emissao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Data emissão' />,
			cell: ({ row }) => {
				const data = row.getValue('dt_emissao') as string;
				return <div>{format(new Date(data), 'dd/MM/yyyy')}</div>;
			},
		},
		{
			id: 'ds_razao_social_emitente',
			accessorKey: 'ds_razao_social_emitente',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tomador' />,
			cell: ({ row }) => {
				const razaoSocial = row.getValue('ds_razao_social_emitente') as string;
				return <div className='w-1/3'>{razaoSocial || '--'}</div>;
			},
		},
		{
			id: 'origem_destino',
			header: 'Origem > Destino',
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<div className='flex h-full w-1/3 items-center gap-2'>
						<Badge variant={'gray'} className='border-transparent px-2 py-1 text-sm'>
							{cte.cd_mun_ini ? `${cte.ds_nome_mun_ini}/${cte.ds_uf_ini}` : '--'}
						</Badge>
						{'>'}
						<Badge variant={'gray'} className='border-transparent px-2 py-1 text-sm'>
							{cte.cd_mun_fim ? `${cte.ds_nome_mun_fim}/${cte.ds_uf_fim}` : '--'}
						</Badge>
					</div>
				);
			},
		},
		{
			id: 'vl_total',
			accessorKey: 'vl_total',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Valor total' />,
			cell: ({ row }) => {
				const valor = row.getValue('vl_total') as string;
				return <div className='min-w-35'>{valor ? formatBRL(parseFloat(valor) / 100) : '--'}</div>;
			},
		},
		{
			id: 'averbado',
			header: 'Averbado',
			cell: () => {
				return <div className='text-center'></div>;
			},
		},
		{
			id: 'status',
			header: 'Status',
			cell: () => {
				return <div className='w-4 text-center'></div>;
			},
		},
		{
			id: 'actions',
			header: 'Visualizar',
			cell: () => {
				return (
					<div className='text-center'>
						<Button tooltip='Detalhes' variant='ghost' size='icon'>
							<Eye />
						</Button>
					</div>
				);
			},
		},
	];

	const handlePageChange = (newPage: number) => {
		setFilter((prev) => ({ ...prev, page: newPage }));
	};

	const handlePageSizeChange = (newSize: number) => {
		setFilter((prev) => ({ ...prev, pageSize: newSize, page: 1 }));
	};

	// Sincronizar sorting com filter
	useEffect(() => {
		if (sorting.length === 0) return;

		const [{ id: sortColumn, desc }] = sorting;
		setFilter((prev) => ({
			...prev,
			sortBy: sortColumn as ICtesParams['sortBy'],
			sortOrder: desc ? 'desc' : 'asc',
			page: 1,
		}));
	}, [sorting]);

	return (
		<>
			<Head>
				<title>Transporte CTe | Esteira</title>
			</Head>
			<DashboardLayout title='Viagens e Cargas' description='Visão Geral das Viagens e Cargas'>
				<h2 className='pt-3 pb-4 text-xl font-semibold'>CTe - Conhecimento de Transporte Eletrônico</h2>
				<div className='flex gap-2'>
					<div className='relative col-span-5 h-10 flex-1'>
						<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
						<Input
							placeholder='Pesquisar'
							value={filter.search}
							onChange={(e) => setFilter({ ...filter, search: e.target.value })}
							className='mr-2 pl-8'
						/>
					</div>
					<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
						<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
					</Button>
					<MonthYearSelector
						showClearButton
						placeholder='Mês/Ano'
						className='max-w-32'
						selected={filter.startDate ? new Date(filter.startDate) : undefined}
						onSelect={(date) =>
							setFilter({
								...filter,
								startDate: date ? new Date(date.getFullYear(), date.getMonth(), 1) : undefined,
								endDate: date ? new Date(date.getFullYear(), date.getMonth() + 1, 0) : undefined,
								page: 1,
							})
						}
					/>
					{/* 	<FilterDrawer>
						<h1>Form dos filtros</h1>
					</FilterDrawer> */}
					<AddCte />
				</div>

				{empresa_id && !isFetching && (!data?.data || data.data.length === 0) && (
					<div className='mt-6'>
						<EmptyState label='Nenhum CTe encontrado' />
					</div>
				)}

				{empresa_id && (isFetching || (data?.data && data.data.length > 0)) && (
					<DataTableDynamic
						pageParameters={{
							page: filter.page ?? 1,
							pageSize: filter.pageSize ?? 10,
							total: data?.pagination?.totalItems || 0,
							totalPages: data?.pagination?.totalPages || 1,
						}}
						onPageChange={handlePageChange}
						onPageSizeChange={handlePageSizeChange}
						ref={tableRef}
						columns={columns}
						data={data?.data || []}
						sorting={sorting}
						onSortingChange={setSorting}
						allIds={data?.allIds}
					/>
				)}
			</DashboardLayout>
		</>
	);
}
