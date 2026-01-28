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
import { GrupoConta } from '@/pages/contabilidade/grupos-contas';
import { AlertCircle, AlertTriangle, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { deactivateGrupoContas } from '@/services/api/grupo-contas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HandleDeactivateProps {
	grupo: GrupoConta;
}

export default function HandleDeactivateGrupo({ grupo }: HandleDeactivateProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [warnings, setWarnings] = useState<Map<string, boolean>>(new Map());
	const [isLoading, setIsLoading] = useState(false);

	const atualizarWarnings = useCallback(() => {
		setWarnings((prevState) => {
			const newState = new Map(prevState);
			const warn = grupo.js_con_plano_contas.length != 0;
			if (grupo.id) {
				newState.set(grupo.id, warn);
			}
			return newState;
		});
	}, [grupo]);

	useEffect(() => {
		atualizarWarnings();
	}, [atualizarWarnings]);

	async function HandleDeactivate() {
		setIsLoading(true);
		try {
			if (grupo.id) {
				await deactivateGrupoContas(grupo.id);
			} else {
				throw new Error('Grupo ID is null.');
			}
			toast.success('Grupo inativado com sucesso.');
			await queryClient.invalidateQueries({ queryKey: ['get-grupo-contas', state] });
		} catch (error) {
			console.error('Error deactivating:', error);
			toast.error('Erro ao desativar.');
		} finally {
			setIsLoading(false);
		}
	}

	const hasWarning = grupo.id ? (warnings.get(grupo.id) ?? false) : false;
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button tooltip='Inativar' variant='ghost' size='icon' className={`${hasWarning ? 'border-red-500' : ''}`}>
					{hasWarning ? <AlertTriangle className='text-red-500' /> : <ToggleLeft />}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Inativar grupo {grupo.ds_nome_grupo}? </AlertDialogTitle>
					<AlertDialogDescription className='grid gap-4'>
						{hasWarning && (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertTitle>Aviso</AlertTitle>
								<AlertDescription>Este grupo possui conta(s) vinculada(s).</AlertDescription>
							</Alert>
						)}
						Isso irá inativar o grupo de contas {grupo.ds_nome_grupo}.
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
