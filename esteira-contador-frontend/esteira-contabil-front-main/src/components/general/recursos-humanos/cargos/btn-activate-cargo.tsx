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
import { ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { activateCargo } from '@/services/api/cargos';
import { useQueryClient } from '@tanstack/react-query';

interface HandleDeleteUserProps {
	cargo: Cargo;
}

export default function HandleActivateCargo({ cargo }: HandleDeleteUserProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const [warnings, setWarnings] = useState<Map<string, boolean>>(new Map());
	const [isLoading, setIsLoading] = useState(false);

	// Atualiza warnings ao montar o componente
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

	async function HandleActivate() {
		setIsLoading(true);
		try {
			await activateCargo(cargo.id);
			toast.success('Cargo ativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-cargo-empresa'] });
		} catch (error) {
			console.error('Error activating:', error);
			toast.error('Erro ao ativar.');
		} finally {
			setIsLoading(false);
		}
	}

	// Define se há warning para o cargo
	const hasWarning = warnings.get(cargo.id) ?? false;

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Ativar' variant='ghost' size='icon' className={`${hasWarning ? 'border-red-500' : ''}`}>
					{hasWarning ? <ToggleRight className='text-red-500' /> : <ToggleRight className='text-green-500' />}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Ativar {cargo.ds_nome}?</AlertDialogTitle>
					<AlertDialogDescription>
						Isso irá ativar {cargo.ds_nome} nesta empresa.
						<br />
						{hasWarning ? 'Aviso: este cargo não possui nenhum funcionário vinculado' : ''}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction disabled={isLoading} onClick={HandleActivate}>
						Continuar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
