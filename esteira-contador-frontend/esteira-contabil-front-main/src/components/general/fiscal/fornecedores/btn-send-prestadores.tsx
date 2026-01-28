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
import { CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { sincronizarPrestadores } from '@/services/api/sieg-documentos-fiscais';
import { useCompanyContext } from '@/context/company-context';

export default function HandleUpdatePrestadores() {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();
	const { state: empresa_id } = useCompanyContext();

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await sincronizarPrestadores(empresa_id);
				await queryClient.invalidateQueries({
					queryKey: ['get-fornecedores-empresa-paginado'],
				});
			})(),
			{
				loading: 'Sincronizando prestadores...',
				success: () => {
					setLoading(false);
					return 'Prestadores sincronizados com sucesso!';
				},
				error: (error) => {
					setLoading(false);
					return `Erro ao sincronizar prestadores: ${error.message || error}`;
				},
			},
		);
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Sincronizar prestadores' variant='outline' disabled={loading} size='icon'>
					<CloudUpload />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Sincronizar prestadores?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação irá sincronizar os prestadores com o sistema externo. Esse processo pode levar alguns minutos. Deseja continuar?
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
