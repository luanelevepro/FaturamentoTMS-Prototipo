import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useState, useDeferredValue, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, SquarePlus } from 'lucide-react';
import { INfe } from './tableNFe';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import DrawerDocuments from './DrawerDocuments';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates,  verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableInvoiceItem from './SortableInvoiceItem';

export default function AddTravel() {
	const [open, setOpen] = useState(false);
	const [firstStep, setFirstStep] = useState(false);
	const [invoice, setInvoice] = useState<INfe[]>([]);
	console.log('🚀 ~ invoice ~>', invoice);
	const [query, setQuery] = useState('');
	const deferredQuery = useDeferredValue(query);
	console.log('🚀 ~ AddTravel ~ deferredQuery:', deferredQuery, setQuery);
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setInvoice((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	// Função para gerar o array de viagens no formato solicitado
	const getViagensList = () => {
		return invoice.map((item, index) => ({
			id: item.id,
			ordem: index + 1,
		}));
	};

	const cleanFilter = () => {
		setFirstStep(false);
		setInvoice([]);
		setOpen(false);
	};

 const handleSubmit = () => {
    if (!firstStep) {
      console.log('🚫 Ainda não está no último passo, não envia.');
      return;
    }
    
    const viagens = getViagensList();
    
    toast.success('CTe registrado com sucesso');
    console.log('🚀 Dados enviados:', { viagens });
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


	const checkStep = (title: string, completed: boolean) => {
		return (
			<div className='bg-muted flex items-center gap-4 rounded-lg p-1.75'>
				<div
					className={`text-background flex size-5.25 items-center justify-center rounded-full ${completed ? 'bg-[#38B000]' : 'bg-[#A7A7A7]'}`}
				>
					<Check className='size-4' />
				</div>
				<p className='text-primary font-bold'>{title}</p>
			</div>
		);
	};

	const totalValor = invoice.reduce((acc, item) => acc + item.valorTotal, 0);
	const totalPeso = invoice.reduce((acc, item) => acc + item.peso, 0);

	function formatarPeso(pesoEmKg: number) {
		if (pesoEmKg < 1000) {
			return `${pesoEmKg.toLocaleString('pt-BR')} Kg`;
		}

		if (pesoEmKg % 1000 === 0) {
			return `${pesoEmKg / 1000} T`;
		}

		if (pesoEmKg % 100 === 0) {
			return `${(pesoEmKg / 1000).toLocaleString('pt-BR')} T`;
		}

		return `${pesoEmKg.toLocaleString('pt-BR')} Kg`;
	}

	const firstCard = [
		{
			title: 'Valor total da carga',
			value: `${totalValor.toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL',
			})}`,
		},
		{
			title: 'Valor total do frete',
			value: `${totalValor.toLocaleString('pt-BR', {
				style: 'currency',
				currency: 'BRL',
			})}`,
		},
		{
			title: 'Valor total do peso',
			value: `${formatarPeso(totalPeso)} `,
		},
		{ title: 'Documentos selecionados', value: `${invoice.length} documentos` },
	];

	const haveDanfe = invoice.length > 0;

	return (
		<Drawer open={open} onOpenChange={setOpen} dismissible={false}>
			<DrawerTrigger asChild>
				<Button>
					<SquarePlus />
					Cadastrar Viagem
				</Button>
			</DrawerTrigger>

			<DrawerContent inert={!open} className='top-0 mt-0! rounded-none! [&>div.bg-muted]:hidden'>
				<form id='form-travel' onSubmit={handleSubmit}>
					<DrawerHeader className='border-muted-foreground/30 border-b px-8 py-3'>
						<DrawerTitle>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-muted-foreground text-sm'>Cadastrar</p>
									<p className='text-start text-xl font-semibold'>Viagem</p>
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
										onClick={() => {
											if (!firstStep) {
												handleNext();
											} else {
												handleSubmit();
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
					<Card className='h-[calc(100dvh - 72px)] m-6 p-6'>
						<div className='bg-foreground text-secondary flex justify-between rounded-lg px-2 py-2.5'>
							<h1 className='font-bold'> Carga 1</h1>
							<ChevronDown className={`${!haveDanfe && 'rotate-180'}`} />
						</div>
						{checkStep('Passo 1 - Documento da viagem', haveDanfe)}

						{invoice.length > 0 && (
							<Card className='flex flex-row gap-4 p-4 shadow-none'>
								{firstCard.map((item) => {
									return (
										<div className='flex-1' key={item.title}>
											<p className='text-sm'>{item.title}</p>
											<p className='font-semibold'>{item.value}</p>
										</div>
									);
								})}
							</Card>
						)}
						<DrawerDocuments invoice={invoice} setInvoice={setInvoice} />
						{checkStep('Passo 2 - Informação da rota e carga', haveDanfe)}
						{!haveDanfe ? (
							<div className='flex h-22 items-center justify-center rounded-lg border'>
								<p className='text-muted-foreground'>
									As informações da rota e carga serão carregadas aqui após seleção dos documentos
								</p>
							</div>
						) : (
							<div className='space-y-2 py-4'>
								<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
									<SortableContext items={invoice.map((i) => i.id)} strategy={verticalListSortingStrategy}>
										{invoice.map((item, index) => (
											<SortableInvoiceItem key={item.id} item={item} index={index} />
										))}
									</SortableContext>
								</DndContext>
							</div>
						)}
						{checkStep('Passo 3 - Informações do motorista e veículo', haveDanfe)}

						<div className='mt-5 px-8 py-3'>
							<h6 className='mt-6 mb-4 font-medium'>
								{!firstStep ? 'Selecione todas as NF-e que deseja gerar neste CTe:' : 'Carga'}
							</h6>

							{/* 	{firstStep ? (
								<InfoFrete data={invoice} />
							) : (
								<TableNfe invoice={invoice} query={query} setInvoice={setInvoice} setQuery={setQuery} />
							)} */}
						</div>
					</Card>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
