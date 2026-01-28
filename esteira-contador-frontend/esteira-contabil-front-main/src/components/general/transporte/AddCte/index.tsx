import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, SquarePlus } from 'lucide-react';
import TableNfe from './tableNFe';
import InfoFrete from './infoFrete';
import { toast } from 'sonner';
import { IDFe } from '@/interfaces/faturamento/transporte/dfe';
import { useCompanyContext } from '@/context/company-context';
import { postCte } from '@/services/api/transporte';
import { useQueryClient } from '@tanstack/react-query';
import { ICreateCte } from '@/interfaces';

export default function AddCte() {
	const queryClient = useQueryClient();
	const { state: empresa_id } = useCompanyContext();
	const [open, setOpen] = useState(false);
	const [firstStep, setFirstStep] = useState(false);
	const [invoice, setInvoice] = useState<IDFe[]>([]);
	const [loading, setLoading] = useState(false);
	console.log('🚀 ~ file: index.tsx:13 ~ AddCte ~ empresa_id:', loading);
	const cleanFilter = () => {
		setFirstStep(false);
		setInvoice([]);
		setOpen(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!firstStep) {
			console.log('🚫 Ainda não está no último passo, não envia.');
			return;
		}

		const formData = new FormData(e.currentTarget as HTMLFormElement);

		const data = Object.fromEntries(formData.entries());

		
		const dataPayloadCte: ICreateCte = {
			nfe_ids: invoice.map((inv) => inv.id),
			id_empresa: empresa_id,
			dados_adicionais: {
				modal: String(data.modal || '01'),
				tpServ: String(data.tpserv || '0'),
				RNTRC: String(data.RNTRC || '13346456'),
				dPrev: String(data.dPrev),
				//depois disso
				cfop: String(data.cfop || ''),
				pagamento: String(data.pagamento || ''),
				valorFrete: String(data.valorFrete || ""),
				pesoTotal: Number(data.pesoTotal || 0),
			},
		};

		try {
			setLoading(true);
			await postCte(dataPayloadCte);
			queryClient.invalidateQueries({ queryKey: ['cte'] });
			toast.success('Cte salvo com sucesso');
		} catch (error) {
			console.error('Erro ao salvar:', error);
			toast.error('Erro ao salvar Cte');
		} finally {
			setLoading(false);
		}
		cleanFilter();
	};

	const handleNext = () => {
		if (invoice.length === 0) {
			alert('Selecione pelo menos uma NF-e.');
			return;
		}
		setFirstStep(true);
	};

	useEffect(() => {
		if (open && firstStep) {
			const firstInput = document.querySelector('#placa') as HTMLElement;
			firstInput?.focus();
		}
	}, [open, firstStep]);

	return (
		<Drawer open={open} onOpenChange={setOpen} dismissible={false}>
			<DrawerTrigger asChild>
				<Button>
					<SquarePlus />
					Cadastrar CT-e
				</Button>
			</DrawerTrigger>

			<DrawerContent inert={!open} className='top-0 mt-0! rounded-none! [&>div.bg-muted]:hidden'>
				<form id='form-cte' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-sm'>Cadastrar</p>
									<p className='text-start text-xl font-semibold'>CTe</p>
								</div>
								<div className='flex gap-4'>
									<Button variant='outline' color='red' onClick={cleanFilter}>
										Cancelar
									</Button>
									{firstStep && (
										<Button variant='secondary' type='button' onClick={() => setFirstStep(false)}>
											Voltar
										</Button>
									)}
									<Button
										disabled={invoice.length === 0}
										type='button'
										onClick={() => {
											if (!firstStep) {
												handleNext();
											} else {
												const form = document.getElementById('form-cte') as HTMLFormElement;
												form?.requestSubmit();
											}
										}}
									>
										{!firstStep ? 'Próximo' : 'Finalizar'}
									</Button>
								</div>
							</div>
							<DrawerDescription></DrawerDescription>
						</DrawerTitle>
					</DrawerHeader>

					<div className='max-h-[calc(100dvh-73px)] overflow-auto px-8 py-8'>
						<div className='flex items-center gap-4'>
							<div
								className={`flex h-12 w-fit items-center justify-center gap-2 rounded-lg px-3 ${
									!firstStep ? 'bg-card-foreground' : 'border-sidebar-ring text-background border'
								}`}
							>
								<span
									className={`flex size-5 items-center justify-center rounded-full ${
										!firstStep ? 'bg-[#A7A7A7]' : 'bg-green-500'
									}`}
								>
									<Check className='size-3.5 text-white' />
								</span>
								<p className={`${!firstStep ? 'text-ring' : 'text-gray font-medium'}`}>Selecionar NF-e</p>
							</div>
							<ChevronRight color='#717171' />
							<div
								className={`flex h-12 w-fit items-center justify-center gap-2 rounded-lg px-3 ${
									firstStep ? 'bg-card-foreground' : 'border-sidebar-ring text-background border'
								}`}
							>
								<span className={`flex size-5 items-center justify-center rounded-full ${firstStep ? 'bg-green-500' : 'bg-gray'}`}>
									<Check className='size-3.5 text-white' />
								</span>
								<p className={`${firstStep ? 'text-ring' : 'text-gray font-medium'}`}>Informações do frete</p>
							</div>
						</div>

						<h6 className='mt-6 mb-4 font-medium'>{!firstStep ? 'Selecione todas as NF-e que deseja gerar neste CTe:' : 'Carga'}</h6>
						{firstStep ? <InfoFrete data={invoice} /> : <TableNfe invoice={invoice} setInvoice={setInvoice} />}
					</div>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
