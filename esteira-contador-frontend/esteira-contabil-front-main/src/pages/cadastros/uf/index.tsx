import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { toast } from 'sonner';
import { getUFs } from '@/services/api/sistema';

export default function EmbarcadorParametrosUFPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc', search: '' });
	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-parametro-embarcador-uf', pageParameters, state],
		queryFn: () => getUFs(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.ufs.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};
	const tableRef = useRef<DataTableRef<ESTEIRA.RAW.SisIbgeUf>>(null);

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

	const columns: ColumnDef<ESTEIRA.RAW.SisIbgeUf>[] = [
		{
			accessorKey: 'ds_uf',
			header: ({ column }) => <DataTableColumnHeader column={column} title='UF' />,
		},
		{
			accessorKey: 'ds_state',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
		},
	];

	return (
		<>
			<Head>
				<title>Cadastro UF | Esteira</title>
			</Head>
			<DashboardLayout title='UF' description='Gerenciamento de unidades federativas.'>
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
					{data?.ufs?.length === 0 ? (
						<EmptyState label='Nenhum UF encontrado.' />
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
							ref={tableRef}
							columns={columns}
							data={data?.ufs || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
