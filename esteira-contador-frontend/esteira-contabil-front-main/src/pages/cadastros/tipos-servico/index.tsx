import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
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
import { createTiposServico, deleteTiposServico, getTiposServico, updateTiposServico } from '@/services/api/sistema';

export interface TipoServicoData {
	id?: string;
	ds_descricao: string;
	ds_codigo: string;
}

const columns: ColumnDef<TipoServicoData>[] = [
	{
		accessorKey: 'ds_codigo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Codigo' />,
	},
	{
		accessorKey: 'ds_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
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

export default function CadastroTipoServicoPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-tipos-servicos'],
		queryFn: getTiposServico,
		staleTime: 1000 * 60 * 5,
	});

	const filteredData = useMemo(() => {
		return data?.filter((item: { [s: string]: unknown } | ArrayLike<unknown>) =>
			Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os tipos de Servico.');
	}

	return (
		<>
			<Head>
				<title>Cadastro de Tipos de Serviço | Esteira</title>
			</Head>
			<DashboardLayout title='Tipos de Serviço' description='Gerencie o cadastro de tipos de serviço.'>
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
						<EmptyState label='Nenhum registro encontrado.' />
					) : (
						<DataTable columns={columns} data={filteredData || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: TipoServicoData }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [info, setInfo] = useState<TipoServicoData>(data ?? { ds_descricao: '', ds_codigo: '' });
	const [errorMessage, setErrorMessage] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInfo({ ...info, [e.target.id]: e.target.value });
	};

	async function sendInformation() {
		setErrorMessage('');

		if (!info.ds_descricao) {
			setErrorMessage('Descrição é obrigatória.');
			return;
		}

		if (!info.ds_codigo) {
			setErrorMessage('Código é obrigatório.');
			return;
		}

		setIsLoading(true);

		try {
			if (data?.id) {
				await updateTiposServico(data?.id, info);
			} else {
				await createTiposServico(info);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-tipos-servicos'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			setInfo(data ?? { ds_descricao: '', ds_codigo: '' });
			setOpen(false);
		}
	}

	useEffect(() => {
		setInfo(data ?? { ds_descricao: '', ds_codigo: '' });
	}, [data]);

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		sendInformation();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} tipos de serviço</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid grid-cols-3 gap-4'>
						<div className='col-span-1 grid gap-2'>
							<Label htmlFor='name'>Código</Label>
							<Input id='ds_codigo' defaultValue={info.ds_codigo} type='text' onChange={handleChange} disabled={isLoading} />
						</div>
						<div className='col-span-2 grid gap-2'>
							<Label htmlFor='name'>Descrição</Label>
							<Input id='ds_descricao' defaultValue={info.ds_descricao} type='text' onChange={handleChange} disabled={isLoading} />
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

function HandleDelete({ data }: { data: TipoServicoData }) {
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
			await deleteTiposServico(data?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-tipos-servicos'] });
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
