import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { FileCheck, FileMinus, ListFilter, MoreVertical, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTableRef } from '@/components/ui/data-table';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getProdutosEmpresasPaginado, updateProdutosEmpresas } from '@/services/api/fiscal';
import { useCompanyContext } from '@/context/company-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { Badge } from '@/components/ui/badge';
import HandleSyncProdutosEmpresas from '@/components/general/fiscal/cadastros/produtos/btn-sync-data';

export interface ProdutosData {
	id: string;
	ds_nome: string;
	ds_unidade: string;
	ds_codigo_barras: string;
	ds_tipo_item: string;
	dt_cadastro: string;
	id_fis_empresas: string;
	id_empresa_externo: string;
	id_externo: string;
	cd_ncm: string;
	cd_cest: string | null;
	ds_status: boolean;
}

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
		accessorKey: 'cd_ncm',
		header: ({ column }) => <DataTableColumnHeader column={column} title='NCM' />,
	},
	{
		accessorKey: 'cd_cest',
		header: ({ column }) => <DataTableColumnHeader column={column} title='CEST' />,
	},
	{
		accessorKey: 'ds_codigo_barras',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código de barras' />,
	},
	{
		accessorKey: 'ds_tipo_item',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo de item' />,
	},
	{
		accessorKey: 'ds_status',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			const value = String(row.getValue('ds_status'));
			const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
			type BadgeVariant = 'danger' | 'success' | 'default' | 'warning';
			let variant: BadgeVariant = 'default';

			switch (value) {
				case 'NOVO':
					variant = 'warning';
					break;
				case 'ATIVO':
					variant = 'success';
					break;
				case 'INATIVO':
					variant = 'danger';
					break;
				default:
					variant = 'default';
			}
			return (
				<Badge variant={variant} className='cursor-default'>
					{formattedValue}
				</Badge>
			);
		},
	},
];

export default function FiscalProdutosPage() {
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<ProdutosData>>(null);
	// const [sorting, setSorting] = useState<SortingState>([]);
	const [searchTerm, setSearchTerm] = useState('');
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
		tipo: 'produto',
		status: [],
		tipo_item: [],
	});
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<'status' | 'tipo'>('status');
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const [selectedTipo, setSelectedTipo] = useState<string[]>([]);
	const statusOptions = ['ATIVO', 'INATIVO', 'NOVO'];
	const tipoOptions = [
		{ cd_tipo_item: '01', ds_tipo_item: 'Matéria prima' },
		{ cd_tipo_item: '02', ds_tipo_item: 'Embalagem' },
		{ cd_tipo_item: '03', ds_tipo_item: 'Produto em processo' },
		{ cd_tipo_item: '04', ds_tipo_item: 'Produto acabado' },
		{ cd_tipo_item: '05', ds_tipo_item: 'Subproduto' },
		{ cd_tipo_item: '06', ds_tipo_item: 'Produto intermediário' },
		{ cd_tipo_item: '07', ds_tipo_item: 'Uso e consumo' },
		{ cd_tipo_item: '08', ds_tipo_item: 'Ativo imobilizado' },
		// { cd_tipo_item: '09', ds_tipo_item: 'Serviços' },
		{ cd_tipo_item: '10', ds_tipo_item: 'Outros insumos' },
		{ cd_tipo_item: '00', ds_tipo_item: 'Mercadoria para revenda' },
		{ cd_tipo_item: '99', ds_tipo_item: 'Outras' },
	];

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: selectedStatus, page: 1 }));
	}, [selectedStatus]);

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, tipo_item: selectedTipo, page: 1 }));
	}, [selectedTipo]);

	// useEffect(() => {
	// 	if (sorting.length === 0) return;

	// 	const [{ id: orderColumn, desc }] = sorting;
	// 	setPageParameters((prev) => ({
	// 		...prev,
	// 		orderColumn,
	// 		orderBy: desc ? 'desc' : 'asc',
	// 		page: 1,
	// 	}));
	// }, [sorting]);
	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-produtos-empresa-paginado', pageParameters, state],
		queryFn: () => getProdutosEmpresasPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	// Filtra no frontend por todos os campos (igual Funcionários)
	const filteredProdutos = useMemo(() => {
		if (!data?.produtos) return [];

		return data.produtos.filter((produto: ProdutosData) =>
			Object.values(produto).some((value: unknown) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data?.produtos, searchTerm]);

	// const handlePageChange = (newPage: number) => {
	// 	if (newPage < 1 || (data && data.produtos.length === 0)) return;
	// 	setPageParameters((prev) => ({ ...prev, page: newPage }));
	// };

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
				await queryClient.invalidateQueries({ queryKey: ['get-produtos-empresa-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: 'Atualizando status dos produtos...',
				success: () => `${productsToUpdate.length} produtos(s) atualizado(s) com sucesso.`,
				error: (error) => `Erro ao atualizar o status do produto: ${error.message || error}`,
			},
		);
	}

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	return (
		<>
			<Head>
				<title>Produtos | Esteira</title>
			</Head>
			<DashboardLayout title='Produtos' description='Gerenciamento de produtos.'>
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
						{/* Dropdown de filtros */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='icon' tooltip='Filtrar'>
									<ListFilter className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align='end' className='w-64 p-0'>
								{(() => {
									// Mapeia dados conforme a aba ativa - garante defaults seguros
									const cfg =
										activeTab === 'status'
											? {
													label: 'Filtrar Status',
													options: statusOptions,
													selected: selectedStatus,
													setSelected: setSelectedStatus,
													paramKey: 'status' as const,
													displayOptions: statusOptions.map((s) => ({ value: s, label: s })),
												}
											: activeTab === 'tipo'
												? {
														label: 'Filtrar Tipo',
														options: tipoOptions.map((t) => String(parseInt(t.cd_tipo_item, 10))),
														selected: selectedTipo,
														setSelected: setSelectedTipo,
														paramKey: 'tipo_item' as const,
														displayOptions: tipoOptions.map((t) => ({
															value: String(parseInt(t.cd_tipo_item, 10)),
															label: `${t.cd_tipo_item} - ${t.ds_tipo_item}`,
														})),
													}
												: {
														label: '',
														options: [] as string[],
														selected: [] as string[],
														setSelected: (() => {}) as React.Dispatch<React.SetStateAction<string[]>>,
														paramKey: 'status' as const,
														displayOptions: [] as { value: string; label: string }[],
													};

									const selectAll = () => {
										// marca todos os options da aba ativa
										cfg.setSelected([...cfg.options]);
									};

									const clearAll = () => {
										// limpa somente a chave relevante
										if (cfg.paramKey === 'status') {
											setSelectedStatus([]);
										} else if (cfg.paramKey === 'tipo_item') {
											setSelectedTipo([]);
										}
									};

									return (
										<div className='flex flex-col'>
											{/* Header das abas */}
											<div className='flex border-b'>
												<button
													type='button'
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setActiveTab('status');
													}}
													className={`flex-1 px-3 py-2 text-sm ${
														activeTab === 'status' ? 'border-b-2 font-medium' : 'text-muted-foreground'
													}`}
												>
													Status
												</button>
												<button
													type='button'
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														setActiveTab('tipo');
													}}
													className={`flex-1 px-3 py-2 text-sm ${
														activeTab === 'tipo' ? 'border-b-2 font-medium' : 'text-muted-foreground'
													}`}
												>
													Tipo
												</button>
											</div>

											{/* Conteúdo da aba */}
											<div className='p-2'>
												<DropdownMenuLabel>{cfg.label}</DropdownMenuLabel>
												<DropdownMenuSeparator />

												<div className='max-h-64 overflow-auto pr-1'>
													{cfg.displayOptions?.map((opt) => (
														<DropdownMenuItem
															key={`${cfg.paramKey}-${opt.value}`}
															onSelect={(e) => e.preventDefault()}
															className='flex items-center gap-2'
														>
															<Checkbox
																checked={cfg.selected.includes(opt.value)}
																onCheckedChange={(checked) => {
																	cfg.setSelected((prev: string[]) =>
																		checked ? [...prev, opt.value] : prev.filter((s) => s !== opt.value),
																	);
																}}
															/>
															<span>{opt.label}</span>
														</DropdownMenuItem>
													))}
												</div>
												<DropdownMenuSeparator />
												{/* Selecionar todos da aba ativa */}
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault();
														selectAll();
													}}
													className='hover:cursor-pointer'
												>
													Selecionar todos
												</DropdownMenuItem>
												<DropdownMenuItem
													onSelect={(e) => {
														e.preventDefault();
														clearAll();
													}}
													className='text-red-600 hover:bg-red-100'
												>
													Limpar todos os filtros
												</DropdownMenuItem>
											</div>
										</div>
									);
								})()}
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' tooltip='Opções' size='icon' aria-label='Abrir menu de ações'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem className='text-sm' onClick={() => handleProductStatusChange('ATIVO')}>
									<FileCheck className='h-4 w-4' />
									Ativar produto(s)
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleProductStatusChange('INATIVO')}>
									<FileMinus className='h-4 w-4' />
									Inativar produto(s)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<HandleSyncProdutosEmpresas />
					</div>
					{filteredProdutos?.length === 0 ? (
						<EmptyState label='Nenhum produto encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredProdutos || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
