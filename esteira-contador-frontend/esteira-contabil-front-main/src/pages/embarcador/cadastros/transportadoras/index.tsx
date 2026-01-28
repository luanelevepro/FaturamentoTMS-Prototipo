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
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { toast } from 'sonner';
import { getTransportadoras, createTransportadora, updateTransportadora, deleteTransportadora } from '@/services/api/sistema';
import { CidadesSelector } from '@/components/general/seletores/cidades-selector';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
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
import ColoredInitials from '@/components/general/embarcador/initials';
import { useCompanyContext } from '@/context/company-context';
import { ImportSheetDropdown } from '@/components/general/import-sheet-dropdown';

export default function EmbarcadorParametrosTransportadorasPage() {
	const { state } = useCompanyContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pageParameters, setPageParameters] = useState<ESTEIRA.PAYLOAD.Paginacao>({ page: 1, pageSize: 10, orderBy: 'asc' });

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-cadastro-embarcador-transportadoras', pageParameters, state],
		queryFn: () =>
			getTransportadoras({
				...pageParameters,
				search: searchTerm,
			}),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
	});
	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || (data && data.transportadoras.length === 0)) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

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

	const columns: ColumnDef<ESTEIRA.RAW.Transportadora>[] = [
		{
			accessorKey: 'cd_transportadora',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Código' />,
		},
		{
			accessorKey: 'ds_nome_fantasia',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome Fantasia' />,
			cell: ({ row }) => {
				return (
					<div className='flex items-center gap-2'>
						<ColoredInitials name={row.original.ds_nome_fantasia} />
						{row.original.ds_nome_fantasia}
					</div>
				);
			},
		},
		{
			accessorKey: 'ds_cnpj',
			header: ({ column }) => <DataTableColumnHeader column={column} title='CNPJ' />,
			cell: ({ row }) => {
				return <span>{formatCnpjCpf(row.getValue('ds_cnpj'))}</span>;
			},
		},
		{
			accessorKey: 'ds_razao_social',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Razão Social' />,
		},
		{
			accessorKey: 'id_emb_ibge_cidade',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Cidade' />,
			cell: ({ row }) => {
				return <div className='flex items-center gap-2'>{row.original.js_emb_ibge_cidade?.js_sis_city.ds_city}</div>;
			},
		},
		{
			accessorKey: 'id_emb_ibge_uf',
			header: ({ column }) => <DataTableColumnHeader column={column} title='UF' />,
			cell: ({ row }) => {
				return <div className='flex items-center gap-2'>{row.original.js_emb_ibge_cidade?.js_emb_ibge_uf.js_sis_ibge_uf?.ds_uf}</div>;
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
				<title>Cadastro Transportadoras | Esteira</title>
			</Head>
			<DashboardLayout title='Transportadoras' description='Gerenciamento de transportadoras.'>
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
						<ImportSheetDropdown tableName='emb_transportadoras' displayName='Transportadoras' />
						<HandleInsert>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar</p>
							</Button>
						</HandleInsert>
					</div>
					{data?.transportadoras?.length === 0 ? (
						<EmptyState label='Nenhuma transportadora encontrada.' />
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
							data={data?.transportadoras || []}
							sorting={sorting}
							onSortingChange={setSorting}
						/>
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: ESTEIRA.RAW.Transportadora }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [selectedCity, setSelectedCity] = useState<number | undefined>(data?.js_emb_ibge_cidade?.id_sis_cidade);

	async function sendInformation(payload: ESTEIRA.PAYLOAD.CreateTransportadora) {
		setErrorMessage('');

		if (!payload.cd_transportadora && !data?.cd_transportadora) {
			setErrorMessage('Código da transportadora é obrigatória.');
			return;
		}

		if (!payload.ds_cnpj) {
			setErrorMessage('CNPJ é obrigatório.');
			return;
		}

		if (!payload.ds_nome_fantasia) {
			setErrorMessage('Nome fantasia é obrigatório.');
			return;
		}

		if (!payload.ds_razao_social) {
			setErrorMessage('Razão social é obrigatório.');
			return;
		}

		if (!selectedCity) {
			setErrorMessage('Cidade é obrigatória.');
			return;
		}

		setIsLoading(true);

		try {
			if (data?.cd_transportadora) {
				await updateTransportadora(Number(data.cd_transportadora), {
					cd_transportadora: payload.cd_transportadora,
					ds_cnpj: payload.ds_cnpj,
					ds_nome_fantasia: payload.ds_nome_fantasia,
					ds_razao_social: payload.ds_razao_social,
					id_sis_ibge_cidade: payload.id_sis_ibge_cidade || selectedCity,
				});
			} else {
				await createTransportadora({
					cd_transportadora: payload.cd_transportadora!,
					ds_cnpj: payload.ds_cnpj,
					ds_nome_fantasia: payload.ds_nome_fantasia,
					ds_razao_social: payload.ds_razao_social,
					id_sis_ibge_cidade: selectedCity,
				});
			}
			await queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-transportadoras'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		}

		setIsLoading(false);
		setOpen(false);

		queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-transportadoras'] });
	}

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const info = {
			cd_transportadora: formData.get('cd_transportadora') as string,
			ds_cnpj: formData.get('ds_cnpj') as string,
			ds_nome_fantasia: formData.get('ds_nome_fantasia') as string,
			ds_razao_social: formData.get('ds_razao_social') as string,
			id_sis_ibge_cidade: selectedCity!,
		} satisfies ESTEIRA.PAYLOAD.CreateTransportadora;

		sendInformation(info);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{data?.cd_transportadora ? 'Editar' : 'Adicionar'} Transportadora</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='cd_transportadora'>Código</Label>
						<Input
							name='cd_transportadora'
							id='cd_transportadora'
							defaultValue={data?.cd_transportadora}
							type='number'
							disabled={isLoading}
						/>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='ds_cnpj'>CNPJ</Label>
						<Input name='ds_cnpj' id='ds_cnpj' defaultValue={data?.ds_cnpj} type='text' disabled={isLoading} />
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='ds_nome_fantasia'>Nome Fantasia</Label>
						<Input
							name='ds_nome_fantasia'
							id='ds_nome_fantasia'
							defaultValue={data?.ds_nome_fantasia}
							type='text'
							disabled={isLoading}
						/>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='ds_razao_social'>Razão Social</Label>
						<Input
							name='ds_razao_social'
							id='ds_razao_social'
							defaultValue={data?.ds_razao_social}
							type='text'
							disabled={isLoading}
						/>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='ds_cnpj'>Cidade</Label>
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
							{isLoading ? 'Salvando...' : 'Salvar'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: ESTEIRA.RAW.Transportadora }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!data?.id_emb_ibge_uf) {
			toast.error('Item desconhecido, não foi possível remover.');
			return;
		}
		try {
			await deleteTransportadora(data.cd_transportadora);
			await queryClient.invalidateQueries({ queryKey: ['get-cadastro-embarcador-transportadoras'] });
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
