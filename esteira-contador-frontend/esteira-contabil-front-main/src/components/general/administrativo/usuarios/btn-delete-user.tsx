import { useState } from 'react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User } from '@/pages/administracao/usuarios';
import { UserRoundMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteUsuarioEmpresa } from '@/services/api/empresas';
import { useCompanyContext } from '@/context/company-context';

interface HandleDeleteUserProps {
	user: User;
}

export default function HandleDeleteUser({ user }: HandleDeleteUserProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(false);
	const { state: empresa_id } = useCompanyContext();

	async function handleDelete() {
		setIsLoading(true);
		try {
			await deleteUsuarioEmpresa(empresa_id, user.id);
			queryClient.invalidateQueries({ queryKey: ['get-usuarios-empresa'] });
			toast.success('Usuário removido com sucesso.');
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar.');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Remover acesso' variant='ghost' size='icon'>
					<UserRoundMinus />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remover o acesso de {user.ds_name}?</AlertDialogTitle>
					<AlertDialogDescription>Isso irá remover o acesso de {user.ds_name} a esta empresa.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction disabled={isLoading} onClick={handleDelete}>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
