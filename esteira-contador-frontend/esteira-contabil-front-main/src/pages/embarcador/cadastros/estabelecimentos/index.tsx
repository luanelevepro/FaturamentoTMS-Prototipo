import React, { FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { toast } from 'sonner';
import {
	// getUFs,
	getEstabelecimentos,
	deleteEstabelecimento,
	updateEstabelecimento,
	createEstabelecimento,
	// getUFCidades,
} from '@/services/api/sistema';
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
// import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import ColoredInitials from '@/components/general/embarcador/initials';
import { CidadesSelector } from '@/components/general/seletores/cidades-selector';

export default function EmbarcadorParametrosEstabelecimentosPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc' });

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-cadastro-embarcador-estabelecimentos', pageParameters, state],
		queryFn: () =>
			getEstabelecimentos({
				...pageParameters,
				search: searchTerm,
			}),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.estabelecimentos.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

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

	useEffect(() => {
		if (isFetching) return;
		if (!isError) return;

		toast.error(`Erro ao buscar dados: ${error}`);
	}, [isFetching, isError, error]);

	useEffect(() => {
		const handler = setTimeout(() => {
			refetch();
		}, 300);

		return () => {
			clearTimeout(handler);
		};
	}, [searchTerm, refetch]);

	const columns: ColumnDef<ESTEIRA.RAW.Estabelecimento>[] = [
		{
			accessorKey: 'ds_nome',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome' />,
			cell: ({ row }) => (
				<span className='flex items-center gap-2'>
					<ColoredInitials name={row.original.ds_nome} />
					{row.original.ds_nome}
				</span>
			),
		},
		{
			accessorKey: 'id_sis_ibge_cidade',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Cidade' />,
			cell: ({ row }) => {
				return (
					<div className='flex items-center gap-2'>
						{row.original.js_emb_ibge_cidade?.js_sis_city.ds_city} -{' '}
						{row.original.js_emb_ibge_cidade?.js_emb_ibge_uf.js_sis_ibge_uf?.ds_uf}
					</div>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<div className='flex justify-end gap-2'>
					<HandleInsert data={row.original}>
						<Button tooltip='Editar' variant='outline' size='icon'>
							<Pencil />
						</Button>
					</HandleInsert>
					<HandleDelete data={row.original} />
				</div>
			),
		},
	];

	return (
		<>
			<Head>
				<title>Cadastro Estabelecimentos | Esteira</title>
			</Head>
			<DashboardLayout title='Estabelecimentos' description='Gerenciamento de estabelecimentos.'>
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
					{data?.estabelecimentos?.length === 0 ? (
						<EmptyState label='Nenhum estabelecimento encontrado.' />
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
							columns={columns}
							data={data?.estabelecimentos || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: ESTEIRA.RAW.Estabelecimento }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [selectedCity, setSelectedCity] = useState<number | undefined>(data?.js_emb_ibge_cidade?.id_sis_cidade);
	// const [selectedUF, setSelectedUF] = useState<number | undefined>(data?.js_emb_ibge_cidade?.id_emb_uf);
	// // const [selectedUFCidades, setSelectedUFCidades] = useState<ESTEIRA.RESPONSE.GetUFCidades | null>(null);
	// const { data: ufData, isFetching } = useQuery({
	// 	queryKey: ['get-ufs'],
	// 	queryFn: () =>
	// 		getUFs({
	// 			page: 1,
	// 			orderBy: 'asc',
	// 			pageSize: 100,
	// 			search: '',
	// 		}),
	// 	staleTime: 1000 * 60 * 5,
	// 	placeholderData: keepPreviousData,
	// });
	// const { data: selectedUFCidades, isFetching: isFetchingCidades } = useQuery({
	// 	queryKey: [`get-cidades-${selectedUF}`, selectedUF],
	// 	queryFn: () => getUFCidades(Number(selectedUF)),
	// 	staleTime: 1000 * 60 * 5,
	// 	enabled: !!selectedUF,
	// });

	async function sendInformation(payload: ESTEIRA.PAYLOAD.CreateEstabelecimento) {
		setErrorMessage('');

		if (!payload.ds_nome) {
			setErrorMessage('Nome é obrigatório.');
			return;
		}

		if (!payload.id_sis_ibge_cidade) {
			setErrorMessage('Cidade é obrigatória.');
			return;
		}

		setIsLoading(true);

		try {
			if (data?.id) {
				await updateEstabelecimento({
					id_sis_ibge_cidade: Number(payload.id_sis_ibge_cidade || selectedCity),
					ds_nome: payload.ds_nome,
					id: data.id,
				});
			} else {
				await createEstabelecimento({
					id_sis_ibge_cidade: Number(payload.id_sis_ibge_cidade),
					ds_nome: payload.ds_nome,
				});
			}
			await queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-estabelecimentos'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		}

		setIsLoading(false);
		setOpen(false);

		queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-estabelecimentos'] });
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const info = {
			id_sis_ibge_cidade: selectedCity!,
			ds_nome: formData.get('ds_nome') as string,
		} satisfies ESTEIRA.PAYLOAD.CreateEstabelecimento;

		sendInformation(info);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} Estabelecimento</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='ds_nome'>Nome</Label>
						<Input name='ds_nome' id='ds_nome' defaultValue={data?.ds_nome} type='text' disabled={isLoading} />
					</div>
					<div className='grid gap-2'>
						<CidadesSelector
							defaultValue={data?.js_emb_ibge_cidade?.id_sis_cidade.toString()}
							onCityChange={(id_sis_ibge_cidade) => {
								setSelectedCity(Number(id_sis_ibge_cidade));
							}}
						/>
					</div>
					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}
					<div className='grid gap-2'>
						<Button type='submit' disabled={isLoading} className='w-full'>
							Salvar
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: ESTEIRA.RAW.Estabelecimento }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!data?.id) {
			toast.error('Item desconhecido, não foi possível remover.');
			return;
		}
		try {
			await deleteEstabelecimento(data.id);
			await queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-estabelecimentos'] });
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
				<Button tooltip='Excluir' variant='destructive' size='icon'>
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
