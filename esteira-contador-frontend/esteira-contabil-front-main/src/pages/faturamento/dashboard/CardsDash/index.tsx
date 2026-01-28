import { Icons } from '@/components/layout/icons';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function CardsDash() {
	const itensCards = [
		{
			id: 0,
			color: 'bg-green-500',
			title: 'Faturamento Liquído 2025',
			value: 7172500,
			percentage: 16.7,
			percentageBadge: 16.7,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#D7EFCC] text-[#38b000]'>
					<Icons.dolarSquare />
				</div>
			),
		},
		{
			id: 1,
			color: 'bg-purple-500',
			title: 'Meta Mensal',
			value: 1500000,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#F1EBFF] text-[#9D75F8]'>
					<Icons.calendar />
				</div>
			),
		},
		{
			id: 2,
			color: 'bg-red-500',
			title: 'Devoluções Acumulados',
			value: 377500,
			percentageBadge: 16.7,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#FFDEDE] text-[#D00000]'>
					<Icons.trendDown />
				</div>
			),
		},
		{
			id: 3,
			color: 'bg-blue-500',
			title: 'Atingimento Meta',
			percentage: 68.37,
			percentageBadge: -31.7,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#CCE4F0] text-[#0077B6]'>
					<Icons.tickSquare />
				</div>
			),
		},
		{
			id: 4,
			color: 'bg-yellow-500',
			title: 'Porcetagem de Devoluções',
			percentage: 5,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#FFEBC5] text-[#FAA307]'>
					<Icons.refreshSquare />
				</div>
			),
		},
		{
			id: 5,
			color: 'bg-pink-500',
			title: 'Clientes Ativos',
			clients: 1.247,
			percentageBadge: 8.3,
			colorIcon: '',
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#FEF1FB] text-[#F875D7]'>
					<Icons.profileUser />
				</div>
			),
		},
	];

	return (
		<>
			{itensCards.map((card, index) => {
				const isPositive = !!card?.percentageBadge && card?.percentageBadge > 0;
				return (
					<Card key={card.id} className={`p-6 shadow-none order-${index}`}>
						<div className={`flex h-full justify-between`}>
							<div>
								<div className={`h-1.5 w-6 rounded-[24px] ${card.color}`} />
								<p className='text-muted-foreground mt-2 text-sm font-medium'>{card.title}</p>
								<p className='text-2xl font-semibold'>
									{card?.value !== undefined
										? card.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
										: card?.clients !== undefined
											? card.clients
											: `${card?.percentage
													.toLocaleString('pt-BR', {
														minimumFractionDigits: 1,
														maximumFractionDigits: 2,
													})
													.replace(',', '.')}%`}
								</p>
								{!!card.percentageBadge && (
									<p className='mt-1.5 flex items-center gap-2 text-nowrap'>
										<p
											className={`flex w-fit items-center gap-1 rounded-full px-2 py-1 ${isPositive ? 'bg-[#D7EFCC] text-[#38B000]' : 'bg-[#FFDEDE] text-[#D00000]'}`}
										>
											{isPositive ? (
												<ArrowUp className={`size-5 rounded-full bg-[#38B000] p-1 text-[#D7EFCC]`} strokeWidth={2.5} />
											) : (
												<ArrowDown className={`size-5 rounded-full bg-[#D00000] p-1 text-[#FFDEDE]`} strokeWidth={2.5} />
											)}
											<p className='text-xs font-medium'>{isPositive ? `+${card.percentageBadge}` : card.percentageBadge} %</p>
										</p>
										<span className='text-sm text-[#707070]'> vs ano anterior</span>
									</p>
								)}
							</div>
							<div className='my-auto'>{card.icon}</div>
						</div>
					</Card>
				);
			})}
		</>
	);
}
