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
import { useCompanyContext } from '@/context/company-context';
import { useQueryClient } from '@tanstack/react-query';
import { sincronizarVeiculos } from '@/services/api/tms';

export default function HandleSyncVeiculos() {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await sincronizarVeiculos(state);
				await queryClient.invalidateQueries({ queryKey: ['get-veiculos-paginado', state] });
			})(),
			{
				loading: 'Sincronizando veículos...',
				success: () => {
					setLoading(false);
					setOpen(false);
					return 'Veículos sincronizados com sucesso!';
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
				<Button tooltip='Sincronizar veículos' variant='outline' disabled={loading} size='icon'>
					<CloudDownload />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Sincronizar veículos?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação irá sincronizar os veículos do patrimônio com o sistema. Os centros de custos necessários serão sincronizados
						automaticamente. Esse processo pode levar alguns minutos. Deseja continuar?
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
