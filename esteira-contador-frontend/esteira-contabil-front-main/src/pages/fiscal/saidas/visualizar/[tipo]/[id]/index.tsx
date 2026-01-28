import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchData } from '@/services/api/request-handler';
import SystemLayout from '@/components/layout/system-layout';

/** prop mínima que todo wrapper espera */
interface ViewerProps {
	documento: unknown;
}

/* Lazy-load dos WRAPPERS (não dos viewers raiz!) */
const viewers: Record<string, () => Promise<{ default: React.ComponentType<ViewerProps> }>> = {
	nfse: () => import('@/components/viewers/wrappers/viewer-nfse'),
	nfe: () => import('@/components/viewers/wrappers/viewer-nfe'),
	cte: () => import('@/components/viewers/wrappers/viewer-cte'),
};

export default function VisualizarDispatcher() {
	const { query } = useRouter();
	const { tipo = '', id = '' } = query as { tipo?: string; id?: string };

	/* quando o tipo não existir, manda 404 mesmo */
	const Viewer = dynamic<ViewerProps>(viewers[tipo.toLowerCase()] ?? (() => import('@/pages/404')), {
		loading: () => <Skeleton className='h-96 w-full' />,
	});
	const getNumero = (doc: unknown): string | undefined =>
		typeof doc === 'object' && doc !== null && 'ds_numero' in doc ? (doc as { ds_numero?: string }).ds_numero : undefined;
	/* fetch genérico (você já fazia isso) */
	const { data, isFetching, error } = useQuery<unknown>({
		queryKey: ['documento', tipo, id],
		queryFn: () => fetchData(`/api/fiscal/documentos/${tipo}/${id}`),
		enabled: Boolean(tipo && id),
	});

	if (isFetching) return <Skeleton className='h-96 w-full' />;
	if (error) return <p>Erro ao carregar: {(error as Error).message}</p>;
	if (!data) return null;
	const numero = getNumero(data);
	return (
		<>
			<Head>
				<title>Visualizando documento fiscal | Esteira</title>
			</Head>

			<SystemLayout className='bg-muted/40 grid gap-4 p-4 lg:gap-6 lg:p-6'>
				<div className='mx-auto w-full max-w-5xl'>
					<div className='flex flex-col space-y-0.5'>
						<h2 className='text-2xl font-bold tracking-tight'>Visualizando documento fiscal</h2>

						{data && <p className='text-muted-foreground'>Nº {numero ?? '--'}</p>}
					</div>
				</div>

				{/* corpo / viewer ---------------------------------------------------- */}
				<div className='mx-auto grid w-full max-w-5xl gap-4'>
					{isFetching && <Skeleton className='h-96 w-full' />}
					{error && <p className='text-destructive'>Erro: {(error as Error).message}</p>}
					{data && <Viewer documento={data} />}
				</div>
			</SystemLayout>
		</>
	);
}
