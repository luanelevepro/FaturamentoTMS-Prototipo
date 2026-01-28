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
import { getCentrosCustosPaginado, ativarCentrosCustos, inativarCentrosCustos } from '@/services/api/contabilidade';
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
import HandleSyncCentrosCustos from '@/components/general/contabilidade/cadastros/centros-custos/btn-sync-data';

export interface CentrosCustosData {
	id: string;
	ds_nome_ccusto: string;
	id_externo_ccusto: string;
	is_ativo: boolean;
	ds_origem_registro: string;
	dt_created: string;
	dt_updated: string;
	dt_cadastro: string;
	id_con_departamentos: string;
	js_con_departamentos?: {
		id: string;
		ds_nome_depart: string;
	};
}

const columns: ColumnDef<CentrosCustosData>[] = [
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
		accessorKey: 'id_externo_ccusto',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome_ccusto',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
	},
	{
		accessorKey: 'js_con_departamentos.ds_nome_depart',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Departamento' />,
		cell: ({ row }) => {
			const departamento = row.original.js_con_departamentos?.ds_nome_depart;
			return <span>{departamento || '-'}</span>;
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

export default function ContabilidadeCentrosCustosPage() {
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<CentrosCustosData>>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [pageParameters, setPageParameters] = useState<{
		status: string[];
	}>({
		status: [],
	});
	const queryClient = useQueryClient();
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const statusOptions = ['ATIVO', 'INATIVO'];

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: selectedStatus }));
	}, [selectedStatus]);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-centros-custos-paginado', pageParameters, state],
		queryFn: () => getCentrosCustosPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	// Filtra no frontend por todos os campos
	const filteredCentrosCustos = useMemo(() => {
		if (!data?.centrosCustos) return [];

		return data.centrosCustos.filter((centro: CentrosCustosData) => {
			const searchLower = searchTerm.toLowerCase();
			return (
				String(centro.ds_nome_ccusto).toLowerCase().includes(searchLower) ||
				String(centro.id_externo_ccusto).toLowerCase().includes(searchLower) ||
				String(centro.js_con_departamentos?.ds_nome_depart || '')
					.toLowerCase()
					.includes(searchLower)
			);
		});
	}, [data?.centrosCustos, searchTerm]);

	async function handleCentroCustosStatusChange(isAtivo: boolean) {
		const selectedCentros = tableRef.current?.getSelectedRows() || [];

		if (selectedCentros.length === 0) {
			toast.info('Selecione ao menos um centro de custos.');
			return;
		}

		const centrosToUpdate = selectedCentros.filter((centro) => centro.is_ativo !== isAtivo);

		if (centrosToUpdate.length === 0) {
			toast.info('Os centros de custos selecionados já estão no status desejado.');
			return;
		}

		const ids = centrosToUpdate.map((c) => c.id);

		return toast.promise(
			(async () => {
				if (isAtivo) {
					await ativarCentrosCustos(ids);
				} else {
					await inativarCentrosCustos(ids);
				}
				await queryClient.invalidateQueries({ queryKey: ['get-centros-custos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isAtivo ? 'Ativando' : 'Inativando'} centros de custos...`,
				success: () => `${ids.length} centro(s) de custos ${isAtivo ? 'ativado(s)' : 'inativado(s)'} com sucesso.`,
				error: (error) => `Erro ao atualizar o status: ${error.message || error}`,
			},
		);
	}

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	return (
		<>
			<Head>
				<title>Centros de Custos | Esteira</title>
			</Head>
			<DashboardLayout title='Centros de Custos' description='Gerenciamento de centros de custos.'>
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
								<div className='flex flex-col'>
									{/* Conteúdo do filtro */}
									<div className='p-2'>
										<DropdownMenuLabel>Filtrar Status</DropdownMenuLabel>
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
										{/* Selecionar todos */}
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
								<Button variant='outline' tooltip='Opções' size='icon' aria-label='Abrir menu de ações'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem className='text-sm' onClick={() => handleCentroCustosStatusChange(true)}>
									<FileCheck className='h-4 w-4' />
									Ativar centro(s) de custos
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleCentroCustosStatusChange(false)}>
									<FileMinus className='h-4 w-4' />
									Inativar centro(s) de custos
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<HandleSyncCentrosCustos />
					</div>
					{filteredCentrosCustos?.length === 0 ? (
						<EmptyState label='Nenhum centro de custos encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredCentrosCustos || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
