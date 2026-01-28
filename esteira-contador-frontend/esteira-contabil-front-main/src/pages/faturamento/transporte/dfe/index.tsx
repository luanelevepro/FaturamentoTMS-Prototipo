import DashboardLayout from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { MousePointerClick, RefreshCw, SearchIcon, Save, Key } from 'lucide-react';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Addnfe from '@/components/general/transporte/AddNfe';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useCompanyContext } from '@/context/company-context';
import EmptyState from '@/components/states/empty-state';
import { IDfesParams, ITransporteDFe } from '@/interfaces/faturamento/transporte/dfe';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { getDfes, patchDfe } from '@/services/api/transporte';
import Link from 'next/link';
import ModalViewDfe from '@/components/general/transporte/ModalViewDfe';
import type { IDFe } from '@/interfaces/faturamento/transporte/dfe';

import { IPatchDfe } from '@/interfaces';
import FilterDfe from '@/components/general/transporte/Dfe/FilterDfe';
import { ModalSubcontratadoSwap } from '@/components/general/fiscal/documentos/modal-subcontratado-swap';
import { ModalSubcontratadoApproval } from '@/components/general/fiscal/documentos/modal-subcontratado-approval';
//import EmailNotSend from '@/components/general/transporte/EmailNotSend';

export default function TransporteCte() {
	const queryClient = useQueryClient();
	const { state: empresa_id } = useCompanyContext();
	const tableRef = useRef<DataTableRef<IDFe>>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: 'dt_emissao',
			desc: true,
		},
	]);
	const [filter, setFilter] = useState<IDfesParams>({
		id: empresa_id,
		page: 1,
		pageSize: 10,
		search: '',
		endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
		startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
		sortBy: 'dt_emissao',
		sortOrder: 'desc',
		type: undefined,
		status: ['INTEGRADO', 'IMPORTADO'],
		situacao: ['PENDENTE'],
		emit: false,
	});

	const { data, isFetching, refetch } = useQuery<ITransporteDFe>({
		queryKey: ['dfes', filter],
		queryFn: () => getDfes(filter),
		staleTime: 1000 * 60 * 60,
		retry: 1,
		placeholderData: keepPreviousData,
	});

	const hasAccessError = data?.error === 'Empresa does not have access to FATURAMENTO module or it is not activated';

	// Sincronizar sorting com filter
	useEffect(() => {
		if (sorting.length === 0) return;

		const [{ id: sortColumn, desc }] = sorting;
		setFilter((prev) => ({
			...prev,
			sortBy: sortColumn as IDfesParams['sortBy'],
			sortOrder: desc ? 'desc' : 'asc',
			page: 1,
		}));
	}, [sorting]);

	const handlePageChange = (newPage: number) => {
		setFilter((prev) => ({ ...prev, page: newPage }));
	};

	const handlePageSizeChange = (newSize: number) => {
		setFilter((prev) => ({ ...prev, pageSize: newSize, page: 1 }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const formData = new FormData(e.currentTarget as HTMLFormElement);

		const data = Object.fromEntries(formData.entries());
		const dataPayload: IPatchDfe = {
			id: String(data.cteId),
			controlNumber: Number(data.controlNumber),
		};

		try {
			await patchDfe(dataPayload);
			queryClient.invalidateQueries({ queryKey: ['dfes'] });
			toast.success('Dfe alterado com sucesso');
		} catch (error) {
			console.error('Erro ao salvar:', error);
			toast.error('Erro ao atualizar Dfe');
		} finally {
			setLoading(false);
		}
	};

	const columns: ColumnDef<IDFe>[] = [
		// {
		// 	id: 'select',
		// 	header: ({ table }) => (
		// 		<Checkbox
		// 			checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
		// 			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
		// 			aria-label='Select all'
		// 		/>
		// 	),
		// 	cell: ({ row }) => (
		// 		<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />
		// 	),
		// 	enableSorting: false,
		// 	enableHiding: false,
		// },
		{
			id: 'ds_tipo',
			accessorKey: 'ds_tipo',
			header: 'Tipo',
			cell: ({ row }) => (
				<Badge variant={row.getValue('ds_tipo') === 'NFE' ? 'successTwo' : 'transit'} className='border-transparent px-2 py-1'>
					{row.getValue('ds_tipo') === 'NFE' ? 'NFe' : 'CTe'}
				</Badge>
			),
		},
		{
			id: 'ds_status',
			accessorKey: 'ds_status',
			header: 'Status',
			cell: ({ row }) => {
				const status = row.getValue('ds_status') as string;
				const variant =
					status === 'PENDENTE' ? 'transit' : status === 'VINCULADO' ? 'pending' : status === 'CANCELADO' ? 'danger' : 'success';
				return (
					<Badge variant={variant} className='border-transparent px-2 py-1'>
						{status}
					</Badge>
				);
			},
		},
		{
			id: 'dt_emissao',
			accessorKey: 'dt_emissao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Data emissão' />,
			cell: ({ row }) => <div>{format(new Date(row.getValue('dt_emissao')), 'dd/MM/yyyy')}</div>,
		},
		{
			id: 'numero_serie',
			header: 'Nº/Série',
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<div className='flex flex-col gap-1'>
						<span className='text-sm font-semibold'>{cte.ds_numero}</span>
						<span className='text-muted-foreground text-xs'>Série: {cte.ds_serie}</span>
					</div>
				);
			},
		},
		{
			id: 'emitente',
			header: 'Emitente',
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<div className='w-1/3'>
						<p>{cte.nomeEmitente || '--'}</p>
						<span className='text-muted-foreground text-sm'>
							{cte.ds_documento_emitente ? `(${formatCnpjCpf(cte.ds_documento_emitente)})` : '--'}
						</span>
					</div>
				);
			},
		},
		{
			id: 'destinatario',
			header: 'Destinatário',
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<div className='w-1/3'>
						<p>{cte.nomeDestinatario || '--'}</p>
						<span className='text-muted-foreground text-sm'>
							{cte.ds_documento_destinatario ? `(${formatCnpjCpf(cte.ds_documento_destinatario)})` : '--'}
						</span>
					</div>
				);
			},
		},
		{
			id: 'vFrete',
			accessorKey: 'vFrete',
			header: 'Valor frete',
			cell: ({ row }) => {
				const valor = row.getValue('vFrete') as number;
				return valor ? valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) : '--';
			},
		},
		{
			id: 'valorTotal',
			accessorKey: 'vCarga',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Valor carga' />,
			cell: ({ row }) => {
				const valor = row.getValue('valorTotal') as number;
				return valor ? valor.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) : '--';
			},
		},
		{
			id: 'ds_controle',
			accessorKey: 'ds_controle',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nº controle' />,
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<form id='id' className='flex' onSubmit={handleSubmit}>
						<input type='hidden' name='cteId' value={cte.id} />
						<Input
							className='w-34 pr-8'
							id='controlNumber'
							name='controlNumber'
							type='number'
							defaultValue={cte?.ds_controle}
							placeholder={'Nº controle'}
						/>
						<Button tooltip='Salvar número de controle' variant='ghost' size='icon' className='-ml-9' disabled={loading}>
							<Save />
						</Button>
					</form>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const cte = row.original;
				return (
					<div className='flex justify-end'>
						{/* Se tem alteração pendente, mostra botão de aprovação */}
						{cte.alteracao_subcontratacao_pendente ? (
							<ModalSubcontratadoApproval documento={cte} onApprovalChange={() => refetch()} />
						) : (
							/* Se é subcontratada mas não tem alteração pendente, mostra botão de swap */
							cte.is_subcontratada && <ModalSubcontratadoSwap documento={cte} />
						)}
						<Button
							variant='ghost'
							size='icon'
							tooltip={cte?.ds_chave || 'Sem chave'}
							onClick={async (e) => {
								e.stopPropagation();
								const chaveText = cte?.ds_chave || '';
								if (!chaveText) {
									toast.error('Nenhuma chave disponível para copiar.');
									return;
								}
								try {
									await navigator.clipboard.writeText(String(chaveText));
									toast.success('Chave copiada para a área de transferência.');
								} catch (err) {
									console.error('Erro ao copiar chave:', err);
									toast.error('Erro ao copiar chave.');
								}
							}}
						>
							<Key className='h-4 w-4' />
						</Button>
						<ModalViewDfe obs={cte?.obs} />
					</div>
				);
			},
		},
	];

	return (
		<>
			<Head>
				<title>Transporte DFe | Esteira</title>
			</Head>
			<DashboardLayout title='Transporte' description='Visão Geral das Viagens e Cargas'>
				<h2 className='pt-3 pb-4 text-xl font-semibold'>DFe - Distribuição Fiscal Eletrônica</h2>
				<div className='flex gap-2'>
					<div className='relative col-span-5 h-10 flex-1'>
						<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
						<Input
							placeholder='Pesquisar por emitente ou destinatário'
							value={filter.search}
							onChange={(e) => setFilter({ ...filter, search: e.target.value })}
							className='mr-2 pl-8'
						/>
					</div>

					<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
						<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
					</Button>
					<FilterDfe filter={filter} setFilter={setFilter} />
					<MonthYearSelector
						showClearButton
						placeholder='Mês/Ano'
						className='max-w-32'
						selected={filter.startDate ? new Date(filter.startDate) : undefined}
						onSelect={(date) =>
							setFilter({
								...filter,
								startDate: date ? new Date(date.getFullYear(), date.getMonth(), 1) : undefined,
								endDate: date ? new Date(date.getFullYear(), date.getMonth() + 1, 0) : undefined,
								page: 1,
							})
						}
					/>
					{/* 	<FilterDrawer>
						<h1>Form dos filtros</h1>
						</FilterDrawer>
						<EmailNotSend /> */}
					<Addnfe />
				</div>
				{hasAccessError && (
					<Link
						href={'/faturamento/empresa'}
						className='bg-red-30 mt-4 flex w-full items-center justify-center gap-3 rounded-lg border p-4'
					>
						<p className='max-w-72 text-center'>Você precisa habilitar integração fiscal Se quiser ativar clique aqui!</p>
						<MousePointerClick />
					</Link>
				)}

				{!hasAccessError && empresa_id && !isFetching && (!data?.data || data.data.length === 0) && (
					<div className='mt-6'>
						<EmptyState label='Nenhum DFe registrado' />
					</div>
				)}

				{!hasAccessError && empresa_id && (isFetching || (data?.data && data.data.length > 0)) && (
					<DataTableDynamic
						pageParameters={{
							page: filter.page ?? 1,
							pageSize: filter.pageSize ?? 10,
							total: data?.pagination?.totalItems || 0,
							totalPages: data?.pagination?.totalPages || 1,
						}}
						onPageChange={handlePageChange}
						onPageSizeChange={handlePageSizeChange}
						ref={tableRef}
						columns={columns}
						data={data?.data || []}
						sorting={sorting}
						onSortingChange={setSorting}
						allIds={data?.allIds}
					/>
				)}
			</DashboardLayout>
		</>
	);
}
