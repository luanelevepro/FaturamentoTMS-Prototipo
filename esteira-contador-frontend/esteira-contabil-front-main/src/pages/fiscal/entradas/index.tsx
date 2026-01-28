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
	FileText,
	ListFilter,
	CloudUpload,
	X,
	GitCommitHorizontal,
	History,
	Key,
	Package,
	KeySquare,
	MessageCircleWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/states/empty-state';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { useCompanyContext } from '@/context/company-context';
import { useLayout } from '@/context/layout-context';
import { DataTableDynamic, type DataTableRef } from '@/components/ui/data-table-dynamic';
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
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import {
	getDocumentosFiscais,
	downloadXmlNotaFiscalServico,
	integrarNotaFiscalServico,
	integrarListaNotaFiscalServico,
	integrarNfeEntrada,
	reverterIntegracaoNfeEntrada,
	operacaoNaoRealizada,
	sincronizarDominioCte,
	sincronizarVerfDominio,
	sincronizarDominio,
	sincronizarDominioNfe,
} from '@/services/api/documentos-fiscais';
import { executeRegrasNfe } from '@/services/api/regras-nfe';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { DocumentViewer } from '@/components/viewers/document-viewer';
import { XMLUploader } from '@/components/general/fiscal/entradas/documento/xml-uploader';
import { XLSXUploader } from '@/components/general/fiscal/entradas/documento/xlsx-uploader';
import { NFEItemsModal } from '@/components/general/fiscal/entradas/nfe-items-modal';
import { TimelineModal } from '@/components/ui/timeline-modal';
import { eventosToTimelineItems, historicoToTimelineItems } from '@/components/helpers/timeline';
import { coletarCteSieg, coletarNfceSieg, coletarNfeSieg, coletarNfseSieg } from '@/services/api/sieg-documentos-fiscais';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ChevronDown, Clock, CheckCircle2 } from 'lucide-react';
import { DocumentJustificationModal } from '@/components/general/fiscal/entradas/documento/operacao-nao-realizada-modal';
import { motion } from 'framer-motion';
import { getUfEmpresa } from '@/services/api/empresas';

export interface DocumentosData {
	id: string;
	ds_tipo: string;
	ds_status: string;
	id_nfse: string;
	js_nfse: {
		ds_numero: string;
		ds_valor_servicos: string;
		ds_codigo_verificacao: string;
		dt_emissao: string;
		fis_fornecedor: {
			ds_documento: string;
			ds_nome: string;
		};
	};
	id_nfe: string;
	js_nfe: {
		ds_numero: string;
		vl_nf: string;
		dt_emissao: string;
		cd_tipo_operacao: string;
		dt_saida_entrega: string;
		ds_chave: string;
		ds_serie: string;
		ds_uf_emitente: string;
		ds_municipio_emitente: string;
		cd_crt_emitente: string;
		fis_fornecedor: {
			ds_documento: string;
			ds_nome: string;
		};
		fis_nfe_itens: {
			id: string;
		};
	};
	id_cte: string;
	js_cte: {
		ds_numero: string;
		vl_total: string;
		dt_emissao: string;
		ds_chave: string;
		// fis_fornecedor: {
		// 	ds_documento: string;
		// 	ds_nome: string;
		// };
		ds_razao_social_emitente: string;
		ds_documento_emitente: string;
		ds_razao_social_remetente: string;
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
	fis_auditoria_doc?: {
		id: string;
		js_inconsistencias?: {
			status?: string;
			dt_deteccao?: string;
			campos_comparados?: Array<{
				atual?: string | null;
				campo?: string;
				esperado?: string | null;
				valor_db?: string | null;
				diferente?: boolean;
				valor_sat?: number | string | null;
				diferenca?: string | number | null;
				tipo_erro?: string | null;
			}>;
		};
		dt_created?: string;
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

// Constantes de filtros de status por tipo de documento
const ALLOWED_STATUS_BY_TYPE = {
	NFE: ['AGUARDANDO_INTEGRACAO'],
	NFSE: ['IMPORTADO', 'DIGITADO'],
	CTE: [], // CTE não tem integração por enquanto
};

export default function FiscaEntradasPage() {
	const { state } = useCompanyContext();
	const { openDocumentViewer, documentViewerOpen, documentViewerWidth } = useLayout();
	const tableRef = useRef<DataTableRef<DocumentosData>>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDocument, setSelectedDocument] = useState<DocumentosData | null>(null);
	const [pageParameters, setPageParameters] = useState<{
		page: number;
		pageSize: number;
		orderBy: string;
		orderColumn: string;
		search: string;
		date: Date | string;
		status?: string[];
		tipos?: string[];
	}>(() => {
		// Inicialização por localStorage para persistência de filtros
		try {
			const saved = localStorage.getItem('fiscal-entradas-filters');
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					page: 1,
					pageSize: 10,
					orderBy: 'asc',
					orderColumn: 'dt_emissao',
					search: '',
					date: new Date(),
					status: [],
					tipos: [],
					...parsed,
				};
			}
		} catch (error) {
			console.warn('Failed to parse saved filters:', error);
		}

		return {
			page: 1,
			pageSize: 10,
			orderBy: 'asc',
			orderColumn: 'dt_emissao',
			search: '',
			date: new Date(),
			status: [],
			tipos: [],
		};
	});

	const [integratingId, setIntegratingId] = useState<string | null>(null);
	const [integratingListId, setIntegratingListId] = useState<string[] | null>(null);
	const [applyingRulesListId, setApplyingRulesListId] = useState<string[] | null>(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const queryClient = useQueryClient();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<'status' | 'tipos'>('status');
	const isInitialized = useRef(false);

	// Estados para o modal de itens da NFE
	const [nfeItemsModalOpen, setNfeItemsModalOpen] = useState(false);
	const [selectedNfeId, setSelectedNfeId] = useState<string>('');
	const [nfeHeaderData, setNfeHeaderData] = useState<{
		nfeKey: string;
		supplier: string;
		supplierUf: string;
		supplierMunicipio: string;
		supplierCrt: string;
		issueDate: string;
		entryDate: string;
		invoiceNumber: string;
		series: string;
		ds_status: string;
	} | null>(null);

	// Estado para modal de auditoria
	const [auditModalOpen, setAuditModalOpen] = useState(false);
	const [auditForModal, setAuditForModal] = useState<DocumentosData['fis_auditoria_doc'] | null>(null);

	// Estado para modal de justificativa de operação não realizada
	const [justificativaModalOpen, setJustificativaModalOpen] = useState(false);
	const [justificativaDocuments, setJustificativaDocuments] = useState<Array<{
		id?: string;
		fis_nfe?: { id?: string; numero?: string; valor?: number; serie?: string; dataEmissao?: string; destinatario?: string };
		fis_cte?: {
			id?: string;
			numero?: string;
			valor?: number;
			serie?: string;
			dataEmissao?: string;
			remetente?: string;
			destinatario?: string;
		};
		fis_nfse?: { id?: string; numero?: string; valor?: number; dataEmissao?: string; destinatario?: string };
	}> | null>(null);

	// Salvar no localStorage sempre que os parâmetros da página mudarem
	useEffect(() => {
		localStorage.setItem('fiscal-entradas-filters', JSON.stringify(pageParameters));
	}, [pageParameters]);

	// Inicializar o estado local com os filtros persistentes apenas uma vez
	useEffect(() => {
		if (!isInitialized.current) {
			setSelectedStatus(pageParameters.status || []);
			setSelectedTypes(pageParameters.tipos || []);
			setSearchTerm(pageParameters.search || '');
			isInitialized.current = true;
		}
	}, [pageParameters.status, pageParameters.tipos, pageParameters.search]);

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
				await Promise.all([
					sincronizarDominio(format(new Date(pageParameters.date), 'yyyy-MM')),
					sincronizarDominioNfe(format(new Date(pageParameters.date), 'yyyy-MM')),
					sincronizarDominioCte(format(new Date(pageParameters.date), 'yyyy-MM')),
					sincronizarVerfDominio(format(new Date(pageParameters.date), 'yyyy-MM')),
				]);
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
	const handleSyncDFE = async () => {
		if (isSyncing) return;
		setIsSyncing(true);
		return toast.promise(
			(async () => {
				await Promise.all([
					coletarCteSieg(state, format(new Date(pageParameters.date), 'yyyy-MM')),
					coletarNfseSieg(state, format(new Date(pageParameters.date), 'yyyy-MM')),
				]);
				await coletarNfeSieg(state, format(new Date(pageParameters.date), 'yyyy-MM'));
				await coletarNfceSieg(state, format(new Date(pageParameters.date), 'yyyy-MM'));
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

	// Map DocumentosData -> formato aguardado pelo DocumentJustificationModal
	const mapToFisDocumento = (doc: DocumentosData) => {
		if (doc.js_nfe) {
			return {
				id: doc.id,
				fis_nfe: {
					id: doc.id_nfe || doc.id,
					numero: doc.js_nfe.ds_numero || undefined,
					valor: doc.js_nfe.vl_nf ? Number(doc.js_nfe.vl_nf) / 100 : 0,
					serie: doc.js_nfe.ds_serie || undefined,
					dataEmissao: doc.js_nfe.dt_emissao || undefined,
					destinatario: doc.js_nfe.fis_fornecedor?.ds_nome || undefined,
				},
			};
		}
		if (doc.js_cte) {
			return {
				id: doc.id,
				fis_cte: {
					id: doc.id_cte || doc.id,
					numero: doc.js_cte.ds_numero || undefined,
					valor: doc.js_cte.vl_total ? Number(doc.js_cte.vl_total) / 100 : 0,
					serie: undefined,
					dataEmissao: doc.js_cte.dt_emissao || undefined,
					remetente: doc.js_cte.ds_razao_social_remetente || undefined,
					destinatario: doc.js_cte.ds_razao_social_destinatario || undefined,
				},
			};
		}
		// NFSe and other shapes
		if (doc.js_nfse) {
			return {
				id: doc.id,
				fis_nfse: {
					id: doc.id_nfse || doc.id,
					numero: doc.js_nfse.ds_numero || undefined,
					valor: doc.js_nfse.ds_valor_servicos ? Number(doc.js_nfse.ds_valor_servicos) / 100 : 0,
					dataEmissao: doc.js_nfse.dt_emissao || undefined,
					destinatario: doc.js_nfse.fis_fornecedor?.ds_nome || undefined,
				},
			};
		}
		return { id: doc.id };
	};

	const queryKey = ['get-documentos-fiscal-entrada', pageParameters, state];

	const { data, isError, error, isFetching, refetch } = useQuery({
		queryKey: queryKey,
		queryFn: () => getDocumentosFiscais(pageParameters),
		staleTime: 1000 * 60 * 5,
		placeholderData: keepPreviousData,
		enabled: !!state,
	});

	const { data: ufEmpresaData } = useQuery({
		queryKey: ['get-uf-empresa', state],
		queryFn: () => getUfEmpresa(state),
		staleTime: 1000 * 60 * 60,
		enabled: !!state,
	});
	console.log('UFs da empresa:', ufEmpresaData);
	const handleIntegrate = async (documentoId: string, tipoDoc: string | undefined, statusDoc: string | undefined) => {
		if (!documentoId || integratingId) return;

		// Validar se o status é permitido para este tipo de documento
		const tipoNormalizado = (tipoDoc || '').toUpperCase();
		const statusPermitidos = (ALLOWED_STATUS_BY_TYPE[tipoNormalizado as keyof typeof ALLOWED_STATUS_BY_TYPE] || []) as string[];

		if (statusPermitidos.length > 0 && !statusPermitidos.includes(statusDoc || '')) {
			toast.error(`Documentos ${tipoDoc} só podem ser integrados com status: ${statusPermitidos.join(', ')}`);
			return;
		}

		setIntegratingId(documentoId);
		try {
			if (tipoDoc === 'NFE') {
				await integrarNfeEntrada([documentoId], format(new Date(pageParameters.date), 'yyyy-MM'));
			} else {
				await integrarNotaFiscalServico(documentoId);
			}
			toast.success('Documento integrado com sucesso!');
			await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
		} catch (err) {
			toast.error(`Erro ao integrar documento: ${String(err)}`);
		} finally {
			setIntegratingId(null);
		}
	};

	async function handleRevertList() {
		if (integratingListId) {
			toast.info('Já existe uma integração em andamento.');
			return;
		}

		const isSelectAllMode = tableRef.current?.getSelectAllMode() || false;
		const nfeIds: string[] = [];

		if (isSelectAllMode) {
			const allIds = data?.allIds || [];

			// Helper para localizar o documento na lista `notas` usando diferentes chaves
			const findDocForAllId = (item: { id: string; id_nfe?: string | null; id_nfse?: string | null }) =>
				((data?.notas || []) as DocumentosData[]).find(
					(n) => n.id === item.id || n.id_nfe === item.id_nfe || n.id_nfse === item.id_nfse,
				);

			allIds.forEach((item: { id: string; id_nfe?: string | null; id_nfse?: string | null; id_cte?: string | null }) => {
				// Para reverter, só aceitamos NFE com status INTEGRACAO_ESCRITA
				if (!item.id_nfe) return;
				const doc = findDocForAllId(item);
				if (doc && String(doc.ds_status) === 'INTEGRACAO_ESCRITA') {
					nfeIds.push(item.id_nfe as string);
				}
			});
		} else {
			// Caso contrário, processe apenas os documentos selecionados da página
			const selectedDocs = tableRef.current?.getSelectedRows() || [];

			selectedDocs.forEach((document) => {
				const tipo = String(document.ds_tipo || '').toUpperCase();
				const status = String(document.ds_status || '');
				if (tipo === 'NFE' && status === 'INTEGRACAO_ESCRITA') {
					if (document.id_nfe) nfeIds.push(document.id_nfe);
				}
			});
		}

		if (nfeIds.length === 0) {
			toast.info('Você deve selecionar ao menos uma NFE com status INTEGRACAO_ESCRITA para reverter.');
			return;
		}

		setIntegratingListId([...nfeIds]);

		return toast.promise(
			(async () => {
				try {
					await reverterIntegracaoNfeEntrada(nfeIds, format(new Date(pageParameters.date), 'yyyy-MM'));
					await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
					await refetch();
					tableRef.current?.clearSelectedRows();
				} catch (error) {
					throw error;
				} finally {
					setIntegratingListId(null);
				}
			})(),
			{
				loading: 'Revertendo integração...',
				success: () => `${nfeIds.length} documento(s) revertido(s) com sucesso.`,
				error: (error) => `Erro ao reverter documentos: ${error.message || error}`,
			},
		);
	}

	async function handleIntegrateList() {
		if (integratingListId) {
			toast.info('Já existe uma integração em andamento.');
			return;
		}

		const isSelectAllMode = tableRef.current?.getSelectAllMode() || false;

		// Separar selecionados por tipo de documento
		const nfseIds: string[] = [];
		const nfeIds: string[] = [];
		const cteIds: string[] = [];

		if (isSelectAllMode) {
			const allIds = data?.allIds || [];

			// Helper para localizar o documento na lista `notas` usando diferentes chaves
			const findDocForAllId = (item: { id: string; id_nfe?: string | null; id_nfse?: string | null }) =>
				((data?.notas || []) as DocumentosData[]).find(
					(n) => n.id === item.id || n.id_nfe === item.id_nfe || n.id_nfse === item.id_nfse,
				);

			allIds.forEach((item: { id: string; id_nfe?: string | null; id_nfse?: string | null; id_cte?: string | null }) => {
				// Se temos id_nfe, é uma NFE — somente se o documento correspondente estiver com status AGUARDANDO_INTEGRACAO
				if (item.id_nfe) {
					const doc = findDocForAllId(item);
					if (doc && String(doc.ds_status) === 'AGUARDANDO_INTEGRACAO') {
						nfeIds.push(item.id_nfe as string);
					}
					return;
				}
				// Se temos id_nfse, é uma NFSE
				if (item.id_nfse) {
					const doc = findDocForAllId(item);
					if (doc && ALLOWED_STATUS_BY_TYPE.NFSE.includes(String(doc.ds_status))) {
						nfseIds.push(item.id_nfse as string);
					}
					return;
				}
				// Se temos id_cte, é um CTE
				if (item.id_cte) {
					cteIds.push(item.id_cte as string);
					return;
				}
			});
		} else {
			// Caso contrário, processe apenas os documentos selecionados da página
			const selectedDocs = tableRef.current?.getSelectedRows() || [];

			selectedDocs.forEach((document) => {
				const tipo = String(document.ds_tipo || '').toUpperCase();
				const status = String(document.ds_status || '');
				if (tipo === 'NFE') {
					// Só integramos NFEs que estão AGUARDANDO_INTEGRACAO
					if (ALLOWED_STATUS_BY_TYPE.NFE.includes(status)) {
						if (document.id_nfe) nfeIds.push(document.id_nfe);
						else if (document.id_nfse) nfeIds.push(document.id_nfse);
					}
				} else if (tipo === 'NFSE') {
					// Só integramos NFSEs que estão em IMPORTADO ou DIGITADO
					if (ALLOWED_STATUS_BY_TYPE.NFSE.includes(status)) {
						if (document.id_nfse) nfseIds.push(document.id_nfse);
						else if (document.id_nfe) nfseIds.push(document.id_nfe);
					}
				} else if (tipo === 'CTE') {
					if (document.id_cte) cteIds.push(document.id_cte);
				}
			});
		}

		const totalToIntegrate = nfseIds.length + nfeIds.length;

		if (totalToIntegrate === 0) {
			toast.info('Você deve selecionar no mínimo um documento válido para integração.');
			return;
		}
		setIntegratingListId([...nfseIds, ...nfeIds]);

		return toast.promise(
			(async () => {
				try {
					if (nfseIds.length > 0) {
						await integrarListaNotaFiscalServico(nfseIds);
					}

					if (nfeIds.length > 0) {
						await integrarNfeEntrada(nfeIds, format(new Date(pageParameters.date), 'yyyy-MM'));
					}

					await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
					await refetch();
					tableRef.current?.clearSelectedRows();
				} catch (error) {
					throw error;
				} finally {
					setIntegratingListId(null);
				}
			})(),
			{
				loading: 'Integrando documentos...',
				success: () => `${totalToIntegrate} documento(s) integrado(s) com sucesso.`,
				error: (error) => `Erro ao integrar documentos: ${error.message || error}`,
			},
		);
	}

	async function handleApplyRulesToSelected() {
		if (applyingRulesListId) {
			toast.info('Já existe uma aplicação de regras em andamento.');
			return;
		}

		const isSelectAllMode = tableRef.current?.getSelectAllMode() || false;

		// coletar ids de NFE das linhas selecionadas
		const nfeIds: string[] = [];
		const excludedDocs: DocumentosData[] = [];

		const forbiddenStatuses = new Set(['EMITIDO', 'CANCELADO', 'OPERACAO_NAO_REALIZADA', 'DIGITADO_FISCAL', 'CONFERIDO_FISCAL']);

		const hasForbiddenEvent = (doc: DocumentosData) => {
			const eventos = doc.fis_evento || [];
			return eventos.some((ev) => {
				const txt = String(ev?.ds_descricao_evento || ev?.cd_codigo_evento || '').toLowerCase();
				return (
					txt.includes('não realizada') || txt.includes('nao realizada') || txt.includes('cancelamento') || txt.includes('cancelado')
				);
			});
		};

		if (isSelectAllMode) {
			// Se estamos em modo "selecionar todos", use os allIds para pegar id_nfe
			const allIds = data?.allIds || [];

			// Helper para localizar o documento na lista `notas` usando diferentes chaves
			const findDocForAllId = (item: { id: string; id_nfe?: string | null; id_nfse?: string | null }) =>
				((data?.notas || []) as DocumentosData[]).find(
					(n) => n.id === item.id || n.id_nfe === item.id_nfe || n.id_nfse === item.id_nfse,
				);

			allIds.forEach((item: { id: string; id_nfe?: string | null; id_nfse?: string | null; id_cte?: string | null }) => {
				if (!item.id_nfe) return;
				const doc = findDocForAllId(item);
				if (!doc) return;
				const status = String(doc.ds_status || '').toUpperCase();
				if (forbiddenStatuses.has(status) || hasForbiddenEvent(doc)) {
					excludedDocs.push(doc);
					return;
				}
				nfeIds.push(item.id_nfe as string);
			});
		} else {
			// Caso contrário, processe os documentos selecionados normalmente
			const selectedDocs = tableRef.current?.getSelectedRows() || [];
			selectedDocs.forEach((document) => {
				const tipo = String(document.ds_tipo || '').toUpperCase();
				if (tipo !== 'NFE') return;
				const status = String(document.ds_status || '').toUpperCase();
				if (forbiddenStatuses.has(status) || hasForbiddenEvent(document)) {
					excludedDocs.push(document);
					return;
				}
				if (document.id_nfe) nfeIds.push(document.id_nfe);
			});
		}

		if (nfeIds.length === 0) {
			const msg =
				excludedDocs.length > 0
					? 'Nenhuma NFE elegível selecionada. Alguns documentos foram ignorados.'
					: 'Nenhuma NFE selecionada para aplicar regras.';
			toast.info(msg);
			return;
		}

		setApplyingRulesListId([...nfeIds]);

		return toast.promise(
			(async () => {
				try {
					await executeRegrasNfe({ nfeIds });
					await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
					await refetch();
					tableRef.current?.clearSelectedRows();
				} catch (error) {
					throw error;
				} finally {
					setApplyingRulesListId(null);
				}
			})(),
			{
				loading: 'Aplicando regras...',
				success: () => {
					if (excludedDocs.length > 0) {
						toast.info(`${excludedDocs.length} documento(s) foram ignorados por não serem elegíveis.`);
					}
					return `Regras aplicadas para ${nfeIds.length} NFE(s) com sucesso.`;
				},
				error: (error) => `Erro ao aplicar regras: ${error.message || error}`,
			},
		);
	}

	const handleViewNFEItems = async (documento: DocumentosData) => {
		if (!documento.js_nfe) {
			toast.error('Este documento não é uma NFE.');
			return;
		}

		// Helper para converter data UTC para local sem mudança de dia
		const formatLocalDate = (dateString: string | null | undefined): string => {
			if (!dateString) return 'N/D';

			// Extrai apenas a parte da data (YYYY-MM-DD) ignorando horário
			const datePart = dateString.substring(0, 10);
			const [year, month, day] = datePart.split('-');

			// Cria data local sem conversão de timezone
			const localDate = new Date(Number(year), Number(month) - 1, Number(day));

			return format(localDate, 'dd/MM/yyyy');
		};

		// Formatar os dados do cabeçalho
		const headerData = {
			nfeKey: documento.js_nfe.ds_chave || '',
			supplier: documento.js_nfe.fis_fornecedor?.ds_nome || '',
			supplierUf: documento.js_nfe.ds_uf_emitente || '',
			supplierMunicipio: documento.js_nfe.ds_municipio_emitente || '',
			supplierCrt: documento.js_nfe.cd_crt_emitente || '',
			issueDate: formatLocalDate(documento.js_nfe.dt_emissao),
			entryDate: formatLocalDate(documento.js_nfe.dt_saida_entrega),
			invoiceNumber: documento.js_nfe.ds_numero || '',
			series: documento.js_nfe.ds_serie || '',
			ds_status: documento.ds_status || '',
		};
		console.log('documento.js_nfe', documento.js_nfe);
		console.log('headerData', headerData);
		setSelectedNfeId(documento.id_nfe);
		setNfeHeaderData(headerData);
		setNfeItemsModalOpen(true);
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
			id: 'cd_tipo_operacao',
			accessorKey: 'cd_tipo_operacao',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo Op.' />,
			cell: ({ row }) => {
				return <div className='font-medium'>{row.original.js_nfe?.cd_tipo_operacao || '-'}</div>;
			},
		},
		{
			id: 'fis_fornecedor.ds_nome',
			accessorKey: 'fis_fornecedor.ds_nome',
			accessorFn: (row) =>
				row.js_nfse?.fis_fornecedor?.ds_nome || row.js_nfe?.fis_fornecedor?.ds_nome || row.js_cte?.ds_razao_social_emitente,
			header: ({ column }) => <DataTableColumnHeader column={column} title='Emitente' />,
			cell: ({ row }) => {
				let nome = 'N/A';
				let documento = '';
				let regime = '0';
				let municipio = 'N/A';
				let uf = 'N/A';

				if (row.original.js_nfse?.fis_fornecedor) {
					nome = row.original.js_nfse.fis_fornecedor.ds_nome;
					documento = row.original.js_nfse.fis_fornecedor.ds_documento;
				} else if (row.original.js_nfe?.fis_fornecedor) {
					nome = row.original.js_nfe.fis_fornecedor.ds_nome;
					documento = row.original.js_nfe.fis_fornecedor.ds_documento;
					regime = row.original.js_nfe.cd_crt_emitente || '0';
					municipio = row.original.js_nfe.ds_municipio_emitente || 'N/A';
					uf = row.original.js_nfe.ds_uf_emitente || 'N/A';
					switch (regime) {
						case '1':
							regime = 'CRT 1: Simples Nacional';
							break;
						case '2':
							regime = 'CRT 2: Simples Nacional, excesso';
							break;
						case '3':
							regime = 'CRT 3: Regime Normal';
							break;
						default:
							regime = 'Não informado';
							break;
					}
				} else if (row.original.js_cte) {
					nome = row.original.js_cte.ds_razao_social_emitente || row.original.js_cte.ds_documento_emitente || 'N/A';
					documento = row.original.js_cte.ds_documento_emitente;
				}

				return (
					<>
						<div className='font-medium'>{nome}</div>
						<div className='text-xs opacity-80'>
							({formatCnpjCpf(documento || '')} | {municipio} - {uf} | {regime})
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

				type BadgeVariant = 'info' | 'danger' | 'success' | 'default' | 'secondary' | 'outline' | 'warning' | 'pending' | 'muted';
				let variant: BadgeVariant = 'default';

				switch (value) {
					case 'DIGITADO':
						variant = 'info';
						break;
					case 'IMPORTADO':
						variant = 'info';
						break;
					case 'EMITIDO':
						variant = 'muted';
						break;
					case 'AGUARDANDO_VALIDACAO':
						variant = 'info';
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
					case 'OPERACAO_NAO_REALIZADA':
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

				const eventoText = latest.ds_descricao_evento || latest.cd_codigo_evento || 'Evento';
				const eventoTextLower = eventoText.toLowerCase();

				// Determinar variante baseada no tipo de manifestação
				let badgeVariant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' = 'outline';
				const badgeClassName = 'cursor-default text-nowrap';

				if (eventoTextLower.includes('ciência') || eventoTextLower.includes('ciencia')) {
					// Azul escuro para Ciência da Operação
					badgeVariant = 'info';
				} else if (eventoTextLower.includes('confirmação') || eventoTextLower.includes('confirmacao')) {
					// Verde escuro para Confirmação da Operação
					badgeVariant = 'success';
				} else if (eventoTextLower.includes('desconhecimento')) {
					// Alaranjado para Desconhecimento da Operação
					badgeVariant = 'warning';
				} else if (
					eventoTextLower.includes('não realizada') ||
					eventoTextLower.includes('nao realizada') ||
					eventoTextLower.includes('cancelamento')
				) {
					// Vermelho para Operação não Realizada ou Cancelamento
					badgeVariant = 'danger';
				}
				return (
					<Badge variant={badgeVariant} className={badgeClassName}>
						{eventoText}
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
											router.push(`/fiscal/entradas/editar/${documento.id_nfse}`);
										}}
									>
										Editar nota
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									disabled={isCurrentlyIntegrating}
									onClick={() => {
										getDocumentoFiscalXML(documento.id_nfse);
									}}
									className='hover:cursor-pointer'
								>
									Baixar XML
								</DropdownMenuItem>
								{(row.getValue('ds_status') === 'DIGITADO' ||
									row.getValue('ds_status') === 'IMPORTADO' ||
									row.getValue('ds_status') === 'AGUARDANDO_INTEGRACAO') && (
									<DropdownMenuItem
										onClick={() => handleIntegrate(documento.id_nfse || documento.id_nfe, documento.ds_tipo, documento.ds_status)}
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

								{/* Reverter integração - somente para NFE com status INTEGRACAO_ESCRITA */}
								{row.getValue('ds_tipo') === 'NFE' && row.getValue('ds_status') === 'INTEGRACAO_ESCRITA' && (
									<DropdownMenuItem
										className='hover:cursor-pointer'
										disabled={isCurrentlyIntegrating}
										onClick={async () => {
											if (!documento.js_nfe.ds_chave) {
												toast.error('Documento NFE sem chave.');
												return;
											}
											setIntegratingId(documento.js_nfe.ds_chave);
											return toast.promise(
												(async () => {
													try {
														await reverterIntegracaoNfeEntrada(
															[documento.id_nfe],
															format(new Date(pageParameters.date), 'yyyy-MM'),
														);
														await queryClient.invalidateQueries({
															queryKey: ['get-documentos-fiscal-entrada', pageParameters, state],
														});
														await refetch();
													} catch (error) {
														throw error;
													} finally {
														setIntegratingId(null);
													}
												})(),
												{
													loading: 'Revertendo integração...',
													success: () => 'Integração revertida com sucesso.',
													error: (error) => `Erro ao reverter integração: ${error.message || error}`,
												},
											);
										}}
									>
										Reverter integração
									</DropdownMenuItem>
								)}
								{documento.ds_status !== 'OPERACAO_NAO_REALIZADA' && documento.ds_status !== 'CANCELADA' && (
									<DropdownMenuItem
										className='hover:cursor-pointer'
										onClick={(e) => {
											e.stopPropagation();
											setJustificativaDocuments([mapToFisDocumento(documento)]);
											setJustificativaModalOpen(true);
										}}
									>
										Operação não realizada
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						{/* Botão de auditoria abre modal com inconsistências */}
						{(() => {
							const audits = documento.fis_auditoria_doc || [];
							const hasInconsistencia = audits.some((a) =>
								(a.js_inconsistencias?.campos_comparados || []).some((c) => {
									if (!c) return false;
									if (c.diferente === true) return true;
									const s = String(c.diferente).toLowerCase();
									return s === 'true' || s === '1';
								}),
							);

							return hasInconsistencia ? (
								<Button
									variant='warn'
									size='icon'
									className='mr-1 flex h-8 w-8 p-0 align-middle'
									tooltip='Inconsistências'
									onClick={(e) => {
										e.stopPropagation();
										setAuditForModal(documento.fis_auditoria_doc || null);
										setAuditModalOpen(true);
									}}
								>
									<MessageCircleWarning className='h-4 w-4' />
								</Button>
							) : null;
						})()}
						<Button
							variant='ghost'
							tooltip={
								row.original.js_nfse?.ds_codigo_verificacao ||
								row.original.js_nfe?.ds_chave ||
								row.original.js_cte?.ds_chave ||
								'Sem chave'
							}
							onClick={async (e) => {
								e.stopPropagation();
								const keyText =
									row.original.js_nfse?.ds_codigo_verificacao ||
									row.original.js_nfe?.ds_chave ||
									row.original.js_cte?.ds_chave ||
									'';
								if (!keyText) {
									toast.error('Nenhuma chave disponível para copiar.');
									return;
								}
								try {
									await navigator.clipboard.writeText(String(keyText));
									toast.success('Chave copiada para a área de transferência.');
								} catch (err) {
									console.error('Erro ao copiar chave:', err);
									toast.error('Erro ao copiar chave.');
								}
							}}
						>
							<Key />
						</Button>
						<TimelineModal items={historicoToTimelineItems(row.original)} title='Timeline de Status' triggerText='Timeline'>
							<Button variant='ghost' tooltip='Timeline de Status' className='flex h-8 w-8 p-0 align-middle'>
								<History />
							</Button>
						</TimelineModal>
						<TimelineModal
							items={eventosToTimelineItems(row.original.fis_evento, row.original)}
							title='Timeline de Eventos'
							triggerText='Timeline'
						>
							<Button variant='ghost' tooltip='Timeline de Eventos' className='flex h-8 w-8 p-0 align-middle'>
								<GitCommitHorizontal />
							</Button>
						</TimelineModal>
						{/* Botão para visualizar itens da NFE - por enquanto só aparece para NFE */}
						{documento.ds_tipo === 'NFE' &&
							// documento.ds_status !== 'DIGITADO_FISCAL' &&
							// documento.ds_status !== 'CONFERIDO_FISCAL' &&
							documento.js_nfe && (
								<Button
									variant='ghost'
									tooltip='Visualizar/Atualizar Itens da NFE'
									disabled={isCurrentlyIntegrating}
									onClick={(e) => {
										e.stopPropagation();
										handleViewNFEItems(documento);
									}}
									className='flex h-8 w-8 p-0 align-middle'
								>
									<Package className='h-4 w-4' />
								</Button>
							)}
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
		// Evitamos loop de memoria para pesquisa
		if (searchTerm === pageParameters.search) return;

		const handler = setTimeout(() => {
			setPageParameters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm, setPageParameters, pageParameters.search]);

	useEffect(() => {
		if (sorting.length === 0) return;

		const [{ id: orderColumn, desc }] = sorting;
		setPageParameters((prev) => ({
			...prev,
			orderColumn, // ex: 'js_nfse.dt_emissao'
			orderBy: desc ? 'desc' : 'asc',
			page: 1, // sempre volta pra página 1
		}));
	}, [sorting, setPageParameters]);

	const handlePageChange = (newPage: number) => {
		if (newPage < 1) return;
		setPageParameters((prev) => ({ ...prev, page: newPage }));
	};

	if (isError && !isFetching) {
		toast.error(error?.message || 'Erro ao carregar os registros.');
	}

	const notasData = data?.notas || [];

	// Preparar auditorias para exibição no modal (ordenar e separar última/anteriores)
	const _auditsSorted = (auditForModal || []).slice();
	_auditsSorted.sort((a, b) => {
		const ta = Date.parse(a?.js_inconsistencias?.dt_deteccao || a?.js_inconsistencias?.dt_deteccao || '') || 0;
		const tb = Date.parse(b?.js_inconsistencias?.dt_deteccao || b?.js_inconsistencias?.dt_deteccao || '') || 0;
		return ta - tb;
	});
	const latestAuditForModal = _auditsSorted.length ? _auditsSorted[_auditsSorted.length - 1] : null;
	const olderAuditsForModal = _auditsSorted.length > 1 ? _auditsSorted.slice(0, _auditsSorted.length - 1) : [];

	const parseToCents = (v: unknown): number | null => {
		if (v === null || v === undefined) return null;
		if (typeof v === 'number') return Math.round(v);
		const s = String(v).trim();
		if (s.length === 0) return null;
		if (/[.,]/.test(s)) {
			const normalized = s
				.replace(/\.(?=\d{3}($|[^\d]))/g, '')
				.replace(/\./g, '')
				.replace(/,/g, '.');
			const f = Number(normalized);
			if (!Number.isNaN(f)) return Math.round(f * 100);
		}
		const digits = s.replace(/[^0-9-]/g, '');
		if (digits.length === 0) return null;
		const n = Number(digits);
		if (!Number.isNaN(n)) return Math.round(n);
		return null;
	};

	const mapFieldName = (field?: string) => {
		if (!field) return '';
		switch (field) {
			case 'vl_nf':
				return 'Valor da Nota';
			case 'ds_numero':
				return 'Número';
			case 'ds_serie':
				return 'Série';
			case 'dt_emissao':
				return 'Data de Emissão';
			case 'status_documento':
				return 'Status do Documento';
			case 'ds_chave':
				return 'Chave de Acesso';
			case 'ds_cnpj_emitente':
				return 'CNPJ Emitente';
			case 'ds_cnpj_destinatario':
				return 'CNPJ Destinatário';
			default:
				return field
					.replace(/^ds_/, '')
					.replace(/^dt_/, '')
					.replace(/^vl_/, '')
					.replace(/^cd_/, '')
					.replace(/_/g, ' ')
					.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
		}
	};

	const humanizeTipo = (t?: string) => {
		if (!t) return '';
		return String(t)
			.replace(/_/g, ' ')
			.toLowerCase()
			.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
	};

	interface AuditCampo {
		atual?: string | null;
		campo?: string;
		esperado?: string | null;
		valor_db?: string | null;
		diferente?: boolean;
		valor_sat?: number | string | null;
		diferenca?: string | number | null;
		tipo_erro?: string | null;
	}

	interface AuditInconsistencias {
		status?: string;
		motivo?: string;
		dt_deteccao?: string;
		campos_comparados?: AuditCampo[];
	}

	// Renderiza campo de STATUS (cancelado, operação não realizada, etc)
	const renderStatusField = (c: AuditCampo) => (
		<div className='mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30'>
			<div className='mb-2 flex items-center gap-2'>
				<div className='rounded-full bg-red-500 p-1'>
					<svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
					</svg>
				</div>
				<span className='font-semibold text-red-700 dark:text-red-400'>{mapFieldName(c.campo)}</span>
			</div>
			<div className='grid grid-cols-2 gap-2 text-sm'>
				<div className='rounded border border-red-200/50 bg-red-100/50 p-2 dark:border-red-800/50 dark:bg-red-900/20'>
					<span className='mb-1 block text-xs text-red-600/70 dark:text-red-400/70'>Sistema</span>
					<span className='font-medium text-red-900 dark:text-red-200'>{c.valor_db || c.atual || '—'}</span>
				</div>
				<div className='rounded border border-red-200/50 bg-red-100/50 p-2 dark:border-red-800/50 dark:bg-red-900/20'>
					<span className='mb-1 block text-xs text-red-600/70 dark:text-red-400/70'>SAT/Esperado</span>
					<span className='font-medium text-red-900 dark:text-red-200'>{c.valor_sat || c.esperado || '—'}</span>
				</div>
			</div>
		</div>
	);

	// Renderiza campo de VALOR (vl_nf, etc)
	const renderValorField = (c: AuditCampo) => {
		const dbCents = parseToCents(c.valor_db);
		const satCents = parseToCents(c.valor_sat);
		const dbFormatted = dbCents !== null ? formatBRL(dbCents / 100) : String(c.valor_db ?? '—');

		let satFormatted = '—';
		if (satCents !== null) {
			// Ajuste inteligente para SAT (pode vir em reais ou centavos)
			if (dbCents && satCents > 0) {
				const ratio = dbCents / satCents;
				if (ratio >= 50 && ratio <= 200) {
					satFormatted = formatBRL(satCents); // já está em reais
				} else {
					satFormatted = formatBRL(satCents / 100);
				}
			} else {
				satFormatted = formatBRL(satCents / 100);
			}
		} else if (c.valor_sat !== null && c.valor_sat !== undefined) {
			satFormatted = String(c.valor_sat);
		}

		const diferenca = c.diferenca
			? parseToCents(c.diferenca)
			: dbCents !== null && satCents !== null
				? Math.abs(dbCents - satCents)
				: null;

		return (
			<div className='mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
				<div className='mb-2 flex items-center gap-2'>
					<div className='rounded-full bg-amber-500 p-1'>
						<svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
					</div>
					<span className='font-semibold text-amber-700 dark:text-amber-400'>{mapFieldName(c.campo)}</span>
				</div>
				<div className='grid grid-cols-2 gap-2 text-sm'>
					<div className='rounded border border-amber-200/50 bg-amber-100/50 p-2 dark:border-amber-800/50 dark:bg-amber-900/20'>
						<span className='mb-1 block text-xs text-amber-600/70 dark:text-amber-400/70'>Sistema (DB)</span>
						<span className='font-mono font-medium text-amber-900 dark:text-amber-200'>{dbFormatted}</span>
					</div>
					<div className='rounded border border-amber-200/50 bg-amber-100/50 p-2 dark:border-amber-800/50 dark:bg-amber-900/20'>
						<span className='mb-1 block text-xs text-amber-600/70 dark:text-amber-400/70'>SAT</span>
						<span className='font-mono font-medium text-amber-900 dark:text-amber-200'>{satFormatted}</span>
					</div>
				</div>
				{diferenca !== null && diferenca > 0 && (
					<div className='mt-2 text-center'>
						<span className='rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/50 dark:text-red-300'>
							Diferença: {formatBRL(diferenca / 100)}
						</span>
					</div>
				)}
			</div>
		);
	};

	// Renderiza campo de DATA (dt_emissao, etc)
	const renderDataField = (c: AuditCampo) => {
		const formatDate = (v: unknown) => {
			if (!v) return '—';
			const str = String(v);
			// Se for ISO date, pega só a parte da data
			const datePart = str.substring(0, 10);
			if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
				const [year, month, day] = datePart.split('-');
				return `${day}/${month}/${year}`;
			}
			return str;
		};

		return (
			<div className='mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30'>
				<div className='mb-2 flex items-center gap-2'>
					<div className='rounded-full bg-blue-500 p-1'>
						<svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
							/>
						</svg>
					</div>
					<span className='font-semibold text-blue-700 dark:text-blue-400'>{mapFieldName(c.campo)}</span>
				</div>
				<div className='grid grid-cols-2 gap-2 text-sm'>
					<div className='rounded border border-blue-200/50 bg-blue-100/50 p-2 dark:border-blue-800/50 dark:bg-blue-900/20'>
						<span className='mb-1 block text-xs text-blue-600/70 dark:text-blue-400/70'>Sistema</span>
						<span className='font-medium text-blue-900 dark:text-blue-200'>{formatDate(c.valor_db || c.atual)}</span>
					</div>
					<div className='rounded border border-blue-200/50 bg-blue-100/50 p-2 dark:border-blue-800/50 dark:bg-blue-900/20'>
						<span className='mb-1 block text-xs text-blue-600/70 dark:text-blue-400/70'>SAT/Esperado</span>
						<span className='font-medium text-blue-900 dark:text-blue-200'>{formatDate(c.valor_sat || c.esperado)}</span>
					</div>
				</div>
			</div>
		);
	};

	// Renderiza campo de TEXTO genérico (número, série, chave, etc)
	const renderTextoField = (c: AuditCampo) => (
		<div className='mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50'>
			<div className='mb-2 flex items-center gap-2'>
				<div className='rounded-full bg-gray-500 p-1'>
					<svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
						/>
					</svg>
				</div>
				<span className='font-semibold text-gray-700 dark:text-gray-300'>{mapFieldName(c.campo)}</span>
				{c.tipo_erro && <span className='rounded bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700'>{humanizeTipo(c.tipo_erro)}</span>}
			</div>
			<div className='grid grid-cols-2 gap-2 text-sm'>
				<div className='rounded border border-gray-200/50 bg-gray-100/50 p-2 dark:border-gray-600/50 dark:bg-gray-700/30'>
					<span className='mb-1 block text-xs text-gray-500 dark:text-gray-400'>Sistema</span>
					<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>{c.valor_db || c.atual || '—'}</span>
				</div>
				<div className='rounded border border-gray-200/50 bg-gray-100/50 p-2 dark:border-gray-600/50 dark:bg-gray-700/30'>
					<span className='mb-1 block text-xs text-gray-500 dark:text-gray-400'>SAT/Esperado</span>
					<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>{c.valor_sat || c.esperado || '—'}</span>
				</div>
			</div>
		</div>
	);

	// Renderiza um campo de acordo com seu tipo
	const renderAuditField = (c: AuditCampo, idx: number) => {
		const campo = c.campo || '';

		// Status do documento (cancelado, etc)
		if (campo === 'status_documento' || c.tipo_erro === 'CANCELADO' || c.tipo_erro === 'OPERACAO_NAO_REALIZADA') {
			return <div key={idx}>{renderStatusField(c)}</div>;
		}

		// Campos de valor monetário
		if (campo.startsWith('vl_') || campo === 'valor' || campo.includes('valor')) {
			return <div key={idx}>{renderValorField(c)}</div>;
		}

		// Campos de data
		if (campo.startsWith('dt_') || campo.includes('data') || campo.includes('date')) {
			return <div key={idx}>{renderDataField(c)}</div>;
		}

		// Demais campos (texto genérico)
		return <div key={idx}>{renderTextoField(c)}</div>;
	};

	const renderAudit = (audit: typeof latestAuditForModal, keyIdx: number) => {
		if (!audit) return null;
		const ins = audit.js_inconsistencias as AuditInconsistencias | undefined;

		// Filtra apenas campos com diferente: true
		const camposComDiferenca = (ins?.campos_comparados || []).filter(
			(c: AuditCampo | undefined): c is AuditCampo => !!c && Boolean(c.diferente),
		);

		if (camposComDiferenca.length === 0) {
			return (
				<div key={audit.id || keyIdx} className='text-muted-foreground mb-4 py-4 text-center'>
					Nenhuma inconsistência detectada nesta auditoria.
				</div>
			);
		}

		return (
			<div key={audit.id || keyIdx} className='mb-4'>
				{/* Header da auditoria com motivo/status */}
				<div className='bg-muted/50 mb-3 rounded-lg p-3'>
					<div className='flex items-center justify-between'>
						<div>
							<span className='font-medium'>
								{ins?.status
									? String(ins.status)
											.replace(/_/g, ' ')
											.toLowerCase()
											.replace(/(^|\s)\S/g, (t) => t.toUpperCase())
									: 'Auditoria'}
							</span>
							{ins?.dt_deteccao && (
								<span className='text-muted-foreground ml-2 text-sm'>
									• {format(new Date(ins.dt_deteccao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
								</span>
							)}
						</div>
						<span className='rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/50 dark:text-red-300'>
							{camposComDiferenca.length} inconsistência{camposComDiferenca.length > 1 ? 's' : ''}
						</span>
					</div>
					{ins?.motivo && <p className='text-muted-foreground mt-2 border-t pt-2 text-sm'>{ins.motivo}</p>}
				</div>

				{/* Lista de campos com inconsistências */}
				{camposComDiferenca.map((c, idx) => renderAuditField(c, idx))}
			</div>
		);
	};

	return (
		<>
			<Head>
				<title>Entradas | Esteira</title>
			</Head>

			<div
				className='transition-all duration-300 ease-in-out'
				style={{
					marginRight: documentViewerOpen ? `${documentViewerWidth}px` : '0px',
				}}
			>
				<DashboardLayout title='Entradas' description='Gerenciamento de documentos fiscais.'>
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
								selected={pageParameters.date ? new Date(pageParameters.date) : new Date()}
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
									<DropdownMenuItem
										className='hover:cursor-pointer'
										onClick={() => {
											const selected = tableRef.current?.getSelectedRows() || [];
											if (!selected || selected.length === 0) {
												toast.info('Selecione ao menos um documento para adicionar justificativa.');
												return;
											}

											const excluded = selected.filter(
												(s) => s.ds_status === 'OPERACAO_NAO_REALIZADA' || s.ds_status === 'CANCELADA',
											);
											const allowed = selected.filter(
												(s) => s.ds_status !== 'OPERACAO_NAO_REALIZADA' && s.ds_status !== 'CANCELADA',
											);

											if (allowed.length === 0) {
												toast.info('Nenhum documento selecionado é elegível para Operação não realizada.');
												return;
											}

											if (excluded.length > 0) {
												toast.info(`${excluded.length} documento(s) ignorado(s) por estarem com status não elegível.`);
											}

											setJustificativaDocuments(allowed.map((s) => mapToFisDocumento(s)));
											setJustificativaModalOpen(true);
										}}
									>
										<FileText />
										Operação não realizada
									</DropdownMenuItem>
									<XMLUploader>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()} className='hover:cursor-pointer'>
											<UploadIcon />
											Importar XML
										</DropdownMenuItem>
									</XMLUploader>
									{ufEmpresaData?.uf === 'SC' && (
										<XLSXUploader period={format(new Date(pageParameters.date), 'yyyy-MM')}>
											<DropdownMenuItem onSelect={(e) => e.preventDefault()} className='hover:cursor-pointer'>
												<UploadIcon />
												Enviar planilhas SAT
											</DropdownMenuItem>
										</XLSXUploader>
									)}
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
									<DropdownMenuItem onClick={() => handleIntegrateList()} className='hover:cursor-pointer'>
										<CloudUpload />
										{integratingListId !== null ? (
											<>
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												Integrando...
											</>
										) : (
											'Integrar Documento(s)'
										)}
									</DropdownMenuItem>

									<DropdownMenuItem onClick={() => handleRevertList()} className='hover:cursor-pointer'>
										{integratingListId !== null ? (
											<>
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												Revertendo...
											</>
										) : (
											<>
												<X className='mr-2 h-4 w-4' />
												Reverter Integração
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleApplyRulesToSelected()} className='hover:cursor-pointer'>
										{applyingRulesListId !== null ? (
											<>
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												Aplicando regras...
											</>
										) : (
											<>
												<KeySquare className='mr-2 h-4 w-4' />
												Aplicar Regras
											</>
										)}
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
								allIds={data?.allIds}
							/>
						)}
					</div>
				</DashboardLayout>
			</div>

			{/* Modal dos itens da NFE */}

			{/* Modal de auditoria - mostra inconsistências detalhadas (visual atualizado) */}
			<Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
				<DialogContent className='max-w-2xl gap-0 overflow-hidden p-0'>
					{/* Header */}
					<div className='from-muted/50 to-muted border-border/50 relative border-b bg-gradient-to-br px-6 py-5'>
						<div className='flex items-start justify-between'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10'>
									<motion.div
										initial={{ rotate: -10, scale: 0 }}
										animate={{ rotate: 0, scale: 1 }}
										transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
									>
										<AlertTriangle className='h-5 w-5 text-amber-500' />
									</motion.div>
								</div>
								<div>
									<DialogTitle className='text-foreground text-lg font-semibold'>Inconsistências de Auditoria</DialogTitle>
									<DialogDescription className='mt-0.5 text-sm'>
										{(latestAuditForModal ? 1 : 0) + olderAuditsForModal.length}{' '}
										{(latestAuditForModal ? 1 : 0) + olderAuditsForModal.length === 1
											? 'diferença detectada'
											: 'diferenças detectadas'}{' '}
										no documento
									</DialogDescription>
								</div>
							</div>
						</div>
					</div>

					{/* Content */}
					<ScrollArea className='max-h-[60vh]'>
						<div className='space-y-4 p-6'>
							{latestAuditForModal ? (
								<>
									<div className='mb-4 flex items-center gap-2'>
										<FileText className='text-muted-foreground h-4 w-4' />
										<span className='text-foreground text-sm font-medium'>Auditoria mais recente</span>
									</div>

									{renderAudit(latestAuditForModal, 0)}

									{olderAuditsForModal.length > 0 && (
										<Collapsible className='mt-6'>
											<CollapsibleTrigger asChild>
												<Button
													variant='outline'
													size='sm'
													className='hover:bg-muted/50 group w-full justify-between gap-2 border-dashed hover:border-solid'
												>
													<span className='flex items-center gap-2'>
														<Clock className='text-muted-foreground h-4 w-4' />
														Histórico de auditorias ({olderAuditsForModal.length})
													</span>
													<ChevronDown className='text-muted-foreground h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180' />
												</Button>
											</CollapsibleTrigger>
											<CollapsibleContent className='animate-accordion-down mt-4 space-y-3'>
												{olderAuditsForModal.map((audit, i) => (
													<div key={audit.id || i} className='opacity-75 transition-opacity hover:opacity-100'>
														{renderAudit(audit, i + 1)}
													</div>
												))}
											</CollapsibleContent>
										</Collapsible>
									)}
								</>
							) : (
								<div className='flex flex-col items-center justify-center py-12 text-center'>
									<div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
										<CheckCircle2 className='text-muted-foreground h-6 w-6' />
									</div>
									<p className='text-muted-foreground mt-4 text-sm'>Nenhuma inconsistência encontrada</p>
								</div>
							)}
						</div>
					</ScrollArea>

					{/* Footer */}
					<DialogFooter className='border-border/50 bg-muted/30 border-t px-6 py-4'>
						<Button onClick={() => setAuditModalOpen(false)} className='min-w-[100px]'>
							Fechar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal para justificativa de operação não realizada */}
			<DocumentJustificationModal
				open={!!justificativaModalOpen}
				onOpenChange={(open) => setJustificativaModalOpen(open)}
				documentos={justificativaDocuments || []}
				onSubmit={async (docsWithJustification) => {
					try {
						const items = docsWithJustification.map((d) => ({ id_documento: d.id, justificativa: d.justificativa }));
						await operacaoNaoRealizada(items);
						await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
						toast.success(`${docsWithJustification.length} documento(s) processado(s) com sucesso.`);
					} catch (err) {
						console.error(err);
						toast.error('Erro ao processar justificativas.');
					} finally {
						setJustificativaModalOpen(false);
						setJustificativaDocuments(null);
					}
				}}
			/>

			{nfeHeaderData && (
				<NFEItemsModal
					open={nfeItemsModalOpen}
					onOpenChange={setNfeItemsModalOpen}
					nfeId={selectedNfeId}
					headerData={nfeHeaderData}
					onSaved={async () => {
						await queryClient.invalidateQueries({ queryKey: ['get-documentos-fiscal-entrada', pageParameters, state] });
						await refetch();
					}}
				/>
			)}

			{/* DocumentViewer Sheet */}
			<DocumentViewer documento={selectedDocument} />
		</>
	);
}
