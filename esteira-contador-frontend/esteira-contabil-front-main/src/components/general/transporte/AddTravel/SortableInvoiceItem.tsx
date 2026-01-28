import { GripVertical } from 'lucide-react';
import { INfe } from './tableNFe';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableInvoiceItem({ item, index }: { item: INfe; index: number }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<Card ref={setNodeRef} style={style} className='grid grid-cols-[auto_256px_1fr] gap-4 p-3 shadow-none'>
			<div {...attributes} {...listeners} className='flex cursor-grab items-center active:cursor-grabbing'>
				<GripVertical className='text-muted-foreground h-5 w-5' />
			</div>
			<div className='flex items-center justify-between'>
				<Badge
					variant={index === 0 ? 'transit' : 'cargo'}
					className={`${index === 0 ? 'w-[256px]' : 'px-7'} max-h-10 border-transparent py-2 text-base`}
				>
					{index === 0 ? 'Origem' : 'Entrega'}
				</Badge>
				{index !== 0 && <p>{`Ordem ${index}`}</p>}
			</div>
			<div className='flex flex-col'>
				<h1 className='font-semibold'>{item.nf || 'Número da NFe'}</h1>
				<p className='text-muted-foreground text-sm'>
					Valor:{' '}
					{item.valorTotal?.toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					})}
				</p>
			</div>
		</Card>
	);
}