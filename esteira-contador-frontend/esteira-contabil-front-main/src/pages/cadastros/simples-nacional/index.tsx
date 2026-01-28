import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
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
import { createSimplesNacional, deleteSimplesNacional, getSimplesNacional, updateSimplesNacional } from '@/services/api/sistema';
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';

const columns: ColumnDef<ESTEIRA.RAW.SimplesNacional>[] = [
	{
		accessorKey: 'cd_simples',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
	},
	{
		accessorKey: 'ds_nome',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Nome/Descrição' />,
	},
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

export default function CadastroSimplesNacionalPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc', orderColumn: 'cd_simples' });
	const [sorting, setSorting] = useState<SortingState>([]);

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-simples-nacional'],
		queryFn: () => getSimplesNacional(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});

	const filteredData = useMemo(() => {
		return data?.filter((item: { [s: string]: unknown } | ArrayLike<unknown>) =>
			Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar simples nacional.');
	}

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.carrocerias.length === 0)) return;
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

	return (
		<>
			<Head>
				<title>Cadastro de Simples Nacional | Esteira</title>
			</Head>
			<DashboardLayout title='Simples Nacional' description='Gerencie faixas do Simples Nacional.'>
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
						<HandleInsert>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsert>
					</div>
					{filteredData?.length === 0 ? (
						<EmptyState label='Nenhum simples nacional encontrado.' />
					) : (
						<DataTableDynamic
							onPageChange={handlePageChange}
							columns={columns}
							data={filteredData || ''}
							onPageSizeChange={(newSize) => setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
							pageParameters={{
								page: pageParameters.page || 0,
								pageSize: pageParameters.pageSize || 10,
								total: data?.total || 0,
								totalPages: data?.totalPages || 1,
							}}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: ESTEIRA.RAW.SimplesNacional }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	async function sendInformation(payload: Partial<ESTEIRA.RAW.SimplesNacional>) {
		setErrorMessage('');
		setIsLoading(true);

		try {
			if (payload.id) {
				await updateSimplesNacional(payload.id, payload);
			} else {
				await createSimplesNacional(payload);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-simples-nacional'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			setOpen(false);
		}
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.target as HTMLFormElement);
		const form = {
			cd_simples: formData.get('cd_simples') as string,
			ds_nome: formData.get('ds_nome') as string,
			id: data?.id,
		};

		if (!form.cd_simples) {
			setErrorMessage('Código é obrigatório.');
			return;
		}

		if (!form.ds_nome) {
			setErrorMessage('Nome/Descrição é obrigatório.');
			return;
		}

		sendInformation(form);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} Simples Nacional</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid grid-cols-3 gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='cd_simples'>Código</Label>
							<Input name='cd_simples' id='cd_simples' type='number' defaultValue={data?.cd_simples} disabled={isLoading} />
						</div>
						<div className='col-span-2 grid gap-2'>
							<Label htmlFor='ds_nome'>Nome/Descrição</Label>
							<Input name='ds_nome' id='ds_nome' defaultValue={data?.ds_nome} type='text' disabled={isLoading} />
						</div>
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

function HandleDelete({ data }: { data: Pick<ESTEIRA.RAW.SimplesNacional, 'id' | 'cd_simples' | 'ds_nome'> }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!data?.cd_simples) {
			toast.error('Erro ao deletar.');
			return;
		}
		try {
			await deleteSimplesNacional(data?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-simples-nacional'] });
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
