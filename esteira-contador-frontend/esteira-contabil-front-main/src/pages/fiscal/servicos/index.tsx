import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { FileCheck, FileMinus, MoreVertical, RefreshCw, SearchIcon, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DataTable, DataTableRef } from '@/components/ui/data-table';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getProdutosEmpresasPaginado, updateProdutosEmpresas } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ProdutosData } from '../produtos';
import HandleSyncProdutosEmpresas from '@/components/general/fiscal/cadastros/produtos/btn-sync-data';

const columns: ColumnDef<ProdutosData>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
			/>
		),
		cell: ({ row }) => (
			<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />
		),
	},
	{
		accessorKey: 'id_externo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
	},
	{
		accessorKey: 'ds_tipo_servico',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo de serviço' />,
	},
	{
		accessorKey: 'ds_status',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			const value = String(row.getValue('ds_status'));
			const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
			return (
				<Badge variant={value === 'ATIVO' ? 'success' : 'danger'} className='cursor-default'>
					{formattedValue}
				</Badge>
			);
		},
	},
];

export default function FiscalProdutosPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<ProdutosData>>(null);

	const [activeTab, setActiveTab] = useState<'status'>('status');
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const statusOptions = ['ATIVO', 'INATIVO', 'NOVO'];

	const [pageParameters, setPageParameters] = useState<{
		page: number;
		pageSize: number;
		orderBy: string;
		orderColumn: string;
		search: string;
		tipo: string;
		status: string[];
		tipo_item: string[];
	}>({
		page: 1,
		pageSize: 10,
		orderBy: 'asc',
		orderColumn: 'ds_nome',
		search: '',
		tipo: 'servico',
		status: [],
		tipo_item: [],
	});

	// Sincroniza selectedStatus com pageParameters.status
	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: selectedStatus, page: 1 }));
	}, [selectedStatus]);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-servicos-empresa-paginado', pageParameters, state],
		queryFn: () => getProdutosEmpresasPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	// Filtra no frontend por todos os campos (igual Funcionários e Produtos)
	const filteredServicos = useMemo(() => {
		if (!data?.produtos) return [];

		return data.produtos.filter((servico: ProdutosData) =>
			Object.values(servico).some((value: unknown) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data?.produtos, searchTerm]);

	async function handleProductStatusChange(status: string) {
		const selectedProducts = tableRef.current?.getSelectedRows() || [];

		const productsToUpdate = selectedProducts
			.filter((product) => String(product.ds_status) !== status)
			.map((product) => ({ id: product.id, ds_status: status }));

		if (productsToUpdate.length === 0) {
			toast.info('Não há serviços para atualizar.');
			return;
		}
		return toast.promise(
			(async () => {
				await updateProdutosEmpresas(productsToUpdate);
				await refetch();

				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: 'Atualizando status dos serviços...',
				success: () => {
					return `${productsToUpdate.length} serviço(s) atualizado(s) com sucesso.`;
				},
				error: (error) => {
					return `Erro ao atualizar o status do serviço: ${error.message || error}`;
				},
			},
		);
	}

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	return (
		<>
			<Head>
				<title>Serviços | Esteira</title>
			</Head>
			<DashboardLayout title='Serviços' description='Gerenciamento de serviços.'>
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
						{/* Dropdown de filtros */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='icon' tooltip='Filtrar'>
									<ListFilter className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align='end' className='w-64 p-0'>
								<div className='flex flex-col'>
									<div className='flex border-b'>
										<button
											type='button'
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setActiveTab('status');
											}}
											className={`flex-1 px-3 py-2 text-sm ${activeTab === 'status' ? 'border-b-2 font-medium' : 'text-muted-foreground'}`}
										>
											Status
										</button>
									</div>

									<div className='p-2'>
										<DropdownMenuLabel>Filtrar Status</DropdownMenuLabel>
										<DropdownMenuSeparator />

										<div className='max-h-64 overflow-auto pr-1'>
											{statusOptions.map((opt: string) => (
												<DropdownMenuItem
													key={`status-${opt}`}
													onSelect={(e) => e.preventDefault()}
													className='flex items-center gap-2'
												>
													<Checkbox
														checked={selectedStatus.includes(opt)}
														onCheckedChange={(checked) => {
															if (checked) {
																setSelectedStatus((prev) => [...prev, opt]);
																return;
															}
															setSelectedStatus((prev) => prev.filter((s) => s !== opt));
														}}
													/>
													<span>{opt.replace(/_/g, ' ')}</span>
												</DropdownMenuItem>
											))}
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onSelect={(e) => {
												e.preventDefault();
												setSelectedStatus([...statusOptions]);
											}}
											className='hover:cursor-pointer'
										>
											Selecionar todos
										</DropdownMenuItem>
										<DropdownMenuItem
											onSelect={(e) => {
												e.preventDefault();
												setSelectedStatus([]);
											}}
											className='text-red-600 hover:bg-red-100'
										>
											Limpar todos os filtros
										</DropdownMenuItem>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' tooltip='Opções' size={'icon'} aria-label='Abrir menu de ações'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									className='text-sm'
									onClick={() => {
										handleProductStatusChange('ATIVO');
									}}
								>
									<FileCheck className='h-4 w-4' />
									Ativar serviço(s)
								</DropdownMenuItem>
								<DropdownMenuItem
									className='text-sm'
									onClick={() => {
										handleProductStatusChange('INATIVO');
									}}
								>
									<FileMinus className='h-4 w-4' />
									Inativar serviço(s)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<HandleSyncProdutosEmpresas />
					</div>
					{filteredServicos?.length === 0 ? (
						<EmptyState label='Nenhum serviço encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredServicos || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
