import { useState } from 'react';
import { Ban, BanIcon, Building2, CheckCircle2, MailCheck, MailWarning, MoreVertical, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { blockAcessoUsuarioEmpresa, getAcessosEmpresa } from '@/services/api/empresas';
import { Company } from '@/pages/administracao/empresas';
import LoadingSpinner from '@/components/states/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
interface User {
	id: string;
	ds_name: string | null;
	ds_email: string;
	is_confirmed: boolean;
	ds_fantasia: string | null;
	is_blocked: boolean;
}

export default function BtnUsuariosEmpresa({ empresa }: { empresa: Company }) {
	const [open, setOpen] = useState(false);

	const {
		data: users,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-acessos-usuarios-empresa', empresa.id],
		queryFn: () => getAcessosEmpresa(empresa.id),
		staleTime: 1000 * 60 * 5,
		enabled: !!open,
	});

	async function setIsBlocked(user: User) {
		try {
			await blockAcessoUsuarioEmpresa(empresa.id, user.id);
			await refetch();
			toast.success('Acesso alterado com sucesso.');
		} catch (error) {
			console.error('Error:', error);
			toast.error('Erro.');
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button tooltip='Usuários' variant='ghost' size='icon'>
					<Users />
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Usuários</SheetTitle>
					<SheetDescription>Lista de usuários com acesso à empresa.</SheetDescription>
				</SheetHeader>
				{isFetching ? (
					<LoadingSpinner className='mt-4' />
				) : users?.length > 0 ? (
					<div className='grid gap-4 overflow-auto px-4 pb-4'>
						{users.map((user: User) => (
							<Card key={user.id} className={`w-full max-w-sm rounded-lg py-0 ${user.is_blocked ? 'opacity-75' : ''}`}>
								<CardContent className='flex justify-between gap-2 p-4'>
									<div className='grid gap-1'>
										<div className='flex items-center gap-2'>
											<h3 className='font-semibold'>{user.ds_name}</h3>
											<Badge
												variant={user.is_blocked ? 'danger' : user.is_confirmed ? 'success' : 'pending'}
												className='flex cursor-default items-center gap-1'
											>
												{user.is_blocked ? (
													<BanIcon className='h-3 w-3' />
												) : user.is_confirmed ? (
													<MailCheck className='h-3 w-3' />
												) : (
													<MailWarning className='h-3 w-3' />
												)}
												{user.is_blocked ? 'Bloqueado' : user.is_confirmed ? 'Confirmado' : 'Pendente'}
											</Badge>
										</div>
										<div className='text-muted-foreground grid gap-1 text-sm'>
											<div className='flex items-center gap-2'>
												<Tooltip>
													<TooltipTrigger className='flex cursor-default items-center gap-1'>
														{user.is_confirmed ? <MailCheck className='h-3 w-3' /> : <MailWarning className='h-3 w-3' />}
														{user.ds_email}
													</TooltipTrigger>
													<TooltipContent>{user.is_confirmed ? 'E-mail confirmado' : 'E-mail não confirmado'}</TooltipContent>
												</Tooltip>
											</div>
											<div className='flex items-center gap-2'>
												<Building2 className='h-3 w-3' />
												{user.ds_fantasia || 'N/A'}
											</div>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant='ghost' className='h-8 w-8 p-0' aria-label='Abrir menu de ações'>
												<MoreVertical className='h-4 w-4' />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem className='text-sm' onClick={() => setIsBlocked(user)}>
												{user.is_blocked ? (
													<span className='flex items-center gap-2 text-green-600'>
														<CheckCircle2 className='h-4 w-4' />
														Desbloquear usuário
													</span>
												) : (
													<span className='text-destructive flex items-center gap-2'>
														<Ban className='h-4 w-4' />
														Bloquear usuário
													</span>
												)}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<p className='mt-4 text-gray-500'>Nenhum usuário encontrado.</p>
				)}
			</SheetContent>
		</Sheet>
	);
}
