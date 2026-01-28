import { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { TooltipProvider } from '../ui/tooltip';

type LayoutProps = {
	children: ReactNode;
	className?: string;
};

export default function PageLayout({ children, className }: LayoutProps) {
	return (
		<TooltipProvider skipDelayDuration={0}>
			<main className={cn(className)}>{children}</main>
		</TooltipProvider>
	);
}
