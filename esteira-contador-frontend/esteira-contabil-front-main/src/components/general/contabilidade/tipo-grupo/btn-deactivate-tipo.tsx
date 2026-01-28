import { useState, useEffect, useCallback } from 'react';
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
import { TipoGrupo } from '@/pages/contabilidade/tipos-grupos';
import { AlertTriangle, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { deactivateTipoGrupo } from '@/services/api/tipo-grupo';

interface HandleDeleteProps {
	tipo: TipoGrupo;
}

export default function HandleDeactivateTipo({ tipo }: HandleDeleteProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [warnings, setWarnings] = useState<Map<string, boolean>>(new Map());
	const [isLoading, setIsLoading] = useState(false);

	const atualizarWarnings = useCallback(() => {
		setWarnings((prevState) => {
			const newState = new Map(prevState);
			const warn = tipo.js_con_grupo_contas.length != 0;
			if (tipo.id) {
				newState.set(tipo.id, warn);
			}
			return newState;
		});
	}, [tipo]);

	useEffect(() => {
		atualizarWarnings();
	}, [atualizarWarnings]);

	async function HandleDeactivate() {
		setIsLoading(true);
		try {
			if (tipo.id) {
				await deactivateTipoGrupo(tipo.id);
			} else {
				throw new Error('Tipo ID is null.');
			}
			toast.success('Tipo inativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-tipo-grupo', state] });
		} catch (error) {
			console.error('Error deactivating:', error);
			toast.error('Erro ao desativar.');
		} finally {
			setIsLoading(false);
		}
	}

	const hasWarning = tipo.id ? (warnings.get(tipo.id) ?? false) : false;
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Inativar' variant='ghost' size='icon' className={`${hasWarning ? 'border-red-500' : ''}`}>
					{hasWarning ? <AlertTriangle className='text-red-500' /> : <ToggleLeft />}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Inativar {tipo.ds_nome_tipo}? </AlertDialogTitle>
					<AlertDialogDescription>
						Isso irá inativar {tipo.ds_nome_tipo} nesta empresa.
						<br />
						{hasWarning ? 'Aviso: este tipo possui grupo(s) vinculado(s)' : ''}
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
