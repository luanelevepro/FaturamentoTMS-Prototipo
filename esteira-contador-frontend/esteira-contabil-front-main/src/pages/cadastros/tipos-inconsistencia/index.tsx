import React, { FormEvent, useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Calendar as CalendarIcon, Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import EmptyState from '@/components/states/empty-state';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/layout/icons';
import {
	createTipoInconsistencia,
	deleteTipoInconsistencia,
	getTiposInconsistencia,
	TipoInconsistencia,
	TipoInconsistenciaPayload,
	updateTipoInconsistencia,
} from '@/services/api/fiscal';
import { ColumnDef } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

// Colunas base da tabela
const baseColumns: ColumnDef<TipoInconsistencia>[] = [
	{
		id: 'cd_codigo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
		accessorKey: 'cd_codigo',
		cell: ({ row }) => row.getValue('cd_codigo'),
	},
	{
		id: 'ds_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
		accessorKey: 'ds_descricao',
		cell: ({ row }) => row.getValue('ds_descricao'),
	},
	{
		id: 'criticidade_padrao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Criticidade Padrão' />,
		accessorKey: 'criticidade_padrao',
		cell: ({ row }) => row.getValue('criticidade_padrao'),
	},
	{
		id: 'ds_grupo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Grupo' />,
		accessorKey: 'ds_grupo',
		cell: ({ row }) => row.getValue('ds_grupo'),
	},
	{
		id: 'fl_ativo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
		accessorKey: 'fl_ativo',
		cell: ({ row }) => (row.getValue('fl_ativo') ? 'Ativo' : 'Inativo'),
	},
];

export default function CadastroTiposInconsistenciaPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-tipos-inconsistencia', filterActive],
		queryFn: () => getTiposInconsistencia(filterActive),
		staleTime: 1000 * 60 * 5,
	});

	const filteredData = useMemo(() => {
		if (!data) return [];
		return data.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())));
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar tipos de inconsistência.');
	}

	// Adicionar coluna de ações às colunas base
	const columns: ColumnDef<TipoInconsistencia>[] = [
		...baseColumns,
		{
			id: 'actions',
			cell: ({ row }) => {
				return (
					<div className='flex justify-end'>
						<HandleInsert data={row.original}>
							<Button tooltip='Editar' variant='ghost' size='icon'>
								<Pencil />
							</Button>
						</HandleInsert>
						<HandleDelete data={row.original} />
					</div>
				);
			},
		},
	];

	return (
		<>
			<Head>
				<title>Tipos de Inconsistência | Esteira</title>
			</Head>
			<DashboardLayout title='Tipos de Inconsistência' description='Gerencie os tipos de inconsistência para auditoria fiscal.'>
				<div className='grid gap-6'>
					<div className='flex flex-wrap gap-2'>
						<div className='relative h-10 min-w-[200px] flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<Select
							value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
							onValueChange={(value) => {
								if (value === 'all') setFilterActive(undefined);
								else if (value === 'active') setFilterActive(true);
								else setFilterActive(false);
							}}
						>
							<SelectTrigger className='w-[150px]'>
								<SelectValue placeholder='Filtrar status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Todos</SelectItem>
								<SelectItem value='active'>Ativos</SelectItem>
								<SelectItem value='inactive'>Inativos</SelectItem>
							</SelectContent>
						</Select>
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleInsert>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsert>
					</div>
					{filteredData?.length === 0 ? (
						isFetching ? (
							<EmptyState label='Carregando...' />
						) : (
							<EmptyState label='Nenhum tipo de inconsistência encontrado.' />
						)
					) : (
						<DataTable columns={columns} data={filteredData || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: TipoInconsistencia }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [dtInicioVigencia, setDtInicioVigencia] = useState<Date | undefined>(
		data?.dt_inicio_vigencia ? new Date(data.dt_inicio_vigencia) : undefined,
	);
	const [dtFimVigencia, setDtFimVigencia] = useState<Date | undefined>(data?.dt_fim_vigencia ? new Date(data.dt_fim_vigencia) : undefined);
	const [flAtivo, setFlAtivo] = useState(data?.fl_ativo ?? true);

	async function sendInformation(payload: TipoInconsistenciaPayload & { id?: string }) {
		setErrorMessage('');
		setIsLoading(true);

		try {
			if (payload.id) {
				await updateTipoInconsistencia(payload.id, payload);
			} else {
				await createTipoInconsistencia(payload);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-tipos-inconsistencia'] });
			toast.success('Salvo com sucesso.');
			setOpen(false);
		} catch (error: unknown) {
			console.error('Error:', error);
			const errorMsg = error instanceof Error ? error.message : String(error);
			// Mapear erro de unicidade
			if (errorMsg.includes('P2002') || errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('duplicat')) {
				setErrorMessage('Código já existe. Escolha outro código.');
			} else {
				toast.error('Erro ao salvar.');
			}
		} finally {
			setIsLoading(false);
		}
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage('');

		const formData = new FormData(e.target as HTMLFormElement);
		const form: TipoInconsistenciaPayload & { id?: string } = {
			cd_codigo: (formData.get('cd_codigo') as string)?.trim(),
			ds_descricao: (formData.get('ds_descricao') as string)?.trim(),
			criticidade_padrao: formData.get('criticidade_padrao') as 'INFO' | 'AVISO' | 'CRITICA',
			ds_grupo: (formData.get('ds_grupo') as string)?.trim() || null,
			fl_ativo: flAtivo,
			ds_ordem_exibicao: parseInt(formData.get('ds_ordem_exibicao') as string) || 1,
			versao_regra: (formData.get('versao_regra') as string)?.trim() || null,
			dt_inicio_vigencia: dtInicioVigencia ? dtInicioVigencia.toISOString() : null,
			dt_fim_vigencia: dtFimVigencia ? dtFimVigencia.toISOString() : null,
			id: data?.id,
		};

		if (!form.cd_codigo) {
			setErrorMessage('Código é obrigatório.');
			return;
		}

		if (!form.ds_descricao) {
			setErrorMessage('Descrição é obrigatória.');
			return;
		}

		sendInformation(form);
	};

	// Reset state when dialog opens with different data
	React.useEffect(() => {
		if (open) {
			setDtInicioVigencia(data?.dt_inicio_vigencia ? new Date(data.dt_inicio_vigencia) : undefined);
			setDtFimVigencia(data?.dt_fim_vigencia ? new Date(data.dt_fim_vigencia) : undefined);
			setFlAtivo(data?.fl_ativo ?? true);
			setErrorMessage('');
		}
	}, [open, data]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} Tipo de Inconsistência</DialogTitle>
					<DialogDescription>Preencha os dados do tipo de inconsistência para auditoria.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='cd_codigo'>Código *</Label>
							<Input
								id='cd_codigo'
								name='cd_codigo'
								defaultValue={data?.cd_codigo || ''}
								placeholder='Ex: TOTAL_MISMATCH'
								disabled={isLoading}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='criticidade_padrao'>Criticidade</Label>
							<Select name='criticidade_padrao' defaultValue={data?.criticidade_padrao || 'AVISO'}>
								<SelectTrigger>
									<SelectValue placeholder='Selecione a criticidade' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='INFO'>Info</SelectItem>
									<SelectItem value='AVISO'>Aviso</SelectItem>
									<SelectItem value='CRITICA'>Crítica</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className='grid gap-2'>
						<Label htmlFor='ds_descricao'>Descrição *</Label>
						<Input
							id='ds_descricao'
							name='ds_descricao'
							defaultValue={data?.ds_descricao || ''}
							placeholder='Descrição do tipo de inconsistência'
							disabled={isLoading}
						/>
					</div>

					<div className='grid grid-cols-3 gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='ds_grupo'>Grupo</Label>
							<Input
								id='ds_grupo'
								name='ds_grupo'
								defaultValue={data?.ds_grupo || ''}
								placeholder='Ex: VALORES'
								disabled={isLoading}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='ds_ordem_exibicao'>Ordem de exibição</Label>
							<Input
								id='ds_ordem_exibicao'
								name='ds_ordem_exibicao'
								defaultValue={data?.ds_ordem_exibicao || 1}
								disabled={isLoading}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='versao_regra'>Versão da regra</Label>
							<Input
								id='versao_regra'
								name='versao_regra'
								defaultValue={data?.versao_regra || ''}
								placeholder='Ex: 1.0.0'
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='grid gap-2'>
							<Label>Início da vigência</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn('justify-start text-left font-normal', !dtInicioVigencia && 'text-muted-foreground')}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{dtInicioVigencia ? format(dtInicioVigencia, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar mode='single' selected={dtInicioVigencia} onSelect={setDtInicioVigencia} locale={ptBR} />
								</PopoverContent>
							</Popover>
						</div>
						<div className='grid gap-2'>
							<Label>Fim da vigência</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn('justify-start text-left font-normal', !dtFimVigencia && 'text-muted-foreground')}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{dtFimVigencia ? format(dtFimVigencia, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar mode='single' selected={dtFimVigencia} onSelect={setDtFimVigencia} locale={ptBR} />
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className='flex items-center space-x-2'>
						<Checkbox id='fl_ativo' checked={flAtivo} onCheckedChange={(checked) => setFlAtivo(checked === true)} />
						<Label htmlFor='fl_ativo' className='cursor-pointer'>
							Tipo ativo
						</Label>
					</div>

					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}

					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Salvando...' : 'Salvar'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: TipoInconsistencia }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!data?.id) {
			toast.error('Erro ao deletar.');
			return;
		}
		try {
			await deleteTipoInconsistencia(data.id);
			await queryClient.invalidateQueries({ queryKey: ['get-tipos-inconsistencia'] });
			toast.success('Registro removido com sucesso.');
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar. O registro pode estar sendo usado em outra parte do sistema.');
		} finally {
			setLoading(false);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button tooltip='Excluir' variant='ghost' size='icon'>
					<Trash />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Deletar tipo de inconsistência?</DialogTitle>
					<DialogDescription>
						Isso irá deletar o tipo <strong>{data.cd_codigo}</strong>. Essa ação é irreversível.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button disabled={loading} variant='outline'>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={DeleteData} disabled={loading} variant='destructive'>
						Continuar
						{loading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
