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
import { Cargo } from '@/pages/recursos-humanos/cargos';
import { AlertTriangle, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deactivateCargo } from '@/services/api/cargos';
import { useQueryClient } from '@tanstack/react-query';

interface HandleDeleteUserProps {
	cargo: Cargo;
}

export default function HandleDeactivateCargo({ cargo }: HandleDeleteUserProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [warnings, setWarnings] = useState<Map<string, boolean>>(new Map());
	const [isLoading, setIsLoading] = useState(false);

	const atualizarWarnings = useCallback(() => {
		setWarnings((prevState) => {
			const newState = new Map(prevState);
			const warn = cargo.rh_funcionarios.length === 0;
			newState.set(cargo.id, warn);
			return newState;
		});
	}, [cargo]);

	useEffect(() => {
		atualizarWarnings();
	}, [atualizarWarnings]);

	async function HandleDeactivate() {
		setIsLoading(true);
		try {
			await deactivateCargo(cargo.id);
			toast.success('Cargo inativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-cargo-empresa'] });
		} catch (error) {
			console.error('Error deactivating:', error);
			toast.error('Erro ao desativar.');
		} finally {
			setIsLoading(false);
		}
	}

	const hasWarning = warnings.get(cargo.id) ?? false;
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Inativar' variant='ghost' size='icon' className={`${hasWarning ? 'border-red-500' : ''}`}>
					{hasWarning ? <AlertTriangle className='text-red-500' /> : <ToggleLeft />}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Inativar {cargo.ds_nome}? </AlertDialogTitle>
					<AlertDialogDescription>
						Isso irá inativar {cargo.ds_nome} nesta empresa.
						<br />
						{hasWarning ? 'Aviso: este cargo não possui nenhum funcionário vinculado' : ''}
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
