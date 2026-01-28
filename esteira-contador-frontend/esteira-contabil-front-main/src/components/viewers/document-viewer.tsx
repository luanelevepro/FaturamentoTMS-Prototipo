import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchData } from '@/services/api/request-handler';
import { useLayout } from '@/context/layout-context';
import { useResizable } from '@/hooks/use-resizable';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DocumentosData {
	id: string;
	ds_tipo: string;
	ds_status: string;
	id_nfse: string;
	js_nfse?: {
		ds_numero: string;
		ds_valor_servicos: string;
		ds_codigo_verificacao: string;
		dt_emissao: string;
	};
	id_nfe: string;
	js_nfe?: {
		ds_numero: string;
		vl_nf: string;
		dt_emissao: string;
		ds_chave: string;
	};
	id_cte: string;
	js_cte?: {
		ds_numero: string;
		vl_total: string;
		dt_emissao: string;
		ds_chave: string;
	};
}

interface DocumentViewerProps {
	documento: DocumentosData | null;
}

interface ViewerProps {
	documento: unknown;
}

const viewers: Record<string, () => Promise<{ default: React.ComponentType<ViewerProps> }>> = {
	nfse: () => import('@/components/viewers/wrappers/viewer-nfse'),
	nfe: () => import('@/components/viewers/wrappers/viewer-nfe'),
	cte: () => import('@/components/viewers/wrappers/viewer-cte'),
};

export function DocumentViewer({ documento }: DocumentViewerProps) {
	const { documentViewerOpen, closeDocumentViewer, documentViewerWidth, setDocumentViewerWidth } = useLayout();
	const { width, isResizing, startResize } = useResizable({
		defaultWidth: documentViewerWidth,
		minWidth: 400,
		maxWidth: 1400,
		storageKey: 'document-viewer-width',
	});

	// Sincronizar a largura com o contexto
	useEffect(() => {
		setDocumentViewerWidth(width);
	}, [width, setDocumentViewerWidth]);

	const rawTipo = documento?.ds_tipo?.toLowerCase() || '';
	const tipo = rawTipo === 'nfce' ? 'nfe' : rawTipo;
	const id = documento?.id_nfse || documento?.id_nfe || documento?.id_cte || '';

	// Query para buscar os dados completos do documento
	const { data: documentoCompleto, isFetching } = useQuery({
		queryKey: ['documento-completo', tipo, id],
		queryFn: () => fetchData(`/api/fiscal/documentos/${tipo}/${id}`),
		enabled: Boolean(documento && documentViewerOpen && tipo && id),
		staleTime: 1000 * 60 * 5,
	});

	const Viewer =
		tipo && viewers[tipo]
			? dynamic<ViewerProps>(viewers[tipo], {
					loading: () => <Skeleton className='h-96 w-full' />,
				})
			: null;

	const numero = documento?.js_nfse?.ds_numero || documento?.js_nfe?.ds_numero || documento?.js_cte?.ds_numero;

	if (!documentViewerOpen) return null;

	return (
		<div
			className={cn('document-viewer-content fixed inset-y-0 right-0 z-50 flex', isResizing && 'no-select')}
			style={{ width: `${width}px` }}
		>
			{/* Resize Handle */}
			<div
				className={cn(
					'bg-border hover:bg-accent document-viewer-resize-handle w-1 flex-shrink-0 cursor-ew-resize transition-colors',
					isResizing && 'bg-accent resizing',
				)}
				onMouseDown={startResize}
				title='Arraste para redimensionar'
			/>

			{/* Content */}
			<div className='bg-background flex flex-1 flex-col overflow-hidden border-l shadow-lg'>
				{/* Header */}
				<div className='flex-shrink-0 border-b p-4'>
					<div className='flex items-center justify-between'>
						<div>
							<h2 className='text-lg font-semibold'>Documento Fiscal {numero ? `- Nº ${numero}` : ''}</h2>
							<p className='text-muted-foreground text-sm'>{tipo.toUpperCase()}</p>
						</div>
						<button
							onClick={closeDocumentViewer}
							className='ring-offset-background focus:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'
							title='Fechar visualizador'
						>
							<X className='h-4 w-4' />
						</button>
					</div>
				</div>

				{/* Content Area */}
				<div className='flex-1 overflow-auto p-4'>
					{isFetching && <Skeleton className='h-96 w-full' />}

					{!isFetching && !documentoCompleto && (
						<div className='text-muted-foreground py-8 text-center'>Erro ao carregar o documento</div>
					)}

					{!isFetching && documentoCompleto && Viewer && <Viewer documento={documentoCompleto} />}

					{!isFetching && documentoCompleto && !Viewer && (
						<div className='text-muted-foreground py-8 text-center'>Visualizador não disponível para este tipo de documento</div>
					)}
				</div>
			</div>
		</div>
	);
}
