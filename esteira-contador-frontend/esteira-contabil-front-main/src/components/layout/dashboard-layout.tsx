import { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import SystemLayout from './system-layout';

type LayoutProps = {
	children: ReactNode;
	className?: string;
	title?: string;
	description?: string;
	goBackButton?: boolean;
	rightSection?: ReactNode;
};

export default function DashboardLayout({ children, className, title, description, rightSection }: LayoutProps) {
	return (
		<SystemLayout className='grid gap-4 p-4 lg:gap-6 lg:p-6'>
			<div className='flex items-center justify-between gap-8'>
				<div hidden={!title && !description} className='space-y-0.5'>
					<h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
					<p className='text-muted-foreground'>{description}</p>
				</div>
				{rightSection}
			</div>
			<div className={cn(className)}>{children}</div>
		</SystemLayout>
	);
}
