import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Check, ChevronsUpDown, Info, Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
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
import {
	createPadraoSegmento,
	deletePadraoSegmento,
	getPadraoSegmento,
	getSegmentosEmpresas,
	updatePadraoSegmento,
} from '@/services/api/fiscal';
import { SegmentosEmpresasData } from '../segmentos-empresa';
import {
	MultiSelector,
	MultiSelectorContent,
	MultiSelectorInput,
	MultiSelectorItem,
	MultiSelectorList,
	MultiSelectorTrigger,
} from '@/components/ui/mult-select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getTiposProduto, getTiposServico } from '@/services/api/sistema';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export interface ProdutoPadraoSegmentoData {
	id?: string;
	ds_descricao: string;
	ds_codigo?: string;
	fis_segmentos: {
		id: string;
		ds_descricao: string;
	}[];
	is_padrao?: boolean;
	id_sis_tipos_produto?: string;
	id_sis_tipos_servico?: string;
	sis_tipos_servico?: {
		ds_codigo?: string;
		ds_descricao?: string;
		id?: string;
	} | null;
	sis_tipos_produto?: {
		ds_codigo?: string;
		ds_descricao?: string;
		id?: string;
	} | null;
}

const columns: ColumnDef<ProdutoPadraoSegmentoData>[] = [
	{
		accessorKey: 'ds_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
	},
	{
		accessorKey: 'fis_segmentos',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Segmentos' />,
		cell: ({ row }) => {
			return (
				<div className='flex flex-wrap gap-2'>
					{row.original.fis_segmentos.map((segmento: { id: string; ds_descricao: string }) => (
						<Badge key={segmento.id} variant={'outline'}>
							{segmento.ds_descricao}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		accessorKey: 'sis_tipos_produto',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo de produto' />,
		cell: ({ row }) => {
			return (
				<div className='flex flex-wrap gap-2'>
					<Badge key={row.original.id_sis_tipos_produto} variant={'outline'}>
						{row.original.sis_tipos_produto?.ds_descricao || 'Nenhum'}
					</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: 'sis_tipos_servico',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo de serviço' />,
		cell: ({ row }) => {
			return (
				<div className='flex flex-wrap gap-2'>
					<Badge key={row.original.id_sis_tipos_servico} variant={'outline'}>
						{row.original.sis_tipos_servico?.ds_descricao || 'Nenhum'}
					</Badge>
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<div className='flex justify-end'>
					{!row.original.is_padrao && (
						<>
							<HandleInsert data={row.original}>
								<Button tooltip='Editar' variant='ghost' size='icon'>
									<Pencil />
								</Button>
							</HandleInsert>
							<HandleDelete data={row.original} />
						</>
					)}
					{row.original.is_padrao && (
						<Button className='text-muted-foreground' tooltip='Padrão' variant='link' size='icon'>
							<Info />
						</Button>
					)}
				</div>
			);
		},
	},
];

export default function CadastroRegimeTributarioPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-itens-padroes-segmento'],
		queryFn: getPadraoSegmento,
		staleTime: 1000 * 60 * 5,
	});

	const filteredData = useMemo(() => {
		return data?.filter((item: { [s: string]: unknown } | ArrayLike<unknown>) =>
			Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
		);
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	return (
		<>
			<Head>
				<title>Cadastro de Itens padrões | Esteira</title>
			</Head>
			<DashboardLayout title='Itens padrões' description='Gerenciamento de itens padrões por segmento.'>
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
						<EmptyState label='Nenhum regime tributário encontrado.' />
					) : (
						<DataTable columns={columns} data={filteredData || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: ProdutoPadraoSegmentoData }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [info, setInfo] = useState<ProdutoPadraoSegmentoData>(data ?? { ds_descricao: '', fis_segmentos: [] });
	const [errorMessage, setErrorMessage] = useState('');
	const [popover, setPopover] = useState(false);
	const [popover2, setPopover2] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInfo({ ...info, [e.target.id]: e.target.value });
	};

	const { data: segmentos, isFetching } = useQuery({
		queryKey: ['get-segmentos-empresa'],
		queryFn: getSegmentosEmpresas,
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	const { data: produtos } = useQuery({
		queryKey: ['get-tipos-produtos'],
		queryFn: getTiposProduto,
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	const { data: servicos } = useQuery({
		queryKey: ['get-tipos-servicos'],
		queryFn: getTiposServico,
		staleTime: 1000 * 60 * 5,
		enabled: open,
	});

	async function sendInformation() {
		setErrorMessage('');

		if (!info.ds_descricao) {
			setErrorMessage('Descrição é obrigatória.');
			return;
		}

		if (info.fis_segmentos.length === 0) {
			setErrorMessage('Selecione ao menos um segmento.');
			return;
		}

		const produtoSelecionado = produtos?.find((p: ProdutoPadraoSegmentoData) => p.id === info.id_sis_tipos_produto);
		const id_sis_tipos_servico = produtoSelecionado?.ds_codigo?.toLowerCase() !== '09' ? undefined : info.id_sis_tipos_servico;

		setIsLoading(true);

		const newInfo = {
			ds_descricao: info.ds_descricao,
			fis_segmentos: info.fis_segmentos.map((segmento) => segmento.id),
			id_sis_tipos_produto: info.id_sis_tipos_produto,
			id_sis_tipos_servico,
		};

		try {
			if (data?.id) {
				await updatePadraoSegmento(data?.id, newInfo);
			} else {
				await createPadraoSegmento(newInfo);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-itens-padroes-segmento'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			setInfo(data ?? { ds_descricao: '', fis_segmentos: [] });
			setOpen(false);
		}
	}

	useEffect(() => {
		setInfo(data ?? { ds_descricao: '', fis_segmentos: [] });
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
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} item padrão</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					<div className='grid gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='ds_descricao'>Descrição</Label>
							<Input id='ds_descricao' defaultValue={info.ds_descricao} type='text' onChange={handleChange} disabled={isLoading} />
						</div>
						<div className='grid gap-2'>
							<Label>Segmento</Label>
							{isFetching ? (
								<Skeleton className='h-9 w-full' />
							) : (
								<MultiSelector
									values={info.fis_segmentos.map((segmento) => segmento.id)}
									onValuesChange={(values) => {
										setInfo({
											...info,
											fis_segmentos: values.map((id) => {
												const segmentoFound = segmentos?.find((seg: SegmentosEmpresasData) => seg.id === id);
												return { id, ds_descricao: segmentoFound?.ds_descricao || '' };
											}),
										});
									}}
									loop
									displayValue={(id) => {
										const found = segmentos?.find((seg: SegmentosEmpresasData) => seg.id === id);
										return found?.ds_descricao || id;
									}}
								>
									<MultiSelectorTrigger>
										<MultiSelectorInput placeholder='Selecione' />
									</MultiSelectorTrigger>
									<MultiSelectorContent>
										<MultiSelectorList>
											{segmentos?.map((segmento: SegmentosEmpresasData) => (
												<MultiSelectorItem key={segmento.id} value={segmento.id!} itemId={segmento.id!}>
													{segmento.ds_descricao}
												</MultiSelectorItem>
											))}
										</MultiSelectorList>
									</MultiSelectorContent>
								</MultiSelector>
							)}
						</div>
						<div className='grid gap-2'>
							<Label>Tipo de produto</Label>
							<Popover modal={true} open={popover} onOpenChange={setPopover}>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										disabled={isFetching || isLoading}
										role='combobox'
										aria-expanded={open}
										className='justify-between truncate'
									>
										{info.id_sis_tipos_produto
											? produtos?.find((p: ProdutoPadraoSegmentoData) => p.id === info.id_sis_tipos_produto)?.ds_descricao
											: isFetching
												? 'Carregando...'
												: 'Selecione um tipo...'}
										<ChevronsUpDown className='opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
									<Command
										filter={(value, search) => {
											if (
												produtos
													?.find((p: ProdutoPadraoSegmentoData) => p.id === value)
													?.ds_descricao?.toLowerCase()
													.includes(search)
											)
												return 1;
											if (
												produtos
													?.find((p: ProdutoPadraoSegmentoData) => p.id === value)
													?.ds_codigo?.toLowerCase()
													.includes(search)
											)
												return 1;

											return 0;
										}}
									>
										<CommandInput placeholder='Selecione um tipo...' />
										<CommandList>
											<CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
											<CommandGroup>
												{produtos?.map((p: ProdutoPadraoSegmentoData) => (
													<CommandItem
														key={p.id}
														value={p.id}
														onSelect={(currentValue) => {
															setInfo({ ...info, id_sis_tipos_produto: currentValue });
															setPopover(false);
														}}
													>
														{p.ds_codigo} - {p.ds_descricao}
														<Check
															className={cn('ml-auto', info.id_sis_tipos_produto === p.id ? 'opacity-100' : 'opacity-0')}
														/>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
						{produtos?.find((p: ProdutoPadraoSegmentoData) => p.id === info.id_sis_tipos_produto)?.ds_codigo?.toLowerCase() ==
							'09' && (
							<div className='grid gap-2'>
								<Label>Tipo de serviço</Label>
								<Popover modal={true} open={popover2} onOpenChange={setPopover2}>
									<PopoverTrigger asChild>
										<Button
											variant='outline'
											disabled={isFetching || isLoading}
											role='combobox'
											aria-expanded={open}
											className='justify-between truncate'
										>
											{info.id_sis_tipos_servico
												? servicos?.find((p: ProdutoPadraoSegmentoData) => p.id === info.id_sis_tipos_servico)?.ds_descricao
												: isFetching
													? 'Carregando...'
													: 'Selecione um tipo...'}
											<ChevronsUpDown className='opacity-50' />
										</Button>
									</PopoverTrigger>
									<PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
										<Command
											filter={(value, search) => {
												if (
													servicos
														?.find((p: ProdutoPadraoSegmentoData) => p.id === value)
														?.ds_descricao?.toLowerCase()
														.includes(search)
												)
													return 1;
												if (
													servicos
														?.find((p: ProdutoPadraoSegmentoData) => p.id === value)
														?.ds_codigo?.toLowerCase()
														.includes(search)
												)
													return 1;

												return 0;
											}}
										>
											<CommandInput placeholder='Selecione um tipo...' />
											<CommandList>
												<CommandEmpty>Nenhum tipo encontrada.</CommandEmpty>
												<CommandGroup>
													{servicos?.map((p: ProdutoPadraoSegmentoData) => (
														<CommandItem
															key={p.id}
															value={p.id}
															onSelect={(currentValue) => {
																setInfo({ ...info, id_sis_tipos_servico: currentValue });
																setPopover(false);
															}}
														>
															{p.ds_codigo} - {p.ds_descricao}
															<Check
																className={cn('ml-auto', info.id_sis_tipos_servico === p.id ? 'opacity-100' : 'opacity-0')}
															/>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						)}
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

function HandleDelete({ data }: { data: ProdutoPadraoSegmentoData }) {
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
			await deletePadraoSegmento(data?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-itens-padroes-segmento'] });
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
