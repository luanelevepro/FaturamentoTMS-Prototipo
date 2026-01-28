import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Building2, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/pages/administracao/empresas';
import { getSegmentosEmpresas } from '@/services/api/fiscal';
import { getRegimesTributarios } from '@/services/api/sistema';
import { addSegmentoToEmpresa, addRegimeTributarioToEmpresa, getRegimeTributarioById, getSegmentoById } from '@/services/api/empresas';

interface BtnVincularParametrosProps {
	empresa: Company;
}

interface Segmento {
	id: string;
	ds_nome: string;
	ds_descricao?: string;
}

interface RegimeTributario {
	id: string;
	ds_nome: string;
	ds_descricao?: string;
}

export default function BtnVincularParametros({ empresa }: BtnVincularParametrosProps) {
	const [open, setOpen] = useState(false);
	const [selectedSegmento, setSelectedSegmento] = useState<string>('');
	const [selectedRegime, setSelectedRegime] = useState<string>('');
	const [saving, setSaving] = useState(false);

	// Query para segmentos disponíveis
	const { data: segmentos = [], isLoading: loadingSegmentos } = useQuery<Segmento[]>({
		queryKey: ['segmentos-empresas'],
		queryFn: () => getSegmentosEmpresas(),
		enabled: open,
	});

	// Query para regimes tributários disponíveis
	const { data: regimes = [], isLoading: loadingRegimes } = useQuery<RegimeTributario[]>({
		queryKey: ['regimes-tributarios'],
		queryFn: () => getRegimesTributarios(),
		enabled: open,
	});

	const { data: segmentoVinculado } = useQuery<Segmento | null>({
		queryKey: ['empresa-segmento', empresa.id],
		queryFn: () => (empresa.id_segmento ? getSegmentoById(empresa.id_segmento) : Promise.resolve(null)),
		enabled: open,
	});

	const { data: regimeVinculado } = useQuery<RegimeTributario | null>({
		queryKey: ['empresa-regime', empresa.id],
		queryFn: () => (empresa.id_regime_tributario ? getRegimeTributarioById(empresa.id_regime_tributario) : Promise.resolve(null)),
		enabled: open,
	});
	useEffect(() => {
		if (segmentoVinculado) {
			setSelectedSegmento(segmentoVinculado.id);
		}
		if (regimeVinculado) {
			setSelectedRegime(regimeVinculado.id);
		}
	}, [segmentoVinculado, regimeVinculado]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const promises: Promise<unknown>[] = [];
			if (selectedSegmento) {
				promises.push(addSegmentoToEmpresa(selectedSegmento, empresa.id));
			}

			if (selectedRegime) {
				promises.push(addRegimeTributarioToEmpresa(selectedRegime, empresa.id));
			}

			if (promises.length > 0) {
				await Promise.all(promises);

				let message = 'Parâmetros vinculados: ';
				const updates = [];
				if (selectedSegmento) updates.push('Segmento');
				if (selectedRegime) updates.push('Regime Tributário');
				message += updates.join(' e ');

				toast.success(message);
			} else {
				toast.warning('Nenhum parâmetro foi selecionado');
			}

			setOpen(false);
		} catch (error) {
			toast.error(`Erro ao vincular parâmetros: ${String(error)}`);
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		if (segmentoVinculado) {
			setSelectedSegmento(segmentoVinculado.id);
		} else {
			setSelectedSegmento('');
		}

		if (regimeVinculado) {
			setSelectedRegime(regimeVinculado.id);
		} else {
			setSelectedRegime('');
		}

		setOpen(false);
	};

	return (
		<>
			<Button variant='ghost' size='icon' onClick={() => setOpen(true)} tooltip='Parâmetros'>
				<Settings className='h-4 w-4' />
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className='flex max-h-[90vh] max-w-4xl flex-col overflow-hidden'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-xl font-semibold'>
							<Building2 className='h-5 w-5' />
							Vincular Parâmetros - {empresa.ds_fantasia || empresa.ds_razao_social}
						</DialogTitle>
					</DialogHeader>

					<div className='flex-1 overflow-hidden'>
						<Tabs defaultValue='segmentos' className='flex h-full flex-col'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='segmentos' className='gap-2'>
									<Building2 className='h-4 w-4' />
									Segmentos
								</TabsTrigger>
								<TabsTrigger value='regimes' className='gap-2'>
									<FileText className='h-4 w-4' />
									Regimes Tributários
								</TabsTrigger>
							</TabsList>

							{/* Aba Segmentos */}
							<TabsContent value='segmentos' className='flex-1 overflow-hidden'>
								<Card className='flex h-full flex-col'>
									<CardHeader className='pb-3'>
										<CardTitle className='flex items-center justify-between'>
											<span>Segmentos Disponíveis</span>
											<Badge variant='secondary'>{selectedSegmento ? '1 selecionado' : 'Nenhum selecionado'}</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent className='flex-1 space-y-3 overflow-y-auto'>
										{loadingSegmentos ? (
											<div className='flex items-center justify-center py-8'>
												<Loader2 className='h-6 w-6 animate-spin' />
												<span className='text-muted-foreground ml-2'>Carregando segmentos...</span>
											</div>
										) : segmentos.length > 0 ? (
											<>
												{/* Opção para desmarcar */}
												<div
													className='hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors'
													onClick={() => setSelectedSegmento('')}
												>
													<div className='mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300'>
														{!selectedSegmento && <div className='h-2 w-2 rounded-full bg-blue-600' />}
													</div>
													<div className='flex-1'>
														<label className='text-muted-foreground cursor-pointer text-sm font-medium'>
															Nenhum segmento
														</label>
														<p className='text-muted-foreground mt-1 text-xs'>Remover vinculação de segmento</p>
													</div>
												</div>

												{segmentos.map((segmento) => (
													<div
														key={segmento.id}
														className='hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors'
														onClick={() => setSelectedSegmento(segmento.id)}
													>
														<div className='mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300'>
															{selectedSegmento === segmento.id && <div className='h-2 w-2 rounded-full bg-blue-600' />}
														</div>
														<div className='flex-1'>
															<label className='cursor-pointer text-sm font-medium'>{segmento.ds_nome}</label>
															{segmento.ds_descricao && (
																<p className='text-muted-foreground mt-1 text-xs'>{segmento.ds_descricao}</p>
															)}
														</div>
														{selectedSegmento === segmento.id && <CheckCircle className='h-4 w-4 text-blue-600' />}
													</div>
												))}
											</>
										) : (
											<div className='flex flex-col items-center justify-center py-8 text-center'>
												<Building2 className='text-muted-foreground mb-2 h-8 w-8' />
												<p className='text-muted-foreground text-sm'>Nenhum segmento disponível</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							{/* Aba Regimes Tributários */}
							<TabsContent value='regimes' className='flex-1 overflow-hidden'>
								<Card className='flex h-full flex-col'>
									<CardHeader className='pb-3'>
										<CardTitle className='flex items-center justify-between'>
											<span>Regimes Tributários Disponíveis</span>
											<Badge variant='secondary'>{selectedRegime ? '1 selecionado' : 'Nenhum selecionado'}</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent className='flex-1 space-y-3 overflow-y-auto'>
										{loadingRegimes ? (
											<div className='flex items-center justify-center py-8'>
												<Loader2 className='h-6 w-6 animate-spin' />
												<span className='text-muted-foreground ml-2'>Carregando regimes...</span>
											</div>
										) : regimes.length > 0 ? (
											<>
												{/* Opção para desmarcar */}
												<div
													className='hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors'
													onClick={() => setSelectedRegime('')}
												>
													<div className='mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300'>
														{!selectedRegime && <div className='h-2 w-2 rounded-full bg-blue-600' />}
													</div>
													<div className='flex-1'>
														<label className='text-muted-foreground cursor-pointer text-sm font-medium'>
															Nenhum regime tributário
														</label>
														<p className='text-muted-foreground mt-1 text-xs'>Remover vinculação de regime tributário</p>
													</div>
												</div>

												{regimes.map((regime) => (
													<div
														key={regime.id}
														className='hover:bg-muted/50 flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors'
														onClick={() => setSelectedRegime(regime.id)}
													>
														<div className='mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300'>
															{selectedRegime === regime.id && <div className='h-2 w-2 rounded-full bg-blue-600' />}
														</div>
														<div className='flex-1'>
															<label className='cursor-pointer text-sm font-medium'>{regime.ds_nome}</label>
															{regime.ds_descricao && (
																<p className='text-muted-foreground mt-1 text-xs'>{regime.ds_descricao}</p>
															)}
														</div>
														{selectedRegime === regime.id && <CheckCircle className='h-4 w-4 text-blue-600' />}
													</div>
												))}
											</>
										) : (
											<div className='flex flex-col items-center justify-center py-8 text-center'>
												<FileText className='text-muted-foreground mb-2 h-8 w-8' />
												<p className='text-muted-foreground text-sm'>Nenhum regime tributário disponível</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>

					<DialogFooter className='flex-shrink-0'>
						<Button variant='outline' onClick={handleCancel} disabled={saving}>
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={saving} className='gap-2'>
							{saving ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									Salvando...
								</>
							) : (
								<>
									<CheckCircle className='h-4 w-4' />
									Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
