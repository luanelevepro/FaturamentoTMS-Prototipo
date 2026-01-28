import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useState, useDeferredValue, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import TableNfe, { IMdfe } from './tableMdfe';
import InfoFrete from './infoFreteMdfe';
import { toast } from 'sonner';

interface IProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function AddMDFe({ open, setOpen }: IProps) {
	const [firstStep, setFirstStep] = useState(false);
	const [invoice, setInvoice] = useState<IMdfe[]>([]);
	const [query, setQuery] = useState('');
	const deferredQuery = useDeferredValue(query);
	console.log('🚀 ~ AddCte ~ deferredQuery:', deferredQuery);

	const cleanFilter = () => {
		setFirstStep(false);
		setInvoice([]);
		setOpen(false);
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!firstStep) {
			console.log('🚫 Ainda não está no último passo, não envia.');
			return;
		}

		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());
		toast.success('CTe registrado com sucesso');
		console.log('🚀 Dados enviados:', { ...data, invoice });
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
			<DrawerContent inert={!open} className='top-0 !mt-0 !rounded-none [&>div.bg-muted]:hidden'>
				<form id='form-cte' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-sm'>Cadastrar</p>
									<p className='text-start text-xl font-semibold'>MDFe</p>
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
												const form = document.getElementById('form-mdfe') as HTMLFormElement;
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

					<div className='min-h-[calc(100dvh - 0px)] h-dvh overflow-y-auto px-8 pt-8 pb-3'>
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
								<p className={`${!firstStep ? 'text-ring' : 'text-gray font-medium'}`}>Selecionar CTe</p>
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
								<p className={`${firstStep ? 'text-ring' : 'text-gray font-medium'}`}>Informações adicionais</p>
							</div>
						</div>

						<h6 className='mt-6 mb-4 font-medium'>{!firstStep ? 'Selecione todos os CTes que deseja gerar neste MDFe:' : 'Carga'}</h6>

						{firstStep ? (
							<InfoFrete data={invoice} />
						) : (
							<TableNfe invoice={invoice} query={query} setInvoice={setInvoice} setQuery={setQuery} />
						)}
					</div>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
