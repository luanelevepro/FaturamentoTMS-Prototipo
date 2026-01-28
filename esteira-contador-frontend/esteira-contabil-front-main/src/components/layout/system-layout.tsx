import { ReactNode } from 'react';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import HeaderNav from '../navegation/header-nav';
import { AppSidebar } from '../navegation/app-sidebar';
import { getNotificacoes } from '@/services/api/sistema';
import { useQuery } from '@tanstack/react-query';
import { useLayout } from '@/context/layout-context';

type LayoutProps = {
	children: ReactNode;
	className?: string;
};

export default function SystemLayout({ children, className }: LayoutProps) {
	const { sidebarOpen, setSidebarOpen } = useLayout();

	// Notificações - Queremos isso aqui dentro do layout, sempre disponível.
	const { data } = useQuery({
		queryKey: ['get-notificacoes'],
		queryFn: getNotificacoes,
		staleTime: 1000 * 60,
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 60,
	});

	return (
		<>
			<SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<AppSidebar />
				<SidebarInset>
					<HeaderNav notifications={data}>
						<SidebarTrigger />
					</HeaderNav>
					<main className={cn(className)}>{children}</main>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}
