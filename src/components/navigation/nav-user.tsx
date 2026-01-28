import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

export function NavUser({
    user,
}: {
    user: {
        email: string;
        user_metadata: {
            full_name: string;
        };
    };
}) {
    const { isMobile } = useSidebar();

    const handleSignOut = () => {
        console.log('Sign out clicked');
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                        >
                            <Avatar className='h-8 w-8 rounded-lg'>
                                <AvatarFallback>
                                    {user?.user_metadata?.full_name
                                        ?.split(' ')
                                        .slice(0, 2)
                                        .map((name: string) => name[0])
                                        .join('')
                                        .toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-semibold'>{user?.user_metadata?.full_name}</span>
                                <span className='truncate text-xs'>{user?.email}</span>
                            </div>
                            <ChevronsUpDown className='ml-auto size-4' />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg'
                        side={isMobile ? 'bottom' : 'right'}
                        align='end'
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className='p-0 font-normal'>
                            <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                                <Avatar className='h-8 w-8 rounded-lg'>
                                    <AvatarFallback>
                                        {user?.user_metadata?.full_name
                                            ?.split(' ')
                                            .slice(0, 2)
                                            .map((name: string) => name[0])
                                            .join('')
                                            .toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='grid flex-1 text-left text-sm leading-tight'>
                                    <span className='truncate font-semibold'>{user?.user_metadata?.full_name}</span>
                                    <span className='truncate text-xs'>{user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='group cursor-pointer'>
                            <Settings className='mr-2 h-4 w-4' />
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className='group cursor-pointer'
                            onClick={handleSignOut}
                        >
                            <LogOut className='group-hover:text-red-600 dark:group-hover:text-red-500' />
                            <span className='group-hover:text-red-600 dark:group-hover:text-red-500'>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
