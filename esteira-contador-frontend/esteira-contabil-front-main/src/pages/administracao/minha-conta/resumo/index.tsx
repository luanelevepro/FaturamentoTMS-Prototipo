import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import PageLayout from '@/components/layout/page-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/states/empty-state';
import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getConsumoIntegracaoByEmpresasList, getConsumoIntegracaoEmpAndCompt } from '@/services/api/administrativo/consumo-integracao';
import { useCompanyContext } from '@/context/company-context';
import { toast } from 'sonner';
import { CompanyFilter } from '@/components/ui/company-filter';
import { getSisEmpresasByAdmEmpresasList } from '@/services/api/administrativo/administrativo-empresas';
import { MonthYearSelector } from '@/components/ui/month-year-selector';
import { Button } from '@/components/ui/button';

// todo: a partir dos id's de adm empresa que os consumos gerais terão, poderemos montar um seletor de multipla escolha de empresas e assim enviar para o back uma lista de empresas e uma competencia e podendo então fazer o consumo de uma ou mais empresas especificas, caso necessário

interface ConsumoResult {
	ds_consumo: string;
	ds_limite: number;
}

export interface ServicoVariavel {
	id: string;
	dt_competencia: string;
	ds_consumo: string;
	id_integracao: string;
	id_adm_empresas: string | string[];
	ds_limite: number;
	js_integracao: {
		id: string;
		ds_nome: string;
		ds_descricao: string;
		fl_is_para_escritorio: boolean;
		id_tipo_integracao: string;
	};
}

type Empresa = {
	id: string;
	ds_fantasia: string;
};

export default function MinhaConta() {
	const [activeTab, setActiveTab] = useState('servicos');
	const { state: empresaId } = useCompanyContext();
	const [competencia, setCompetencia] = useState(new Date().toISOString());
	const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>({});

	// const servicosFixos = [
	// 	{
	// 		nome: 'Módulo Financeiro',
	// 		valor: 149.9,
	// 		status: 'ativo',
	// 		proximaCobranca: '15/08/2025',
	// 	},
	// 	{
	// 		nome: 'Módulo Fiscal',
	// 		valor: 199.9,
	// 		status: 'ativo',
	// 		proximaCobranca: '15/08/2025',
	// 	},
	// 	{
	// 		nome: 'Usuários Adicionais (5x)',
	// 		valor: 250.0,
	// 		status: 'ativo',
	// 		proximaCobranca: '15/08/2025',
	// 	},
	// ];
	const {
		data = [],
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery<ServicoVariavel[]>({
		queryKey: ['get-servicos-variaveis', empresaId, competencia],
		queryFn: () => getConsumoIntegracaoEmpAndCompt(empresaId, competencia.toString()),
		staleTime: 1000 * 60 * 5,
		enabled: activeTab === 'servicos' && !!empresaId && !!competencia,
	});

	const gerais = data.filter((s) => Array.isArray(s.id_adm_empresas) && s.js_integracao.ds_nome.endsWith(' - Geral')) as Array<
		ServicoVariavel & { id_adm_empresas: string[] }
	>;

	const empresaQueries = useQueries({
		queries: gerais.map((geral) => ({
			queryKey: ['empresas-por-geral', geral.id],
			queryFn: () => getSisEmpresasByAdmEmpresasList(geral.id_adm_empresas),
			enabled: geral.id_adm_empresas.length > 0,
			staleTime: 1000 * 60 * 5,
		})),
	}) as UseQueryResult<Empresa[], unknown>[];

	const consumoQueries = useQueries({
		queries: Object.entries(selectedMap).map(([geralId, empresasIds]) => {
			const geral = gerais.find((g) => g.id === geralId);
			if (!geral || empresasIds.length === 0) {
				return {
					queryKey: ['consumo-por-empresas-vazio', geralId],
					queryFn: () => Promise.resolve({} as ConsumoResult),
					enabled: false,
					staleTime: 1000 * 60 * 5,
				};
			}

			return {
				queryKey: ['consumo-por-empresas', empresasIds, geral.id_integracao, competencia],
				queryFn: () => getConsumoIntegracaoByEmpresasList(empresasIds, geral.id_integracao, competencia) as Promise<ConsumoResult>,
				enabled: empresasIds.length > 0,
				staleTime: 1000 * 60 * 5,
			};
		}),
	});

	function areArraysEqual(a: string[] = [], b: string[] = []) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => v === b[i]);
	}

	function onSelect(geralId: string, escolhas: string[]) {
		setSelectedMap((prev) => {
			const atual = prev[geralId] || [];
			if (areArraysEqual(atual, escolhas)) {
				return prev; // nada mudou → sem update
			}
			return { ...prev, [geralId]: escolhas };
		});
	}

	if (isError) {
		toast.error((error as Error).message);
	}

	const formatCurrency = (value: number): string => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	};

	const calcularPercentualUso = (usado: string, limite: number) => {
		const usadoNumber = parseFloat(usado);
		return Math.min((usadoNumber / limite) * 100, 100);
	};

	const getCorStatus = (percentual: number) => {
		if (percentual >= 90) return 'text-red-600 bg-red-100';
		if (percentual >= 70) return 'text-yellow-600 bg-yellow-100';
		return 'text-green-600 bg-green-100';
	};

	useEffect(() => {
		if (gerais.length > 0 && empresaQueries.every((q) => q.data)) {
			const initialMap: Record<string, string[]> = {};

			gerais.forEach((geral, idx) => {
				const eq = empresaQueries[idx];
				if (eq.data) {
					initialMap[geral.id] = eq.data.map((e) => e.id);
				}
			});

			setSelectedMap((prev) => {
				// Não sobrescreve seleções existentes
				if (Object.keys(prev).length > 0) return prev;
				return initialMap;
			});
		}
	}, [gerais, empresaQueries]);

	return (
		<DashboardLayout>
			<PageLayout className='mx-auto p-6'>
				<Tabs value={activeTab} onValueChange={setActiveTab} className='mb-6'>
					<TabsList className='grid w-full grid-cols-4'>
						<TabsTrigger value='resumo'>Resumo</TabsTrigger>
						<TabsTrigger value='servicos'>Serviços & Consumo</TabsTrigger>
						<TabsTrigger value='faturas'>Faturas</TabsTrigger>
						<TabsTrigger value='planos'>Planos & Upgrades</TabsTrigger>
					</TabsList>
					{/* Conteúdo da aba "Resumo” */}
					<TabsContent value='resumo' className='space-y-8'>
						<Card>
							<EmptyState label='Em breve...' />
						</Card>
					</TabsContent>
					{/* Conteúdo da aba “Serviços & Consumo” */}
					<TabsContent value='servicos' className='space-y-8'>
						{/* Serviços Fixos */}
						{/* {servicosFixos.length === 0 ? (
							<EmptyState label='Nenhum serviço fixo encontrado.' />
						) : (
							<Card>
								<CardHeader>
									<CardTitle>Serviços com Cobrança Fixa</CardTitle>
									<CardDescription>Aqui estão todos os seus serviços recorrentes.</CardDescription>
								</CardHeader>
								<CardContent className='space-y-3'>
									{servicosFixos.map((s, i) => (
										<div key={i} className='flex items-center justify-between border-b border-gray-200 py-3 last:border-b-0'>
											<div>
												<p className='font-medium'>{s.nome}</p>
												<p className='text-sm'>Próxima cobrança: {s.proximaCobranca}</p>
											</div>
											<div className='text-right'>
												<p className='font-semibold'>{formatCurrency(s.valor)}</p>
												<span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>
													{s.status}
												</span>
											</div>
										</div>
									))}
								</CardContent>
							</Card>
						)} */}
						<Card>
							<CardHeader>
								<CardTitle>
									<div className='flex items-center justify-between'>
										Serviços com Cobrança Variável
										<div className='flex space-x-1.5'>
											<Button
												tooltip='Atualizar'
												variant='outline'
												size='icon'
												disabled={isFetching}
												onClick={() => {
													refetch();
													empresaQueries.forEach((q) => q.refetch && q.refetch());
													consumoQueries.forEach((q) => q.refetch && q.refetch());
												}}
											>
												<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
											</Button>
											<MonthYearSelector
												placeholder='Mês/Ano'
												className='max-w-32'
												selected={competencia ? new Date(competencia) : new Date()}
												onSelect={(date) => setCompetencia(date ? date.toISOString().slice(0, 7) : '')}
											/>
										</div>
									</div>
								</CardTitle>
								<CardDescription>Considere o uso e o limite de cada serviço nesta seção.</CardDescription>
							</CardHeader>

							{data.length === 0 ? (
								<EmptyState label='Nenhum serviço variável encontrado.' />
							) : (
								<CardContent className='space-y-4'>
									{data.map((s: ServicoVariavel, i: number) => {
										if (s.js_integracao.ds_nome.endsWith(' - Geral')) return null; // Ignora serviços gerais
										const pct = calcularPercentualUso(s.ds_consumo, s.ds_limite);
										const cor = getCorStatus(pct);
										return (
											<div key={i} className='rounded-lg border p-4'>
												<div className='mb-3 flex items-start justify-between'>
													<div>
														<p className='font-medium'>{s.js_integracao.ds_nome}</p>
														<p className='text-sm'>{formatCurrency(0.05)} por unidade</p>
													</div>
													<div className='text-right'>
														<p className='font-semibold'>{formatCurrency(parseFloat(s.ds_consumo) * 0.05)}</p>
														<p className='text-sm'>
															{s.ds_consumo.toLocaleString()} / {s.ds_limite.toLocaleString('pt-BR')}
														</p>
													</div>
												</div>

												{/* Barra de progresso */}
												<div className='mb-2 h-2 w-full rounded-full bg-gray-200'>
													<div
														className={`h-2 rounded-full transition-all ${
															pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
														}`}
														style={{ width: `${pct}%` }}
													/>
												</div>

												<div className='flex items-center justify-between'>
													<span className={`rounded-full px-2 py-1 text-xs ${cor}`}>{pct.toFixed(1)}% utilizado</span>
													{pct >= 90 && <span className='text-xs font-medium text-red-600'>Próximo do limite</span>}
												</div>
											</div>
										);
									})}
									{data.some((servico) => Array.isArray(servico.id_adm_empresas)) ? (
										<>
											{gerais.map((g, idx) => {
												const eq = empresaQueries[idx];
												// 1) status da query de nomes de empresas
												if (eq.isLoading) return <div key={g.id}>Carregando empresas…</div>;
												if (eq.isError || !eq.data) return <div key={g.id}>Erro ao carregar empresas</div>;

												return (
													<div key={g.id} className='rounded-lg border p-4'>
														<div className='mb-3 flex items-start justify-between gap-4'>
															<CompanyFilter
																companies={eq.data}
																initialSelectedIds={eq.data.map((c) => c.id)}
																onChange={(ids) => onSelect(g.id, ids)}
															/>
														</div>
														{consumoQueries.map((cq, i) => {
															const geralId = Object.keys(selectedMap)[i];
															if (geralId !== g.id) return null;

															if (cq.isLoading) return <div key={`consumo-${g.id}`}>Carregando dados de consumo…</div>;
															if (cq.isError || !cq.data)
																return <div key={`consumo-${g.id}`}>Nenhum consumo encontrado</div>;

															const { ds_consumo, ds_limite } = cq.data as ConsumoResult;
															const pct = calcularPercentualUso(ds_consumo, ds_limite);
															const cor = getCorStatus(pct);

															return (
																<div key={`consumo-${g.id}`}>
																	<div className='mb-3 flex items-start justify-between gap-4'>
																		<div className='flex flex-col items-start space-y-1'>
																			<span className='block font-medium'>{g.js_integracao.ds_nome}</span>
																			<p className='text-sm'>R$ 0,05 por unidade</p>
																		</div>
																		<div className='mb-3 flex justify-end'>
																			<div className='text-right'>
																				<p className='font-semibold'>{formatCurrency(parseFloat(ds_consumo) * 0.05)}</p>
																				<p className='text-sm'>
																					{Number(ds_consumo).toLocaleString()} / {ds_limite.toLocaleString('pt-BR')}
																				</p>
																			</div>
																		</div>
																	</div>
																	<div className='mb-2 h-2 w-full rounded-full bg-gray-200'>
																		<div
																			className={`h-2 rounded-full transition-all ${
																				pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'
																			}`}
																			style={{ width: `${pct}%` }}
																		/>
																	</div>
																	<div className='flex items-center justify-between'>
																		<span className={`rounded-full px-2 py-1 text-xs ${cor}`}>
																			{pct.toFixed(1)}% utilizado
																		</span>
																		{pct >= 90 && (
																			<span className='text-xs font-medium text-red-600'>Próximo do limite</span>
																		)}
																	</div>
																</div>
															);
														})}
													</div>
												);
											})}
										</>
									) : (
										<div></div>
									)}
								</CardContent>
							)}
						</Card>
						{/* Serviços Variáveis */}
					</TabsContent>
					{/* Conteúdo da aba "Faturas */}
					<TabsContent value='faturas' className='space-y-8'>
						<Card>
							<EmptyState label='Em breve...' />
						</Card>
					</TabsContent>
					{/* Conteúdo da aba "Planos & Upgrades */}
					<TabsContent value='planos' className='space-y-8'>
						<Card>
							<EmptyState label='Em breve...' />
						</Card>
					</TabsContent>
				</Tabs>
			</PageLayout>
		</DashboardLayout>
	);
}
