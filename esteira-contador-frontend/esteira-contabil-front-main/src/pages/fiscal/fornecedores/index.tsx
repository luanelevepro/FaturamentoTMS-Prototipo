import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getFornecedoresPaginado } from '@/services/api/fiscal';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import HandleUpdateFornecedores from '@/components/general/fiscal/fornecedores/btn-update-all';
import { useCompanyContext } from '@/context/company-context';
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { Badge } from '@/components/ui/badge';
import HandleInsertFornecedores from '@/components/general/fiscal/fornecedores/btn-insert-fornecedores';
import HandleUpdatePrestadores from '@/components/general/fiscal/fornecedores/btn-send-prestadores';

export interface FornecedoresData {
	id?: string;
	ds_nome: string;
	ds_endereco?: string;
	ds_cep: string;
	ds_inscricao: string;
	ds_telefone?: string;
	ds_inscricao_municipal: string;
	ds_bairro?: string;
	ds_email?: string;
	ds_codigo_municipio?: number;
	ds_complemento?: string;
	dt_cadastro?: Date | null;
	ds_ibge: number;
	ds_documento: string;
	ds_status?: string;
	ds_codigo_uf?: string;
}

const columns: ColumnDef<FornecedoresData>[] = [
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'ds_documento',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Documento' />,
		cell: ({ row }) => (
			<>
				<div className='font-medium'>{formatCnpjCpf(row.getValue('ds_documento'))}</div>
			</>
		),
	},
	{
		accessorKey: 'ds_inscricao_municipal',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Inscricao Municipal' />,
	},
	{
		accessorKey: 'ds_status',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => (
			<>
				<Badge variant={row.getValue('ds_status') === 'ATIVO' ? 'success' : 'warning'} className='w-fit'>
					{row.getValue('ds_status') === 'ATIVO' ? 'Ativo' : 'Novo'}
				</Badge>
			</>
		),
	},
];

export default function FornecedoresPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pageParameters, setPageParameters] = useState({ page: 1, pageSize: 10, orderBy: 'asc', orderColumn: 'ds_nome', search: '' });

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

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-fornecedores-empresa-paginado', pageParameters, state],
		queryFn: () => getFornecedoresPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.fornecedores.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os fornecedores.');
	}

	return (
		<>
			<Head>
				<title>Fornecedores | Esteira</title>
			</Head>
			<DashboardLayout title='Fornecedores' description='Gerenciamento de Fornecedores.'>
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
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleUpdateFornecedores />
						<HandleUpdatePrestadores />
						<HandleInsertFornecedores>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsertFornecedores>
					</div>
					{data?.length === 0 ? (
						<EmptyState label='Nenhum registro encontrado.' />
					) : (
						<DataTableDynamic
							pageParameters={{
								page: pageParameters.page,
								pageSize: pageParameters.pageSize,
								total: data?.total || 0,
								totalPages: data?.totalPages || 1,
							}}
							onPageChange={handlePageChange}
							onPageSizeChange={(newSize) => setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
							columns={columns}
							data={data?.fornecedores || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
