import { FormEvent, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { toast } from 'sonner';
import {
	getClassificacaoImplementos,
	updateClassificacaoImplementos,
	createClassificacaoImplementos,
	deleteClassificacaoImplementos,
} from '@/services/api/embarcador';
import { Badge } from '@/components/ui/badge';
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
import { Icons } from '@/components/layout/icons';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const columns: ColumnDef<ESTEIRA.RAW.ClassificacaoImplemento>[] = [
	{
		accessorKey: 'ds_classificacao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Classificação' />,
	},
	{
		accessorKey: 'fl_acrescimo_eixo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Acréscimo Eixo?' />,
		cell: ({ row }) => (
			<Badge variant={row.original.fl_acrescimo_eixo ? 'success' : 'default'} className='cursor-default'>
				{row.original.fl_acrescimo_eixo ? 'Sim' : 'Não'}
			</Badge>
		),
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<div className='flex justify-end'>
				<HandleInsert data={row.original}>
					<Button tooltip='Editar' variant='ghost' size='icon'>
						<Pencil />
					</Button>
				</HandleInsert>
				<HandleDelete data={row.original} />
			</div>
		),
	},
];

export default function EmbarcadorParametrosClassificacaoImplementosPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc' });
	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-embarcador-parametro-classificacao-implementos', pageParameters, state, searchTerm],
		queryFn: () =>
			getClassificacaoImplementos({
				...pageParameters,
				search: searchTerm,
			}),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.implementos.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	const tableRef = useRef<DataTableRef<ESTEIRA.RAW.ClassificacaoImplemento>>(null);

	useEffect(() => {
		if (isFetching) return;
		if (!isError) return;

		toast.error(`Erro ao buscar dados: ${error}`);
	}, [isFetching, isError, error]);

	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(searchTerm);
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

	return (
		<>
			<Head>
				<title>Classificação Implementos | Esteira</title>
			</Head>
			<DashboardLayout title='Classificação de Implementos' description='Gerenciamento de classificações de Implementos.'>
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
						<HandleInsert>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsert>
					</div>
					{data?.implementos?.length === 0 ? (
						<EmptyState label='Nenhuma classificação encontrada.' />
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
							data={data?.implementos || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: ESTEIRA.RAW.ClassificacaoImplemento }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const { state } = useCompanyContext();

	async function sendInformation(data: Partial<ESTEIRA.RAW.ClassificacaoImplemento>) {
		setErrorMessage('');

		if (!data.ds_classificacao) {
			setErrorMessage('Descrição é obrigatória.');
			return;
		}

		setIsLoading(true);

		try {
			if (data?.id) {
				await updateClassificacaoImplementos(data.id, {
					ds_classificacao: data.ds_classificacao,
					fl_acrescimo_eixo: data.fl_acrescimo_eixo || false,
				});
			} else {
				await createClassificacaoImplementos({
					ds_classificacao: data.ds_classificacao,
					fl_acrescimo_eixo: data.fl_acrescimo_eixo || false,
				});
			}
			await queryClient.invalidateQueries({ queryKey: ['get-cst'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		}

		setIsLoading(false);
		setOpen(false);

		queryClient.invalidateQueries({ queryKey: ['get-embarcador-parametro-classificacao-implementos'] });
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const info = {
			ds_classificacao: formData.get('ds_classificacao') as string,
			fl_acrescimo_eixo: formData.get('fl_acrescimo_eixo') === 'on',
			id_emb_empresas: state,
			id: data?.id,
		} satisfies Partial<ESTEIRA.RAW.ClassificacaoImplemento>;

		sendInformation(info);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} Classificação de implementos</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='ds_classificacao'>Descrição</Label>
						<Input
							name='ds_classificacao'
							id='ds_classificacao'
							defaultValue={data?.ds_classificacao}
							type='text'
							disabled={isLoading}
						/>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='fl_acrescimo_eixo'>Acréscimo Eixo?</Label>
						<Checkbox id='fl_acrescimo_eixo' name='fl_acrescimo_eixo' defaultChecked={data?.fl_acrescimo_eixo || false} />
					</div>
					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}
					<div className='grid gap-2'>
						<Button type='submit' disabled={isLoading} className='w-full'>
							{isLoading ? 'Salvando...' : 'Salvar'}
							{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: ESTEIRA.RAW.ClassificacaoImplemento }) {
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
			await deleteClassificacaoImplementos(data.id);
			await queryClient.invalidateQueries({ queryKey: ['get-embarcador-parametro-classificacao-implementos'] });
			toast.success('Registro removido com sucesso.');
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar.');
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
					<DialogTitle>Deletar registro?</DialogTitle>
					<DialogDescription>Isso irá deletar o registro, essa ação é irreversível.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button disabled={loading} variant='outline'>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={DeleteData} disabled={loading} variant='destructive'>
						Continuar
						{loading && <Icons.spinner className='h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
