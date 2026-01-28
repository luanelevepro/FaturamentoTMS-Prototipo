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
import { getDepartamentosPaginado, ativarDepartamentos, inativarDepartamentos } from '@/services/api/contabilidade';
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
import HandleSyncDepartamentos from '@/components/general/contabilidade/cadastros/departamentos/btn-sync-data';

export interface DepartamentosData {
	id: string;
	ds_nome_depart: string;
	id_depart_externo: string;
	is_ativo: boolean;
	ds_origem_registro: string;
	dt_created: string;
	dt_updated: string;
}

const columns: ColumnDef<DepartamentosData>[] = [
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
		accessorKey: 'id_depart_externo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome_depart',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
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

export default function ContabilidadeDepartamentosPage() {
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<DepartamentosData>>(null);
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
		queryKey: ['get-departamentos-paginado', pageParameters, state],
		queryFn: () => getDepartamentosPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	// Filtra no frontend por todos os campos
	const filteredDepartamentos = useMemo(() => {
		if (!data?.departamentos) return [];

		return data.departamentos.filter((departamento: DepartamentosData) =>
			Object.values(departamento).some((value: unknown) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data?.departamentos, searchTerm]);

	async function handleDepartamentoStatusChange(isAtivo: boolean) {
		const selectedDepartamentos = tableRef.current?.getSelectedRows() || [];

		if (selectedDepartamentos.length === 0) {
			toast.info('Selecione ao menos um departamento.');
			return;
		}

		const departamentosToUpdate = selectedDepartamentos.filter((departamento) => departamento.is_ativo !== isAtivo);

		if (departamentosToUpdate.length === 0) {
			toast.info('Os departamentos selecionados já estão no status desejado.');
			return;
		}

		const ids = departamentosToUpdate.map((d) => d.id);

		return toast.promise(
			(async () => {
				if (isAtivo) {
					await ativarDepartamentos(ids);
				} else {
					await inativarDepartamentos(ids);
				}
				await queryClient.invalidateQueries({ queryKey: ['get-departamentos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isAtivo ? 'Ativando' : 'Inativando'} departamentos...`,
				success: () => `${ids.length} departamento(s) ${isAtivo ? 'ativado(s)' : 'inativado(s)'} com sucesso.`,
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
				<title>Departamentos | Esteira</title>
			</Head>
			<DashboardLayout title='Departamentos' description='Gerenciamento de departamentos.'>
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
								<DropdownMenuItem className='text-sm' onClick={() => handleDepartamentoStatusChange(true)}>
									<FileCheck className='h-4 w-4' />
									Ativar departamento(s)
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleDepartamentoStatusChange(false)}>
									<FileMinus className='h-4 w-4' />
									Inativar departamento(s)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<HandleSyncDepartamentos />
					</div>
					{filteredDepartamentos?.length === 0 ? (
						<EmptyState label='Nenhum departamento encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredDepartamentos || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
