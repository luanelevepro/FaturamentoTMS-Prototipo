import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { ListFilter, Pencil, Plus, RefreshCw, SearchIcon, Trash } from 'lucide-react';
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
import { createCFOP, deleteCFOP, getCFOP, updateCFOP } from '@/services/api/sistema';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface CFOPData {
	id?: string;
	ds_descricao: string;
	ds_codigo: string;
	fl_fit_entrada?: boolean;
	fl_fit_saida?: boolean;
	fl_fit_cte?: boolean;
	fl_fit_nfe?: boolean;
}

const columns: ColumnDef<CFOPData>[] = [
	{
		accessorKey: 'ds_codigo',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Codigo' />,
	},
	{
		accessorKey: 'ds_descricao',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Descrição' />,
	},
	{
		accessorKey: 'fl_fit_entrada',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Entrada' />,
		cell: ({ row }) => {
			const value = row.getValue('fl_fit_entrada');
			return value ? <Badge variant='success'>Sim</Badge> : <Badge variant='outline'>Não</Badge>;
		},
	},
	{
		accessorKey: 'fl_fit_saida',
		header: ({ column }) => <DataTableColumnHeader column={column} title='Saída' />,
		cell: ({ row }) => {
			const value = row.getValue('fl_fit_saida');
			return value ? <Badge variant='success'>Sim</Badge> : <Badge variant='outline'>Não</Badge>;
		},
	},
	{
		accessorKey: 'fl_fit_cte',
		header: ({ column }) => <DataTableColumnHeader column={column} title='CT-e' />,
		cell: ({ row }) => {
			const value = row.getValue('fl_fit_cte');
			return value ? <Badge variant='success'>Sim</Badge> : <Badge variant='outline'>Não</Badge>;
		},
	},
	{
		accessorKey: 'fl_fit_nfe',
		header: ({ column }) => <DataTableColumnHeader column={column} title='NF-e' />,
		cell: ({ row }) => {
			const value = row.getValue('fl_fit_nfe');
			return value ? <Badge variant='success'>Sim</Badge> : <Badge variant='outline'>Não</Badge>;
		},
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

export default function CadastroCFOPPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedFits, setSelectedFits] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<'operacao' | 'documento'>('operacao');

	const operacaoOptions = [
		{ key: 'entrada', label: 'Entrada' },
		{ key: 'saida', label: 'Saída' },
	];

	const documentoOptions = [
		{ key: 'nfe', label: 'NF-e' },
		{ key: 'cte', label: 'CT-e' },
	];

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: ['get-cfop'],
		queryFn: getCFOP,
		staleTime: 1000 * 60 * 5,
	});

	const filteredData = useMemo(() => {
		if (!data) return [];

		return data.filter((item: CFOPData) => {
			// Filtro de busca por texto
			const matchesSearch = Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()));

			// Filtro por fits selecionados
			if (selectedFits.length === 0) return matchesSearch;

			const fitFilters: { [key: string]: boolean | undefined } = {
				entrada: item.fl_fit_entrada,
				saida: item.fl_fit_saida,
				cte: item.fl_fit_cte,
				nfe: item.fl_fit_nfe,
			};

			const matchesFit = selectedFits.some((fit) => fitFilters[fit]);
			return matchesSearch && matchesFit;
		});
	}, [data, searchTerm, selectedFits]);

	if (isError) {
		toast.error(error?.message || 'Erro ao carregar.');
	}

	return (
		<>
			<Head>
				<title>Cadastro de CFOP | Esteira</title>
			</Head>
			<DashboardLayout title='CFOP' description='Gerencie o cadastro de CFOP.'>
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

						{/* Dropdown de filtros */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='icon' tooltip='Filtrar'>
									<ListFilter className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent align='end' className='w-72 p-0'>
								<div className='flex flex-col'>
									{/* Abas */}
									<div className='flex border-b'>
										<button
											onClick={() => setActiveTab('operacao')}
											className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
												activeTab === 'operacao'
													? 'border-primary text-primary border-b-2'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Operação
										</button>
										<button
											onClick={() => setActiveTab('documento')}
											className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
												activeTab === 'documento'
													? 'border-primary text-primary border-b-2'
													: 'text-muted-foreground hover:text-foreground'
											}`}
										>
											Documento
										</button>
									</div>

									{/* Conteúdo - Aba Operação */}
									{activeTab === 'operacao' && (
										<div className='p-2'>
											<DropdownMenuLabel>Tipo de Operação</DropdownMenuLabel>
											<DropdownMenuSeparator />

											<div className='max-h-64 overflow-auto pr-1'>
												{operacaoOptions.map((opt) => (
													<DropdownMenuItem
														key={opt.key}
														onSelect={(e) => e.preventDefault()}
														className='flex items-center gap-2'
													>
														<Checkbox
															checked={selectedFits.includes(opt.key)}
															onCheckedChange={(checked) => {
																setSelectedFits((prev) =>
																	checked ? [...prev, opt.key] : prev.filter((s) => s !== opt.key),
																);
															}}
														/>
														<span>{opt.label}</span>
													</DropdownMenuItem>
												))}
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedFits((prev) => {
														const keys = operacaoOptions.map((o) => o.key);
														return Array.from(new Set([...prev, ...keys]));
													});
												}}
												className='hover:cursor-pointer'
											>
												Selecionar todos
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedFits((prev) => prev.filter((s) => !['entrada', 'saida'].includes(s)));
												}}
												className='text-red-600 hover:bg-red-100'
											>
												Limpar filtros
											</DropdownMenuItem>
										</div>
									)}

									{/* Conteúdo - Aba Documento */}
									{activeTab === 'documento' && (
										<div className='p-2'>
											<DropdownMenuLabel>Tipo de Documento</DropdownMenuLabel>
											<DropdownMenuSeparator />

											<div className='max-h-64 overflow-auto pr-1'>
												{documentoOptions.map((opt) => (
													<DropdownMenuItem
														key={opt.key}
														onSelect={(e) => e.preventDefault()}
														className='flex items-center gap-2'
													>
														<Checkbox
															checked={selectedFits.includes(opt.key)}
															onCheckedChange={(checked) => {
																setSelectedFits((prev) =>
																	checked ? [...prev, opt.key] : prev.filter((s) => s !== opt.key),
																);
															}}
														/>
														<span>{opt.label}</span>
													</DropdownMenuItem>
												))}
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedFits((prev) => {
														const keys = documentoOptions.map((o) => o.key);
														return Array.from(new Set([...prev, ...keys]));
													});
												}}
												className='hover:cursor-pointer'
											>
												Selecionar todos
											</DropdownMenuItem>
											<DropdownMenuItem
												onSelect={(e) => {
													e.preventDefault();
													setSelectedFits((prev) => prev.filter((s) => !['nfe', 'cte'].includes(s)));
												}}
												className='text-red-600 hover:bg-red-100'
											>
												Limpar filtros
											</DropdownMenuItem>
										</div>
									)}
								</div>
							</DropdownMenuContent>
						</DropdownMenu>

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
							<EmptyState label='Nenhum registro encontrado.' />
						)
					) : (
						<DataTable columns={columns} data={filteredData || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}

function HandleInsert({ children, data }: { children: React.ReactNode; data?: CFOPData }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [info, setInfo] = useState<CFOPData>(
		data ?? {
			ds_descricao: '',
			ds_codigo: '',
			fl_fit_entrada: false,
			fl_fit_saida: false,
			fl_fit_cte: false,
			fl_fit_nfe: false,
		},
	);
	const [errorMessage, setErrorMessage] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInfo({ ...info, [e.target.id]: e.target.value });
	};

	const handleCheckboxChange = (field: string, checked: boolean) => {
		setInfo({ ...info, [field]: checked });
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

		if (!info.fl_fit_entrada && !info.fl_fit_saida && !info.fl_fit_cte && !info.fl_fit_nfe) {
			setErrorMessage('Selecione pelo menos um tipo de operação ou documento.');
			return;
		}

		setIsLoading(true);

		try {
			if (data?.id) {
				await updateCFOP(data?.id, info);
			} else {
				await createCFOP(info);
			}
			await queryClient.invalidateQueries({ queryKey: ['get-cfop'] });
			toast.success('Salvo com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro ao salvar.');
		} finally {
			setIsLoading(false);
			setInfo(
				data ?? {
					ds_descricao: '',
					ds_codigo: '',
					fl_fit_entrada: false,
					fl_fit_saida: false,
					fl_fit_cte: false,
					fl_fit_nfe: false,
				},
			);
			setOpen(false);
		}
	}

	useEffect(() => {
		setInfo(
			data ?? {
				ds_descricao: '',
				ds_codigo: '',
				fl_fit_entrada: false,
				fl_fit_saida: false,
				fl_fit_cte: false,
				fl_fit_nfe: false,
			},
		);
	}, [data]);

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();
		sendInformation();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-h-screen overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{data?.id ? 'Editar' : 'Adicionar'} CFOP</DialogTitle>
					<DialogDescription>Insira os dados para continuar.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='grid gap-4'>
					{/* Seção 1: Campos Básicos */}
					<div className='grid grid-cols-3 gap-4'>
						<div className='col-span-1 grid gap-2'>
							<Label htmlFor='ds_codigo'>Código tributação</Label>
							<Input id='ds_codigo' value={info.ds_codigo} type='text' onChange={handleChange} disabled={isLoading} />
						</div>
						<div className='col-span-2 grid gap-2'>
							<Label htmlFor='ds_descricao'>Descrição</Label>
							<Input id='ds_descricao' value={info.ds_descricao} type='text' onChange={handleChange} disabled={isLoading} />
						</div>
					</div>

					{/* Separador */}
					<Separator />

					{/* Seção 2: Tipo de Operação */}
					<div className='grid gap-3'>
						<Label className='text-sm font-medium'>Tipo de Operação</Label>
						<div className='grid gap-2 pl-4'>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='fl_fit_entrada'
									checked={info.fl_fit_entrada || false}
									onCheckedChange={(checked) => handleCheckboxChange('fl_fit_entrada', !!checked)}
									disabled={isLoading}
								/>
								<label
									htmlFor='fl_fit_entrada'
									className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									Entrada
								</label>
							</div>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='fl_fit_saida'
									checked={info.fl_fit_saida || false}
									onCheckedChange={(checked) => handleCheckboxChange('fl_fit_saida', !!checked)}
									disabled={isLoading}
								/>
								<label
									htmlFor='fl_fit_saida'
									className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									Saída
								</label>
							</div>
						</div>
					</div>

					{/* Separador */}
					<Separator />

					{/* Seção 3: Tipo de Documento */}
					<div className='grid gap-3'>
						<Label className='text-sm font-medium'>Tipo de Documento</Label>
						<div className='grid gap-2 pl-4'>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='fl_fit_cte'
									checked={info.fl_fit_cte || false}
									onCheckedChange={(checked) => handleCheckboxChange('fl_fit_cte', !!checked)}
									disabled={isLoading}
								/>
								<label
									htmlFor='fl_fit_cte'
									className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									CT-e
								</label>
							</div>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='fl_fit_nfe'
									checked={info.fl_fit_nfe || false}
									onCheckedChange={(checked) => handleCheckboxChange('fl_fit_nfe', !!checked)}
									disabled={isLoading}
								/>
								<label
									htmlFor='fl_fit_nfe'
									className='cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									NF-e
								</label>
							</div>
						</div>
					</div>

					{/* Mensagem de Erro */}
					{errorMessage && (
						<p className='text-sm text-red-600' role='alert'>
							{errorMessage}
						</p>
					)}

					{/* Botão de Envio */}
					<Button type='submit' disabled={isLoading} className='w-full'>
						{isLoading ? 'Salvando...' : 'Salvar'}
						{isLoading && <Icons.spinner className='ml-2 h-4 w-4 animate-spin' />}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function HandleDelete({ data }: { data: CFOPData }) {
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
			await deleteCFOP(data?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-cfop'] });
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
