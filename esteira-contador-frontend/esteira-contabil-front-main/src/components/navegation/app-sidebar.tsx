import * as React from 'react';

import { NavUser } from '@/components/navegation/nav-user';
import { CompanySwitcher } from '@/components/navegation/company-switcher';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import { useRouter } from 'next/router';
import { systemModules } from '@/services/modules/system-modules';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/component';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { getEmpresasUsuario } from '@/services/api/usuarios';
import { getModulosEmpresaUsuario } from '@/services/api/modulos';
import { useCompanyContext } from '@/context/company-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronRight } from 'lucide-react';

export type ModuleType = {
	name: string;
	description: string;
	menus: {
		name: string;
		href: string;
		description?: string;
		icon: React.ReactNode;
		items?: { name: string; href: string; description: string }[];
		roles?: string[];
	}[];
	moduleName: string;
	system?: boolean;
	hidden?: boolean;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const supabase = createClient();
	const { state: empresa_id } = useCompanyContext();

	const { data: user } = useQuery({
		queryKey: ['get-user'],
		queryFn: async () => {
			const { data, error } = await supabase.auth.getUser();
			if (error) throw error;
			return data.user;
		},
		staleTime: 1000 * 60 * 5,
	});

	const {
		data: companies,
		isError,
		error,
		isLoading,
	} = useQuery({
		queryKey: ['get-empresas-usuario', user?.id],
		queryFn: () => (user?.id ? getEmpresasUsuario(user.id) : Promise.reject('User ID is undefined')),
		staleTime: 1000 * 60 * 5,
		enabled: !!user?.id,
	});

	const { data: modules } = useQuery({
		queryKey: ['get-user-modules', user?.id, empresa_id],
		queryFn: () => {
			if (!user) throw new Error('User is undefined');
			return getModulosEmpresaUsuario(empresa_id, user.id);
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!user?.id && !!empresa_id,
	});

	if (isError) {
		toast.error(error?.message);
	}

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				{companies ? (
					<CompanySwitcher companies={companies} />
				) : (
					<SidebarMenuButton size='lg'>
						<Skeleton className='aspect-square size-8' />
						<div className='grid flex-1 gap-2'>
							<Skeleton className='h-4 w-2/3' />
							<Skeleton className='h-2 w-1/3' />
						</div>
					</SidebarMenuButton>
				)}
			</SidebarHeader>
			<SidebarContent>
				{isLoading ? (
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{Array.from({ length: 5 }).map((_, index) => (
									<SidebarMenuItem key={index}>
										<SidebarMenuSkeleton className='*:data-[sidebar="menu-skeleton-icon"]:aspect-square' showIcon />
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				) : (
					systemModules
						?.filter((module) => (modules?.includes(module.moduleName) && module.menus.length > 0) || module.system)
						.map((module, i) => <SidebarModules key={`${module.moduleName}-${i}`} modules={modules} module={module} />)
				)}
			</SidebarContent>
			<SidebarFooter>
				{user && (
					<NavUser user={{ ...user, email: user?.email || '', user_metadata: { full_name: user?.user_metadata.full_name || '' } }} />
				)}
			</SidebarFooter>
		</Sidebar>
	);
}

function SidebarModules({ modules, module }: { module: ModuleType; modules: string[] }) {
	const router = useRouter();

	// Verifica se o menu deve ser exibido com base nos roles
	const canAccessMenu = (menuRoles?: string[]) => {
		if (!menuRoles) return true;
		return menuRoles.some((role) => modules.includes(role));
	};

	// Renderiza os itens de menu colapsáveis
	const renderCollapsibleMenu = (menu: (typeof module.menus)[number], index: number) => (
		<Collapsible key={index} defaultOpen={menu.items?.some((item) => router.pathname === item.href)} className='group/collapsible'>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						{menu.icon}
						<span>{menu.name}</span>
						<ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{menu.items?.map((item, subIndex) => (
							<SidebarMenuSubItem key={subIndex}>
								<SidebarMenuSubButton asChild>
									<Link href={item.href} className={router.pathname === item.href ? 'bg-muted' : ''}>
										{item.name}
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);

	// Renderiza os itens de menu simples
	const renderSimpleMenu = (menu: (typeof module.menus)[number], index: number) => (
		<SidebarMenuItem key={index}>
			<SidebarMenuButton tooltip={menu.name} asChild>
				<Link href={menu.href} className={router.pathname === menu.href ? 'bg-muted' : ''}>
					{menu.icon}
					{menu.name}
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{module?.name}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{module.menus
						.filter((menu) => canAccessMenu(menu.roles))
						.map((menu, index) => (menu.items?.length ? renderCollapsibleMenu(menu, index) : renderSimpleMenu(menu, index)))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
