'use client';
import { ArrowUpDown, SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompanyContext } from '@/context/company-context';
import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IDFe, IDfesParams, ITransporteDFe } from '@/interfaces/faturamento/transporte/dfe';
import { getDfes } from '@/services/api/transporte';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import FilterDfe from '../Dfe/FilterDfe';

interface IPropsTable {
	invoice: IDFe[];
	setInvoice: React.Dispatch<React.SetStateAction<IDFe[]>>;
}

export default function TableNfe({ invoice, setInvoice }: IPropsTable) {
	const { state: empresa_id } = useCompanyContext();
	const [filter, setFilter] = useState<IDfesParams>({
		id: empresa_id,
		page: 1,
		pageSize: 100,
		type: undefined,
		search: '',
		sortBy: 'dt_created',
		sortOrder: 'desc',
		status: 'INTEGRADO',
		emit: true,
	});

	const deferredSearch = useDeferredValue(filter.search);

	const deferredFilter = {
		...filter,
		search: deferredSearch,
	};

	const {
		data: items,
		isLoading,
		isFetching,
	} = useQuery<ITransporteDFe>({
		queryKey: ['dfes', deferredFilter],
		queryFn: () => getDfes(deferredFilter),
		staleTime: 1000 * 60 * 60,
	});

	const data = items?.data;

	const toggleInvoice = (cte: IDFe, checked: boolean) => {
		if (checked) {
			setInvoice((prev) => [...prev, cte]);
		} else {
			setInvoice((prev) => prev.filter((item) => item.id !== cte.id));
		}
	};

	const toggleAll = (checked: boolean, list: IDFe[]) => {
		if (checked) {
			setInvoice((prev) => {
				const newItems = list.filter((item) => !prev.some((p) => p.id === item.id));
				return [...prev, ...newItems];
			});
		} else {
			setInvoice((prev) => prev.filter((item) => !list.some((l) => l.id === item.id)));
		}
	};

	const handleSearchChange = (value: string) => {
		setFilter((prev) => ({
			...prev,
			search: value,
			page: 1,
		}));
	};

	const filteredCTE = data || [];
	const allFilteredSelected = filteredCTE.length > 0 && filteredCTE.every((cte) => invoice.some((item) => item.id === cte.id));

	const isTyping = filter.search !== deferredSearch;

	return (
		<>
			<div className='flex gap-3'>
				<div className='relative col-span-5 h-10 flex-1'>
					<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
					<Input
						placeholder='Pesquisar'
						value={filter.search}
						onChange={(e) => handleSearchChange(e.target.value)}
						className='mr-2 pl-8'
					/>
					{isTyping && <span className='text-muted-foreground absolute top-[45%] right-2 -translate-y-1/2 text-xs'>Digitando...</span>}
				</div>
				<FilterDfe filter={filter} setFilter={setFilter} />
			</div>

			<div className='mt-4 w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader className='bg-background sticky top-0 z-10'>
						<TableRow>
							<TableHead className='w-8'>
								<Checkbox
									checked={allFilteredSelected}
									onCheckedChange={(checked) => toggleAll(!!checked, filteredCTE)}
									aria-label='Select all'
								/>
							</TableHead>
							<TableHead className=''>Tipo</TableHead>
							<TableHead className='min-w-30'>
								<Button
									size='sm'
									className={
										'text-muted-foreground -ml-3 flex h-8 w-full justify-between text-xs hover:bg-transparent dark:hover:bg-transparent'
									}
									variant='ghost'
									onClick={() => {
										setFilter({
											...filter,
											sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
										});
									}}
								>
									Data emissão
									<ArrowUpDown />
								</Button>
							</TableHead>
							<TableHead className='w-1/2'>Remetente</TableHead>
							<TableHead className='w-1/2'>Destinatário</TableHead>
							<TableHead className='w-1/3'>Valor frete</TableHead>
							<TableHead className=''>
								<Button
									size='sm'
									className={
										'text-muted-foreground -ml-2 flex h-8 w-full justify-between text-xs hover:bg-transparent dark:hover:bg-transparent'
									}
									variant='ghost'
									onClick={() => {
										setFilter({
											...filter,
											sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
											sortBy: 'valorTotal',
										});
									}}
								>
									Valor carga
									<ArrowUpDown />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									size='sm'
									className={
										'text-muted-foreground -ml-2 flex h-8 w-full justify-between text-xs hover:bg-transparent dark:hover:bg-transparent'
									}
									variant='ghost'
									onClick={() => {
										setFilter({
											...filter,
											sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
											sortBy: 'ds_controle',
										});
									}}
								>
									Nº controle
									<ArrowUpDown />
								</Button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading || isFetching ? (
							<TableRow>
								<TableCell colSpan={8} className='text-center'>
									Carregando...
								</TableCell>
							</TableRow>
						) : filteredCTE.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className='text-center'>
									Nenhum registro encontrado
								</TableCell>
							</TableRow>
						) : (
							filteredCTE.map((cte) => (
								<TableRow key={cte.id}>
									<TableCell>
										<Checkbox
											checked={invoice.some((item) => item.id === cte.id)}
											onCheckedChange={(checked) => toggleInvoice(cte, !!checked)}
											aria-label='Selecionar NF-e'
										/>
									</TableCell>
									<TableCell>
										<Badge variant={cte.ds_tipo === 'NFE' ? 'successTwo' : 'transit'} className='border-transparent px-2 py-1'>
											{cte.ds_tipo === 'NFE' ? 'NFe' : 'CTe'}
										</Badge>
									</TableCell>
									<TableCell>{format(cte.dt_emissao, 'dd/MM/yyyy')}</TableCell>
									<TableCell>
										<p>{!!cte.nomeEmitente ? cte.nomeEmitente : '--'}</p>
										{!!cte.ds_documento_emitente ? `(${formatCnpjCpf(cte.ds_documento_emitente)})` : '--'}
									</TableCell>
									<TableCell>
										<p>{!!cte.nomeDestinatario ? cte.nomeDestinatario : '--'}</p>
										{!!cte.ds_documento_destinatario ? `(${formatCnpjCpf(cte.ds_documento_destinatario)})` : '--'}
									</TableCell>
									<TableCell>
										{!!cte.vFrete
											? cte.vFrete.toLocaleString('pt-br', {
													style: 'currency',
													currency: 'BRL',
												})
											: '--'}
									</TableCell>
									<TableCell>
										{!!cte.vCarga
											? cte.vCarga.toLocaleString('pt-br', {
													style: 'currency',
													currency: 'BRL',
												})
											: '--'}
									</TableCell>
									<TableCell>{!!cte?.ds_controle ? cte?.ds_controle : '--'}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
