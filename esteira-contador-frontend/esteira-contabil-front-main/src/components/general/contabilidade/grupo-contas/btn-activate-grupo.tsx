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
import { GrupoConta } from '@/pages/contabilidade/grupos-contas';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { activateGrupoContas } from '@/services/api/grupo-contas';
import { ToggleLeft } from 'lucide-react';

interface HandleActivateProps {
	grupo: GrupoConta;
}

export default function HandleActivateGrupo({ grupo }: HandleActivateProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [isLoading, setIsLoading] = useState(false);

	async function HandleDeactivate() {
		setIsLoading(true);
		try {
			if (grupo.id) {
				await activateGrupoContas(grupo.id);
			} else {
				throw new Error('Grupo ID is null.');
			}
			toast.success('Grupo ativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-grupo-contas', state] });
		} catch (error) {
			console.error('Error activating:', error);
			toast.error('Erro ao ativar.');
		} finally {
			setIsLoading(false);
		}
	}
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Ativar' variant='ghost' size='icon'>
					<ToggleLeft />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Ativar grupo {grupo.ds_nome_grupo}? </AlertDialogTitle>
					<AlertDialogDescription>
						Isso irá ativar o grupo de contas {grupo.ds_nome_grupo}.<br />
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction disabled={isLoading} onClick={HandleDeactivate}>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
