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
import { sincronizarFuncionariosByEmpresaId } from '@/services/api/funcionarios';
import { useCompanyContext } from '@/context/company-context';
import { useQueryClient } from '@tanstack/react-query';

export default function HandleUpdateFuncionarios() {
	const [open, setOpen] = useState(false);
	const { state } = useCompanyContext();
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	async function HandleUpdate() {
		setLoading(true);
		return toast.promise(
			(async () => {
				await sincronizarFuncionariosByEmpresaId(state);
				await queryClient.invalidateQueries({ queryKey: ['get-funcionarios-empresa', state] });
			})(),
			{
				loading: 'Sincronizando funcionários...',
				success: () => {
					setLoading(false);
					return 'Funcionários sincronizados com sucesso!';
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
					<AlertDialogTitle>Sincronizar funcionários?</AlertDialogTitle>
					<AlertDialogDescription>
						Essa ação deve ser executada somente com os dados de Cargos já atualizado. A ação irá sincronizar os funcionários com o
						sistema externo. Esse processo pode levar alguns minutos. Deseja continuar?
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
