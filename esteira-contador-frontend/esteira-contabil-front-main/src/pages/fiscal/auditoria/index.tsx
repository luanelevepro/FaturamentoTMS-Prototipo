import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	ChevronRight,
	Clock,
	Download,
	FileSearch,
	Info,
	ListFilter,
	Loader2,
	Mail,
	MoreVertical,
	PieChart as PieIcon,
	RefreshCw,
	SearchIcon,
	XCircle,
	DollarSign,
	Building,
} from 'lucide-react';

import SystemLayout from '@/components/layout/system-layout';
import { AuditoriaChart } from '@/components/general/fiscal/auditoria/auditoria-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { Badge } from '@/components/ui/badge';
import { DataTableDynamic } from '@/components/ui/data-table-dynamic';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { formatBRL } from '@/utils/format-brazilian-currency';
import {
	getDocumentosAuditoria,
	getEmpresasAuditoria,
	getEstatisticasGerais,
	getInconsistenciasDocumento,
	type AuditoriaStatusOperacional,
	type CriticidadeLevel,
	type EmpresaComEstatisticas,
	type FisAuditoriaDoc,
	type FisAuditoriaDocIncons,
	type TipoDocumento,
} from '@/services/api/auditoria-fiscal';

function StatusBadge({ status }: { status: AuditoriaStatusOperacional }) {
	const config = {
		ABERTA: { variant: 'destructive' as const, label: 'Aberta', icon: AlertCircle },
		EM_ANALISE: { variant: 'default' as const, label: 'Em Análise', icon: Clock },
		RESOLVIDA: { variant: 'secondary' as const, label: 'Resolvida', icon: CheckCircle2 },
		IGNORADA: { variant: 'outline' as const, label: 'Ignorada', icon: XCircle },
	};

	const { variant, label, icon: Icon } = config[status] || config.ABERTA;

	return (
		<Badge variant={variant} className='flex items-center gap-1.5 text-[11px] uppercase'>
			<Icon className='h-3.5 w-3.5' />
			{label}
		</Badge>
	);
}

function CriticidadeBadge({ criticidade }: { criticidade: CriticidadeLevel }) {
	const config: Record<CriticidadeLevel, { label: string; className: string }> = {
		CRITICA: { label: 'Crítica', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
		AVISO: { label: 'Aviso', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
		INFO: { label: 'Info', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
	};

	const cfg = config[criticidade];
	return <span className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${cfg.className}`}>{cfg.label}</span>;
}

function sortData<T>(rows: T[], sorting: SortingState, accessors: Record<string, (row: T) => unknown>) {
	if (!sorting.length) return rows;
	const [{ id, desc }] = sorting;
	const accessor = accessors[id];
	if (!accessor) return rows;
	return [...rows].sort((a, b) => {
		const va = accessor(a);
		const vb = accessor(b);
		if (va === vb) return 0;
		if (va === undefined || va === null) return 1;
		if (vb === undefined || vb === null) return -1;
		if (va > vb) return desc ? -1 : 1;
		if (va < vb) return desc ? 1 : -1;
		return 0;
	});
}

const statusOptions: AuditoriaStatusOperacional[] = ['ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'IGNORADA'];
const tipoOptions: TipoDocumento[] = ['NFE', 'NFSE', 'CTE', 'NFCE'];
const criticidadeOptions: Array<CriticidadeLevel | 'SEM_CRITICIDADE'> = ['CRITICA', 'AVISO', 'INFO', 'SEM_CRITICIDADE'];

const AuditoriaFiscalPage: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [empresaSorting, setEmpresaSorting] = useState<SortingState>([]);
	const [empresaPage, setEmpresaPage] = useState(1);
	const [empresaPageSize, setEmpresaPageSize] = useState(10);
	const [docsSorting, setDocsSorting] = useState<SortingState>([]);
	const [docPage, setDocPage] = useState(1);
	const [docPageSize, setDocPageSize] = useState(10);
	const [selectedDocumento, setSelectedDocumento] = useState<FisAuditoriaDoc | null>(null);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaComEstatisticas | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const [activeFilterTab, setActiveFilterTab] = useState<'situacao' | 'tipo' | 'criticidade'>('situacao');
	const [selectedStatus, setSelectedStatus] = useState<AuditoriaStatusOperacional[]>([]);
	const [selectedTipos, setSelectedTipos] = useState<TipoDocumento[]>([]);
	const [selectedCriticidade, setSelectedCriticidade] = useState<Array<CriticidadeLevel | 'SEM_CRITICIDADE'>>([]);

	const dateFilters = useMemo(() => {
		if (!selectedDate) return { dt_inicio: undefined, dt_fim: undefined };
		return {
			dt_inicio: startOfMonth(selectedDate).toISOString(),
			dt_fim: endOfMonth(selectedDate).toISOString(),
		};
	}, [selectedDate]);

	const {
		data: estatisticasGerais,
		isLoading: loadingStats,
		refetch: refetchStats,
		isFetching: isFetchingStats,
	} = useQuery({
		queryKey: ['auditoria-estatisticas-gerais'],
		queryFn: getEstatisticasGerais,
	});

	const {
		data: empresas = [],
		isLoading: loadingEmpresas,
		refetch: refetchEmpresas,
		isFetching: isFetchingEmpresas,
	} = useQuery({
		queryKey: ['auditoria-empresas'],
		queryFn: getEmpresasAuditoria,
	});

	const isEscritorio = empresas.length > 0;

	const {
		data: documentos = [],
		isLoading: loadingDocumentos,
		refetch: refetchDocumentos,
		isFetching: isFetchingDocumentos,
	} = useQuery({
		queryKey: ['auditoria-documentos', selectedEmpresa?.cnpj ?? 'all', dateFilters.dt_inicio, dateFilters.dt_fim],
		queryFn: () =>
			getDocumentosAuditoria({
				dt_inicio: dateFilters.dt_inicio,
				dt_fim: dateFilters.dt_fim,
			}),
	});

	const isFetching = isFetchingStats || isFetchingEmpresas || isFetchingDocumentos;

	const { data: inconsistencias = [] } = useQuery({
		queryKey: ['auditoria-inconsistencias', selectedDocumento?.id],
		queryFn: () => (selectedDocumento ? getInconsistenciasDocumento(selectedDocumento.id) : Promise.resolve([])),
		enabled: !!selectedDocumento,
	});

	const empresasFiltradas = useMemo(() => {
		const lower = searchTerm.trim().toLowerCase();
		const hasSearch = lower.length > 0;

		// Calcular estatísticas de documentos por empresa baseado nos filtros aplicados
		const docsByEmpresa = new Map<string, { critica: number; total: number }>();
		documentos.forEach((d: FisAuditoriaDoc) => {
			if (!d.ds_cnpj_destinatario) return;

			// Aplicar filtros ao contar documentos por empresa
			if (selectedStatus.length && !selectedStatus.includes(d.status_operacional)) return;
			if (selectedTipos.length && !selectedTipos.includes(d.ds_tipo_doc as TipoDocumento)) return;
			const criticidade = d.nivel_criticidade_max || 'SEM_CRITICIDADE';
			if (selectedCriticidade.length && !selectedCriticidade.includes(criticidade)) return;
			if (selectedDate) {
				if (!d.dt_emissao) return;
				const dt = new Date(d.dt_emissao);
				if (dt.getMonth() !== selectedDate.getMonth() || dt.getFullYear() !== selectedDate.getFullYear()) return;
			}

			const key = d.ds_cnpj_destinatario;
			if (!docsByEmpresa.has(key)) {
				docsByEmpresa.set(key, { critica: 0, total: 0 });
			}
			const stats = docsByEmpresa.get(key)!;
			stats.total += 1;
			if (d.nivel_criticidade_max === 'CRITICA') {
				stats.critica += 1;
			}
		});

		return empresas.filter((e: EmpresaComEstatisticas) => {
			// Se houver termo de busca, mostrar independente de problemas
			if (hasSearch) {
				return e.nome.toLowerCase().includes(lower) || e.cnpj.includes(lower);
			}

			// Obter as estatísticas filtradas para esta empresa
			const filteredStats = docsByEmpresa.get(e.cnpj);

			// Sem busca: mostrar apenas empresas com documentos após aplicar filtros
			if (!filteredStats || filteredStats.total === 0) return false;

			return true;
		});
	}, [empresas, searchTerm, selectedStatus, selectedTipos, selectedCriticidade, selectedDate, documentos]);

	const empresasOrdenadas = useMemo(() => {
		const accessors: Record<string, (row: EmpresaComEstatisticas) => string | number> = {
			nome: (row) => row.nome,
			total_documentos: (row) => row.total_documentos,
			total_inconsistencias: (row) => row.total_inconsistencias,
			documentos_criticos: (row) => row.documentos_criticos,
			valor_total: (row) => row.valor_total,
		};
		return sortData(empresasFiltradas, empresaSorting, accessors);
	}, [empresasFiltradas, empresaSorting]);

	const empresasTotalPages = Math.ceil(empresasOrdenadas.length / empresaPageSize);
	const empresasPaginadas = useMemo(() => {
		const start = (empresaPage - 1) * empresaPageSize;
		return empresasOrdenadas.slice(start, start + empresaPageSize);
	}, [empresasOrdenadas, empresaPage, empresaPageSize]);

	const documentosFiltrados = useMemo(() => {
		const lower = searchTerm.trim().toLowerCase();
		return documentos.filter((d: FisAuditoriaDoc) => {
			if (selectedEmpresa && d.ds_cnpj_destinatario !== selectedEmpresa.cnpj) return false;
			if (selectedStatus.length && !selectedStatus.includes(d.status_operacional)) return false;
			if (selectedTipos.length && !selectedTipos.includes(d.ds_tipo_doc as TipoDocumento)) return false;
			const criticidade = d.nivel_criticidade_max || 'SEM_CRITICIDADE';
			if (selectedCriticidade.length && !selectedCriticidade.includes(criticidade)) return false;
			if (selectedDate) {
				if (!d.dt_emissao) return false;
				const dt = new Date(d.dt_emissao);
				if (dt.getMonth() !== selectedDate.getMonth() || dt.getFullYear() !== selectedDate.getFullYear()) return false;
			}
			if (!lower) return true;
			const chave = d.ds_chave || '';
			const tipo = d.ds_tipo_doc || '';
			const valor = (d.vl_documento ?? '').toString();
			return chave.toLowerCase().includes(lower) || tipo.toLowerCase().includes(lower) || valor.toLowerCase().includes(lower);
		});
	}, [documentos, searchTerm, selectedEmpresa, selectedStatus, selectedTipos, selectedCriticidade, selectedDate]);

	const documentosOrdenados = useMemo(() => {
		const accessors: Record<string, (row: FisAuditoriaDoc) => string | number | Date | undefined> = {
			emissao: (row) => (row.dt_emissao ? new Date(row.dt_emissao) : undefined),
			origem: (row) => (typeof row.js_meta?.origem === 'string' ? (row.js_meta.origem as string) : ''),
			tipo: (row) => row.ds_tipo_doc,
			valor: (row) => row.vl_documento || 0,
			situacao: (row) => row.status_operacional,
		};
		return sortData(documentosFiltrados, docsSorting, accessors);
	}, [documentosFiltrados, docsSorting]);

	const documentosPaginados = useMemo(() => {
		const start = (docPage - 1) * docPageSize;
		return documentosOrdenados.slice(start, start + docPageSize);
	}, [docPage, docPageSize, documentosOrdenados]);

	const documentosTotalPages = useMemo(
		() => Math.max(1, Math.ceil((documentosOrdenados.length || 1) / docPageSize)),
		[documentosOrdenados.length, docPageSize],
	);

	const documentoColumns: ColumnDef<FisAuditoriaDoc>[] = [
		{
			id: 'emissao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Emissão / Doc' />,
			cell: ({ row }) => (
				<div className='flex flex-col'>
					<span className='font-bold'>
						{row.original.dt_emissao ? format(new Date(row.original.dt_emissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
					</span>
					<span className='text-muted-foreground text-xs'>
						{row.original.ds_tipo_doc} {row.original.ds_chave?.substring(25, 34) || '-'}
					</span>
				</div>
			),
			accessorFn: (row) => (row.dt_emissao ? new Date(row.dt_emissao) : undefined),
			enableSorting: true,
		},
		{
			id: 'origem',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Origem' />,
			cell: ({ row }) => (
				<span className='text-muted-foreground text-sm'>
					{typeof row.original.js_meta?.origem === 'string' ? row.original.js_meta.origem : '-'}
				</span>
			),
			accessorFn: (row) => (typeof row.js_meta?.origem === 'string' ? row.js_meta.origem : ''),
			enableSorting: true,
		},
		{
			id: 'detalhes',
			header: 'Detalhes',
			cell: ({ row }) => (
				<span className='max-w-xs truncate text-xs'>
					{row.original.qtde_inconsistencias && row.original.qtde_inconsistencias > 0
						? `${row.original.qtde_inconsistencias} inconsistência(s) detectada(s)`
						: 'Documento OK'}
				</span>
			),
			enableSorting: false,
		},
		{
			id: 'valor',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Valor' />,
			cell: ({ row }) => (
				<span className='text-right font-bold'>{row.original.vl_documento ? formatBRL(row.original.vl_documento) : '-'}</span>
			),
			accessorFn: (row) => row.vl_documento || 0,
			enableSorting: true,
		},
		{
			id: 'tipo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo' />,
			cell: ({ row }) => (
				<Badge variant='outline' className='text-[10px] font-bold uppercase'>
					{row.original.ds_tipo_doc}
				</Badge>
			),
			accessorFn: (row) => row.ds_tipo_doc,
			enableSorting: true,
		},
		{
			id: 'situacao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Situação' />,
			cell: ({ row }) => <StatusBadge status={row.original.status_operacional} />,
			accessorFn: (row) => row.status_operacional,
			enableSorting: true,
		},
		{
			id: 'acoes',
			header: 'Ações',
			cell: ({ row }) => (
				<div className='flex items-center justify-end gap-2'>
					{row.original.status_tecnico === 'INCONSISTENTE' && (
						<Button size='sm' variant='default' onClick={() => handleOpenDetail(row.original)}>
							<FileSearch className='mr-1.5 h-3.5 w-3.5' />
							Analisar
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' size='icon' className='h-8 w-8'>
								<MoreVertical className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuLabel>Ações</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => handleOpenDetail(row.original)}>
								<FileSearch className='mr-2 h-4 w-4' />
								Ver Detalhes
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Download className='mr-2 h-4 w-4' />
								Baixar XML
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
			enableSorting: false,
		},
	];

	// Colunas para tabela de empresas (escritório)
	const empresaColumns: ColumnDef<EmpresaComEstatisticas>[] = [
		{
			id: 'nome',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Empresa / CNPJ' />,
			cell: ({ row }) => (
				<div className='flex flex-col'>
					<span className='text-sm font-bold'>{row.original.nome}</span>
					<span className='text-muted-foreground text-xs'>{row.original.cnpj}</span>
				</div>
			),
			accessorFn: (row) => row.nome,
			enableSorting: true,
		},
		{
			id: 'total_documentos',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Documentos' />,
			cell: ({ row }) => (
				<div className='text-center'>
					<span className='font-bold'>{row.original.total_documentos}</span>
				</div>
			),
			accessorFn: (row) => row.total_documentos,
			enableSorting: true,
		},
		{
			id: 'total_inconsistencias',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Inconsistências' />,
			cell: ({ row }) => (
				<div className='text-center'>
					{row.original.total_inconsistencias > 0 ? (
						<Badge variant='destructive' className='font-bold'>
							{row.original.total_inconsistencias}
						</Badge>
					) : (
						<span className='text-muted-foreground'>-</span>
					)}
				</div>
			),
			accessorFn: (row) => row.total_inconsistencias,
			enableSorting: true,
		},
		{
			id: 'documentos_criticos',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Críticos' />,
			cell: ({ row }) => (
				<div className='text-center'>
					{row.original.documentos_criticos > 0 ? (
						<Badge variant='destructive' className='text-[10px]'>
							{row.original.documentos_criticos} Críticos
						</Badge>
					) : (
						<span className='text-muted-foreground'>-</span>
					)}
				</div>
			),
			accessorFn: (row) => row.documentos_criticos,
			enableSorting: true,
		},
		{
			id: 'valor_total',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Valor Total' />,
			cell: ({ row }) => <span className='text-right font-medium'>{formatBRL(row.original.valor_total)}</span>,
			accessorFn: (row) => row.valor_total,
			enableSorting: true,
		},
		{
			id: 'acoes',
			header: 'Ações',
			cell: ({ row }) => (
				<div className='flex items-center justify-end'>
					<Button size='sm' variant='default' onClick={() => setSelectedEmpresa(row.original)}>
						Ver Detalhes
						<ChevronRight className='ml-1.5 h-3.5 w-3.5' />
					</Button>
				</div>
			),
			enableSorting: false,
		},
	];

	// Dados do gráfico principal
	const mainChartData = useMemo(() => {
		if (!estatisticasGerais) return [];
		return [
			{ name: 'Resolvidas', value: estatisticasGerais.porStatusOperacional.RESOLVIDA, color: '#10b981' },
			{ name: 'Abertas', value: estatisticasGerais.porStatusOperacional.ABERTA, color: '#ef4444' },
			{ name: 'Em Análise', value: estatisticasGerais.porStatusOperacional.EM_ANALISE, color: '#3b82f6' },
			{ name: 'Ignoradas', value: estatisticasGerais.porStatusOperacional.IGNORADA, color: '#6b7280' },
		];
	}, [estatisticasGerais]);

	// Dados do gráfico por empresa
	const handleRefresh = async () => {
		try {
			await Promise.all([refetchStats(), refetchEmpresas(), refetchDocumentos()]);
			toast.success('Dados atualizados');
		} catch {
			toast.error('Erro ao atualizar dados');
		}
	};

	const handleOpenDetail = (documento: FisAuditoriaDoc) => {
		setSelectedDocumento(documento);
		setDetailModalOpen(true);
	};

	const handleVoltar = () => {
		setSelectedEmpresa(null);
		setSearchTerm('');
	};

	return (
		<>
			<Head>
				<title>Auditorias Fiscais | Esteira Contábil</title>
			</Head>

			<SystemLayout>
				<div className='flex h-full flex-col'>
					{/* Header */}
					<div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
						<div className='flex h-16 items-center gap-4 px-6'>
							{isEscritorio && selectedEmpresa && (
								<Button variant='ghost' size='icon' onClick={handleVoltar}>
									<ArrowLeft className='h-4 w-4' />
								</Button>
							)}
							<div className='flex-1'>
								<h1 className='flex items-center gap-2 text-xl font-semibold tracking-tight'>
									Auditorias Fiscais
									{isEscritorio && selectedEmpresa && (
										<>
											<ChevronRight className='text-muted-foreground h-4 w-4' />
											<span className='text-base font-normal'>{selectedEmpresa.nome}</span>
										</>
									)}
								</h1>
								<p className='text-muted-foreground hidden text-xs sm:block'>
									{isEscritorio && !selectedEmpresa
										? 'Visão consolidada de empresas do escritório'
										: selectedEmpresa
											? 'Análise detalhada de inconsistências da empresa'
											: 'Gerenciamento de malhas fiscais internas e auditorias.'}
								</p>
							</div>
							<Button tooltip='Atualizar' variant='outline' size='icon' disabled={isFetching} onClick={handleRefresh}>
								<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
							</Button>
						</div>
					</div>

					{/* Toolbar */}
					<div className='flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4'>
						<div className='flex max-w-2xl min-w-[300px] flex-1 items-center gap-2'>
							<div className='relative flex-1'>
								<SearchIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
								<Input
									placeholder={
										isEscritorio && !selectedEmpresa
											? 'Pesquisar empresa por nome ou CNPJ...'
											: 'Pesquisar por documento, valor ou tipo...'
									}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='pl-9'
								/>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<MonthYearSelector
								showClearButton
								placeholder='Mês/Ano'
								className='max-w-32'
								selected={selectedDate}
								onSelect={(date) => {
									setSelectedDate(date || undefined);
									setDocPage(1);
								}}
							/>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='icon' aria-label='Filtrar'>
										<ListFilter className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-72 p-0'>
									{(() => {
										const cfg =
											activeFilterTab === 'situacao'
												? {
														label: 'Filtrar Situação',
														options: statusOptions as string[],
														selected: selectedStatus as string[],
														setSelected: setSelectedStatus as React.Dispatch<React.SetStateAction<string[]>>,
													}
												: activeFilterTab === 'criticidade'
													? {
															label: 'Filtrar Criticidade',
															options: criticidadeOptions as string[],
															selected: selectedCriticidade as string[],
															setSelected: setSelectedCriticidade as React.Dispatch<React.SetStateAction<string[]>>,
														}
													: {
															label: 'Filtrar Tipos',
															options: tipoOptions as string[],
															selected: selectedTipos as string[],
															setSelected: setSelectedTipos as React.Dispatch<React.SetStateAction<string[]>>,
														};

										return (
											<div className='flex flex-col'>
												<div className='flex border-b'>
													{[
														{ key: 'situacao', label: 'Situação' },
														{ key: 'tipo', label: 'Tipos' },
														{ key: 'criticidade', label: 'Criticidade' },
													].map((tab) => (
														<button
															key={tab.key}
															type='button'
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																setActiveFilterTab(tab.key as typeof activeFilterTab);
															}}
															className={`flex-1 px-3 py-2 text-sm ${
																activeFilterTab === tab.key ? 'border-b-2 font-medium' : 'text-muted-foreground'
															}`}
														>
															{tab.label}
														</button>
													))}
												</div>

												<div className='p-2'>
													<DropdownMenuLabel>{cfg.label}</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<div className='max-h-64 overflow-auto pr-1'>
														{cfg.options.map((opt: string) => (
															<DropdownMenuItem
																key={`${cfg.label}-${opt}`}
																onSelect={(e) => e.preventDefault()}
																className='flex items-center gap-2'
															>
																<Checkbox
																	checked={cfg.selected.includes(opt)}
																	onCheckedChange={(checked) => {
																		cfg.setSelected((prev: string[]) =>
																			checked ? [...prev, opt] : prev.filter((s) => s !== opt),
																		);
																		setDocPage(1);
																	}}
																/>
																<span>{opt.replace(/_/g, ' ')}</span>
															</DropdownMenuItem>
														))}
													</div>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onSelect={(e) => {
															e.preventDefault();
															cfg.setSelected([...cfg.options]);
															setDocPage(1);
														}}
														className='hover:cursor-pointer'
													>
														Selecionar todos
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={(e) => {
															e.preventDefault();
															setSelectedStatus([]);
															setSelectedTipos([]);
															setSelectedCriticidade([]);
															setDocPage(1);
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
					</div>

					{/* Content */}
					<ScrollArea className='flex-1'>
						<div className='space-y-6 p-6'>
							{/* Cards de Métricas */}
							<motion.div
								className='grid grid-cols-1 gap-6 lg:grid-cols-12'
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4 }}
							>
								{/* Gráfico */}
								<motion.div
									className='lg:col-span-5'
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.1 }}
								>
									<Card>
										<CardHeader>
											<CardTitle className='text-muted-foreground flex items-center justify-between text-sm font-semibold tracking-wider uppercase'>
												{'Status Geral da Auditoria'}
												<PieIcon className='h-4 w-4' />
											</CardTitle>
										</CardHeader>
										<CardContent>
											{loadingStats ? (
												<div className='flex h-[160px] items-center justify-center'>
													<Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
												</div>
											) : (
												<AuditoriaChart
													data={mainChartData}
													centerLabel={estatisticasGerais?.totalDocumentos || 0}
													centerSubLabel={'Documentos'}
												/>
											)}
										</CardContent>
									</Card>
								</motion.div>

								{/* Cards de Valor */}
								<motion.div
									className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-7'
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.4, delay: 0.2 }}
								>
									<Card>
										<CardContent className='pt-6'>
											<div className='flex items-center justify-between'>
												<div className='space-y-1'>
													<p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
														Valor Total em Risco
													</p>
													<p className='text-2xl font-bold'>{formatBRL(estatisticasGerais?.valorTotalRisco || 0)}</p>
													<div className='flex items-center gap-1 text-xs text-red-600 dark:text-red-400'>
														<AlertTriangle className='h-3 w-3' />
														<span>{`${estatisticasGerais?.totalInconsistencias || 0} Inconsistências Ativas`}</span>
													</div>
												</div>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500'>
													<DollarSign className='h-5 w-5' />
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardContent className='pt-6'>
											<div className='flex items-center justify-between'>
												<div className='space-y-1'>
													<p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
														Documentos Auditados
													</p>
													<p className='text-2xl font-bold'>{estatisticasGerais?.totalDocumentos || 0}</p>
													<div className='flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400'>
														<Building className='h-3 w-3' />
														<span>Base escopada por empresa atual</span>
													</div>
												</div>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-500'>
													<CheckCircle2 className='h-5 w-5' />
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Warning Strip */}
									<Card className='border-amber-200 bg-amber-50 md:col-span-2 dark:border-amber-900/30 dark:bg-amber-900/10'>
										<CardContent className='pt-6'>
											<div className='flex items-center gap-3'>
												<Info className='h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500' />
												<div className='text-sm text-amber-800 dark:text-amber-200'>
													<span className='font-bold'>Prioridade de Atendimento:</span> Documentos com status ABERTA requerem
													análise imediata.
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							</motion.div>

							{/* Tabela Condicional: Empresas (escritório) ou Documentos (empresa/escritório com empresa selecionada) */}
							<AnimatePresence mode='wait'>
								{isEscritorio && !selectedEmpresa ? (
									/* === VISUALIZAÇÃO DE ESCRITÓRIO: Lista de Empresas === */
									<motion.div
										key='empresas-view'
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<Card>
											<CardHeader className='flex flex-row items-center justify-between'>
												<div className='flex flex-col gap-1'>
													<CardTitle>Empresas do Escritório</CardTitle>
													{searchTerm === '' && selectedCriticidade.length > 0 && (
														<p className='text-muted-foreground text-xs'>
															Mostrando apenas empresas com inconsistências
															{selectedCriticidade.includes('CRITICA') ? ' • Com documentos críticos' : ''}
														</p>
													)}
													{searchTerm && (
														<p className='text-muted-foreground text-xs'>
															Busca: {searchTerm} • Mostrando todas as empresas encontradas
														</p>
													)}
												</div>
												<div className='flex gap-2'>
													<Button variant='outline' size='sm'>
														<Download className='mr-2 h-4 w-4' />
														Exportar
													</Button>
												</div>
											</CardHeader>
											<CardContent>
												{loadingEmpresas ? (
													<div className='flex items-center justify-center py-8'>
														<Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
													</div>
												) : empresasPaginadas.length > 0 ? (
													<DataTableDynamic
														columns={empresaColumns}
														data={empresasPaginadas}
														pageParameters={{
															page: empresaPage,
															pageSize: empresaPageSize,
															total: empresasOrdenadas.length,
															totalPages: empresasTotalPages,
														}}
														onPageChange={(newPage) => setEmpresaPage(newPage)}
														onPageSizeChange={(newSize) => {
															setEmpresaPageSize(newSize);
															setEmpresaPage(1);
														}}
														sorting={empresaSorting}
														onSortingChange={setEmpresaSorting}
													/>
												) : (
													<div className='text-muted-foreground py-8 text-center'>
														{searchTerm
															? 'Nenhuma empresa encontrada com esse termo.'
															: 'Nenhuma empresa com inconsistências encontrada.'}
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>
								) : (
									/* === VISUALIZAÇÃO DE EMPRESA: Lista de Documentos === */
									<motion.div
										key='documentos-view'
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<Card>
											<CardHeader className='flex flex-row items-center justify-between'>
												<CardTitle>
													{selectedEmpresa ? `Documentos de ${selectedEmpresa.nome}` : 'Documentos Auditados'}
												</CardTitle>
												<div className='flex gap-2'>
													<Button variant='outline' size='sm'>
														<Download className='mr-2 h-4 w-4' />
														Exportar
													</Button>
													<Button size='sm'>
														<Mail className='mr-2 h-4 w-4' />
														Notificar Cliente
													</Button>
												</div>
											</CardHeader>
											<CardContent>
												{loadingDocumentos ? (
													<div className='flex items-center justify-center py-8'>
														<Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
													</div>
												) : documentosPaginados.length > 0 ? (
													<DataTableDynamic
														columns={documentoColumns}
														data={documentosPaginados}
														pageParameters={{
															page: docPage,
															pageSize: docPageSize,
															total: documentosOrdenados.length,
															totalPages: documentosTotalPages,
														}}
														onPageChange={(newPage) => setDocPage(newPage)}
														onPageSizeChange={(newSize) => {
															setDocPageSize(newSize);
															setDocPage(1);
														}}
														sorting={docsSorting}
														onSortingChange={setDocsSorting}
													/>
												) : (
													<div className='text-muted-foreground py-8 text-center'>
														Nenhum documento encontrado no escopo atual.
													</div>
												)}
											</CardContent>
										</Card>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</ScrollArea>
				</div>

				{/* Modal de Detalhes */}
				<Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
					<DialogContent className='flex max-h-[90vh] max-w-2xl flex-col overflow-hidden'>
						<DialogHeader>
							<div className='mb-2 flex items-center gap-2'>
								<Badge variant='outline' className='text-[10px] font-bold uppercase'>
									{selectedDocumento?.ds_tipo_doc}
								</Badge>
								<span className='text-muted-foreground font-mono text-sm'>{selectedDocumento?.ds_chave?.substring(25, 34)}</span>
							</div>
							<DialogTitle className='text-lg leading-tight font-bold'>Análise de Inconsistências do Documento</DialogTitle>
							<DialogDescription>
								Emitido em{' '}
								{selectedDocumento?.dt_emissao
									? format(new Date(selectedDocumento.dt_emissao), "dd/MM/yyyy 'às' HH:mm", {
											locale: ptBR,
										})
									: '-'}
							</DialogDescription>
						</DialogHeader>

						<ScrollArea className='-mx-6 flex-1 px-6'>
							<div className='space-y-6 py-4'>
								{/* Status Card */}
								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex flex-col'>
										<span className='text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase'>
											Status Atual
										</span>
										{selectedDocumento && <StatusBadge status={selectedDocumento.status_operacional} />}
									</div>
									<div className='text-right'>
										<span className='text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase'>
											Valor do Documento
										</span>
										<span className='text-lg font-bold'>
											{selectedDocumento?.vl_documento ? formatBRL(selectedDocumento.vl_documento) : '-'}
										</span>
									</div>
								</div>

								{/* Inconsistências */}
								{inconsistencias && inconsistencias.length > 0 ? (
									<div className='space-y-4'>
										<h3 className='flex items-center gap-2 text-sm font-bold'>
											<FileSearch className='h-4 w-4 text-blue-500' />
											Inconsistências Detectadas ({inconsistencias.length})
										</h3>

										{inconsistencias.map((inc: FisAuditoriaDocIncons, idx: number) => (
											<div key={inc.id} className='space-y-3 rounded-lg border p-4'>
												<div className='flex items-start justify-between'>
													<div className='flex items-center gap-2'>
														<span className='text-muted-foreground text-xs font-bold'>#{idx + 1}</span>
														{inc.criticidade && <CriticidadeBadge criticidade={inc.criticidade} />}
													</div>
													{inc.tipo_inconsistencia && (
														<Badge variant='outline' className='text-[10px]'>
															{inc.tipo_inconsistencia.cd_codigo}
														</Badge>
													)}
												</div>

												<div className='bg-muted/30 rounded border p-3 text-sm leading-relaxed'>
													{inc.ds_mensagem_detalhada || 'Sem descrição detalhada.'}
												</div>

												<div className='grid grid-cols-2 gap-4'>
													{/* ENCONTRADO */}
													<div className='rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/10'>
														<span className='mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-red-600 uppercase dark:text-red-400'>
															<XCircle className='h-4 w-4' />
															Encontrado
														</span>
														<div className='text-sm font-medium text-red-800 dark:text-red-200'>
															{inc.ds_valor_encontrado || '-'}
														</div>
													</div>

													{/* ESPERADO */}
													<div className='rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10'>
														<span className='mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400'>
															<CheckCircle2 className='h-4 w-4' />
															Esperado
														</span>
														<div className='text-sm font-medium text-emerald-800 dark:text-emerald-200'>
															{inc.ds_valor_esperado || '-'}
														</div>
													</div>
												</div>

												{inc.vl_impacto_financeiro && inc.vl_impacto_financeiro > 0 && (
													<div className='flex items-center gap-2 text-sm'>
														<DollarSign className='text-muted-foreground h-4 w-4' />
														<span className='text-muted-foreground'>Impacto Financeiro:</span>
														<span className='font-bold'>{formatBRL(inc.vl_impacto_financeiro)}</span>
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className='text-muted-foreground py-8 text-center'>
										<CheckCircle2 className='mx-auto mb-2 h-12 w-12 text-emerald-500' />
										<p>Nenhuma inconsistência detectada.</p>
									</div>
								)}
							</div>
						</ScrollArea>

						<DialogFooter>
							<Button variant='outline' onClick={() => setDetailModalOpen(false)}>
								Fechar
							</Button>
							{inconsistencias && inconsistencias.length > 0 && (
								<Button>
									<CheckCircle2 className='mr-2 h-4 w-4' />
									Corrigir Agora
								</Button>
							)}
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</SystemLayout>
		</>
	);
};

export default AuditoriaFiscalPage;
