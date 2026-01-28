import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import type { SortingState } from '@tanstack/react-table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
	ArrowRight,
	EllipsisVertical,
	RefreshCw,
	SearchIcon,
	Loader2,
	UploadIcon,
	FilePlus,
	ListFilter,
	Key,
	GitCommitHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { useLayout } from '@/context/layout-context';
import { Badge } from '@/components/ui/badge';
import { formatCnpjCpf } from '@/utils/format-cnpj-cpf';
import { formatBRL } from '@/utils/format-brazilian-currency';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import router from 'next/router';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
	downloadXmlNotaFiscalServico,
	integrarNotaFiscalServico,
	sincronizarDominio,
	getDocumentosSaidasFiscais,
} from '@/services/api/documentos-fiscais';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { DocumentViewer } from '@/components/viewers/document-viewer';
import { XMLUploader } from '@/components/general/fiscal/entradas/documento/xml-uploader';
// import { coletarNfseSieg } from '@/services/api/sieg-documentos-fiscais';
import { TimelineModal } from '@/components/ui/timeline-modal';
import { eventosToTimelineItems } from '@/components/helpers/timeline';
import {
	coletarCteSaidaSieg,
	coletarNfceSaidaSieg,
	coletarNfeSaidaSieg,
	coletarNfseSaidaSieg,
} from '@/services/api/sieg-documentos-fiscais';

interface DocumentosData {
	id: string;
	ds_tipo: string;
	ds_status: string;
	id_nfse: string;
	js_nfse: {
		ds_numero: string;
		ds_valor_servicos: string;
		ds_codigo_verificacao: string;
		dt_emissao: string;
		ds_documento_tomador: string;
		ds_razao_social_tomador: string;
	};
	id_nfe: string;
	js_nfe: {
		ds_numero: string;
		vl_nf: string;
		dt_emissao: string;
		ds_chave: string;
		ds_documento_destinatario: string;
		ds_razao_social_destinatario: string;
	};
	id_cte: string;
	js_cte: {
		ds_numero: string;
		vl_total: string;
		dt_emissao: string;
		ds_chave: string;
		ds_documento_destinatario: string;
		ds_razao_social_destinatario: string;
	};
	fis_evento: {
		cd_codigo_evento: string;
		ds_descricao_evento: string;
		ds_justificativa_evento: string;
		ds_protocolo: string;
		ds_status_retorno: string;
		ds_evento_id: string;
		dt_evento: string;
		dt_created: string;
	}[];
}

export const getDocumentoFiscalXML = async (id: string) => {
	try {
		const xmlString = await downloadXmlNotaFiscalServico(id);
		const blob = new Blob([xmlString], { type: 'application/xml' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `nfse-${id}.xml`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toast.success('XML baixado com sucesso!');
	} catch (error) {
		toast.error(`Erro ao baixar XML: ${String(error)}`);
	}
};

export default function FiscaSaidasPage() {
	const { state } = useCompanyContext();
	const { openDocumentViewer, documentViewerOpen, documentViewerWidth } = useLayout();
	const [selectedDocument, setSelectedDocument] = useState<DocumentosData | null>(null);
	const tableRef = useRef<DataTableRef<DocumentosData>>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [pageParameters, setPageParameters] = useState<{
		page: number;
		pageSize: number;
		orderBy: string;
		orderColumn: string;
		search: string;
		date: string; // store ISO string
		status?: string[];
		tipos?: string[];
	}>({ page: 1, pageSize: 10, orderBy: 'asc', orderColumn: 'dt_emissao', search: '', date: new Date().toISOString(), status: [] });
	const [integratingId, setIntegratingId] = useState<string | null>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const queryClient = useQueryClient();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<'status' | 'tipos'>('status');

	const safeDate = (isoOrAny: unknown) => {
		try {
			const d = new Date(String(isoOrAny || ''));
			if (Number.isNaN(d.getTime())) return new Date();
			return d;
		} catch {
			return new Date();
		}
	};

	const statusOptions = [
		'DIGITADO',
		'IMPORTADO',
		'EMITIDO',
		'AGUARDANDO_VALIDACAO',
		'AGUARDANDO_INTEGRACAO',
		'OPERACAO_NAO_REALIZADA',
		'INTEGRACAO_ESCRITA',
		'DIGITADO_FISCAL',
		'CONFERIDO_FISCAL',
		'CANCELADO',
		'ANULADO',
	];
	const typeOptions = ['NFE', 'NFCE', 'NFSE', 'CTE'];

	const handleSyncDominio = async () => {
		if (isSyncing) return;
		setIsSyncing(true);
		return toast.promise(
			(async () => {
				await sincronizarDominio(format(safeDate(pageParameters.date), 'yyyy-MM'));
				// await coletarNfseSieg(state, format(new Date(pageParameters.date), 'yyyy-MM'));
				await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada'] });
			})(),
			{
				loading: 'Sincronizando documentos...',
				success: () => {
					setIsSyncing(false);
					return 'Sincronização de documentos realizada com sucesso!';
				},
				error: (error) => {
					setIsSyncing(false);
					return `Erro ao sincronizar: ${error.message || error}`;
				},
			},
		);
	};

	const handleSyncDFE = async () => {
		if (isSyncing) return;
		setIsSyncing(true);
		return toast.promise(
			(async () => {
				await Promise.all([
					coletarNfeSaidaSieg(state, format(new Date(pageParameters.date), 'yyyy-MM')),
					coletarCteSaidaSieg(state, format(new Date(pageParameters.date), 'yyyy-MM')),
					coletarNfseSaidaSieg(state, format(new Date(pageParameters.date), 'yyyy-MM')),
				]);
				await coletarNfceSaidaSieg(state, format(safeDate(pageParameters.date), 'yyyy-MM'));
				await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
			})(),
			{
				loading: 'Sincronizando documentos...',
				success: () => {
					setIsSyncing(false);
					return 'Sincronização de documentos realizada com sucesso!';
				},
				error: (error) => {
					setIsSyncing(false);
					return `Erro ao sincronizar: ${error.message || error}`;
				},
			},
		);
	};

	const queryKey = ['get-documentos-fiscal-saida', pageParameters, state];

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: queryKey,
		queryFn: () => getDocumentosSaidasFiscais(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
		enabled: !!state,
	});

	const handleIntegrate = async (documentoId: string) => {
		if (!documentoId || integratingId) return;
		setIntegratingId(documentoId);
		try {
			await integrarNotaFiscalServico(documentoId);
			toast.success('Documento integrado com sucesso!');
			await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada'] });
		} catch (err) {
			toast.error(`Erro ao integrar documento: ${String(err)}`);
		} finally {
			setIntegratingId(null);
		}
	};

	const columns: ColumnDef<DocumentosData>[] = [
		{
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label='Select all'
				/>
			),
			cell: ({ row }) => (
				<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: 'dt_emissao',
			accessorKey: 'dt_emissao',
			accessorFn: (row) => row.js_nfse?.dt_emissao || row.js_nfe?.dt_emissao || row.js_cte?.dt_emissao,
			header: ({ column }) => <DataTableColumnHeader column={column} title='Emissão' />,
			cell: ({ row }) => {
				const iso = row.original.js_nfse?.dt_emissao || row.original.js_nfe?.dt_emissao || row.original.js_cte?.dt_emissao;
				if (!iso) return <div className='font-medium'>-</div>;
				// Formata a data ISO para o formato "dd/MM/yyyy"
				const datePart = iso.substring(0, 10);
				const [year, month, day] = datePart.split('-');
				const formatted = `${day}/${month}/${year}`;
				const numero = row.original.js_nfse?.ds_numero || row.original.js_nfe?.ds_numero || row.original.js_cte?.ds_numero || '-';

				return (
					<>
						<div className='font-medium'>{formatted}</div>
						<div className='text-xs opacity-80'>Nº: {numero || '-'}</div>
					</>
				);
			},
		},
		{
			id: 'destinatario',
			accessorKey: 'destinatario',
			accessorFn: (row) =>
				row.js_nfse?.ds_razao_social_tomador || row.js_nfe?.ds_razao_social_destinatario || row.js_cte?.ds_razao_social_destinatario,
			header: ({ column }) => <DataTableColumnHeader column={column} title='Destinatário' />,
			cell: ({ row }) => {
				const destinatario =
					row.original.js_nfse?.ds_razao_social_tomador ||
					row.original.js_nfe?.ds_razao_social_destinatario ||
					row.original.js_cte?.ds_razao_social_destinatario;
				return (
					<>
						<div className='font-medium'>{destinatario || 'N/A'}</div>
						<div className='text-xs opacity-80'>
							(
							{formatCnpjCpf(
								row.original.js_nfse?.ds_documento_tomador ||
									row.original.js_nfe?.ds_documento_destinatario ||
									row.original.js_cte?.ds_documento_destinatario ||
									'',
							)}
							)
						</div>
					</>
				);
			},
		},
		{
			id: 'ds_valor',
			accessorKey: 'ds_valor',
			accessorFn: (row) => row.js_nfse?.ds_valor_servicos || row.js_nfe?.vl_nf || row.js_cte?.vl_total,
			header: ({ column }) => <DataTableColumnHeader column={column} title='Valor' />,
			cell: ({ row }) => {
				const valor = row.original.js_nfse?.ds_valor_servicos || row.original.js_nfe?.vl_nf || row.original.js_cte?.vl_total;
				return <div className='font-medium'>{valor ? formatBRL(parseFloat(valor) / 100) : '0'}</div>;
			},
		},
		// {
		// 	id: 'ds_chave',
		// 	accessorKey: 'ds_chave',
		// 	accessorFn: (row) => row.js_nfse?.ds_codigo_verificacao || row.js_nfe?.ds_chave || row.js_cte?.ds_chave,
		// 	header: ({ column }) => <DataTableColumnHeader column={column} title='Cód. Verificação' />,
		// 	cell: ({ row }) => {
		// 		const chave = row.original.js_nfse?.ds_codigo_verificacao || row.original.js_nfe?.ds_chave || row.original.js_cte?.ds_chave;
		// 		return <div>{chave || '-'}</div>;
		// 	},
		// },
		{
			accessorKey: 'ds_tipo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo' />,
			cell: ({ row }) => {
				return (
					<Badge variant={'outline'} className='cursor-default'>
						{row.getValue('ds_tipo')}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'ds_status',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Situação' />,
			cell: ({ row }) => {
				const value = String(row.getValue('ds_status') || '').toUpperCase();
				const formattedValue = value.replace(/_/g, ' ');

				type BadgeVariant = 'info' | 'danger' | 'success' | 'default' | 'secondary' | 'outline' | 'warning' | 'pending';
				let variant: BadgeVariant = 'default';

				switch (value) {
					case 'DIGITADO':
						variant = 'info';
						break;
					case 'IMPORTADO':
						variant = 'info';
						break;
					case 'EMITIDO':
						variant = 'info';
						break;
					case 'AGUARDANDO_VALIDACAO':
						variant = 'warning';
						break;
					case 'AGUARDANDO_INTEGRACAO':
						variant = 'warning';
						break;
					case 'INTEGRACAO_ESCRITA':
						variant = 'warning';
						break;
					case 'DIGITADO_FISCAL':
						variant = 'success';
						break;
					case 'CONFERIDO_FISCAL':
						variant = 'success';
						break;
					case 'CANCELADO':
						variant = 'danger';
						break;
					case 'ANULADO':
						variant = 'danger';
						break;
					default:
						variant = 'default';
				}

				return (
					<Badge variant={variant} className='cursor-default text-nowrap'>
						{formattedValue || 'Desconhecido'}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'ds_manifestacao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Manifestação' />,
			accessorFn: (row) => {
				const eventos = row.fis_evento ?? row.fis_evento ?? [];
				if (!eventos.length) return null;

				const latest = eventos.reduce((max, cur) => {
					const curT = Date.parse(cur?.dt_evento ?? cur?.dt_created ?? '');
					const maxT = Date.parse(max?.dt_evento ?? max?.dt_created ?? '');
					return curT > maxT ? cur : max;
				});

				return latest?.ds_descricao_evento ?? latest?.cd_codigo_evento ?? null;
			},
			cell: ({ row }) => {
				const eventos = row.original.fis_evento ?? row.original.fis_evento ?? [];
				if (!eventos.length)
					return (
						<Badge variant='outline' className='cursor-default text-nowrap'>
							{'Sem eventos anexados'}
						</Badge>
					);

				const latest = eventos.reduce((max, cur) => {
					const curT = Date.parse(cur?.dt_evento ?? cur?.dt_created ?? '');
					const maxT = Date.parse(max?.dt_evento ?? max?.dt_created ?? '');
					return curT > maxT ? cur : max;
				});

				return (
					<Badge variant='outline' className='cursor-default text-nowrap'>
						{latest.ds_descricao_evento || latest.cd_codigo_evento || 'Evento'}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const documento = row.original;
				const isCurrentlyIntegrating =
					integratingId != null &&
					(integratingId === documento.id_nfse || integratingId === documento.id_nfe || integratingId === documento.id_cte);
				return (
					<div className='flex justify-end'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='flex h-8 w-8 p-0 align-middle' disabled={isCurrentlyIntegrating}>
									{isCurrentlyIntegrating ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<EllipsisVertical className='h-4 w-4' />
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuLabel>Ações</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{row.getValue('ds_status') === 'DIGITADO' && (
									<DropdownMenuItem
										className='hover:cursor-pointer'
										disabled={isCurrentlyIntegrating}
										onClick={() => {
											router.push(`/fiscal/saidas/editar/${documento.id_nfse || documento.id_nfe || documento.id_cte}`);
										}}
									>
										Editar nota
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									disabled={isCurrentlyIntegrating}
									onClick={() => {
										getDocumentoFiscalXML(documento.id_nfse || documento.id_nfe || documento.id_cte);
									}}
									className='hover:cursor-pointer'
								>
									Baixar XML
								</DropdownMenuItem>
								{(row.getValue('ds_status') === 'DIGITADO' || row.getValue('ds_status') === 'IMPORTADO') && (
									<DropdownMenuItem
										onClick={() => handleIntegrate(documento.id_nfse || documento.id_nfe || documento.id_cte)}
										className='hover:cursor-pointer'
										disabled={isCurrentlyIntegrating}
									>
										{isCurrentlyIntegrating ? (
											<>
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												Integrando...
											</>
										) : (
											'Integrar Documento'
										)}
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							variant='ghost'
							tooltip={
								row.original.js_nfse?.ds_codigo_verificacao ||
								row.original.js_nfe?.ds_chave ||
								row.original.js_cte?.ds_chave ||
								'Sem chave'
							}
						>
							<Key />
						</Button>
						<TimelineModal
							items={eventosToTimelineItems(row.original.fis_evento, row.original)}
							title='Timeline do Documento'
							triggerText='Timeline'
						>
							<Button variant='ghost' tooltip='Visualizar timeline' className='flex h-8 w-8 p-0 align-middle'>
								<GitCommitHorizontal />
							</Button>
						</TimelineModal>
						<Button
							variant='ghost'
							tooltip='Visualizar'
							disabled={isCurrentlyIntegrating}
							onClick={() => {
								setSelectedDocument(documento);
								openDocumentViewer();
							}}
							className='flex h-8 w-8 p-0 align-middle'
						>
							<ArrowRight className='h-4 w-4' />
						</Button>
					</div>
				);
			},
		},
	];

	useEffect(() => {
		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
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

	const handlePageChange = (newPage: number) => {
		if (newPage < 1) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	if (isError && !isFetching) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	const notasData = data?.notas || [];

	return (
		<>
			<Head>
				<title>Saídas | Esteira</title>
			</Head>

			<div
				className='transition-all duration-300 ease-in-out'
				style={{
					marginRight: documentViewerOpen ? `${documentViewerWidth}px` : '0px',
				}}
			>
				<DashboardLayout title='Saídas' description='Gerenciamento de documentos fiscais.'>
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
							<Button
								tooltip='Atualizar'
								variant='outline'
								size='icon'
								disabled={isFetching || !!integratingId || !state}
								onClick={() => refetch()}
							>
								<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
							</Button>
							<MonthYearSelector
								showClearButton
								placeholder='Mês/Ano'
								className='max-w-32'
								selected={safeDate(pageParameters.date)}
								onSelect={(date) => setPageParameters((prev) => ({ ...prev, date: date?.toISOString() || '', page: 1 }))}
							/>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant={'outline'} size={'icon'} className='aspect-square'>
										<EllipsisVertical className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem className='hover:cursor-pointer' onClick={() => router.push('/fiscal/entradas/novo')}>
										<FilePlus />
										Novo documento
									</DropdownMenuItem>
									<XMLUploader>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()} className='hover:cursor-pointer'>
											<UploadIcon />
											Importar XML
										</DropdownMenuItem>
									</XMLUploader>
									<DropdownMenuItem
										className='hover:cursor-pointer'
										disabled={isFetching || isSyncing}
										onClick={handleSyncDominio}
									>
										<RefreshCw className={isSyncing ? 'animate-spin' : ''} />
										Sincronizar documentos
									</DropdownMenuItem>
									<DropdownMenuItem className='hover:cursor-pointer' disabled={isFetching || isSyncing} onClick={handleSyncDFE}>
										<RefreshCw className={isSyncing ? 'animate-spin' : ''} />
										Sincronizar DFE
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{/* Dropdown de filtros */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='icon' tooltip='Filtrar'>
										<ListFilter className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent align='end' className='w-64 p-0'>
									{(() => {
										// Mapeia dados conforme a aba ativa
										const cfg =
											activeTab === 'status'
												? {
														label: 'Filtrar Status',
														options: statusOptions,
														selected: selectedStatus,
														setSelected: setSelectedStatus,
														paramKey: 'status' as const,
													}
												: {
														label: 'Filtrar Tipos',
														options: typeOptions,
														selected: selectedTypes,
														setSelected: setSelectedTypes,
														paramKey: 'tipos' as const,
													};

										return (
											<div className='flex flex-col'>
												{/* Header das abas */}
												<div className='flex border-b'>
													<button
														type='button'
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setActiveTab('status');
														}}
														className={`flex-1 px-3 py-2 text-sm ${
															activeTab === 'status' ? 'border-b-2 font-medium' : 'text-muted-foreground'
														}`}
													>
														Status
													</button>
													<button
														type='button'
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setActiveTab('tipos');
														}}
														className={`flex-1 px-3 py-2 text-sm ${
															activeTab === 'tipos' ? 'border-b-2 font-medium' : 'text-muted-foreground'
														}`}
													>
														Tipos
													</button>
												</div>

												{/* Conteúdo da aba */}
												<div className='p-2'>
													<DropdownMenuLabel>{cfg.label}</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<div className='max-h-64 overflow-auto pr-1'>
														{cfg.options.map((opt: string) => (
															<DropdownMenuItem
																key={`${cfg.paramKey}-${opt}`}
																onSelect={(e) => e.preventDefault()}
																className='flex items-center gap-2'
															>
																<Checkbox
																	checked={cfg.selected.includes(opt)}
																	onCheckedChange={(checked) => {
																		cfg.setSelected((prev: string[]) =>
																			checked ? [...prev, opt] : prev.filter((s) => s !== opt),
																		);
																		const currentFilters = (pageParameters[cfg.paramKey] || []) as string[];
																		const next = checked
																			? [...currentFilters, opt]
																			: currentFilters.filter((s: string) => s !== opt);
																		setPageParameters((prev) => ({ ...prev, [cfg.paramKey]: next, page: 1 }));
																	}}
																/>
																<span>{opt.replace(/_/g, ' ')}</span>
															</DropdownMenuItem>
														))}
													</div>
													<DropdownMenuSeparator />
													{/* Selecionar todos da aba ativa */}
													<DropdownMenuItem
														onSelect={(e) => {
															e.preventDefault();
															// marca todos os options da aba ativa
															cfg.setSelected([...cfg.options]);
															setPageParameters((prev) => ({ ...prev, [cfg.paramKey]: [...cfg.options], page: 1 }));
														}}
														className='hover:cursor-pointer'
													>
														Selecionar todos
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={(e) => {
															e.preventDefault();
															setSelectedStatus?.([]);
															setSelectedTypes?.([]);
															setPageParameters((prev) => ({ ...prev, status: [], tipos: [], page: 1 }));
														}}
														className='text-red-600 hover:bg-red-100'
													>
														Limpar todos os filtros
													</DropdownMenuItem>
												</div>
											</div>
										);
									})()}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{state && !isFetching && notasData.length === 0 && <EmptyState label='Nenhum documento fiscal de serviço encontrado.' />}

						{state && (isFetching || notasData.length > 0) && (
							<DataTableDynamic
								pageParameters={{
									page: pageParameters.page,
									pageSize: pageParameters.pageSize,
									total: data?.total || 0,
									totalPages: data?.totalPages || 1,
								}}
								onPageChange={handlePageChange}
								onPageSizeChange={(newSize) => setPageParameters((prev) => ({ ...prev, pageSize: newSize, page: 1 }))}
								ref={tableRef}
								columns={columns}
								data={data?.notas || []}
								sorting={sorting}
								onSortingChange={setSorting}
							/>
						)}
					</div>
				</DashboardLayout>
			</div>

			<DocumentViewer documento={selectedDocument} />
		</>
	);
}
