import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useState } from 'react';
import { Button } from './button';
import { CircleX, Clock, Info, PlusSquare, Settings } from 'lucide-react';
import { Icons } from '../layout/icons';
import { Card } from './card';
import { Badge } from './badge';
import { format } from 'date-fns';
import { Switch } from './switch';
import { Label } from './label';

const itensCards = [
	{
		id: 0,
		color: 'bg-[#B9B9B9]',
		title: 'Total de rotinas',
		value: 4,
		icon: (
			<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#EBEBEB] text-[#B9B9B9]'>
				<Clock className='size-8' />
			</div>
		),
	},
	{
		id: 1,
		color: 'bg-purple-500',
		title: 'Rotinas ativas',
		value: 4,
		icon: (
			<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#D7EFCC] text-[#38b000]'>
				<Icons.tickSquare />
			</div>
		),
	},
	{
		id: 2,
		color: 'bg-red-500',
		title: 'Rotinas com erro',
		value: 0,
		icon: (
			<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#FFDEDE] text-[#D00000]'>
				<Info className='size-8' />
			</div>
		),
	},
	{
		id: 3,
		color: 'bg-blue-500',
		title: 'Rotinas em execução',
		value: 0,
		icon: (
			<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#CCE4F0] text-[#0077B6]'>
				<Icons.refreshSquare />
			</div>
		),
	},
];

const sendNF = [
	{
		ativo: true,
		title: 'Envio de NF-e Entrada para domínio - Onvio API',
		subTitle: 'Envio automático de NF-e de entrada para domínio todos os dias às 8:00.',
		tags: ['NF-e', 'Entrada', 'Domínio'],
		time: new Date(),
		days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
		delay: 0,
		ultima: new Date(),
	},
	{
		ativo: false,
		title: 'Envio de NF-e Saída para domínio - Onvio API',
		subTitle: 'Envio automático de NF-e de entrada para domínio todos os dias às 8:00.',
		tags: ['NF-e', 'Entrada', 'Domínio'],
		time: new Date(),
		days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
		delay: 0,
		ultima: new Date(),
	},
];

export default function RoutinesCenter() {
	const [open, setOpen] = useState(false);

	return (
		<Drawer open={open} onOpenChange={setOpen} dismissible={false} direction='right'>
			<DrawerTrigger asChild>
				<Button variant='ghost' size='icon' className='relative'>
					<Clock />
				</Button>
			</DrawerTrigger>

			<DrawerContent inert={!open} className='w-full max-w-[1620px] rounded-l-4xl'>
				<DrawerHeader className='p-8 pb-6'>
					<DrawerTitle>
						<div className='flex flex-col-reverse justify-between gap-4 md:flex-row md:gap-10'>
							<div className=''>
								<p className='text-start text-2xl font-semibold'>Rotinas automáticas </p>
								<DrawerDescription className='text-base font-normal'>
									Configure e gerencie o envio automático de documentos fiscais do Esteira Contador para sistemas externos.
								</DrawerDescription>
							</div>
							<div className='ml-auto flex gap-4'>
								<Button variant='secondary' onClick={() => setOpen(!open)}>
									Fechar
								</Button>
								<Button>
									<PlusSquare />
									Nova rotina
								</Button>
							</div>
						</div>
					</DrawerTitle>
				</DrawerHeader>
				<div className='flex flex-col gap-6 px-8'>
					<div className='grid gap-4 min-[560px]:grid-cols-2 min-[1080px]:grid-cols-4'>
						{itensCards.map((card, index) => {
							return (
								<Card key={card.id} className={`p-6 shadow-none order-${index}`}>
									<div className={`flex h-full justify-between`}>
										<div>
											<div className={`h-1.5 w-6 rounded-[24px] ${card.color}`} />
											<p className='text-muted-foreground mt-2 text-sm font-medium'>{card.title}</p>
											<p className='text-2xl font-semibold'>
												{card.value.toLocaleString('pt-br', {
													style: 'decimal',
													minimumIntegerDigits: 2,
												})}
											</p>
										</div>
										<div className='my-auto'>{card.icon}</div>
									</div>
								</Card>
							);
						})}
					</div>
					{sendNF.map((onvio, index) => {
						return (
							<Card key={index} className='p-6 shadow-none'>
								<div className='flex items-start justify-between gap-10 md:items-center'>
									<div>
										<h6 className='font-semibold'>{onvio.title}</h6>
										<p className='text-gray text-sm'>{onvio.subTitle}</p>
									</div>
									<div className='flex items-center space-x-2'>
										<Label className={`${onvio.ativo && 'text-gray'}`}>Inativo</Label>
										<Switch id='isEscritorio' checked={onvio.ativo} onCheckedChange={() => {}} disabled={false} />
										<Label className={`${!onvio.ativo && 'text-gray'}`}>Ativo</Label>
									</div>
								</div>
								<div className='flex flex-wrap justify-between gap-4'>
									<div className='flex-1'>
										<p className='mb-2 text-sm font-medium'>Tags</p>
										<div className='flex gap-2'>
											{onvio.tags.map((tag, index) => {
												return (
													<Badge key={index} className='max-h-[30px] px-2 py-1 text-sm font-normal' variant={'gray'}>
														{tag}
													</Badge>
												);
											})}
										</div>
									</div>
									<div className='flex-1'>
										<p className='mb-2 text-sm font-medium'>Execução</p>
										<div className='flex gap-2'>
											<Badge className='max-h-[30px] px-2 py-1 text-sm font-normal' variant={'gray'}>
												{format(onvio.time, 'hh:mm')}
											</Badge>
										</div>
									</div>
									<div className='flex-1'>
										<p className='mb-2 text-sm font-medium'>Dias</p>
										<div className='flex gap-2'>
											{onvio.days.map((day, index) => {
												return (
													<Badge key={index} className='max-h-[30px] px-2 py-1 text-sm font-normal' variant={'gray'}>
														{day}
													</Badge>
												);
											})}
										</div>
									</div>
									<div className='flex-1'>
										<p className='mb-2 text-sm font-medium'>Delay</p>
										<div className='flex gap-2'>
											<Badge className='max-h-[30px] px-2 py-1 text-sm font-normal' variant={'gray'}>
												D <span className='pb-1'>+</span> {onvio.delay}
											</Badge>
										</div>
									</div>
									<div className='flex-1'>
										<p className='mb-2 text-sm font-medium'>Última execução</p>
										<div className='flex gap-2'>
											<Badge className='max-h-[30px] px-2 py-1 text-sm font-normal' variant={'successTwo'}>
												{`${format(onvio.ultima, 'dd/MM/yyyy')} ás ${format(onvio.ultima, 'HH:mm')}`}
											</Badge>
										</div>
									</div>
								</div>
								<div className='flex justify-end gap-3'>
									<Button variant='outline' color='red'>
										<CircleX />
										Cancelar
									</Button>
									<Button variant='secondary'>
										<Settings />
										Configurações
									</Button>
									<Button variant='outline'>
										<Icons.refreshSquare />
										Executar
									</Button>
								</div>
							</Card>
						);
					})}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
