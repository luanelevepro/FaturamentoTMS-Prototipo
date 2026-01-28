import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { toast } from 'sonner';
import { getCidades } from '@/services/api/sistema';
import type { SortingState } from '@tanstack/react-table';

export default function EmbarcadorParametrosCidadesPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc', search: '' });

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-parametro-embarcador-cidades', pageParameters, state],
		queryFn: () => getCidades(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.cities.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};
	const [sorting, setSorting] = useState<SortingState>([]);

	useEffect(() => {
		if (isFetching) return;
		if (!isError) return;

		toast.error(`Erro ao buscar dados: ${error}`);
	}, [isFetching, isError, error]);

	useEffect(() => {
		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
		}, 500);

		return () => clearTimeout(handler);
	}, [searchTerm]);

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

	const columns: ColumnDef<ESTEIRA.RAW.SisIgbeCity>[] = [
		{
			id: 'ds_city',
			accessorKey: 'ds_city',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
		},
		{
			id: 'ds_uf',
			header: () => {
				return <>UF</>;
			},
			cell: ({ row }) => {
				const uf = row.original?.js_uf;

				if (!uf) return <span className='text-muted-foreground'>N/a</span>;

				return <span>{uf.ds_state}</span>;
			},
		},
	];

	return (
		<>
			<Head>
				<title>Cadastro Cidades | Esteira</title>
			</Head>
			<DashboardLayout title='Cidades' description='Gerenciamento de cidades.'>
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
						<Button tooltip='Atualizar' variant='outline' size='icon' disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
					</div>
					{data?.cities?.length === 0 ? (
						<EmptyState label='Nenhuma cidade encontrada.' />
					) : (
						<DataTableDynamic
							pageParameters={{
								page: pageParameters.page || 0,
								pageSize: pageParameters.pageSize || 10,
								total: data?.total || 0,
								totalPages: data?.totalPages || 1,
							}}
							onPageChange={handlePageChange}
							onPageSizeChange={(newSize) => setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
							columns={columns}
							data={data?.cities || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
