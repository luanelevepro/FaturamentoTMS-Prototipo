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
import { useQueryClient } from '@tanstack/react-query';
import { sincronizarFornecedores } from '@/services/api/fiscal';

export default function HandleUpdateFornecedores() {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await sincronizarFornecedores();
				await queryClient.invalidateQueries({ queryKey: ['get-fornecedores-empresa-paginado'] });
			})(),
			{
				loading: 'Sincronizando Fornecedores...',
				success: () => {
					setLoading(false);
					return 'Fornecedores sincronizados com sucesso!';
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
					<AlertDialogTitle>Sincronizar Fornecedores?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação irá sincronizar os fornecedores com o sistema externo. Esse processo pode levar alguns minutos. Deseja
						continuar?
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
