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
import { CloudDownload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sincronizarCargosByEmpresaId } from '@/services/api/cargos';
import { useCompanyContext } from '@/context/company-context';
import { useQueryClient } from '@tanstack/react-query';

export default function HandleUpdateCargos() {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await sincronizarCargosByEmpresaId(state);
				await queryClient.invalidateQueries({ queryKey: ['get-cargo-empresa', state] });
			})(),
			{
				loading: 'Sincronizando cargos...',
				success: () => {
					setLoading(false);
					return 'Cargos sincronizados com sucesso!';
				},
				error: (error) => {
					setLoading(false);
					return `Erro ao sincronizar: ${error.message || error}`;
				},
			},
		);
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Sincronizar' variant='outline' disabled={loading} size='icon'>
					<CloudDownload />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Sincronizar cargos?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação irá sincronizar os cargos com o sistema externo. Esse processo pode levar alguns minutos. Deseja continuar?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction onClick={HandleUpdate}>Sincronizar</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
