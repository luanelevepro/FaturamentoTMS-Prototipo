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
import { createClient } from '@/utils/supabase/component';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { deleteAllCookies } from '@/hooks/use-delete-user-data';

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
	const supabase = createClient();
	const router = useRouter();

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error logging out:', error.message);
			return;
		}
		deleteAllCookies(['USER_COLOR_PREFERENCE']);
		router.push('/login');
	}

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
									{user?.email
										? user?.email
												.split(' ')
												.slice(0, 2)
												.map((name) => name[0])
												.join('')
												.toUpperCase()
										: ''}
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
										{user?.email
											? user?.email
													.split(' ')
													.slice(0, 2)
													.map((name) => name[0])
													.join('')
													.toUpperCase()
											: ''}
									</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold'>{user?.user_metadata?.full_name}</span>
									<span className='truncate text-xs'>{user?.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild className='group cursor-pointer'>
							<Link href='/configuracoes'>
								<Settings className='mr-2 h-4 w-4' />
								Configurações
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className='group cursor-pointer'
							onClick={() => {
								handleSignOut();
							}}
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
