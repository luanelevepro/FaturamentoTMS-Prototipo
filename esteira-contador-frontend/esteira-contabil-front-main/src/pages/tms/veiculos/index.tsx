import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { FileCheck, FileMinus, ListFilter, MoreVertical, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getVeiculosPaginado, ativarVeiculos, inativarVeiculos, setCarroceria, setTracionador } from '@/services/api/tms';
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
import { Badge } from '@/components/ui/badge';
import HandleSyncVeiculos from '@/components/general/tms/cadastros/veiculos/btn-sync-data';

export interface VeiculosData {
	id: string;
	ds_placa: string;
	ds_nome: string;
	vl_aquisicao: number | null;
	is_ativo: boolean;
	is_carroceria: boolean;
	is_tracionador: boolean;
	dt_aquisicao: string | null;
	dt_baixa: string | null;
	id_centro_custos: string | null;
	dt_created: string;
	dt_updated: string;
	js_con_centro_custos?: {
		id: string;
		ds_nome_ccusto: string;
	};
}

const columns: ColumnDef<VeiculosData>[] = [
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
		accessorKey: 'ds_placa',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Placa' />,
		cell: ({ row }) => {
			const placa = row.getValue('ds_placa') as string;
			return <span className='font-mono font-semibold'>{placa}</span>;
		},
	},
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'vl_aquisicao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Valor Aquisição' />,
		cell: ({ row }) => {
			const valor = row.getValue('vl_aquisicao') as number | null;
			if (!valor) return <span className='text-muted-foreground'>-</span>;
			return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
		},
	},
	{
		accessorKey: 'js_con_centro_custos.ds_nome_ccusto',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Centro de Custos' />,
		cell: ({ row }) => {
			const centroCustos = row.original.js_con_centro_custos?.ds_nome_ccusto;
			return <span>{centroCustos || '-'}</span>;
		},
	},
	{
		accessorKey: 'is_carroceria',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo' />,
		cell: ({ row }) => {
			const isCarroceria = row.original.is_carroceria;
			const isTracionador = row.original.is_tracionador;

			if (isCarroceria) {
				return <Badge variant='outline'>Carroceria</Badge>;
			}
			if (isTracionador) {
				return <Badge variant='outline'>Tracionador</Badge>;
			}
			return (
				<Badge variant='outline' className='text-muted-foreground'>
					-
				</Badge>
			);
		},
	},
	{
		accessorKey: 'dt_aquisicao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Data Aquisição' />,
		cell: ({ row }) => {
			const data = row.getValue('dt_aquisicao') as string | null;
			if (!data) return <span className='text-muted-foreground'>-</span>;
			return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
		},
	},
	{
		accessorKey: 'dt_baixa',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Data Baixa' />,
		cell: ({ row }) => {
			const data = row.getValue('dt_baixa') as string | null;
			if (!data) return <span className='text-muted-foreground'>-</span>;
			return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
		},
	},
	{
		accessorKey: 'is_ativo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		cell: ({ row }) => {
			const value = row.getValue('is_ativo');
			const formattedValue = value ? 'Ativo' : 'Inativo';
			type BadgeVariant = 'danger' | 'success' | 'default';
			const variant: BadgeVariant = value ? 'success' : 'danger';

			return (
				<Badge variant={variant} className='cursor-default'>
					{formattedValue}
				</Badge>
			);
		},
	},
];

export default function TMSVeiculosPage() {
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<VeiculosData>>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [pageParameters, setPageParameters] = useState<{
		page: number;
		pageSize: number;
		orderBy: string;
		orderColumn: string;
		search: string;
		status: string[];
		tipoVeiculo: string[];
	}>({
		page: 1,
		pageSize: 10,
		orderBy: 'asc',
		orderColumn: 'ds_placa',
		search: '',
		status: [],
		tipoVeiculo: [],
	});
	const queryClient = useQueryClient();
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const [selectedTipoVeiculo, setSelectedTipoVeiculo] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<'status' | 'tipoVeiculo'>('status');
	const statusOptions = ['ATIVO', 'INATIVO'];
	const tipoVeiculoOptions = ['TRACIONADOR', 'CARROCERIA'];

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: selectedStatus }));
	}, [selectedStatus]);

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, tipoVeiculo: selectedTipoVeiculo }));
	}, [selectedTipoVeiculo]);

	useEffect(() => {
		if (sorting.length === 0) return;

		const [{ id: orderColumn, desc }] = sorting;
		setPageParameters((prev) => ({
			...prev,
			orderColumn,
			orderBy: desc ? 'desc' : 'asc',
			page: 1,
		}));
	}, [sorting]);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-veiculos-paginado', pageParameters, state],
		queryFn: () => getVeiculosPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	async function handleVeiculoStatusChange(isAtivo: boolean) {
		const selectedVeiculos = tableRef.current?.getSelectedRows() || [];

		if (selectedVeiculos.length === 0) {
			toast.info('Selecione ao menos um veículo.');
			return;
		}

		const veiculosToUpdate = selectedVeiculos.filter((veiculo) => veiculo.is_ativo !== isAtivo);

		if (veiculosToUpdate.length === 0) {
			toast.info('Os veículos selecionados já estão no status desejado.');
			return;
		}

		const ids = veiculosToUpdate.map((v) => v.id);

		return toast.promise(
			(async () => {
				if (isAtivo) {
					await ativarVeiculos(ids);
				} else {
					await inativarVeiculos(ids);
				}
				await queryClient.invalidateQueries({ queryKey: ['get-veiculos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isAtivo ? 'Ativando' : 'Inativando'} veículos...`,
				success: () => `${ids.length} veículo(s) ${isAtivo ? 'ativado(s)' : 'inativado(s)'} com sucesso.`,
				error: (error) => `Erro ao atualizar o status: ${error.message || error}`,
			},
		);
	}

	async function handleSetCarroceria(isCarroceria: boolean) {
		const selectedVeiculos = tableRef.current?.getSelectedRows() || [];

		if (selectedVeiculos.length === 0) {
			toast.info('Selecione ao menos um veículo.');
			return;
		}

		const ids = selectedVeiculos.map((v) => v.id);

		return toast.promise(
			(async () => {
				await setCarroceria(ids, isCarroceria);
				await queryClient.invalidateQueries({ queryKey: ['get-veiculos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isCarroceria ? 'Marcando' : 'Desmarcando'} como carroceria...`,
				success: () => `${ids.length} veículo(s) ${isCarroceria ? 'marcado(s)' : 'desmarcado(s)'} como carroceria com sucesso.`,
				error: (error) => `Erro ao definir tipo: ${error.message || error}`,
			},
		);
	}

	async function handleSetTracionador(isTracionador: boolean) {
		const selectedVeiculos = tableRef.current?.getSelectedRows() || [];

		if (selectedVeiculos.length === 0) {
			toast.info('Selecione ao menos um veículo.');
			return;
		}

		const ids = selectedVeiculos.map((v) => v.id);

		return toast.promise(
			(async () => {
				await setTracionador(ids, isTracionador);
				await queryClient.invalidateQueries({ queryKey: ['get-veiculos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isTracionador ? 'Marcando' : 'Desmarcando'} como tracionador...`,
				success: () => `${ids.length} veículo(s) ${isTracionador ? 'marcado(s)' : 'desmarcado(s)'} como tracionador com sucesso.`,
				error: (error) => `Erro ao definir tipo: ${error.message || error}`,
			},
		);
	}

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	const handlePageChange = (newPage: number) => {
		if (newPage < 1) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	return (
		<>
			<Head>
				<title>Veículos | Esteira</title>
			</Head>
			<DashboardLayout title='Veículos' description='Gerenciamento de veículos da frota.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar por placa, nome ou centro de custos...'
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setPageParameters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
								}}
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

							<DropdownMenuContent align='end' className='w-72 p-0'>
								<div className='flex flex-col'>
									{/* Abas */}
									<div className='flex border-b'>
										<button
											onClick={() => setActiveTab('status')}
											className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
												activeTab === 'status'
													? 'border-primary text-primary border-b-2'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Status
										</button>
										<button
											onClick={() => setActiveTab('tipoVeiculo')}
											className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
												activeTab === 'tipoVeiculo'
													? 'border-primary text-primary border-b-2'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Tipo
										</button>
									</div>

									{/* Conteúdo - Aba Status */}
									{activeTab === 'status' && (
										<div className='p-2'>
											<DropdownMenuLabel>Status do Veículo</DropdownMenuLabel>
											<DropdownMenuSeparator />

											<div className='max-h-64 overflow-auto pr-1'>
												{statusOptions.map((opt) => (
													<DropdownMenuItem key={opt} onSelect={(e) => e.preventDefault()} className='flex items-center gap-2'>
														<Checkbox
															checked={selectedStatus.includes(opt)}
															onCheckedChange={(checked) => {
																setSelectedStatus((prev: string[]) =>
																	checked ? [...prev, opt] : prev.filter((s) => s !== opt),
																);
															}}
														/>
														<span>{opt}</span>
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
												Limpar filtros
											</DropdownMenuItem>
										</div>
									)}

									{/* Conteúdo - Aba Tipo */}
									{activeTab === 'tipoVeiculo' && (
										<div className='p-2'>
											<DropdownMenuLabel>Tipo de Veículo</DropdownMenuLabel>
											<DropdownMenuSeparator />

											<div className='max-h-64 overflow-auto pr-1'>
												{tipoVeiculoOptions.map((opt) => (
													<DropdownMenuItem key={opt} onSelect={(e) => e.preventDefault()} className='flex items-center gap-2'>
														<Checkbox
															checked={selectedTipoVeiculo.includes(opt)}
															onCheckedChange={(checked) => {
																setSelectedTipoVeiculo((prev: string[]) =>
																	checked ? [...prev, opt] : prev.filter((s) => s !== opt),
																);
															}}
														/>
														<span>{opt}</span>
													</DropdownMenuItem>
												))}
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedTipoVeiculo([...tipoVeiculoOptions]);
												}}
												className='hover:cursor-pointer'
											>
												Selecionar todos
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedTipoVeiculo([]);
												}}
												className='text-red-600 hover:bg-red-100'
											>
												Limpar filtros
											</DropdownMenuItem>
										</div>
									)}
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' tooltip='Opções' size='icon' aria-label='Abrir menu de ações'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuLabel>Status</DropdownMenuLabel>
								<DropdownMenuItem className='text-sm' onClick={() => handleVeiculoStatusChange(true)}>
									<FileCheck className='h-4 w-4' />
									Ativar veículo(s)
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleVeiculoStatusChange(false)}>
									<FileMinus className='h-4 w-4' />
									Inativar veículo(s)
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>Tipo de Veículo</DropdownMenuLabel>
								<DropdownMenuItem className='text-sm' onClick={() => handleSetCarroceria(true)}>
									Marcar como Carroceria
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleSetTracionador(true)}>
									Marcar como Tracionador
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className='text-sm' onClick={() => handleSetCarroceria(false)}>
									Desmarcar como Carroceria
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleSetTracionador(false)}>
									Desmarcar como Tracionador
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<HandleSyncVeiculos />
					</div>
					{!isFetching && data?.veiculos?.length === 0 && <EmptyState label='Nenhum veículo encontrado.' />}

					{(isFetching || (data?.veiculos?.length ?? 0) > 0) && (
						<DataTableDynamic
							pageParameters={{
								page: pageParameters.page,
								pageSize: pageParameters.pageSize,
								total: data?.total || 0,
								totalPages: data?.totalPages || 1,
							}}
							onPageChange={handlePageChange}
							onPageSizeChange={(newSize) => setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
							ref={tableRef}
							columns={columns}
							data={data?.veiculos || []}
							sorting={sorting}
							onSortingChange={setSorting}
							allIds={data?.allIds}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
