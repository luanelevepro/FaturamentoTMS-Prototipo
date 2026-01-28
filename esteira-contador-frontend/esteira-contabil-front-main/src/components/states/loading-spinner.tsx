import { Icons } from '@/components/layout/icons';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
	className?: string;
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
	return (
		<div className={cn('flex items-center justify-center', className)}>
			<Icons.spinner className='w-h-8 h-8 animate-spin' />
		</div>
	);
}
