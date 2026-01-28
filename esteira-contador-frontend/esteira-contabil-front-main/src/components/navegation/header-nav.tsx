import React from 'react';
import ThemeToggler from './theme-toggler';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/breadcrumb';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { systemModules } from '@/services/modules/system-modules';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';
import { NotificationCenter } from '../ui/notification-center';
import { deleteNotification } from '@/services/api/sistema';
import { useQueryClient } from '@tanstack/react-query';
import RoutinesCenter from '../ui/routine-center';

export default function HeaderNav({
	children,
	notifications = [],
}: {
	children: React.ReactNode;
	notifications?: ESTEIRA.RESPONSE.GetNotificacoes;
}) {
	const queryClient = useQueryClient();

	return (
		<header className='flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
			<div className='flex items-center gap-2 px-4'>
				{children}
				<NavigationBreadcrumb />
				<Button
					variant='outline'
					size='icon'
					className='aspect-square h-7 w-7 sm:hidden'
					onClick={() => {
						window.history.back();
					}}
				>
					<ChevronLeft className='h-4 w-4' />
					<span className='sr-only'>Voltar</span>
				</Button>
			</div>
			<div className='ml-auto flex items-center gap-2 px-4 transition-all duration-1000 ease-in-out'>
				<RoutinesCenter />
				<NotificationCenter
					notifications={notifications}
					onMarkAsRead={(id) => {
						deleteNotification(id).then(() => {
							queryClient.refetchQueries({ queryKey: ['get-notificacoes'] });
						});
					}}
					onMarkAllAsRead={() => {
						const promises = notifications.map((notification) => {
							return deleteNotification(notification.id);
						});
						Promise.all(promises).then(() => {
							queryClient.refetchQueries({ queryKey: ['get-notificacoes'] });
						});
					}}
				/>
				<ThemeToggler />
			</div>
		</header>
	);
}

const getAllRoutes = (modules: typeof systemModules): Set<string> => {
	const routes = new Set<string>();

	for (const mod of modules) {
		for (const menu of mod.menus || []) {
			if (menu.href && menu.href !== '/') {
				routes.add(menu.href);
			}

			if ('items' in menu && menu.items) {
				for (const item of menu.items) {
					if (item.href && item.href !== '/') {
						routes.add(item.href);
					}
				}
			}
		}
	}

	return routes;
};

function NavigationBreadcrumb() {
	const router = useRouter();
	const { pathname } = router;

	const validRoutes = getAllRoutes(systemModules); // <- obtém as rotas válidas

	const getBreadcrumbs = (path: string) => {
		const pathParts = path.split('/').filter(Boolean);

		return pathParts.map((part, index) => {
			const isDynamic = part.startsWith('[') && part.endsWith(']');
			let name = isDynamic ? part.slice(1, -1) : part;

			name = name
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');

			const href = '/' + pathParts.slice(0, index + 1).join('/');

			const isValid = validRoutes.has(href);

			return { name, href, isValid };
		});
	};

	const breadcrumbs = getBreadcrumbs(pathname);

	return (
		<Breadcrumb className='hidden sm:flex'>
			<BreadcrumbList>
				{breadcrumbs.map((crumb, index) => (
					<React.Fragment key={crumb.href}>
						<BreadcrumbItem>
							{index < breadcrumbs.length - 1 ? (
								crumb.isValid ? (
									<BreadcrumbLink asChild>
										<Link href={crumb.href}>{crumb.name}</Link>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage>{crumb.name}</BreadcrumbPage>
								)
							) : (
								<BreadcrumbPage>{crumb.name}</BreadcrumbPage>
							)}
						</BreadcrumbItem>
						{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
