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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { ToggleLeft } from 'lucide-react';
import { TipoGrupo } from '@/pages/contabilidade/tipos-grupos';
import { activateTipoGrupo } from '@/services/api/tipo-grupo';

interface HandleDeleteProps {
	tipo: TipoGrupo;
}

export default function HandleActivateTipo({ tipo }: HandleDeleteProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [isLoading, setIsLoading] = useState(false);

	async function HandleDeactivate() {
		setIsLoading(true);
		try {
			if (tipo.id) {
				await activateTipoGrupo(tipo.id);
			} else {
				throw new Error('Grupo ID is null.');
			}
			toast.success('Grupo ativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-tipo-grupo', state] });
		} catch (error) {
			console.error('Error deactivating:', error);
			toast.error('Erro ao desativar.');
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
					<AlertDialogTitle>Ativar {tipo.ds_nome_tipo}? </AlertDialogTitle>
					<AlertDialogDescription>
						Isso irá ativar {tipo.ds_nome_tipo} nesta empresa.
						<br />
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
