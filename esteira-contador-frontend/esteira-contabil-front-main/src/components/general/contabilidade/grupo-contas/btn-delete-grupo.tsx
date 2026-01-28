import React, { useState } from 'react';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/layout/icons';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { deleteGrupoContas } from '@/services/api/grupo-contas';
import { useCompanyContext } from '@/context/company-context';
import { GrupoConta } from '@/pages/contabilidade/grupos-contas';

interface HandleDeleteProps {
	grupo: GrupoConta;
}

export default function HandleDelete({ grupo }: HandleDeleteProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();
	const { state } = useCompanyContext();
	const [loading, setLoading] = useState(false);

	async function DeleteData() {
		setLoading(true);
		if (!grupo.id) {
			toast.error('Erro ao deletar.');
			setLoading(false);
			setOpen(false);
			return;
		}
		if (grupo.js_con_plano_contas.length > 0) {
			toast.error('Existem Contas Vinculadas.');
			setLoading(false);
			setOpen(false);
			return;
		}
		try {
			await deleteGrupoContas(grupo?.id);
			await queryClient.invalidateQueries({ queryKey: ['get-grupo-contas', state] });
			toast.success('Registro removido com sucesso.');
		} catch (error) {
			console.error('Error deleting:', error);
			toast.error('Erro ao deletar.');
		} finally {
			setLoading(false);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button tooltip='Excluir' variant='ghost' size='icon'>
					<Trash />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Deletar registro?</DialogTitle>
					<DialogDescription>Isso irá deletar o registro, essa ação é irreversível.</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button disabled={loading} variant='outline'>
							Cancelar
						</Button>
					</DialogClose>
					<Button onClick={DeleteData} disabled={loading} variant='destructive'>
						Continuar
						{loading && <Icons.spinner className='h-4 w-4 animate-spin' />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
