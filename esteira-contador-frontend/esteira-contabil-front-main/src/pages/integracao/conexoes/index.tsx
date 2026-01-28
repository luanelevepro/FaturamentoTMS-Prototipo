import React from 'react';
import Head from 'next/head';
import { useQuery, useQueries } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/states/empty-state';
import { getTipoIntegracao, TipoIntegracao } from '@/services/api/tipo-integracao';
import { getIntegracao, Integration, testarIntegracao } from '@/services/api/integracao';
import IntegrationConfigModal from '@/components/general/integracao/btn-insert-dados-integracao';
import { useCompanyContext } from '@/context/company-context';
import { toast } from 'sonner';

interface IntegrationWithCampos extends Integration {
	sis_integracao_campos: {
		id: string;
		ds_campo_nome: string;
		ds_campo_placeholder: string;
		ds_campo_tipo: string;
		ds_campo_ordem: number;
	}[];
}

export default function IntegrationsPage() {
	const { state: empresaId } = useCompanyContext();
	const {
		data: tipos = [],
		isError: errTipos,
		error: eTipos,
	} = useQuery<TipoIntegracao[]>({
		queryKey: ['get-integracao-tipos'],
		queryFn: getTipoIntegracao,
	});
	const {
		data: integracoes = [],
		isError: errInts,
		error: eInts,
		isLoading: loadingInts,
	} = useQuery<IntegrationWithCampos[]>({
		queryKey: ['get-integracao', empresaId],
		queryFn: async () => await getIntegracao(empresaId),
		staleTime: 1000 * 60 * 5,
		enabled: !!empresaId,
	});
	const connectionQueries = useQueries({
		queries: integracoes.map((intg) => ({
			queryKey: ['test-conexao', intg.id, empresaId],
			queryFn: () => testarIntegracao(intg.id, empresaId),
			staleTime: 1000 * 60 * 5,
			enabled: !!empresaId,
		})),
	});

	if (errTipos) toast.error(`Erro ao buscar tipos: ${(eTipos as Error).message}`);
	if (errInts) toast.error(`Erro ao buscar integrações: ${(eInts as Error).message}`);

	return (
		<>
			<Head>
				<title>Integrações | Esteira</title>
			</Head>
			<DashboardLayout title='Integrações' description='Visualize suas integrações agrupadas por tipo.'>
				<div className='w-full max-w-5xl space-y-8'>
					{loadingInts ? (
						<p className='text-center'>Carregando integrações...</p>
					) : integracoes.length === 0 || tipos.length === 0 ? (
						<EmptyState label='Nenhuma integração encontrada.' />
					) : (
						tipos.map((tipo) => {
							const itens = integracoes.filter((i) => i.js_tipo_integracao.id === tipo.id);
							if (!itens.length) return null;

							return (
								<section key={tipo.id} className='space-y-4'>
									<h2 className='text-2xl font-bold'>{tipo.ds_nome}</h2>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
										{itens.map((integracao) => {
											const idx = integracoes.findIndex((i) => i.id === integracao.id);
											const q = connectionQueries[idx];

											const status = q.isLoading
												? { variant: 'outline', label: 'Testando...' }
												: q.isError
													? { variant: 'danger', label: 'Erro' }
													: q.data?.success
														? { variant: 'success', label: 'Ativo' }
														: { variant: 'warning', label: 'Inativo' };

											return (
												<IntegrationConfigModal key={integracao.id} integracaoId={integracao.id} is_view={false}>
													<Card className='cursor-pointer shadow-none transition-shadow hover:shadow-md'>
														<CardContent className='space-y-2'>
															<h3 className='text-lg font-semibold'>{integracao.ds_nome}</h3>
															{integracao.ds_descricao && (
																<p className='text-muted-foreground text-sm'>{integracao.ds_descricao}</p>
															)}
														</CardContent>
														<CardFooter>
															<Badge variant={status.variant as 'outline' | 'destructive' | 'success' | 'danger'}>
																{status.label}
															</Badge>
														</CardFooter>
													</Card>
												</IntegrationConfigModal>
											);
										})}
									</div>
								</section>
							);
						})
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
