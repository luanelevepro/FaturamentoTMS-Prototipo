import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { FileCheck, FileMinus, ListFilter, MoreVertical, RefreshCw, SearchIcon, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
	getSegmentosPaginado,
	ativarSegmentos,
	inativarSegmentos,
	createSegmento,
	updateSegmento,
	deleteSegmento,
} from '@/services/api/tms';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export interface SegmentoData {
	id: string;
	cd_identificador: string;
	ds_nome: string;
	is_ativo: boolean;
	dt_created: string;
	dt_updated: string;
	id_tms_empresas: string;
}

export default function TMSSegmentosPage() {
	const { state } = useCompanyContext();
	const tableRef = useRef<DataTableRef<SegmentoData>>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [pageParameters, setPageParameters] = useState<{
		page: number;
		pageSize: number;
		orderBy: string;
		orderColumn: string;
		search: string;
		status: string[];
	}>({
		page: 1,
		pageSize: 10,
		orderBy: 'asc',
		orderColumn: 'ds_nome',
		search: '',
		status: [],
	});
	const queryClient = useQueryClient();
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const statusOptions = ['ATIVO', 'INATIVO'];

	// Estados para modal de criação/edição
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSegmento, setEditingSegmento] = useState<SegmentoData | null>(null);
	const [formData, setFormData] = useState({ ds_nome: '', cd_identificador: '' });
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setPageParameters((prev) => ({ ...prev, status: selectedStatus }));
	}, [selectedStatus]);

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
		queryKey: ['get-segmentos-paginado', pageParameters, state],
		queryFn: () => getSegmentosPaginado(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	async function handleSegmentoStatusChange(isAtivo: boolean) {
		const selectedSegmentos = tableRef.current?.getSelectedRows() || [];

		if (selectedSegmentos.length === 0) {
			toast.info('Selecione ao menos um segmento.');
			return;
		}

		const segmentosToUpdate = selectedSegmentos.filter((segmento) => segmento.is_ativo !== isAtivo);

		if (segmentosToUpdate.length === 0) {
			toast.info('Os segmentos selecionados já estão no status desejado.');
			return;
		}

		const ids = segmentosToUpdate.map((s) => s.id);

		return toast.promise(
			(async () => {
				if (isAtivo) {
					await ativarSegmentos(ids);
				} else {
					await inativarSegmentos(ids);
				}
				await queryClient.invalidateQueries({ queryKey: ['get-segmentos-paginado'] });
				await refetch();
				tableRef.current?.clearSelectedRows();
			})(),
			{
				loading: `${isAtivo ? 'Ativando' : 'Inativando'} segmentos...`,
				success: () => `${ids.length} segmento(s) ${isAtivo ? 'ativado(s)' : 'inativado(s)'} com sucesso.`,
				error: (error) => `Erro ao atualizar o status: ${error.message || error}`,
			},
		);
	}

	async function handleCreateSegmento() {
		if (!formData.ds_nome.trim()) {
			toast.error('Nome do segmento é obrigatório.');
			return;
		}

		setIsSubmitting(true);

		const payload: { ds_nome: string; cd_identificador?: string } = {
			ds_nome: formData.ds_nome,
		};

		if (formData.cd_identificador.trim()) {
			payload.cd_identificador = formData.cd_identificador;
		}

		try {
			await createSegmento(payload);
			await queryClient.invalidateQueries({ queryKey: ['get-segmentos-paginado'] });
			await refetch();
			setIsModalOpen(false);
			setFormData({ ds_nome: '', cd_identificador: '' });
			toast.success('Segmento criado com sucesso.');
		} catch (error) {
			toast.error(`Erro ao criar segmento: ${error instanceof Error ? error.message : error}`);
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleOpenEditModal(segmento: SegmentoData) {
		setEditingSegmento(segmento);
		setFormData({ ds_nome: segmento.ds_nome, cd_identificador: segmento.cd_identificador });
		setIsModalOpen(true);
	}

	async function handleUpdateSegmento() {
		if (!formData.ds_nome.trim()) {
			toast.error('Nome do segmento é obrigatório.');
			return;
		}

		if (!editingSegmento) return;

		setIsSubmitting(true);

		try {
			await updateSegmento(editingSegmento.id, { ds_nome: formData.ds_nome });
			await queryClient.invalidateQueries({ queryKey: ['get-segmentos-paginado'] });
			await refetch();
			setIsModalOpen(false);
			setFormData({ ds_nome: '', cd_identificador: '' });
			setEditingSegmento(null);
			toast.success('Segmento atualizado com sucesso.');
		} catch (error) {
			toast.error(`Erro ao atualizar segmento: ${error instanceof Error ? error.message : error}`);
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleOpenDeleteModal(segmento: SegmentoData) {
		toast.promise(
			deleteSegmento(segmento.id).then(async () => {
				await queryClient.invalidateQueries({ queryKey: ['get-segmentos-paginado'] });
				await refetch();
			}),
			{
				loading: 'Deletando segmento...',
				success: () => 'Segmento deletado com sucesso.',
				error: (error) => `Erro ao deletar segmento: ${error.message || error}`,
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

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingSegmento(null);
		setFormData({ ds_nome: '', cd_identificador: '' });
	};

	// Colunas da tabela (seguindo padrão de Entradas, incluindo ações inline)
	const columns: ColumnDef<SegmentoData>[] = [
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
			accessorKey: 'cd_identificador',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
			cell: ({ row }) => {
				const codigo = row.getValue('cd_identificador') as string;
				return <span className='font-mono font-semibold'>{codigo}</span>;
			},
		},
		{
			accessorKey: 'ds_nome',
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
		{
			id: 'actions',
			cell: ({ row }) => (
				<div className='flex justify-end gap-2'>
					<Button variant='ghost' size='sm' tooltip='Editar' onClick={() => handleOpenEditModal(row.original)}>
						<Edit className='h-4 w-4' />
					</Button>
					<Button
						variant='ghost'
						size='sm'
						tooltip='Deletar'
						onClick={() => handleOpenDeleteModal(row.original)}
						className='text-red-600 hover:bg-red-100 hover:text-red-700'
					>
						<Trash2 className='h-4 w-4' />
					</Button>
				</div>
			),
		},
	];

	return (
		<>
			<Head>
				<title>Segmentos | Esteira</title>
			</Head>
			<DashboardLayout title='Segmentos' description='Gerenciamento de segmentos de transporte.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar por código ou nome...'
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
									{/* Conteúdo - Aba Status */}
									<div className='p-2'>
										<DropdownMenuLabel>Status do Segmento</DropdownMenuLabel>
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
								<DropdownMenuItem className='text-sm' onClick={() => handleSegmentoStatusChange(true)}>
									<FileCheck className='h-4 w-4' />
									Ativar segmento(s)
								</DropdownMenuItem>
								<DropdownMenuItem className='text-sm' onClick={() => handleSegmentoStatusChange(false)}>
									<FileMinus className='h-4 w-4' />
									Inativar segmento(s)
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							variant='default'
							size='sm'
							onClick={() => {
								setEditingSegmento(null);
								setFormData({ ds_nome: '', cd_identificador: '' });
								setIsModalOpen(true);
							}}
							className='gap-2'
						>
							<Plus className='h-4 w-4' />
							Novo Segmento
						</Button>
					</div>
					{!isFetching && data?.segmentos?.length === 0 && <EmptyState label='Nenhum segmento encontrado.' />}

					{(isFetching || (data?.segmentos?.length ?? 0) > 0) && (
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
							data={data?.segmentos || []}
							sorting={sorting}
							onSortingChange={setSorting}
							allIds={data?.allIds}
						/>
					)}
				</div>
			</DashboardLayout>

			{/* Modal de Criação/Edição */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>{editingSegmento ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle>
						<DialogDescription>
							{editingSegmento
								? 'Atualize as informações do segmento.'
								: 'Crie um novo segmento. O código será gerado automaticamente se não informado.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid grid-cols-4 items-center gap-4'>
							<Label htmlFor='codigo' className='text-right'>
								Código
							</Label>
							<Input
								id='codigo'
								disabled={!!editingSegmento}
								placeholder='Deixe vazio para auto-geração'
								value={formData.cd_identificador}
								onChange={(e) => setFormData({ ...formData, cd_identificador: e.target.value })}
								className='col-span-3'
							/>
						</div>
						<div className='grid grid-cols-4 items-center gap-4'>
							<Label htmlFor='nome' className='text-right'>
								Nome
							</Label>
							<Input
								id='nome'
								placeholder='Nome do segmento'
								value={formData.ds_nome}
								onChange={(e) => setFormData({ ...formData, ds_nome: e.target.value })}
								className='col-span-3'
								autoFocus
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={handleCloseModal} disabled={isSubmitting}>
							Cancelar
						</Button>
						<Button onClick={editingSegmento ? handleUpdateSegmento : handleCreateSegmento} disabled={isSubmitting} className='gap-2'>
							{isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
							{editingSegmento ? 'Atualizar' : 'Criar'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
