'use client';
import { Icons } from '@/components/layout/icons';
import { Card } from '@/components/ui/card';
import { fetchData } from '@/services/api/request-handler';
import { useQuery } from '@tanstack/react-query';
import { Archive, FileText, FolderArchive, Inbox, Info, MailWarning } from 'lucide-react';

interface IStatic {
	success: boolean;
	data: IInfo;
}

interface IInfo {
	arquivados: number;
	extraidos: number;
	naoExtraidos: number;
	inbox: number;
}

export async function getDfeStatics() {
	return await fetchData(`/api/transporte/statistics`, undefined, 'GET');
}

export default function CardsTransporte() {
	const { data } = useQuery<IStatic>({
		queryKey: ['dfes'],
		queryFn: getDfeStatics,
		staleTime: 1000 * 60 * 60,
		retry: 1,
	});

	const itensCards = [
		{
			id: 0,
			color: 'bg-green',
			title: 'Emails inboxes',
			numberInt: data?.data?.inbox || 0,
			icon: (
				<div className='text-green bg-green-opacity flex size-12 items-center justify-center rounded-[8px]'>
					<Inbox />
				</div>
			),
		},
		{
			id: 1,
			color: 'bg-orange',
			title: 'Emails extraídos',
			numberInt: data?.data?.extraidos || 0,
			icon: (
				<div className='text-orange bg-orange-opacity flex size-12 items-center justify-center rounded-[8px]'>
					<Archive />
				</div>
			),
		},
		{
			id: 2,
			color: 'bg-gray',
			title: 'Emails arquivados',
			numberInt: data?.data?.arquivados || 0,
			icon: (
				<div className='text-gray bg-gray-opacity flex size-12 items-center justify-center rounded-[8px]'>
					<FolderArchive />
				</div>
			),
		},
		{
			id: 3,
			color: 'bg-red',
			title: 'Emails não extraidos',
			numberInt: data?.data?.naoExtraidos || 0,
			icon: (
				<div className='text-red bg-red-opacity flex size-12 items-center justify-center rounded-[8px]'>
					<MailWarning />
				</div>
			),
		},
		{
			id: 4,
			color: 'bg-purple-500',
			title: 'Faturamento Liquído 2025',
			numberInt: 999,
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#F1EBFF] text-[#9D75F8]'>
					<FileText size={32} />
				</div>
			),
		},
		{
			id: 5,
			color: 'bg-green-500',
			title: 'Viagens Ativas',
			numberInt: 88,
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#D7EFCC] text-[#38b000]'>
					<Icons.TruckFast />
				</div>
			),
		},
		{
			id: 6,
			color: 'bg-[#0077B6]',
			title: 'Faturamento do mês',
			numberMoney: 45200.0,
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#CCE4F0] text-[#0077B6]'>
					<Icons.dolarSquare />
				</div>
			),
		},
		{
			id: 7,
			color: 'bg-[#FAA307]',
			title: 'Pendente de averbação',
			numberInt: 99,
			icon: (
				<div className='flex size-12 items-center justify-center rounded-[8px] bg-[#FFEBC5] text-[#FAA307]'>
					<Info size={32} />
				</div>
			),
		},
	];

	return (
		<div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4'>
			{itensCards.map((card, index) => {
				return (
					<Card key={card.id} className={`p-6 shadow-none order-${index} gap-0`}>
						<div className={`h-1.5 w-6 rounded-[24px] ${card.color}`} />
						<div className={`flex h-full justify-between`}>
							<div>
								<p className='text-muted-foreground mt-2 text-sm font-medium'>{card.title}</p>
								<p className='text-2xl font-semibold'>
									{card?.numberMoney !== undefined
										? card.numberMoney.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
										: card?.numberInt}
								</p>
							</div>
							<div className='my-auto'>{card.icon}</div>
						</div>
					</Card>
				);
			})}
		</div>
	);
}
