import { Icons } from '@/components/layout/icons';

export default function EmptyState({ label }: { label: string }) {
	return (
		<div className='flex flex-col items-center space-y-6'>
			<Icons.empty_state />
			<div className='flex flex-col items-center space-y-2'>
				<p className=''>Nada por aqui</p>
				<p className='text-muted-foreground'>{label}</p>
			</div>
		</div>
	);
}
