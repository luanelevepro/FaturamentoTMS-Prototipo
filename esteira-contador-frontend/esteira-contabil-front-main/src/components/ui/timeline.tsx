import React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
	id: string;
	date: string;
	title: string;
	description: string;
	status?: 'completed' | 'in-progress' | 'upcoming';
}

interface TimelineProps {
	items: TimelineItem[];
	className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
	if (!items.length) {
		return <div className='text-muted-foreground flex items-center justify-center p-8'>Nenhum item na timeline</div>;
	}

	return (
		<div className={cn('relative w-full overflow-x-auto py-8', className)}>
			<div className={cn('flex min-w-max items-start space-x-8 px-4', items.length === 1 && 'justify-center')}>
				{items.length > 0 && (
					<div className='from-border via-primary/30 to-border absolute top-12 left-1/2 h-0.5 w-[calc(100%-2rem)] -translate-x-1/2 bg-gradient-to-r' />
				)}

				{items.map((item) => (
					<div key={item.id} className='group relative flex min-w-[240px] flex-col items-center'>
						{/* círculo indicador */}
						<div className='relative z-10 mb-4'>
							<div
								className={cn(
									'bg-card h-10 w-10 rounded-full border-3 shadow-lg transition-all duration-300 group-hover:scale-110',
									{
										'border-primary bg-primary text-primary-foreground shadow-primary/20': item.status === 'completed',
										'border-primary from-primary to-primary/80 text-primary-foreground shadow-primary/30 animate-pulse bg-gradient-to-br':
											item.status === 'in-progress',
										'border-muted-foreground/50 bg-card text-muted-foreground shadow-muted/10':
											item.status === 'upcoming' || !item.status,
									},
								)}
							>
								<div className='flex h-full w-full items-center justify-center'>
									{item.status === 'completed' && (
										<svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
										</svg>
									)}
									{item.status === 'in-progress' && <div className='bg-primary-foreground h-3 w-3 animate-pulse rounded-full' />}
									{(item.status === 'upcoming' || !item.status) && <div className='bg-muted-foreground/60 h-2 w-2 rounded-full' />}
								</div>
							</div>
						</div>

						{/* conteúdo */}
						<div className='space-y-3 text-center transition-all duration-300 group-hover:scale-105 group-hover:transform'>
							<div className='space-y-1'>
								<h3 className='text-foreground group-hover:text-primary leading-tight font-semibold transition-colors'>
									{item.title}
								</h3>
								<time className='text-muted-foreground bg-muted/50 rounded-md px-2 py-1 font-mono text-xs'>{item.date}</time>
							</div>
							<p className='text-muted-foreground max-w-[220px] text-sm leading-relaxed'>{item.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
