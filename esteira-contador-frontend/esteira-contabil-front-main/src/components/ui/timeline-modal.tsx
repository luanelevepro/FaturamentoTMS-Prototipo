import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timeline, TimelineItem } from './timeline';
import { Calendar, Clock } from 'lucide-react';

interface TimelineModalProps {
	items: TimelineItem[];
	title?: string;
	triggerText?: string;
	children?: React.ReactNode;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({ items, title = 'Timeline', triggerText = 'Ver Timeline', children }) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				{children || (
					<Button variant='outline' className='gap-2'>
						<Calendar className='h-4 w-4' />
						{triggerText}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='bg-background border-border/50 max-h-[85vh] max-w-5xl overflow-hidden border shadow-2xl'>
				<DialogHeader className='border-border/50 border-b pb-4'>
					<DialogTitle className='flex items-center gap-2 text-xl'>
						<Clock className='text-primary h-6 w-6' />
						{title}
					</DialogTitle>
				</DialogHeader>
				<div className='mt-6 max-h-[65vh] overflow-x-auto overflow-y-hidden'>
					<Timeline items={items} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
