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
import { updateProdutosEmpresasExterno } from '@/services/api/fiscal';

export default function HandleSyncProdutosEmpresas() {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await updateProdutosEmpresasExterno();
				await queryClient.invalidateQueries({ queryKey: ['get-produtos-empresa-paginado', state] });
			})(),
			{
				loading: 'Sincronizando dados...',
				success: () => {
					setLoading(false);
					return 'Dados sincronizadas com sucesso!';
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
				<Button tooltip='Sincronizar dados' variant='outline' disabled={loading} size='icon'>
					<CloudDownload />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Sincronizar dados?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação irá sincronizar os dados com o sistema externo. Esse processo pode levar alguns minutos. Deseja continuar?
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
