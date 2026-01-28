import * as React from 'react';

import { NavUser } from '@/components/navigation/nav-user';
import { CompanySwitcher } from '@/components/navigation/company-switcher';
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import { useLocation, Link } from 'react-router-dom';
import { systemModules, ModuleType } from '@/services/modules/system-modules';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useCompanyContext } from '@/context/company-context';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    // Mock user data
    const user = {
        email: 'dev@tomazi.com',
        user_metadata: { full_name: 'Desenvolvedor Tomazi' }
    };

    // Mock companies
    const companies = [
        { id: '1', ds_fantasia: 'Transportes Tomazi', id_externo: '1', is_escritorio: false },
        { id: '2', ds_fantasia: 'Escritório Central', id_externo: '2', is_escritorio: true },
    ];

    // We can filter modules here if needed
    const modules: string[] = ['TMS', 'ADMIN', 'FINANCEIRO'];
    const isError = false;

    return (
        <Sidebar collapsible='icon' {...props}>
            <SidebarHeader>
                <CompanySwitcher companies={companies} />
            </SidebarHeader>
            <SidebarContent>
                {systemModules
                    ?.filter((module) => (modules?.includes(module.moduleName) && module.menus.length > 0) || module.system)
                    .map((module, i) => <SidebarModules key={`${module.moduleName}-${i}`} modules={modules} module={module} />)
                }
            </SidebarContent>
            <SidebarFooter>
                {user && (
                    <NavUser user={user} />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}

function SidebarModules({ modules, module }: { module: ModuleType; modules: string[] }) {
    const location = useLocation();
    const pathname = location.pathname;

    // Renderiza os itens de menu colapsáveis
    const renderCollapsibleMenu = (menu: (typeof module.menus)[number], index: number) => (
        <Collapsible key={index} defaultOpen={menu.items?.some((item) => pathname === item.href)} className='group/collapsible'>
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
                                <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                    <Link to={item.href}>
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
            <SidebarMenuButton tooltip={menu.name} asChild isActive={pathname === menu.href}>
                <Link to={menu.href}>
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
                        .map((menu, index) => (menu.items?.length ? renderCollapsibleMenu(menu, index) : renderSimpleMenu(menu, index)))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
